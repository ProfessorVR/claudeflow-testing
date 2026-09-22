// Speaker selection in the microphone menu (2026-09-19).

#include "AudioOutputSelectorSubsystem.h"

#include "Async/Async.h"
#include "AudioDevice.h"
#include "AudioDeviceManager.h"
#include "AudioDeviceNotificationSubsystem.h"
#include "AudioMixer.h"
#include "AudioMixerDevice.h"
#include "AudioThread.h"
#include "Blueprint/UserWidget.h"
#include "Blueprint/WidgetTree.h"
#include "Components/Button.h"
#include "Components/ComboBoxString.h"
#include "Components/PanelSlot.h"
#include "Components/PanelWidget.h"
#include "Components/TextBlock.h"
#include "Engine/Engine.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"
#include "Misc/App.h"
#include "Misc/ConfigCacheIni.h"
#include "UObject/UnrealType.h"
#include "UObject/UObjectHash.h"

#if PLATFORM_MAC
#include <CoreAudio/CoreAudio.h>
#endif

DEFINE_LOG_CATEGORY(LogAudioOutputSelector);

namespace AudioOutputSelector
{
    const TCHAR* MenuClassPath = TEXT("/Game/FirstPerson/UI/BP_AudioInput.BP_AudioInput_C");
    const TCHAR* ConfigSection = TEXT("AudioOutput");
    const TCHAR* CopyPrefix = TEXT("EVC_Output_");

    // The microphone row of BP_AudioInput: VerticalBox_0 > SizeBox_1 > HorizontalBox_107 > [TextBlock_47 "Input
    // Device:", SizeBox_0 > Button_96 (refresh), ComboBoxString_273].
    const FName MenuListName(TEXT("VerticalBox_0"));
    const FName MicRowName(TEXT("SizeBox_1"));
    const FName MicLabelName(TEXT("TextBlock_47"));
    const FName MicComboName(TEXT("ComboBoxString_273"));
    const FName MicRefreshName(TEXT("Button_96"));

    constexpr int32 MaxSwitchAttempts = 5;      // a switch already in progress refuses new requests
    constexpr double SwitchRetryDelay = 0.5;
    constexpr int32 MaxReapplies = 3;           // automatic re-applies of the chosen device ...
    constexpr double ReapplyWindow = 30.0;      // ... per this many seconds
    constexpr double RefreshTimeout = 5.0;

    FName CopyName(const UWidget* Source)
    {
        return FName(*(FString(CopyPrefix) + Source->GetName()));
    }

    // The designer-set values of a widget or slot (styles, fonts, sizes, padding, alignment), without object
    // references, event bindings or list contents.
    void CopyDesignerProperties(const UObject* Source, UObject* Target)
    {
        static const TSet<FName> Skipped = { TEXT("Slot"), TEXT("Slots"), TEXT("Content"), TEXT("Parent"),
            TEXT("DefaultOptions"), TEXT("SelectedOption") };
        for (TFieldIterator<FProperty> It(Source->GetClass()); It; ++It)
        {
            FProperty* Property = *It;
            if (!Property->HasAnyPropertyFlags(CPF_Edit) || Property->HasAnyPropertyFlags(CPF_Transient | CPF_Deprecated)
                || Property->IsA<FObjectPropertyBase>() || Property->IsA<FInterfaceProperty>()
                || Property->IsA<FDelegateProperty>() || Property->IsA<FMulticastDelegateProperty>()
                || Skipped.Contains(Property->GetFName()))
            {
                continue;
            }
            if (const FArrayProperty* Array = CastField<FArrayProperty>(Property); Array && Array->Inner->IsA<FObjectPropertyBase>())
            {
                continue;
            }
            Property->CopyCompleteValue_InContainer(Target, Source);
        }
    }

    // A copy of a widget and everything under it, in the same widget tree. OutCopies: source name -> copy.
    UWidget* CopyWidget(UWidgetTree* Tree, const UWidget* Source, TMap<FName, UWidget*>& OutCopies)
    {
        if (Source->IsA<UUserWidget>())
        {
            UWidget* Copy = Tree->ConstructWidget<UUserWidget>(Source->GetClass(), CopyName(Source));
            OutCopies.Add(Source->GetFName(), Copy);
            return Copy;
        }
        UWidget* Copy = Tree->ConstructWidget<UWidget>(Source->GetClass(), CopyName(Source));
        if (!Copy)
        {
            return nullptr;
        }
        CopyDesignerProperties(Source, Copy);
        OutCopies.Add(Source->GetFName(), Copy);
        const UPanelWidget* SourcePanel = Cast<UPanelWidget>(Source);
        UPanelWidget* CopyPanel = Cast<UPanelWidget>(Copy);
        if (SourcePanel && CopyPanel)
        {
            for (int32 Index = 0; Index < SourcePanel->GetChildrenCount(); ++Index)
            {
                const UWidget* Child = SourcePanel->GetChildAt(Index);
                UWidget* ChildCopy = Child ? CopyWidget(Tree, Child, OutCopies) : nullptr;
                UPanelSlot* SlotCopy = ChildCopy ? CopyPanel->AddChild(ChildCopy) : nullptr;
                if (SlotCopy && Child->Slot && Child->Slot->GetClass() == SlotCopy->GetClass())
                {
                    CopyDesignerProperties(Child->Slot, SlotCopy);
                }
            }
        }
        return Copy;
    }

