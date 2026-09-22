// Video player volume slider (2026-09-19).

#include "VideoPlayerVolumeSubsystem.h"

#include "ActiveSound.h"
#include "AudioDevice.h"
#include "AudioThread.h"
#include "MediaSoundComponent.h"
#include "Blueprint/UserWidget.h"
#include "Blueprint/WidgetTree.h"
#include "Components/PanelSlot.h"
#include "Components/PanelWidget.h"
#include "Components/Slider.h"
#include "Engine/Engine.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"
#include "GameFramework/PlayerController.h"
#include "Kismet/GameplayStatics.h"
#include "Misc/App.h"
#include "Misc/CommandLine.h"
#include "Misc/ConfigCacheIni.h"
#include "Misc/Parse.h"
#include "Sound/SoundClass.h"
#include "Sound/SoundMix.h"
#include "UObject/UnrealType.h"
#include "UObject/UObjectHash.h"

DEFINE_LOG_CATEGORY(LogVideoPlayerVolume);

namespace VideoPlayerVolume
{
    const TCHAR* VideoClassPath = TEXT("/Game/AntizeMenuSystem/Sounds/ClassesAndMixes/SC_Video.SC_Video");
    const TCHAR* VideoMixPath = TEXT("/Game/AntizeMenuSystem/Sounds/ClassesAndMixes/SM_Video.SM_Video");
    const TCHAR* ConfigSection = TEXT("VideoPlayer");
    const FName SliderName(TEXT("Slider_Volume"));
    constexpr double SaveDelay = 0.75;      // save once the slider has been still this long
    const TCHAR* OptionsClassPath = TEXT("/Game/AntizeMenuSystem/Widgets/W_Options.W_Options_C");
    constexpr int32 VideoAudioIndex = 4;    // after Master 0, Music 1, Effects 2, Voice 3 (E_TemplateAudio)

    // In 1 % steps like the sliders, so the text the settings menu stores reads back as the same value.
    float RoundVolume(float Value)
    {
        return FMath::RoundToFloat(FMath::Clamp(Value, 0.f, 1.f) * 100.f) / 100.f;
    }

    UObject* GetObjectValue(UObject* Object, const TCHAR* Name)
    {
        FObjectPropertyBase* Property = FindFProperty<FObjectPropertyBase>(Object->GetClass(), Name);
        return Property ? Property->GetObjectPropertyValue_InContainer(Object) : nullptr;
    }

    void SetObjectValue(UObject* Object, const TCHAR* Name, UObject* Value)
    {
        if (FObjectPropertyBase* Property = FindFProperty<FObjectPropertyBase>(Object->GetClass(), Name))
        {
            Property->SetObjectPropertyValue_InContainer(Object, Value);
        }
    }

    void SetTextValue(UObject* Object, const TCHAR* Name, const FText& Value)
    {
        if (FTextProperty* Property = FindFProperty<FTextProperty>(Object->GetClass(), Name))
        {
            Property->SetPropertyValue_InContainer(Object, Value);
        }
    }

    void SetDoubleValue(UObject* Object, const TCHAR* Name, double Value)
    {
        if (FDoubleProperty* Property = FindFProperty<FDoubleProperty>(Object->GetClass(), Name))
        {
            Property->SetPropertyValue_InContainer(Object, Value);
        }
    }

    void SetBoolValue(UObject* Object, const TCHAR* Name, bool Value)
    {
        if (FBoolProperty* Property = FindFProperty<FBoolProperty>(Object->GetClass(), Name))
        {
            Property->SetPropertyValue_InContainer(Object, Value);
        }
    }

    void SetByteValue(UObject* Object, const TCHAR* Name, uint8 Value)
    {
        FProperty* Property = FindFProperty<FProperty>(Object->GetClass(), Name);
        if (FByteProperty* Byte = CastField<FByteProperty>(Property))
        {
            Byte->SetPropertyValue_InContainer(Object, Value);
        }
        else if (FEnumProperty* Enum = CastField<FEnumProperty>(Property))
        {
            Enum->GetUnderlyingProperty()->SetIntPropertyValue(Enum->ContainerPtrToValuePtr<void>(Object), static_cast<uint64>(Value));
        }
    }