    // Adds Content to Panel with the slot settings of Template (a slot of the same panel type).
    void AddChildLike(UPanelWidget* Panel, UWidget* Content, const UPanelSlot* Template)
    {
        UPanelSlot* Slot = Panel->AddChild(Content);
        if (Slot && Template && Template->GetClass() == Slot->GetClass())
        {
            CopyDesignerProperties(Template, Slot);
            Slot->SynchronizeProperties();
        }
    }

    TWeakObjectPtr<UAudioOutputSelectorSubsystem> MacInstance;
}

using namespace AudioOutputSelector;

#if PLATFORM_MAC
namespace AudioOutputSelectorMac
{
    AudioObjectPropertyAddress Address(AudioObjectPropertySelector Selector, AudioObjectPropertyScope Scope = kAudioObjectPropertyScopeGlobal)
    {
        return AudioObjectPropertyAddress{ Selector, Scope, kAudioObjectPropertyElementMain };
    }

    FString StringProperty(AudioObjectID Object, AudioObjectPropertySelector Selector)
    {
        const AudioObjectPropertyAddress Addr = Address(Selector);
        CFStringRef Value = nullptr;
        UInt32 Size = sizeof(Value);
        if (AudioObjectGetPropertyData(Object, &Addr, 0, nullptr, &Size, &Value) != noErr || !Value)
        {
            return FString();
        }
        const CFIndex Capacity = CFStringGetMaximumSizeForEncoding(CFStringGetLength(Value), kCFStringEncodingUTF8) + 1;
        TArray<ANSICHAR> Utf8;
        Utf8.SetNumZeroed(static_cast<int32>(Capacity));
        const bool bConverted = CFStringGetCString(Value, Utf8.GetData(), Capacity, kCFStringEncodingUTF8);
        CFRelease(Value);
        return bConverted ? FString(UTF8_TO_TCHAR(Utf8.GetData())) : FString();
    }

    int32 OutputChannels(AudioObjectID Device)
    {
        const AudioObjectPropertyAddress Addr = Address(kAudioDevicePropertyStreamConfiguration, kAudioObjectPropertyScopeOutput);
        UInt32 Size = 0;
        if (AudioObjectGetPropertyDataSize(Device, &Addr, 0, nullptr, &Size) != noErr || Size < sizeof(AudioBufferList))
        {
            return 0;
        }
        TArray<uint8> Buffer;
        Buffer.SetNumZeroed(static_cast<int32>(Size));
        AudioBufferList* Buffers = reinterpret_cast<AudioBufferList*>(Buffer.GetData());
        if (AudioObjectGetPropertyData(Device, &Addr, 0, nullptr, &Size, Buffers) != noErr)
        {
            return 0;
        }
        int32 Channels = 0;
        for (UInt32 Index = 0; Index < Buffers->mNumberBuffers; ++Index)
        {
            Channels += static_cast<int32>(Buffers->mBuffers[Index].mNumberChannels);
        }
        return Channels;
    }

    bool IsHidden(AudioObjectID Device)
    {
        const AudioObjectPropertyAddress Addr = Address(kAudioDevicePropertyIsHidden);
        UInt32 Hidden = 0;
        UInt32 Size = sizeof(Hidden);
        return AudioObjectGetPropertyData(Device, &Addr, 0, nullptr, &Size, &Hidden) == noErr && Hidden != 0;
    }

    AudioObjectID DefaultOutput()
    {
        const AudioObjectPropertyAddress Addr = Address(kAudioHardwarePropertyDefaultOutputDevice);
        AudioObjectID Device = kAudioObjectUnknown;
        UInt32 Size = sizeof(Device);
        return AudioObjectGetPropertyData(kAudioObjectSystemObject, &Addr, 0, nullptr, &Size, &Device) == noErr ? Device : kAudioObjectUnknown;
    }