    // Calls a (Blueprint) function by name; Fill sets its parameters.
    bool CallBlueprintFunction(UObject* Object, const TCHAR* Name, TFunctionRef<void(UFunction*, uint8*)> Fill)
    {
        UFunction* Function = Object ? Object->FindFunction(FName(Name)) : nullptr;
        if (!Function)
        {
            return false;
        }
        TArray<uint8, TAlignedHeapAllocator<16>> Params;
        Params.SetNumZeroed(FMath::Max<int32>(Function->ParmsSize, 1));
        for (TFieldIterator<FProperty> It(Function); It && It->HasAnyPropertyFlags(CPF_Parm); ++It)
        {
            It->InitializeValue_InContainer(Params.GetData());
        }
        Fill(Function, Params.GetData());
        Object->ProcessEvent(Function, Params.GetData());
        for (TFieldIterator<FProperty> It(Function); It && It->HasAnyPropertyFlags(CPF_Parm); ++It)
        {
            It->DestroyValue_InContainer(Params.GetData());
        }
        return true;
    }

    // The designer-set values of a widget or slot, without object references or event bindings.
    void CopyDesignerProperties(const UObject* Source, UObject* Target)
    {
        static const TSet<FName> Skipped = { TEXT("Slot"), TEXT("Slots"), TEXT("Content"), TEXT("Parent") };
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

    void AddChildLike(UPanelWidget* Panel, UWidget* Content, const UPanelSlot* Template)
    {
        UPanelSlot* Slot = Panel->AddChild(Content);
        if (Slot && Template && Template->GetClass() == Slot->GetClass())
        {
            CopyDesignerProperties(Template, Slot);
            Slot->SynchronizeProperties();
        }
    }
}

using namespace VideoPlayerVolume;

bool UVideoPlayerVolumeSubsystem::ShouldCreateSubsystem(UObject* Outer) const
{
    return !IsRunningDedicatedServer() && FApp::CanEverRenderAudio();
}

void UVideoPlayerVolumeSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);

    GConfig->GetFloat(ConfigSection, TEXT("Volume"), Volume, GGameUserSettingsIni);
    Volume = RoundVolume(Volume);

    VideoClass = LoadObject<USoundClass>(nullptr, VideoClassPath);
    VideoMix = LoadObject<USoundMix>(nullptr, VideoMixPath);
    if (VideoClass && !VideoMix)
    {
        // Same mix as the asset: one adjuster on SC_Video.
        UE_LOG(LogVideoPlayerVolume, Warning, TEXT("SM_Video not found; using an equivalent mix built at runtime"));
        VideoMix = NewObject<USoundMix>(this, TEXT("SM_Video_Runtime"));
        FSoundClassAdjuster Adjuster;
        Adjuster.SoundClassObject = VideoClass;
        VideoMix->SoundClassEffects.Add(Adjuster);
    }
    if (!VideoClass)
    {
        UE_LOG(LogVideoPlayerVolume, Warning, TEXT("SC_Video not found; the video player volume slider stays inactive"));
    }

    TickHandle = FTSTicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateUObject(this, &UVideoPlayerVolumeSubsystem::Tick), 0.1f);
    PostActorTickHandle = FWorldDelegates::OnWorldPostActorTick.AddUObject(this, &UVideoPlayerVolumeSubsystem::OnWorldPostActorTick);

#if !UE_BUILD_SHIPPING
    if (FParse::Value(FCommandLine::Get(), TEXT("VideoVolumeSelfTest="), SelfTestMode) || FParse::Param(FCommandLine::Get(), TEXT("VideoVolumeSelfTest")))
    {
        SelfTestMode = SelfTestMode.IsEmpty() ? FString(TEXT("full")) : SelfTestMode;
        UE_LOG(LogVideoPlayerVolume, Log, TEXT("Self-test requested: %s"), *SelfTestMode);
    }
#endif

    UE_LOG(LogVideoPlayerVolume, Log, TEXT("Video player volume %.2f (SC_Video %s, SM_Video %s)"), Volume,
        VideoClass ? TEXT("found") : TEXT("missing"), VideoMix ? *VideoMix->GetName() : TEXT("missing"));
}