    TArray<AudioObjectID> AllDevices()
    {
        TArray<AudioObjectID> Devices;
        const AudioObjectPropertyAddress Addr = Address(kAudioHardwarePropertyDevices);
        UInt32 Size = 0;
        if (AudioObjectGetPropertyDataSize(kAudioObjectSystemObject, &Addr, 0, nullptr, &Size) != noErr || Size == 0)
        {
            return Devices;
        }
        Devices.SetNumZeroed(static_cast<int32>(Size / sizeof(AudioObjectID)));
        if (AudioObjectGetPropertyData(kAudioObjectSystemObject, &Addr, 0, nullptr, &Size, Devices.GetData()) != noErr)
        {
            Devices.Reset();
            return Devices;
        }
        Devices.SetNum(static_cast<int32>(Size / sizeof(AudioObjectID)));
        return Devices;
    }

    // Output devices a player can choose: visible, with output channels, not VoiceProcessingIO's private aggregate.
    bool IsChoosableOutput(AudioObjectID Device, FString& OutUid, FString& OutName)
    {
        if (OutputChannels(Device) <= 0 || IsHidden(Device))
        {
            return false;
        }
        OutName = StringProperty(Device, kAudioObjectPropertyName);
        OutUid = StringProperty(Device, kAudioDevicePropertyDeviceUID);
        return !OutUid.IsEmpty() && !OutName.StartsWith(TEXT("CADefaultDeviceAggregate"));
    }

    bool SetDefaultOutput(const FString& Uid)
    {
        for (AudioObjectID Device : AllDevices())
        {
            FString DeviceUid, Name;
            if (IsChoosableOutput(Device, DeviceUid, Name) && DeviceUid == Uid)
            {
                const AudioObjectPropertyAddress Addr = Address(kAudioHardwarePropertyDefaultOutputDevice);
                return AudioObjectSetPropertyData(kAudioObjectSystemObject, &Addr, 0, nullptr, sizeof(Device), &Device) == noErr;
            }
        }
        return false;
    }

    // Core Audio thread: device list or default output changed.
    OSStatus OnHardwareChanged(AudioObjectID, UInt32 NumAddresses, const AudioObjectPropertyAddress* Addresses, void*)
    {
        bool bDeviceListChanged = false;
        for (UInt32 Index = 0; Index < NumAddresses; ++Index)
        {
            bDeviceListChanged |= Addresses[Index].mSelector == kAudioHardwarePropertyDevices;
        }
        AsyncTask(ENamedThreads::GameThread, [bDeviceListChanged]()
        {
            if (UAudioOutputSelectorSubsystem* Selector = MacInstance.Get())
            {
                Selector->OnPlatformDevicesChanged(bDeviceListChanged);
            }
        });
        return noErr;
    }

    const AudioObjectPropertySelector WatchedSelectors[] = { kAudioHardwarePropertyDevices, kAudioHardwarePropertyDefaultOutputDevice };
}
#endif

bool UAudioOutputSelectorSubsystem::ShouldCreateSubsystem(UObject* Outer) const
{
    return !IsRunningDedicatedServer() && FApp::CanEverRenderAudio();
}

void UAudioOutputSelectorSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);

    GConfig->GetString(ConfigSection, TEXT("DeviceId"), PreferredId, GGameUserSettingsIni);
    GConfig->GetString(ConfigSection, TEXT("DeviceName"), PreferredName, GGameUserSettingsIni);

    TickHandle = FTSTicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateUObject(this, &UAudioOutputSelectorSubsystem::Tick), 0.25f);
    PostActorTickHandle = FWorldDelegates::OnWorldPostActorTick.AddUObject(this, &UAudioOutputSelectorSubsystem::OnWorldPostActorTick);

    if (UAudioDeviceNotificationSubsystem* Notifications = GEngine ? UAudioDeviceNotificationSubsystem::Get() : nullptr)
    {
        DefaultChangedHandle = Notifications->DefaultRenderDeviceChangedNative.AddUObject(this, &UAudioOutputSelectorSubsystem::OnDefaultRenderDeviceChanged);
        AddedHandle = Notifications->DeviceAddedNative.AddUObject(this, &UAudioOutputSelectorSubsystem::OnDeviceAdded);
        RemovedHandle = Notifications->DeviceRemovedNative.AddUObject(this, &UAudioOutputSelectorSubsystem::OnDeviceRemoved);
        SwitchedHandle = Notifications->DeviceSwitchedNative.AddUObject(this, &UAudioOutputSelectorSubsystem::OnDeviceSwitched);
    }

#if PLATFORM_MAC
    MacInstance = this;
    for (AudioObjectPropertySelector Selector : AudioOutputSelectorMac::WatchedSelectors)
    {
        const AudioObjectPropertyAddress Addr = AudioOutputSelectorMac::Address(Selector);
        AudioObjectAddPropertyListener(kAudioObjectSystemObject, &Addr, &AudioOutputSelectorMac::OnHardwareChanged, nullptr);
    }
#endif

    UE_LOG(LogAudioOutputSelector, Log, TEXT("Output device preference: %s"),
        PreferredId.IsEmpty() ? TEXT("system default") : *FString::Printf(TEXT("%s [%s]"), *PreferredName, *PreferredId));
}