void UVideoPlayerVolumeSubsystem::Deinitialize()
{
    if (bSaveDue)
    {
        SaveVolume();
    }
    FWorldDelegates::OnWorldPostActorTick.Remove(PostActorTickHandle);
    FTSTicker::GetCoreTicker().RemoveTicker(TickHandle);
    for (const TWeakObjectPtr<USlider>& Slider : Sliders)
    {
        if (Slider.IsValid())
        {
            Slider->OnValueChanged.RemoveAll(this);
        }
    }
    Sliders.Reset();
    Super::Deinitialize();
}

bool UVideoPlayerVolumeSubsystem::Tick(float DeltaTime)
{
    if (bSaveDue && FPlatformTime::Seconds() >= SaveAt)
    {
        SaveVolume();
    }
#if !UE_BUILD_SHIPPING
    if (!SelfTestMode.IsEmpty())
    {
        RunSelfTest();
    }
#endif
    return true;
}

void UVideoPlayerVolumeSubsystem::OnWorldPostActorTick(UWorld* World, ELevelTick TickType, float DeltaSeconds)
{
    // After the actors tick and before the frame is drawn, so a video player opened this frame shows its slider in place.
    if (!World || !World->IsGameWorld() || World->GetGameInstance() != GetGameInstance() || !VideoClass || !VideoMix)
    {
        return;
    }
    if (MixWorld.Get() != World && World->GetAudioDevice())
    {
        UGameplayStatics::PushSoundMixModifier(World, VideoMix);
        ApplyVolume(World);
        MixWorld = World;
        UE_LOG(LogVideoPlayerVolume, Log, TEXT("SM_Video active in %s at %.2f"), *World->GetMapName(), Volume);
#if !UE_BUILD_SHIPPING
        SelfTestStart = FPlatformTime::Seconds();
#endif
    }

    // Video audio into SC_Video. DefaultMediaSoundClassName is not enough: when a MediaSoundComponent starts, the engine
    // passes the component's own SoundClass (None) to the sound, which then falls back to the general default class
    // (SC_Master). So every media sound component without a class gets SC_Video here, before it starts.
    TArray<UObject*> MediaSounds;
    GetObjectsOfClass(UMediaSoundComponent::StaticClass(), MediaSounds, true, RF_ClassDefaultObject | RF_ArchetypeObject, EInternalObjectFlags::Garbage);
    for (UObject* Object : MediaSounds)
    {
        UMediaSoundComponent* MediaSound = static_cast<UMediaSoundComponent*>(Object);
        if (MediaSound->SoundClass == nullptr && MediaSound->GetWorld() == World)
        {
            MediaSound->SoundClass = VideoClass;
            const bool bWasPlaying = MediaSound->IsPlaying();
            if (bWasPlaying)
            {
                MediaSound->Stop();
                MediaSound->Start();
            }
            UE_LOG(LogVideoPlayerVolume, Log, TEXT("%s.%s: video sound class set%s"), *GetNameSafe(MediaSound->GetOwner()),
                *MediaSound->GetName(), bWasPlaying ? TEXT(" (restarted)") : TEXT(""));
        }
    }

    TArray<UObject*> Widgets;
    GetObjectsOfClass(UUserWidget::StaticClass(), Widgets, true, RF_ClassDefaultObject | RF_ArchetypeObject, EInternalObjectFlags::Garbage);
    for (UObject* Object : Widgets)
    {
        UUserWidget* Widget = static_cast<UUserWidget*>(Object);
        if (!IsVideoPlayerClass(Widget->GetClass()) || Widget->GetWorld() != World)
        {
            continue;
        }
        USlider* Slider = Cast<USlider>(Widget->GetWidgetFromName(SliderName));
        if (Slider && !Slider->OnValueChanged.IsAlreadyBound(this, &UVideoPlayerVolumeSubsystem::OnVideoSliderChanged))
        {
            LinkSlider(Widget, Slider);
        }
    }

    UpdateSettingsRow(World);
}

bool UVideoPlayerVolumeSubsystem::IsVideoPlayerClass(UClass* WidgetClass)
{
    if (const bool* Known = VideoPlayerClasses.Find(WidgetClass))
    {
        return *Known;
    }
    const bool bVideoPlayer = WidgetClass->GetName().StartsWith(TEXT("BP_WG_"));
    VideoPlayerClasses.Add(WidgetClass, bVideoPlayer);
    return bVideoPlayer;
}

void UVideoPlayerVolumeSubsystem::LinkSlider(UUserWidget* Widget, USlider* Slider)
{
    Slider->SetValue(Volume);       // fires OnValueChanged (the widget's own handler does nothing); linked after it
    Slider->OnValueChanged.AddDynamic(this, &UVideoPlayerVolumeSubsystem::OnVideoSliderChanged);
    Sliders.RemoveAll([](const TWeakObjectPtr<USlider>& Existing) { return !Existing.IsValid(); });
    Sliders.Add(Slider);
    UE_LOG(LogVideoPlayerVolume, Log, TEXT("%s: volume slider linked at %.2f"), *Widget->GetName(), Volume);
}

void UVideoPlayerVolumeSubsystem::OnVideoSliderChanged(float Value)
{
    SetVolume(Value, false);
}

void UVideoPlayerVolumeSubsystem::OnSettingsSliderChanged(float Value)
{
    SetVolume(Value, true);
}

void UVideoPlayerVolumeSubsystem::SetVolume(float NewVolume, bool bFromSettingsRow)
{
    if (bSettingVolume)
    {
        return;     // our own slider updates below
    }
    NewVolume = RoundVolume(NewVolume);
    if (FMath::IsNearlyEqual(NewVolume, Volume, 0.0001f))
    {
        return;
    }
    TGuardValue<bool> Setting(bSettingVolume, true);
    Volume = NewVolume;
    if (UWorld* World = MixWorld.Get())
    {
        ApplyVolume(World);
    }
    // Every video player and the settings row show the same level.
    for (const TWeakObjectPtr<USlider>& Slider : Sliders)
    {
        if (Slider.IsValid() && !FMath::IsNearlyEqual(Slider->GetValue(), Volume, 0.001f))
        {
            Slider->SetValue(Volume);
        }
    }
    if (!bFromSettingsRow)
    {
        SyncSettingsRowQuietly();
    }
    bSaveDue = true;
    SaveAt = FPlatformTime::Seconds() + SaveDelay;
    UE_LOG(LogVideoPlayerVolume, Verbose, TEXT("Video volume %.2f (%s)"), Volume, bFromSettingsRow ? TEXT("settings") : TEXT("video player"));
}

void UVideoPlayerVolumeSubsystem::UpdateSettingsRow(UWorld* World)
{
    const double Now = FPlatformTime::Seconds();
    if (!OptionsClass.IsValid())
    {
        if (Now < NextOptionsLookup)
        {
            return;
        }
        NextOptionsLookup = Now + 1.0;
        OptionsClass = FindObject<UClass>(nullptr, OptionsClassPath);
        if (!OptionsClass.IsValid())
        {
            return;
        }
    }

    UUserWidget* Menu = SettingsMenu.Get();
    if (!Menu || Menu->GetWorld() != World)
    {
        Menu = nullptr;
        TArray<UObject*> Menus;
        GetObjectsOfClass(OptionsClass.Get(), Menus, true, RF_ClassDefaultObject | RF_ArchetypeObject, EInternalObjectFlags::Garbage);
        for (UObject* Object : Menus)
        {
            UUserWidget* Candidate = Cast<UUserWidget>(Object);
            if (Candidate && Candidate->WidgetTree && Candidate->GetWorld() == World)
            {
                Menu = Candidate;
                break;
            }
        }
        if (Menu != SettingsMenu.Get())
        {
            SettingsMenu = Menu;
            SettingsRow.Reset();
            SettingsRowStage = 0;
        }
        if (!Menu)
        {
            return;
        }
    }

    if (SettingsRowStage == 0)
    {
        // Once the menu has set up its own rows (it gives each row OptionsRef in PreConstruct).
        UUserWidget* Master = Cast<UUserWidget>(Menu->WidgetTree->FindWidget(TEXT("Audio_Master")));
        if (Master && GetObjectValue(Master, TEXT("OptionsRef")) == Menu)
        {
            AddSettingsRow(Menu);
        }
    }
    else if (SettingsRowStage == 1 && Now - SettingsRowStageTime > 0.3)
    {
        // The menu registers the new row itself: OptionsRef, its row lists (Save/Cancel/Default, navigation), colours.
        UUserWidget* Row = SettingsRow.Get();
        if (!Row || !CallBlueprintFunction(Menu, TEXT("GetTemplateAndApplySettings"), [](UFunction*, uint8*) {}))
        {
            UE_LOG(LogVideoPlayerVolume, Warning, TEXT("Settings Video row: could not register it with the menu"));
            if (Row)
            {
                SetObjectValue(Row, TEXT("OptionsRef"), Menu);
            }
        }
        SettingsRowStage = 2;
        SettingsRowStageTime = Now;
    }
    else if (SettingsRowStage == 2 && Now - SettingsRowStageTime > 1.0)
    {
        // The row has read MyAudio[4] (= Volume) by now; follow it from here on.
        UUserWidget* Row = SettingsRow.Get();
        USlider* Slider = Row ? Cast<USlider>(Row->GetWidgetFromName(TEXT("Slider_Audio"))) : nullptr;
        if (Slider)
        {
            Slider->OnValueChanged.AddDynamic(this, &UVideoPlayerVolumeSubsystem::OnSettingsSliderChanged);
            UE_LOG(LogVideoPlayerVolume, Log, TEXT("Settings Video row ready: slider %.2f, video volume %.2f, registered %s"),
                Slider->GetValue(), Volume, GetObjectValue(Row, TEXT("OptionsRef")) == Menu ? TEXT("yes") : TEXT("no"));
        }
        SettingsRowStage = 3;
    }
}