void UAudioOutputSelectorSubsystem::Deinitialize()
{
#if PLATFORM_MAC
    for (AudioObjectPropertySelector Selector : AudioOutputSelectorMac::WatchedSelectors)
    {
        const AudioObjectPropertyAddress Addr = AudioOutputSelectorMac::Address(Selector);
        AudioObjectRemovePropertyListener(kAudioObjectSystemObject, &Addr, &AudioOutputSelectorMac::OnHardwareChanged, nullptr);
    }
    MacInstance.Reset();
#endif

    if (UAudioDeviceNotificationSubsystem* Notifications = GEngine ? UAudioDeviceNotificationSubsystem::Get() : nullptr)
    {
        Notifications->DefaultRenderDeviceChangedNative.Remove(DefaultChangedHandle);
        Notifications->DeviceAddedNative.Remove(AddedHandle);
        Notifications->DeviceRemovedNative.Remove(RemovedHandle);
        Notifications->DeviceSwitchedNative.Remove(SwitchedHandle);
    }
    FWorldDelegates::OnWorldPostActorTick.Remove(PostActorTickHandle);
    FTSTicker::GetCoreTicker().RemoveTicker(TickHandle);

    for (const TWeakObjectPtr<UComboBoxString>& Combo : Combos)
    {
        if (Combo.IsValid())
        {
            Combo->OnSelectionChanged.RemoveAll(this);
        }
    }
    Combos.Reset();

    Super::Deinitialize();
}

bool UAudioOutputSelectorSubsystem::Tick(float DeltaTime)
{
    const double Now = FPlatformTime::Seconds();

    // First chance: apply the saved choice.
    if (!bStartupApplied && GEngine && GEngine->GetMainAudioDeviceRaw())
    {
        bStartupApplied = true;
        bApplyPreference = !PreferredId.IsEmpty();
        RefreshDevices();
    }

    if (bRefreshInFlight && Now - RefreshStartTime > RefreshTimeout)
    {
        UE_LOG(LogAudioOutputSelector, Warning, TEXT("Output device list did not arrive; asking again"));
        bRefreshInFlight = false;
        NextRefresh = Now;
    }
    if (NextRefresh > 0.0 && Now >= NextRefresh)
    {
        NextRefresh = 0.0;
        RefreshDevices();
    }
    if (bSwitchPending && NextSwitchAttempt > 0.0 && Now >= NextSwitchAttempt)
    {
        NextSwitchAttempt = 0.0;
        AttemptSwitch();
    }
    return true;
}

void UAudioOutputSelectorSubsystem::OnWorldPostActorTick(UWorld* World, ELevelTick TickType, float DeltaSeconds)
{
    // After the actors tick and before the frame is drawn, so a menu opened this frame shows the row at once.
    if (!World || !World->IsGameWorld() || World->GetGameInstance() != GetGameInstance())
    {
        return;
    }
    if (!MenuClass.IsValid())
    {
        const double Now = FPlatformTime::Seconds();
        if (Now < NextMenuClassLookup)
        {
            return;
        }
        NextMenuClassLookup = Now + 1.0;
        MenuClass = FindObject<UClass>(nullptr, MenuClassPath);
        if (!MenuClass.IsValid())
        {
            return;
        }
    }

    static const FName RowCopyName(*(FString(CopyPrefix) + MicRowName.ToString()));
    TArray<UObject*> Menus;
    GetObjectsOfClass(MenuClass.Get(), Menus, true, RF_ClassDefaultObject | RF_ArchetypeObject, EInternalObjectFlags::Garbage);
    for (UObject* Object : Menus)
    {
        UUserWidget* Menu = Cast<UUserWidget>(Object);
        if (Menu && Menu->WidgetTree && Menu->GetWorld() == World && !MenusWithoutRow.Contains(Menu)
            && !StaticFindObjectFast(UWidget::StaticClass(), Menu->WidgetTree, RowCopyName))
        {
            AddOutputRow(Menu);
        }
    }
}

void UAudioOutputSelectorSubsystem::AddOutputRow(UUserWidget* Menu)
{
    UWidgetTree* Tree = Menu->WidgetTree;
    UPanelWidget* List = Cast<UPanelWidget>(Tree->FindWidget(MenuListName));
    UWidget* MicRow = Tree->FindWidget(MicRowName);
    UTextBlock* MicLabel = Cast<UTextBlock>(Tree->FindWidget(MicLabelName));
    const int32 MicIndex = (List && MicRow) ? List->GetChildIndex(MicRow) : INDEX_NONE;
    if (MicIndex == INDEX_NONE || !Cast<UComboBoxString>(Tree->FindWidget(MicComboName)))
    {
        UE_LOG(LogAudioOutputSelector, Warning, TEXT("%s: microphone row not found; no Output Device row"), *Menu->GetName());
        for (auto It = MenusWithoutRow.CreateIterator(); It; ++It)
        {
            if (!It->IsValid())
            {
                It.RemoveCurrent();
            }
        }
        MenusWithoutRow.Add(Menu);
        return;
    }

    TMap<FName, UWidget*> Copies;
    UWidget* Row = CopyWidget(Tree, MicRow, Copies);
    UComboBoxString* Combo = Cast<UComboBoxString>(Copies.FindRef(MicComboName));
    UTextBlock* Label = Cast<UTextBlock>(Copies.FindRef(MicLabelName));
    UButton* Refresh = Cast<UButton>(Copies.FindRef(MicRefreshName));
    if (!Row || !Combo)
    {
        UE_LOG(LogAudioOutputSelector, Warning, TEXT("%s: could not copy the microphone row"), *Menu->GetName());
        MenusWithoutRow.Add(Menu);
        return;
    }

    if (Label)
    {
        const FString MicText = MicLabel ? MicLabel->GetText().ToString() : FString();
        Label->SetText(FText::FromString(MicText.Contains(TEXT("Input")) ? MicText.Replace(TEXT("Input"), TEXT("Output")) : FString(TEXT("Output Device: "))));
    }
    Combo->ClearOptions();
    Combo->OnSelectionChanged.AddDynamic(this, &UAudioOutputSelectorSubsystem::OnOutputSelectionChanged);
    if (Refresh)
    {
        Refresh->OnClicked.AddDynamic(this, &UAudioOutputSelectorSubsystem::OnRefreshClicked);
    }

    // Under the microphone row. Packaged games cannot insert at an index, so rows below it are added again after it.
    TArray<TPair<UWidget*, UPanelSlot*>> RowsBelow;
    while (List->GetChildrenCount() > MicIndex + 1)
    {
        const int32 Last = List->GetChildrenCount() - 1;
        UWidget* Below = List->GetChildAt(Last);
        RowsBelow.Insert(TPair<UWidget*, UPanelSlot*>(Below, Below ? Below->Slot.Get() : nullptr), 0);
        List->RemoveChildAt(Last);
    }
    AddChildLike(List, Row, MicRow->Slot);
    for (const TPair<UWidget*, UPanelSlot*>& Below : RowsBelow)
    {
        if (Below.Key)
        {
            AddChildLike(List, Below.Key, Below.Value);
        }
    }

    // Line the two lists up: both labels as wide as the wider one.
    if (Label && MicLabel)
    {
        Label->ForceLayoutPrepass();
        MicLabel->ForceLayoutPrepass();
        const float Width = FMath::Max(Label->GetDesiredSize().X, MicLabel->GetDesiredSize().X);
        if (Width > 0.f)
        {
            Label->SetMinDesiredWidth(Width);
            MicLabel->SetMinDesiredWidth(Width);
        }
    }

    Combos.RemoveAll([](const TWeakObjectPtr<UComboBoxString>& Existing) { return !Existing.IsValid(); });
    Combos.Add(Combo);
    UpdateCombos();
    RefreshDevices();
    UE_LOG(LogAudioOutputSelector, Log, TEXT("Output Device row added to %s"), *Menu->GetName());
}