void UVideoPlayerVolumeSubsystem::AddSettingsRow(UUserWidget* Menu)
{
    SettingsRowStage = 3;       // one attempt per menu
    UWidgetTree* Tree = Menu->WidgetTree;
    UPanelWidget* List = Cast<UPanelWidget>(Tree->FindWidget(TEXT("ScrollBox_Audio")));
    UUserWidget* Voice = Cast<UUserWidget>(Tree->FindWidget(TEXT("Audio_Voice")));
    if (!List || !Voice)
    {
        UE_LOG(LogVideoPlayerVolume, Warning, TEXT("Settings menu layout not recognized; no Video row"));
        return;
    }
    if (Tree->FindWidget(TEXT("Audio_Video")))
    {
        return;
    }

    // The menu keeps each row's value as text in MyAudio[SettingName]; the Video row is entry 4.
    if (!SetMenuAudioEntry(Menu, FString::SanitizeFloat(Volume)))
    {
        UE_LOG(LogVideoPlayerVolume, Warning, TEXT("Settings menu audio values not found; no Video row"));
        return;
    }

    UUserWidget* Row = CreateWidget<UUserWidget>(Menu, Voice->GetClass(), TEXT("Audio_Video"));
    if (!Row)
    {
        return;
    }
    // Same look and settings as the Voice row; OptionsRef stays empty until the menu registers the row, so the row
    // ignores its own start-up slider moves.
    CopyDesignerProperties(Voice, Row);
    SetTextValue(Row, TEXT("AudioName"), NSLOCTEXT("VideoPlayerVolume", "VideoRowName", "Video"));
    SetTextValue(Row, TEXT("Description"), NSLOCTEXT("VideoPlayerVolume", "VideoRowDescription", "Adjust the Video Volume."));
    SetByteValue(Row, TEXT("SettingName"), 4);
    SetDoubleValue(Row, TEXT("SliderDefaultValue(Percent)"), 1.0);
    SetBoolValue(Row, TEXT("AddSpace?"), false);
    AddChildLike(List, Row, Voice->Slot);
    if (USlider* Slider = Cast<USlider>(Row->GetWidgetFromName(TEXT("Slider_Audio"))))
    {
        Slider->SetValue(Volume);
    }
    SettingsRow = Row;
    SettingsRowStage = 1;
    SettingsRowStageTime = FPlatformTime::Seconds();
    UE_LOG(LogVideoPlayerVolume, Log, TEXT("Settings menu: Video row added under Voice at %.2f"), Volume);
}