void UAudioOutputSelectorSubsystem::RefreshDevices()
{
    if (bRefreshInFlight)
    {
        bRefreshAgain = true;
        return;
    }

#if PLATFORM_MAC
    TArray<FOutputDevice> List;
    FString DefaultUid;
    const AudioObjectID Default = AudioOutputSelectorMac::DefaultOutput();
    for (AudioObjectID Device : AudioOutputSelectorMac::AllDevices())
    {
        FOutputDevice Entry;
        if (AudioOutputSelectorMac::IsChoosableOutput(Device, Entry.Id, Entry.Name))
        {
            Entry.bIsSystemDefault = Device == Default;
            if (Entry.bIsSystemDefault)
            {
                DefaultUid = Entry.Id;
            }
            List.Add(MoveTemp(Entry));
        }
    }
    OnDevicesListed(MoveTemp(List), MoveTemp(DefaultUid));
#else
    if (!GEngine || !GEngine->GetMainAudioDeviceRaw())
    {
        return;
    }
    bRefreshInFlight = true;
    RefreshStartTime = FPlatformTime::Seconds();
    const Audio::FDeviceId MainDeviceId = GEngine->GetMainAudioDeviceID();
    TWeakObjectPtr<UAudioOutputSelectorSubsystem> WeakThis(this);
    FAudioThread::RunCommandOnAudioThread([WeakThis, MainDeviceId]()
    {
        TArray<FOutputDevice> List;
        FString Current;
        FAudioDeviceManager* Manager = FAudioDeviceManager::Get();
        FAudioDevice* Device = Manager ? Manager->GetAudioDeviceRaw(MainDeviceId) : nullptr;
        Audio::IAudioMixerPlatformInterface* Platform = Device
            ? static_cast<Audio::FMixerDevice*>(Device)->GetAudioMixerPlatform() : nullptr;
        if (Platform)
        {
            TArray<Audio::FAudioPlatformDeviceInfo> Infos;
            if (Audio::IAudioPlatformDeviceInfoCache* Cache = Platform->GetDeviceInfoCache())
            {
                Infos = Cache->GetAllActiveOutputDevices();
            }
            else
            {
                uint32 Count = 0;
                Platform->GetNumOutputDevices(Count);
                for (uint32 Index = 0; Index < Count; ++Index)
                {
                    Audio::FAudioPlatformDeviceInfo Info;
                    if (Platform->GetOutputDeviceInfo(Index, Info))
                    {
                        Infos.Add(MoveTemp(Info));
                    }
                }
            }
            for (const Audio::FAudioPlatformDeviceInfo& Info : Infos)
            {
                if (!Info.DeviceId.IsEmpty())
                {
                    List.Add(FOutputDevice{ Info.DeviceId, Info.Name, Info.bIsSystemDefault != 0 });
                }
            }
            Current = Platform->GetPlatformDeviceInfo().DeviceId;
        }
        AsyncTask(ENamedThreads::GameThread, [WeakThis, List = MoveTemp(List), Current = MoveTemp(Current)]() mutable
        {
            if (UAudioOutputSelectorSubsystem* This = WeakThis.Get())
            {
                This->OnDevicesListed(MoveTemp(List), MoveTemp(Current));
            }
        });
    });
#endif
}

void UAudioOutputSelectorSubsystem::OnDevicesListed(TArray<FOutputDevice> InDevices, FString InCurrentId)
{
    bRefreshInFlight = false;

    FString Summary;
    for (const FOutputDevice& Device : InDevices)
    {
        Summary += FString::Printf(TEXT("%s%s%s%s"), Summary.IsEmpty() ? TEXT("") : TEXT(" | "), *Device.Name,
            Device.bIsSystemDefault ? TEXT(" [default]") : TEXT(""), Device.Id == InCurrentId ? TEXT(" [playing]") : TEXT(""));
    }
    if (Summary != LastSummary)
    {
        UE_LOG(LogAudioOutputSelector, Log, TEXT("Output devices: %s"), Summary.IsEmpty() ? TEXT("(none)") : *Summary);
        LastSummary = Summary;
    }

#if PLATFORM_MAC
    // The default output moved away from the chosen device while that device is still connected: the player picked
    // another output in the Sound menu, so the game follows the system default from now on.
    const FOutputDevice* NewDefault = InDevices.FindByPredicate([](const FOutputDevice& Device) { return Device.bIsSystemDefault; });
    const bool bPreferredConnected = InDevices.ContainsByPredicate([this](const FOutputDevice& Device) { return Device.Id == PreferredId; });
    if (bHaveDeviceList && !PreferredId.IsEmpty() && CurrentId == PreferredId && NewDefault && NewDefault->Id != PreferredId
        && bPreferredConnected && !bSwitchPending)
    {
        UE_LOG(LogAudioOutputSelector, Log, TEXT("Mac output changed to %s outside the game; following the system default"), *NewDefault->Name);
        PreferredId.Empty();
        PreferredName.Empty();
        SavePreference();
    }
#endif

    Devices = MoveTemp(InDevices);
    CurrentId = MoveTemp(InCurrentId);
    bHaveDeviceList = true;
    UpdateCombos();

    if (bApplyPreference)
    {
        bApplyPreference = false;
        ApplyPreference();
    }
    if (bRefreshAgain)
    {
        bRefreshAgain = false;
        RefreshDevices();
    }
}