void UVideoPlayerVolumeSubsystem::SyncSettingsRowQuietly()
{
    // A change from a video player: update the settings row without the row reporting it to the menu (which would mark
    // the settings as edited), and make it the row's Cancel point too.
    UUserWidget* Row = SettingsRow.Get();
    UUserWidget* Menu = SettingsMenu.Get();
    if (!Row || !Menu)
    {
        return;
    }
    UObject* OptionsRef = GetObjectValue(Row, TEXT("OptionsRef"));
    SetObjectValue(Row, TEXT("OptionsRef"), nullptr);
    CallBlueprintFunction(Row, TEXT("SetSliderValue"), [this](UFunction* Function, uint8* Params)
    {
        if (FDoubleProperty* ValueParam = FindFProperty<FDoubleProperty>(Function, TEXT("Value")))
        {
            ValueParam->SetPropertyValue_InContainer(Params, Volume);
        }
        if (FBoolProperty* MakeSliderParam = FindFProperty<FBoolProperty>(Function, TEXT("MakeSlider?")))
        {
            MakeSliderParam->SetPropertyValue_InContainer(Params, true);
        }
    });
    SetDoubleValue(Row, TEXT("BackupSlider"), Volume);
    SetObjectValue(Row, TEXT("OptionsRef"), OptionsRef);
    SetMenuAudioEntry(Menu, FString::SanitizeFloat(Volume));
}

bool UVideoPlayerVolumeSubsystem::SetMenuAudioEntry(UUserWidget* Menu, const FString& Value) const
{
    // W_Options.MyAudio (S_MyAudio) holds one array of strings.
    FStructProperty* MyAudio = FindFProperty<FStructProperty>(Menu->GetClass(), TEXT("MyAudio"));
    FArrayProperty* Values = nullptr;
    for (TFieldIterator<FArrayProperty> It(MyAudio ? MyAudio->Struct : nullptr); It; ++It)
    {
        if (It->Inner->IsA<FStrProperty>())
        {
            Values = *It;
            break;
        }
    }
    if (!Values)
    {
        return false;
    }
    FScriptArrayHelper Array(Values, Values->ContainerPtrToValuePtr<void>(MyAudio->ContainerPtrToValuePtr<void>(Menu)));
    while (Array.Num() <= VideoAudioIndex)
    {
        Array.AddValue();
    }
    *reinterpret_cast<FString*>(Array.GetRawPtr(VideoAudioIndex)) = Value;
    return true;
}

void UVideoPlayerVolumeSubsystem::ApplyVolume(UWorld* World) const
{
    UGameplayStatics::SetSoundMixClassOverride(World, VideoMix, VideoClass, Volume, 1.f, 0.f, false);
}

void UVideoPlayerVolumeSubsystem::SaveVolume()
{
    bSaveDue = false;
    GConfig->SetFloat(ConfigSection, TEXT("Volume"), Volume, GGameUserSettingsIni);
    GConfig->Flush(false, GGameUserSettingsIni);
    UE_LOG(LogVideoPlayerVolume, Log, TEXT("Video player volume saved: %.2f"), Volume);
}

#if !UE_BUILD_SHIPPING
void UVideoPlayerVolumeSubsystem::LogClassVolumes(const FString& Reason) const
{
    UWorld* World = MixWorld.Get();
    FAudioDevice* Device = World ? World->GetAudioDeviceRaw() : nullptr;
    if (!Device)
    {
        return;
    }
    TArray<TPair<FString, USoundClass*>> Classes;
    for (const TCHAR* Name : { TEXT("SC_Master"), TEXT("SC_Music"), TEXT("SC_Effects"), TEXT("SC_Voice"), TEXT("SC_Video") })
    {
        Classes.Emplace(Name, LoadObject<USoundClass>(nullptr, *FString::Printf(TEXT("/Game/AntizeMenuSystem/Sounds/ClassesAndMixes/%s.%s"), Name, Name)));
    }
    FAudioThread::RunCommandOnAudioThread([Device, Classes, Reason]()
    {
        FString Line;
        for (const TPair<FString, USoundClass*>& Entry : Classes)
        {
            const FSoundClassProperties* Properties = Entry.Value ? Device->GetSoundClassCurrentProperties(Entry.Value) : nullptr;
            Line += FString::Printf(TEXT(" %s=%.3f"), *Entry.Key.RightChop(3), Properties ? Properties->Volume : -1.f);
        }
        UE_LOG(LogVideoPlayerVolume, Log, TEXT("SELFTEST effective volumes [%s]:%s"), *Reason, *Line);
        // The class each playing sound is really in (video sounds are SynthSounds owned by the screen actors).
        int32 Count = 0;
        for (const FActiveSound* Sound : Device->GetActiveSounds())
        {
            if (Sound && ++Count <= 20)
            {
                UE_LOG(LogVideoPlayerVolume, Log, TEXT("SELFTEST playing: %s (%s) owner %s in class %s"), *GetNameSafe(Sound->GetSound()),
                    Sound->GetSound() ? *Sound->GetSound()->GetClass()->GetName() : TEXT("-"), *Sound->GetOwnerName(),
                    *GetNameSafe(Sound->GetSoundClass()));
            }
        }
    });
}