void UAudioOutputSelectorSubsystem::UpdateCombos()
{
    // Entries: "Default: <name>" (follows the system default), then each connected output device, then the chosen
    // device if it is not connected.
    TArray<TPair<FString, FString>> Entries;
    const FOutputDevice* Default = Devices.FindByPredicate([](const FOutputDevice& Device) { return Device.bIsSystemDefault; });
    Entries.Emplace(Default ? FString::Printf(TEXT("Default: %s"), *Default->Name) : FString(TEXT("Default")), FString());
    TMap<FString, int32> NameUses;
    for (const FOutputDevice& Device : Devices)
    {
        FString Entry = Device.Name.IsEmpty() ? Device.Id : Device.Name;
        const int32 Uses = ++NameUses.FindOrAdd(Entry);
        if (Uses > 1)
        {
            Entry = FString::Printf(TEXT("%s (%d)"), *Entry, Uses);
        }
        Entries.Emplace(Entry, Device.Id);
    }
    FString Selected = Entries[0].Key;
    if (!PreferredId.IsEmpty())
    {
        if (const TPair<FString, FString>* Chosen = Entries.FindByPredicate([this](const TPair<FString, FString>& Entry) { return Entry.Value == PreferredId; }))
        {
            Selected = Chosen->Key;
        }
        else
        {
            Selected = FString::Printf(TEXT("%s (not connected)"), PreferredName.IsEmpty() ? TEXT("Chosen device") : *PreferredName);
            Entries.Emplace(Selected, PreferredId);
        }
    }

    EntryToId.Reset();
    for (const TPair<FString, FString>& Entry : Entries)
    {
        EntryToId.Add(Entry.Key, Entry.Value);
    }

    TGuardValue<bool> Updating(bUpdatingCombos, true);
    Combos.RemoveAll([](const TWeakObjectPtr<UComboBoxString>& Combo) { return !Combo.IsValid(); });
    for (const TWeakObjectPtr<UComboBoxString>& Combo : Combos)
    {
        // Rebuild only when something changed, so an open list is not closed under the player.
        bool bSame = Combo->GetOptionCount() == Entries.Num() && Combo->GetSelectedOption() == Selected;
        for (int32 Index = 0; bSame && Index < Entries.Num(); ++Index)
        {
            bSame = Combo->GetOptionAtIndex(Index) == Entries[Index].Key;
        }
        if (!bSame)
        {
            Combo->ClearOptions();
            for (const TPair<FString, FString>& Entry : Entries)
            {
                Combo->AddOption(Entry.Key);
            }
            Combo->SetSelectedOption(Selected);
        }
    }
}

void UAudioOutputSelectorSubsystem::ApplyPreference()
{
    // "Default" needs nothing: the engine (Windows) and the system (Mac) follow the default output themselves.
    if (PreferredId.IsEmpty() || bSwitchPending)
    {
        return;
    }
    const FOutputDevice* Preferred = Devices.FindByPredicate([this](const FOutputDevice& Device) { return Device.Id == PreferredId; });
    if (!Preferred)
    {
        UE_LOG(LogAudioOutputSelector, Log, TEXT("Chosen output device %s is not connected; playing on the default until it is"), *PreferredName);
        return;
    }
    if (CurrentId == PreferredId)
    {
        return;
    }
    const double Now = FPlatformTime::Seconds();
    ReapplyTimes.RemoveAll([Now](double Time) { return Now - Time > ReapplyWindow; });
    if (ReapplyTimes.Num() >= MaxReapplies)
    {
        UE_LOG(LogAudioOutputSelector, Warning, TEXT("Not moving the game back to %s again (%d moves in %.0f s)"), *Preferred->Name, ReapplyTimes.Num(), ReapplyWindow);
        return;
    }
    ReapplyTimes.Add(Now);
    UE_LOG(LogAudioOutputSelector, Log, TEXT("Playing on the chosen output device %s"), *Preferred->Name);
    SwitchTo(PreferredId);
}

void UAudioOutputSelectorSubsystem::SwitchTo(const FString& DeviceId)
{
    bSwitchPending = true;
    PendingSwitchId = DeviceId;
    SwitchAttempts = 0;
    NextSwitchAttempt = 0.0;
    AttemptSwitch();
}

void UAudioOutputSelectorSubsystem::AttemptSwitch()
{
    ++SwitchAttempts;
    const FString DeviceId = PendingSwitchId;

#if PLATFORM_MAC
    // Empty = the system default, which is already what plays.
    OnSwitchRequested(DeviceId, DeviceId.IsEmpty() || AudioOutputSelectorMac::SetDefaultOutput(DeviceId));
#else
    if (!GEngine || !GEngine->GetMainAudioDeviceRaw())
    {
        OnSwitchRequested(DeviceId, false);
        return;
    }
    const Audio::FDeviceId MainDeviceId = GEngine->GetMainAudioDeviceID();
    TWeakObjectPtr<UAudioOutputSelectorSubsystem> WeakThis(this);
    FAudioThread::RunCommandOnAudioThread([WeakThis, MainDeviceId, DeviceId]()
    {
        FAudioDeviceManager* Manager = FAudioDeviceManager::Get();
        FAudioDevice* Device = Manager ? Manager->GetAudioDeviceRaw(MainDeviceId) : nullptr;
        Audio::IAudioMixerPlatformInterface* Platform = Device
            ? static_cast<Audio::FMixerDevice*>(Device)->GetAudioMixerPlatform() : nullptr;
        const bool bAccepted = Platform && Platform->RequestDeviceSwap(DeviceId, /*bInForce*/ false, TEXT("Speaker selection"));
        AsyncTask(ENamedThreads::GameThread, [WeakThis, DeviceId, bAccepted]()
        {
            if (UAudioOutputSelectorSubsystem* This = WeakThis.Get())
            {
                This->OnSwitchRequested(DeviceId, bAccepted);
            }
        });
    });
#endif
}