void UVideoPlayerVolumeSubsystem::RunSelfTest()
{
    UWorld* World = MixWorld.Get();
    if (!World || SelfTestStart <= 0.0)
    {
        return;
    }
    const double Elapsed = FPlatformTime::Seconds() - SelfTestStart;
    const bool bFull = SelfTestMode == TEXT("full");
    USlider* Slider = SelfTestWidget.IsValid() ? Cast<USlider>(SelfTestWidget->GetWidgetFromName(SliderName)) : nullptr;

    if (SelfTestMode == TEXT("settings"))
    {
        // The settings menu's Video row: settings -> video, and video player -> settings row (quietly).
        UUserWidget* Row = SettingsRow.Get();
        UUserWidget* Menu = SettingsMenu.Get();
        USlider* RowSlider = Row ? Cast<USlider>(Row->GetWidgetFromName(TEXT("Slider_Audio"))) : nullptr;
        auto LogState = [&](const TCHAR* Reason)
        {
            FString Entry = TEXT("-");
            FString Edited;
            if (Menu)
            {
                FStructProperty* MyAudio = FindFProperty<FStructProperty>(Menu->GetClass(), TEXT("MyAudio"));
                for (TFieldIterator<FArrayProperty> It(MyAudio ? MyAudio->Struct : nullptr); It; ++It)
                {
                    FScriptArrayHelper Array(*It, It->ContainerPtrToValuePtr<void>(MyAudio->ContainerPtrToValuePtr<void>(Menu)));
                    Entry = FString::Printf(TEXT("%d entries, [4]=%s"), Array.Num(),
                        Array.Num() > VideoAudioIndex ? **reinterpret_cast<FString*>(Array.GetRawPtr(VideoAudioIndex)) : TEXT("-"));
                    break;
                }
                for (TFieldIterator<FBoolProperty> It(Menu->GetClass()); It; ++It)
                {
                    if (It->GetName().Contains(TEXT("Edit")))
                    {
                        Edited += FString::Printf(TEXT(" %s=%d"), *It->GetName(), It->GetPropertyValue_InContainer(Menu) ? 1 : 0);
                    }
                }
            }
            UE_LOG(LogVideoPlayerVolume, Log, TEXT("SELFTEST settings [%s]: row slider %.2f, MyAudio %s, row registered %s, video %.2f,%s"),
                Reason, RowSlider ? RowSlider->GetValue() : -1.f, *Entry, (Row && GetObjectValue(Row, TEXT("OptionsRef")) == Menu) ? TEXT("yes") : TEXT("no"),
                Volume, *Edited);
        };
        if (SelfTestStep == 0 && Elapsed > 20.0 && SettingsRowStage == 3)
        {
            LogState(TEXT("start"));
            if (RowSlider)
            {
                RowSlider->SetValue(0.4f);      // what a player dragging the Video row to 40 % produces
            }
            ++SelfTestStep;
        }
        else if (SelfTestStep == 1 && Elapsed > 23.0)
        {
            LogState(TEXT("settings row 0.40"));
            LogClassVolumes(TEXT("settings row 0.40"));
            UClass* WidgetClass = LoadClass<UUserWidget>(nullptr, TEXT("/Game/Blueprints/360_Screens/Widgets/BP_WG_BilateralScar.BP_WG_BilateralScar_C"));
            if (WidgetClass && World->GetFirstPlayerController())
            {
                SelfTestWidget = CreateWidget<UUserWidget>(World->GetFirstPlayerController(), WidgetClass);
                SelfTestWidget->AddToViewport();
            }
            ++SelfTestStep;
        }
        else if (SelfTestStep == 2 && Elapsed > 25.0)
        {
            UE_LOG(LogVideoPlayerVolume, Log, TEXT("SELFTEST video player slider on open: %.2f"), Slider ? Slider->GetValue() : -1.f);
            if (Slider)
            {
                Slider->SetValue(0.7f);         // a player dragging the video player's slider to 70 %
            }
            ++SelfTestStep;
        }
        else if (SelfTestStep == 3 && Elapsed > 27.0)
        {
            LogState(TEXT("video player 0.70"));
            LogClassVolumes(TEXT("video player 0.70"));
            if (SelfTestWidget.IsValid())
            {
                SelfTestWidget->RemoveFromParent();
            }
            UE_LOG(LogVideoPlayerVolume, Log, TEXT("SELFTEST DONE"));
            SelfTestMode.Empty();
        }
        return;
    }

    if (SelfTestStep == 0 && Elapsed > 20.0)
    {
        LogClassVolumes(TEXT("start"));
        ++SelfTestStep;
    }
    else if (SelfTestStep == 1 && Elapsed > 21.0)
    {
        // A video player as the character's E key creates one (the widget finds its screen itself).
        UClass* WidgetClass = LoadClass<UUserWidget>(nullptr, TEXT("/Game/Blueprints/360_Screens/Widgets/BP_WG_BilateralScar.BP_WG_BilateralScar_C"));
        APlayerController* Controller = World->GetFirstPlayerController();
        if (WidgetClass && Controller)
        {
            SelfTestWidget = CreateWidget<UUserWidget>(Controller, WidgetClass);
            SelfTestWidget->AddToViewport();
            Controller->bShowMouseCursor = true;
            UE_LOG(LogVideoPlayerVolume, Log, TEXT("SELFTEST opened %s"), *SelfTestWidget->GetName());
        }
        ++SelfTestStep;
    }
    else if (SelfTestStep == 2 && Elapsed > 23.0)
    {
        UE_LOG(LogVideoPlayerVolume, Log, TEXT("SELFTEST slider position on open: %.3f (saved %.3f)"), Slider ? Slider->GetValue() : -1.f, Volume);
        if (!bFull)
        {
            SelfTestStep = 10;          // "open": leave it open for manual use and report every 3 s
            return;
        }
        if (Slider)
        {
            // What a player dragging the slider to the middle produces.
            Slider->SetValue(0.5f);
            Slider->OnValueChanged.Broadcast(0.5f);
        }
        ++SelfTestStep;
    }
    else if (SelfTestStep == 3 && Elapsed > 25.0)
    {
        LogClassVolumes(TEXT("video slider 0.5"));
        ++SelfTestStep;
    }
    else if (SelfTestStep == 4 && Elapsed > 26.0)
    {
        // Settings menu Master at 50 %, exactly as W_TemplateAudio applies it (session only; the settings save is untouched).
        USoundMix* MasterMix = LoadObject<USoundMix>(nullptr, TEXT("/Game/AntizeMenuSystem/Sounds/ClassesAndMixes/SM_Master.SM_Master"));
        USoundClass* MasterClass = LoadObject<USoundClass>(nullptr, TEXT("/Game/AntizeMenuSystem/Sounds/ClassesAndMixes/SC_Master.SC_Master"));
        UGameplayStatics::SetSoundMixClassOverride(World, MasterMix, MasterClass, 0.5f, 1.f, 0.f, true);
        UGameplayStatics::PushSoundMixModifier(World, MasterMix);
        ++SelfTestStep;
    }
    else if (SelfTestStep == 5 && Elapsed > 28.0)
    {
        LogClassVolumes(TEXT("master 0.5 + video slider 0.5"));
        if (SelfTestWidget.IsValid())
        {
            SelfTestWidget->RemoveFromParent();
        }
        UE_LOG(LogVideoPlayerVolume, Log, TEXT("SELFTEST DONE"));
        SelfTestMode.Empty();
    }
    else if (SelfTestStep >= 10 && Elapsed > 23.0 + 3.0 * (SelfTestStep - 9))
    {
        LogClassVolumes(FString::Printf(TEXT("open +%ds, video %.2f"), 3 * (SelfTestStep - 9), Volume));
        if (++SelfTestStep > 30)
        {
            SelfTestMode.Empty();
        }
    }
}
#endif