void UAudioOutputSelectorSubsystem::OnSwitchRequested(const FString& DeviceId, bool bAccepted)
{
    if (!bSwitchPending || DeviceId != PendingSwitchId)
    {
        return;     // a newer choice replaced this one
    }
    if (bAccepted)
    {
        bSwitchPending = false;
        UE_LOG(LogAudioOutputSelector, Log, TEXT("Switching game audio to %s"), DeviceId.IsEmpty() ? TEXT("the system default") : *DeviceId);
        NextRefresh = FPlatformTime::Seconds() + 1.0;     // show the result in the lists
        return;
    }
    if (SwitchAttempts >= MaxSwitchAttempts)
    {
        bSwitchPending = false;
        UE_LOG(LogAudioOutputSelector, Warning, TEXT("Could not switch game audio to %s after %d attempts"), DeviceId.IsEmpty() ? TEXT("the system default") : *DeviceId, SwitchAttempts);
        return;
    }
    NextSwitchAttempt = FPlatformTime::Seconds() + SwitchRetryDelay;
}

void UAudioOutputSelectorSubsystem::SavePreference() const
{
    GConfig->SetString(ConfigSection, TEXT("DeviceId"), *PreferredId, GGameUserSettingsIni);
    GConfig->SetString(ConfigSection, TEXT("DeviceName"), *PreferredName, GGameUserSettingsIni);
    GConfig->Flush(false, GGameUserSettingsIni);
}

void UAudioOutputSelectorSubsystem::OnOutputSelectionChanged(FString SelectedItem, ESelectInfo::Type SelectionType)
{
    if (bUpdatingCombos || SelectionType == ESelectInfo::Direct)
    {
        return;
    }
    const FString* Id = EntryToId.Find(SelectedItem);
    if (!Id || *Id == PreferredId)
    {
        return;
    }
    const FOutputDevice* Device = Devices.FindByPredicate([Id](const FOutputDevice& Entry) { return Entry.Id == *Id; });
    PreferredId = *Id;
    PreferredName = Device ? Device->Name : FString();
    SavePreference();
    ReapplyTimes.Reset();
    UE_LOG(LogAudioOutputSelector, Log, TEXT("Output device chosen: %s"), PreferredId.IsEmpty() ? TEXT("system default") : *FString::Printf(TEXT("%s [%s]"), *PreferredName, *PreferredId));
    UpdateCombos();     // other open menus; drops a "(not connected)" entry

    if (PreferredId.IsEmpty())
    {
#if !PLATFORM_MAC
        // Back to the Windows default, unless the game already plays there.
        const FOutputDevice* Default = Devices.FindByPredicate([](const FOutputDevice& Entry) { return Entry.bIsSystemDefault; });
        if (!Default || Default->Id != CurrentId)
        {
            SwitchTo(FString());
        }
#endif
    }
    else if (Device && (Device->Id != CurrentId))
    {
        SwitchTo(PreferredId);
    }
}

void UAudioOutputSelectorSubsystem::OnRefreshClicked()
{
    RefreshDevices();
}

void UAudioOutputSelectorSubsystem::OnDefaultRenderDeviceChanged(EAudioDeviceChangedRole Role, FString DeviceId)
{
    // The engine moves the game to the new default itself (OnDeviceSwitched follows); update the "Default" entry.
    RefreshDevices();
}

void UAudioOutputSelectorSubsystem::OnDeviceAdded(FString DeviceId)
{
    if (!PreferredId.IsEmpty() && DeviceId == PreferredId)
    {
        UE_LOG(LogAudioOutputSelector, Log, TEXT("Chosen output device %s connected"), *PreferredName);
        bApplyPreference = true;
    }
    RefreshDevices();
}

void UAudioOutputSelectorSubsystem::OnDeviceRemoved(FString DeviceId)
{
    RefreshDevices();
}

void UAudioOutputSelectorSubsystem::OnDeviceSwitched(FString DeviceId)
{
    CurrentId = DeviceId;
#if !PLATFORM_MAC
    // The engine moved the game (a new Windows default, or the device went away): back to the chosen device.
    if (!PreferredId.IsEmpty() && DeviceId != PreferredId)
    {
        bApplyPreference = true;
    }
#endif
    RefreshDevices();
}

void UAudioOutputSelectorSubsystem::OnPlatformDevicesChanged(bool bDeviceListChanged)
{
    // A device was connected: if it is the chosen one, play on it again.
    if (bDeviceListChanged && !PreferredId.IsEmpty())
    {
        bApplyPreference = true;
    }
    RefreshDevices();
}
