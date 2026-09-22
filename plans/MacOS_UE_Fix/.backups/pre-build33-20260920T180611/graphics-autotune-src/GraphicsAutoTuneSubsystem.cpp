// First-launch graphics auto-tuning (2026-09-18). See GraphicsAutoTuneSubsystem.h for the design.

#include "GraphicsAutoTuneSubsystem.h"

#include "Blueprint/UserWidget.h"
#include "Components/ActorComponent.h"
#include "DynamicRHI.h"
#include "Engine/Engine.h"
#include "Engine/GameInstance.h"
#include "Engine/GameViewportClient.h"
#include "Engine/World.h"
#include "Framework/Application/SlateApplication.h"
#include "GameFramework/Pawn.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/SaveGame.h"
#include "HAL/IConsoleManager.h"
#include "Kismet/GameplayStatics.h"
#include "Kismet/KismetSystemLibrary.h"
#include "Misc/App.h"
#include "Misc/CommandLine.h"
#include "Misc/ConfigCacheIni.h"
#include "Misc/DateTime.h"
#include "PipelineStateCache.h"
#include "RenderTimer.h"
#include "ShaderPipelineCache.h"
#include "Styling/CoreStyle.h"
#include "UObject/EnumProperty.h"
#include "UObject/UObjectGlobals.h"
#include "UObject/UnrealType.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/SBoxPanel.h"
#include "Widgets/SWindow.h"
#include "Widgets/Text/STextBlock.h"

#if PLATFORM_WINDOWS
#include "Windows/WindowsHWrapper.h"
#endif

DEFINE_LOG_CATEGORY(LogGraphicsAutoTune);

static TAutoConsoleVariable<int32> CVarGraphicsAutoTuneEnable(
    TEXT("gfx.AutoTune.Enable"),
    1,
    TEXT("1 = tune graphics automatically on the first launch (default). 0 = never tune; a run in progress is cancelled and the previous settings restored."),
    ECVF_Default);

static TAutoConsoleVariable<float> CVarGraphicsAutoTuneTestBudgetScale(
    TEXT("gfx.AutoTune.TestBudgetScale"),
    1.0f,
    TEXT("TESTING ONLY: multiplies the 60/30 fps frame budgets (e.g. 0.6 makes a fast GPU take the lower-resolution path). Default 1."),
    ECVF_Cheat);

static TAutoConsoleVariable<int32> CVarMacWindowRepair(
    TEXT("gfx.MacWindowRepair"),
    1,
    TEXT("macOS only, and it is what keeps clicks under the pointer. 0 = leave the window mode alone. 1 = keep the game windowed at the display height less gfx.MacWindowedTrim (default; the only mode that is reliable from launch). 2 = fullscreen at the display height less gfx.MacFullscreenTrim — correct only once the options menu has put the game in Fullscreen itself, not from startup."),
    ECVF_Default);

static TAutoConsoleVariable<int32> CVarMacFullscreenTrim(
    TEXT("gfx.MacFullscreenTrim"),
    74,
    TEXT("macOS, gfx.MacWindowRepair 2 only: pixels taken off the display height for fullscreen. 74 (the menu bar at 2x) is the value that measured correct on a 2880x1864 panel; the engine's own display metrics disagree with the OS here, so it is a number rather than a calculation."),
    ECVF_Default);

static TAutoConsoleVariable<int32> CVarMacWindowedTrim(
    TEXT("gfx.MacWindowedTrim"),
    182,
    TEXT("macOS, gfx.MacWindowRepair 1 only: pixels taken off the display height for the windowed size. The engine's work area leaves out the Dock, so its own number still puts the bottom of the game behind it; 182 is the menu bar plus a visible Dock measured on a 2880x1864 panel."),
    ECVF_Default);

namespace GfxAutoTune
{
    // Bump when the ladder or thresholds change enough that installs tuned by an older version should be re-tuned.
    // 2 (2026-09-19): the resolution row is now chosen for the display rather than looked up from the viewport the
    // game already happens to be in. Installs tuned by version 1 kept whatever resolution the menu defaulted to —
    // 1280x800 on a Retina Mac — so they have to be tuned again for the fix to reach them.
    constexpr int32 TuneVersion = 2;
    constexpr int32 MaxAttempts = 3;              // cancelled runs before giving up (the menu defaults stay)
    constexpr double MacRepairDelaySeconds = 3.0; // let macOS finish the fullscreen transition before repairing
    constexpr double MacRepairTransitionTimeout = 3.0; // give up waiting for the windowed transition after this
    constexpr double MacRepairSettleSeconds = 1.0;// wait after the game re-applies a mode before repairing again
    constexpr double MacRepairCooldownSeconds = 2.0; // the repair's own two r.setres calls must not retrigger it
    constexpr int32 MacRepairMaxPerSession = 8;   // the options menu re-applies its mode at login; re-correct it
    constexpr double MenuWaitTimeoutSeconds = 600.0; // the options menu only exists after the login screen, so be generous

    const TCHAR* const ConfigSection = TEXT("GraphicsAutoTune");
    const TCHAR* const MenuSlotName = TEXT("/Settings/MyOptions");   // AntizeMenuSystem BP_MainMenuFunction.GetSlotNameUserIndex
    const TCHAR* const MenuComponentClassName = TEXT("BP_MainMenuComponent_C");

    // "Stable" = 95th-percentile frame cost within 90 % of the frame budget.
    constexpr float Budget60BaseMs = 15.0f;
    constexpr float Budget30BaseMs = 30.0f;
    float BudgetScale() { return FMath::Clamp(CVarGraphicsAutoTuneTestBudgetScale.GetValueOnGameThread(), 0.1f, 1.0f); }
    float Budget60Ms() { return Budget60BaseMs * BudgetScale(); }
    float Budget30Ms() { return Budget30BaseMs * BudgetScale(); }

    constexpr double MenuGraceSeconds = 1.5;      // rows (incl. key-binding rows) finish loading ~0.2 s after the menu is built
    constexpr double LevelGraceSeconds = 5.0;
    constexpr double MaxShaderWaitSeconds = 60.0; // stop waiting for shader/PSO precompiles after this
    constexpr double SettleSeconds = 2.0;
    constexpr double MaxExtraSettleSeconds = 8.0; // extra wait for precompiles triggered by a new candidate
    constexpr double SampleSeconds = 5.0;
    constexpr double MaxSampleSeconds = 15.0;
    constexpr int32 MinFrames = 30;
    constexpr double RunTimeoutSeconds = 300.0;   // on timeout the best result measured so far is kept
    constexpr double PollSeconds = 0.5;

    constexpr int32 MinScreenPercent = 50;
    constexpr int32 MaxBatteryDeferrals = 3;      // launches on battery that postpone tuning in the hope of AC power
    constexpr float NoGainTolerance = 1.05f;      // a rung within 5 % of Low's frame time gains nothing from going lower
    constexpr float MinResolutionGain = 0.97f;    // keep lowering the resolution while a step cuts the p95 frame time by >= 3 %
    constexpr int32 MaxResolutionSteps = 6;

    // Options-menu rows the tuner changes per quality rung (menu option indices: High, Medium, Low).
    struct FTunableRow
    {
        const TCHAR* Name;
        int32 Index[3];
    };
    const FTunableRow TunableRows[] =
    {
        { TEXT("Graphic_Texture"),      { 2, 1, 0 } },  // Low, Medium, High, Very High, Epic
        { TEXT("Graphic_Anisotropy"),   { 3, 2, 1 } },  // Off, 4x, 8x, 16x
        { TEXT("Graphic_PostProcess"),  { 2, 1, 0 } },
        { TEXT("Graphic_AntiAliasing"), { 3, 2, 1 } },  // Off, Low, Medium, High, ... (kept on for temporal upscaling)
        { TEXT("Graphic_Effect"),       { 2, 1, 0 } },
        { TEXT("Graphic_DetailMode"),   { 2, 1, 0 } },  // Low, Medium, High
        { TEXT("Graphic_Foliage"),      { 2, 1, 0 } },
        { TEXT("Graphic_ViewDistance"), { 2, 1, 0 } },
        { TEXT("Graphic_Shaders"),      { 2, 1, 0 } },
        { TEXT("Graphic_Reflections"),  { 2, 1, 0 } },
    };
    const TCHAR* const RungNames[3] = { TEXT("High"), TEXT("Medium"), TEXT("Low") };

    // Rows held at the operator's defaults on every machine.
    struct FFixedRow
    {
        const TCHAR* Name;
        int32 Index;
    };
    const FFixedRow FixedRows[] =
    {
        { TEXT("Graphic_Shadow"), 1 },              // Low (sg.ShadowQuality 0)
        { TEXT("Graphic_GlobalIllumination"), 0 },  // Low (no Lumen, no distance-field AO)
        { TEXT("Graphic_MotionBlur"), 0 },          // Off
        { TEXT("Graphic_VSync"), 1 },               // Enabled
    };

    const TCHAR* const MaxFpsRow = TEXT("Graphic_MaxFPS");     // 15, 30, 60, 120, 144, Unlimited
    const int32 MaxFpsValues[] = { 15, 30, 60, 120, 144, 999 }; // the row's t.MaxFPS commands
    constexpr int32 MaxFps30Index = 1;
    constexpr int32 MaxFps60Index = 2;
    const TCHAR* const VSyncRow = TEXT("Graphic_VSync");
    const TCHAR* const ScreenModeRow = TEXT("Graphic_ScreenMode");  // Windowed, Windowed Fullscreen, Fullscreen
    constexpr int32 WindowedFullscreenIndex = 1;
    const TCHAR* const ResolutionRow = TEXT("Graphic_Resolution");
    const TCHAR* const ScreenScaleRow = TEXT("Graphic_ScreenScale");

    // True when running on battery power. FWindowsPlatformMisc::IsRunningOnBattery (5.4) tests the battery's charge
    // flag instead of the AC line, so it reports "battery" for any plugged-in laptop whose battery is charged; ask
    // Windows for the AC line directly. The macOS implementation (IOPowerSources state) is correct.
    bool IsOnBatteryPower()
    {
#if PLATFORM_WINDOWS
        SYSTEM_POWER_STATUS Status;
        return ::GetSystemPowerStatus(&Status) && Status.ACLineStatus == 0; // 0 offline, 1 online, 255 unknown
#else
        return FPlatformMisc::IsRunningOnBattery();
#endif
    }

    float Percentile(TArray<float> Values, float Fraction)
    {
        if (Values.Num() == 0)
        {
            return 0.f;
        }
        Values.Sort();
        const int32 Index = FMath::Clamp(FMath::CeilToInt(Fraction * Values.Num()) - 1, 0, Values.Num() - 1);
        return Values[Index];
    }
    float Percentile95(const TArray<float>& Values) { return Percentile(Values, 0.95f); }

    // A step whose typical frame is well inside the budget but whose 95th percentile is not was most likely hit by
    // one-time hitches (first-launch shader/pipeline compilation); it is measured once more before it counts.
    constexpr float HitchMedianFraction = 0.85f;

    // Calls a Blueprint function/event by name. SetParams fills the parameter buffer (return false to cancel the
    // call); ReadParams reads out-parameters after the call.
    bool CallFunction(UObject* Target, const TCHAR* FunctionName,
                      TFunctionRef<bool(UFunction*, uint8*)> SetParams,
                      TFunctionRef<void(UFunction*, uint8*)> ReadParams)
    {
        UFunction* Function = Target ? Target->FindFunction(FName(FunctionName)) : nullptr;
        if (!Function)
        {
            UE_LOG(LogGraphicsAutoTune, Warning, TEXT("%s has no function %s"), *GetNameSafe(Target), FunctionName);
            return false;
        }
        if (Function->ParmsSize == 0)
        {
            Target->ProcessEvent(Function, nullptr);
            return true;
        }
        uint8* Parms = static_cast<uint8*>(FMemory_Alloca_Aligned(Function->ParmsSize, Function->GetMinAlignment()));
        FMemory::Memzero(Parms, Function->ParmsSize);
        for (TFieldIterator<FProperty> It(Function); It && It->HasAnyPropertyFlags(CPF_Parm); ++It)
        {
            It->InitializeValue_InContainer(Parms);
        }
        const bool bParamsOk = SetParams(Function, Parms);
        if (bParamsOk)
        {
            Target->ProcessEvent(Function, Parms);
            ReadParams(Function, Parms);
        }
        else
        {
            UE_LOG(LogGraphicsAutoTune, Warning, TEXT("%s.%s: unexpected parameters"), *GetNameSafe(Target), FunctionName);
        }
        for (TFieldIterator<FProperty> It(Function); It && It->HasAnyPropertyFlags(CPF_Parm); ++It)
        {
            It->DestroyValue_InContainer(Parms);
        }
        return bParamsOk;
    }

    bool CallNoParams(UObject* Target, const TCHAR* FunctionName)
    {
        return CallFunction(Target, FunctionName, [](UFunction*, uint8*) { return true; }, [](UFunction*, uint8*) {});
    }

    bool CallWithInt(UObject* Target, const TCHAR* FunctionName, const TCHAR* ParamName, int32 Value)
    {
        return CallFunction(Target, FunctionName,
            [ParamName, Value](UFunction* Function, uint8* Parms)
            {
                FIntProperty* Param = CastField<FIntProperty>(Function->FindPropertyByName(FName(ParamName)));
                if (!Param)
                {
                    return false;
                }
                Param->SetPropertyValue_InContainer(Parms, Value);
                return true;
            },
            [](UFunction*, uint8*) {});
    }

    bool CallWithDouble(UObject* Target, const TCHAR* FunctionName, const TCHAR* ParamName, double Value)
    {
        return CallFunction(Target, FunctionName,
            [ParamName, Value](UFunction* Function, uint8* Parms)
            {
                FProperty* Param = Function->FindPropertyByName(FName(ParamName));
                if (FDoubleProperty* AsDouble = CastField<FDoubleProperty>(Param))
                {
                    AsDouble->SetPropertyValue_InContainer(Parms, Value);
                    return true;
                }
                if (FFloatProperty* AsFloat = CastField<FFloatProperty>(Param))
                {
                    AsFloat->SetPropertyValue_InContainer(Parms, static_cast<float>(Value));
                    return true;
                }
                return false;
            },
            [](UFunction*, uint8*) {});
    }

    // W_Options.SaveOptions(out bool Success?) - only a fallback (it also marks the key bindings as saved).
    bool CallSaveOptions(UObject* Menu, bool& bOutSuccess)
    {
        bOutSuccess = false;
        return CallFunction(Menu, TEXT("SaveOptions"),
            [](UFunction*, uint8*) { return true; },
            [&bOutSuccess](UFunction* Function, uint8* Parms)
            {
                if (FBoolProperty* Result = CastField<FBoolProperty>(Function->FindPropertyByName(FName(TEXT("Success?")))))
                {
                    bOutSuccess = Result->GetPropertyValue_InContainer(Parms);
                }
            });
    }

    UObject* GetObjectProperty(const UObject* Owner, const TCHAR* PropertyName)
    {
        if (!Owner)
        {
            return nullptr;
        }
        FObjectPropertyBase* Property = FindFProperty<FObjectPropertyBase>(Owner->GetClass(), FName(PropertyName));
        return Property ? Property->GetObjectPropertyValue_InContainer(Owner) : nullptr;
    }

    int32 GetIntProperty(const UObject* Owner, const TCHAR* PropertyName, int32 Default)
    {
        const FIntProperty* Property = Owner ? FindFProperty<FIntProperty>(Owner->GetClass(), FName(PropertyName)) : nullptr;
        return Property ? Property->GetPropertyValue_InContainer(Owner) : Default;
    }

    // Reads a byte or enum property (e.g. a row's TEnumAsByte<E_TemplateGraphic> SettingName).
    int32 GetByteProperty(const UObject* Owner, const TCHAR* PropertyName, int32 Default)
    {
        const FProperty* Property = Owner ? FindFProperty<FProperty>(Owner->GetClass(), FName(PropertyName)) : nullptr;
        if (const FByteProperty* AsByte = CastField<FByteProperty>(Property))
        {
            return AsByte->GetPropertyValue_InContainer(Owner);
        }
        if (const FEnumProperty* AsEnum = CastField<FEnumProperty>(Property))
        {
            return static_cast<int32>(AsEnum->GetUnderlyingProperty()->GetSignedIntPropertyValue(AsEnum->ContainerPtrToValuePtr<void>(Owner)));
        }
        return Default;
    }

    double GetDoubleProperty(const UObject* Owner, const TCHAR* PropertyName, double Default)
    {
        const FProperty* Property = Owner ? FindFProperty<FProperty>(Owner->GetClass(), FName(PropertyName)) : nullptr;
        if (const FDoubleProperty* AsDouble = CastField<FDoubleProperty>(Property))
        {
            return AsDouble->GetPropertyValue_InContainer(Owner);
        }
        if (const FFloatProperty* AsFloat = CastField<FFloatProperty>(Property))
        {
            return AsFloat->GetPropertyValue_InContainer(Owner);
        }
        return Default;
    }

    FString GetStringProperty(const UObject* Owner, const TCHAR* PropertyName)
    {
        const FStrProperty* Property = Owner ? FindFProperty<FStrProperty>(Owner->GetClass(), FName(PropertyName)) : nullptr;
        return Property ? Property->GetPropertyValue_InContainer(Owner) : FString();
    }

    // Display strings of a row's ButtonOptions (TArray<FText>).
    TArray<FString> GetButtonOptions(const UObject* Row)
    {
        TArray<FString> Out;
        const FArrayProperty* Property = Row ? FindFProperty<FArrayProperty>(Row->GetClass(), FName(TEXT("ButtonOptions"))) : nullptr;
        const FTextProperty* Inner = Property ? CastField<FTextProperty>(Property->Inner) : nullptr;
        if (!Inner)
        {
            return Out;
        }
        FScriptArrayHelper Helper(Property, Property->ContainerPtrToValuePtr<void>(Row));
        for (int32 Index = 0; Index < Helper.Num(); ++Index)
        {
            Out.Add(Inner->GetPropertyValue(Helper.GetRawPtr(Index)).ToString());
        }
        return Out;
    }

    // Sets W_Options.MyGraphicIndex[SettingIndex].Index (the menu's per-setting value string, indexed by E_TemplateGraphic).
    bool SetMenuGraphicValue(UObject* Menu, int32 SettingIndex, const FString& Value)
    {
        FArrayProperty* Property = Menu ? FindFProperty<FArrayProperty>(Menu->GetClass(), FName(TEXT("MyGraphicIndex"))) : nullptr;
        FStructProperty* Inner = Property ? CastField<FStructProperty>(Property->Inner) : nullptr;
        FStrProperty* Field = nullptr;
        if (Inner)
        {
            for (TFieldIterator<FStrProperty> It(Inner->Struct); It; ++It)
            {
                Field = *It;   // S_GraphicIndex has a single string member ("Index")
                break;
            }
        }
        if (!Field || SettingIndex < 0 || SettingIndex > 64)
        {
            return false;
        }
        FScriptArrayHelper Helper(Property, Property->ContainerPtrToValuePtr<void>(Menu));
        if (SettingIndex >= Helper.Num())
        {
            Helper.AddValues(SettingIndex + 1 - Helper.Num());
        }
        Field->SetPropertyValue_InContainer(Helper.GetRawPtr(SettingIndex), Value);
        return true;
    }
}

bool UGraphicsAutoTuneSubsystem::ShouldCreateSubsystem(UObject* Outer) const
{
    return !IsRunningDedicatedServer() && Super::ShouldCreateSubsystem(Outer);
}

void UGraphicsAutoTuneSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);

    LevelStartTime = FPlatformTime::Seconds();
    TickHandle = FTSTicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateUObject(this, &UGraphicsAutoTuneSubsystem::Tick));
    PostLoadMapHandle = FCoreUObjectDelegates::PostLoadMapWithWorld.AddUObject(this, &UGraphicsAutoTuneSubsystem::OnPostLoadMap);
    if (!IConsoleManager::Get().FindConsoleObject(TEXT("gfx.AutoTune.Run")))
    {
        RunCommand = IConsoleManager::Get().RegisterConsoleCommand(
            TEXT("gfx.AutoTune.Run"),
            TEXT("Re-run the graphics auto-tuner in the current level (the result is saved through the options menu)."),
            FConsoleCommandDelegate::CreateUObject(this, &UGraphicsAutoTuneSubsystem::RequestRun),
            ECVF_Default);
    }

    if (FParse::Param(FCommandLine::Get(), TEXT("NoGraphicsAutoTune")))
    {
        UE_LOG(LogGraphicsAutoTune, Display, TEXT("Disabled by -NoGraphicsAutoTune"));
        return;
    }
    bForced = FParse::Param(FCommandLine::Get(), TEXT("GraphicsAutoTune"));

#if WITH_EDITOR
    if (GIsEditor && !bForced)
    {
        return; // never tune play-in-editor sessions unless asked
    }
#endif

    int32 TunedVersion = 0;
    int32 Attempts = 0;
    GConfig->GetInt(GfxAutoTune::ConfigSection, TEXT("TunedVersion"), TunedVersion, GGameUserSettingsIni);
    GConfig->GetInt(GfxAutoTune::ConfigSection, TEXT("Attempts"), Attempts, GGameUserSettingsIni);
    const bool bHasMenuSave = UGameplayStatics::DoesSaveGameExist(GfxAutoTune::MenuSlotName, 0);

    if (!bForced && TunedVersion < GfxAutoTune::TuneVersion && Attempts >= GfxAutoTune::MaxAttempts)
    {
        UE_LOG(LogGraphicsAutoTune, Warning, TEXT("Not tuning this launch: %d runs in a row were cancelled; the menu's settings stay"), Attempts);
        // Not marked finished, and the count is cleared: the next launch is free to try again rather than this
        // install being disabled for good.
        RecordOutcome(FString::Printf(TEXT("stood down after %d cancelled runs; will try again next launch"), Attempts), false);
        GConfig->SetInt(GfxAutoTune::ConfigSection, TEXT("Attempts"), 0, GGameUserSettingsIni);
        GConfig->Flush(false, GGameUserSettingsIni);
        return;
    }
    // Any install this version has not tuned yet. It deliberately does NOT care whether an options save already
    // exists: a Shipping build saves to the user directory (FApp::IsInstalled), which on any machine that has run an
    // earlier build already holds one — and reading that as "the player chose these settings" is what stopped
    // Shipping builds ever benchmarking. TunedVersion, written when a run finishes, is what keeps this to once.
    bPending = bForced || TunedVersion < GfxAutoTune::TuneVersion;
    UE_LOG(LogGraphicsAutoTune, Display, TEXT("Startup: %s (TunedVersion=%d, attempts=%d, options save %s%s)"),
        bPending ? TEXT("will tune in the first level with the options menu") : TEXT("no tuning needed"),
        TunedVersion, Attempts, bHasMenuSave ? TEXT("present") : TEXT("absent"), bForced ? TEXT(", forced by -GraphicsAutoTune") : TEXT(""));
    if (bPending)
    {
        Phase = EPhase::WaitForMenu;
    }
}

void UGraphicsAutoTuneSubsystem::Deinitialize()
{
    EndRun();
    FTSTicker::GetCoreTicker().RemoveTicker(TickHandle);
    FCoreUObjectDelegates::PostLoadMapWithWorld.Remove(PostLoadMapHandle);
    if (RunCommand)
    {
        IConsoleManager::Get().UnregisterConsoleObject(RunCommand);
        RunCommand = nullptr;
    }
    Phase = EPhase::Idle;
    Super::Deinitialize();
}

void UGraphicsAutoTuneSubsystem::RequestRun()
{
    if (IsTuning())
    {
        UE_LOG(LogGraphicsAutoTune, Display, TEXT("A tuning pass is already running"));
        return;
    }
    UE_LOG(LogGraphicsAutoTune, Display, TEXT("Tuning requested"));
    bPending = true;
    bForced = true;
    Menu.Reset();
    NextPollTime = 0.0;
    Phase = EPhase::WaitForMenu;
}

bool UGraphicsAutoTuneSubsystem::IsTuning() const
{
    return Phase == EPhase::Settling || Phase == EPhase::Sampling;
}

void UGraphicsAutoTuneSubsystem::OnPostLoadMap(UWorld* LoadedWorld)
{
    LevelStartTime = FPlatformTime::Seconds();
    if (IsTuning())
    {
        Abort(TEXT("the level changed"), false);
    }
    Menu.Reset();
    if (bPending)
    {
        NextPollTime = 0.0;
        Phase = EPhase::WaitForMenu;
    }
}

UUserWidget* UGraphicsAutoTuneSubsystem::FindMenu(APawn*& OutPawn, APlayerController*& OutPC) const
{
    OutPawn = nullptr;
    OutPC = nullptr;
    UGameInstance* GameInstance = GetGameInstance();
    APlayerController* PC = GameInstance ? GameInstance->GetFirstLocalPlayerController() : nullptr;
    APawn* Pawn = PC ? PC->GetPawn() : nullptr;
    if (!Pawn)
    {
        return nullptr;
    }
    for (UActorComponent* Component : Pawn->GetComponents())
    {
        if (Component && Component->GetClass()->GetName() == GfxAutoTune::MenuComponentClassName)
        {
            UUserWidget* Found = Cast<UUserWidget>(GfxAutoTune::GetObjectProperty(Component, TEXT("W_OptionsRef")));
            if (Found && Found->IsInViewport())
            {
                OutPawn = Pawn;
                OutPC = PC;
                return Found;
            }
        }
    }
    return nullptr;
}

bool UGraphicsAutoTuneSubsystem::IsMenuOpen() const
{
    return Menu.IsValid() && Menu->IsVisible();
}

bool UGraphicsAutoTuneSubsystem::IsShaderWorkPending() const
{
    return PipelineStateCache::NumActivePrecacheRequests() > 0 || FShaderPipelineCache::NumPrecompilesRemaining() > 0;
}

bool UGraphicsAutoTuneSubsystem::IsWindowMinimized() const
{
    UGameViewportClient* Viewport = GetGameInstance() ? GetGameInstance()->GetGameViewportClient() : nullptr;
    const TSharedPtr<SWindow> Window = Viewport ? Viewport->GetWindow() : nullptr;
    return Window.IsValid() && Window->IsWindowMinimized();
}

bool UGraphicsAutoTuneSubsystem::Tick(float DeltaTime)
{
    const double Now = FPlatformTime::Seconds();
    RepairMacWindow(Now);           // macOS input repair; runs whether or not this session is tuning

    if (Phase == EPhase::Idle)
    {
        return true;
    }

    if (CVarGraphicsAutoTuneEnable.GetValueOnGameThread() == 0)
    {
        if (IsTuning())
        {
            Abort(TEXT("it was disabled with gfx.AutoTune.Enable 0"), true);
        }
        return true;
    }

    switch (Phase)
    {
    case EPhase::WaitForMenu:
    {
        if (Now < NextPollTime)
        {
            break;
        }
        NextPollTime = Now + GfxAutoTune::PollSeconds;
        APawn* Pawn = nullptr;
        APlayerController* PC = nullptr;
        if (UUserWidget* Found = FindMenu(Pawn, PC))
        {
            Menu = Found;
            TunedPawn = Pawn;
            TunedController = PC;
            MenuFoundTime = Now;
            Phase = EPhase::WaitForSettle;
            UE_LOG(LogGraphicsAutoTune, Display, TEXT("Options menu found; waiting for the level to settle"));
        }
        else if (LevelStartTime > 0.0 && Now - LevelStartTime > GfxAutoTune::MenuWaitTimeoutSeconds)
        {
            // Without this the wait is silent and endless, and in a Shipping build there is no log to show it.
            UE_LOG(LogGraphicsAutoTune, Warning, TEXT("No options menu after %.0f s in this level; not tuning here"),
                GfxAutoTune::MenuWaitTimeoutSeconds);
            RecordOutcome(TEXT("skipped: no options menu found in the level"), false);
            Phase = EPhase::Idle;
        }
        break;
    }
    case EPhase::WaitForSettle:
    {
        if (Now < NextPollTime)
        {
            break;
        }
        NextPollTime = Now + GfxAutoTune::PollSeconds;
        APawn* Pawn = nullptr;
        APlayerController* PC = nullptr;
        if (!Menu.IsValid() || FindMenu(Pawn, PC) != Menu.Get())
        {
            Menu.Reset();
            Phase = EPhase::WaitForMenu;
            break;
        }
        // (An options save existing is no longer a reason to skip — see the gate in Initialize. Opening the options
        // menu during a run still aborts it, which is the case that actually means "the player is choosing".)
        const bool bMenuSettled = Now - MenuFoundTime >= GfxAutoTune::MenuGraceSeconds;
        const bool bLevelSettled = Now - LevelStartTime >= GfxAutoTune::LevelGraceSeconds;
        const bool bShadersSettled = !IsShaderWorkPending() || Now - MenuFoundTime >= GfxAutoTune::MaxShaderWaitSeconds;
        if (bMenuSettled && bLevelSettled && bShadersSettled && !IsMenuOpen() && !IsWindowMinimized())
        {
            // Laptops on battery are often power- or frame-capped; a result measured then would stick after plugging
            // in. Wait for a launch on AC power, but not forever.
            if (!bForced && GfxAutoTune::IsOnBatteryPower())
            {
                int32 Deferrals = 0;
                GConfig->GetInt(GfxAutoTune::ConfigSection, TEXT("BatteryDeferrals"), Deferrals, GGameUserSettingsIni);
                if (Deferrals < GfxAutoTune::MaxBatteryDeferrals)
                {
                    GConfig->SetInt(GfxAutoTune::ConfigSection, TEXT("BatteryDeferrals"), Deferrals + 1, GGameUserSettingsIni);
                    GConfig->SetString(GfxAutoTune::ConfigSection, TEXT("LastResult"), TEXT("postponed: running on battery"), GGameUserSettingsIni);
                    GConfig->Flush(false, GGameUserSettingsIni);
                    UE_LOG(LogGraphicsAutoTune, Display, TEXT("Running on battery: tuning postponed to a launch on AC power (%d of %d); the menu defaults apply meanwhile"),
                        Deferrals + 1, GfxAutoTune::MaxBatteryDeferrals);
                    bPending = false;
                    Phase = EPhase::Idle;
                    break;
                }
                UE_LOG(LogGraphicsAutoTune, Display, TEXT("Still on battery after %d launches; tuning now"), Deferrals);
            }
            BeginRun();
        }
        break;
    }
    case EPhase::Settling:
    case EPhase::Sampling:
    {
        if (!Menu.IsValid() || !TunedPawn.IsValid() || (TunedController.IsValid() && TunedController->GetPawn() != TunedPawn.Get()))
        {
            Abort(TEXT("the level or the player's pawn changed"), Menu.IsValid());
            break;
        }
        if (IsMenuOpen())
        {
            Abort(TEXT("the options menu was opened"), true);
            break;
        }
        if (Now - RunStartTime > GfxAutoTune::RunTimeoutSeconds)
        {
            UE_LOG(LogGraphicsAutoTune, Warning, TEXT("Tuning is taking too long; keeping the best result measured so far"));
            CommitBestSoFar();
            break;
        }
        if (IsWindowMinimized())
        {
            StartSettling(); // nothing is rendered while minimized; measure this candidate again afterwards
            break;
        }
        const double Elapsed = Now - PhaseStartTime;
        if (Phase == EPhase::Settling)
        {
            const bool bShadersSettled = !IsShaderWorkPending() || Elapsed >= GfxAutoTune::SettleSeconds + GfxAutoTune::MaxExtraSettleSeconds;
            if (Elapsed >= GfxAutoTune::SettleSeconds && bShadersSettled)
            {
                Phase = EPhase::Sampling;
                PhaseStartTime = Now;
            }
        }
        else
        {
            AddSample();
            if ((Elapsed >= GfxAutoTune::SampleSeconds && CostSamples.Num() >= GfxAutoTune::MinFrames) || Elapsed >= GfxAutoTune::MaxSampleSeconds)
            {
                FinishStep();
            }
        }
        break;
    }
    default:
        break;
    }
    return true;
}

void UGraphicsAutoTuneSubsystem::BeginRun()
{
    UUserWidget* MenuWidget = Menu.Get();
    UObject* ProbeRow = MenuWidget ? MenuWidget->GetWidgetFromName(FName(GfxAutoTune::TunableRows[0].Name)) : nullptr;
    if (!ProbeRow || !ProbeRow->FindFunction(FName(TEXT("ByGlobalSetting"))) || !MenuWidget->FindFunction(FName(TEXT("MakeBackUp"))))
    {
        UE_LOG(LogGraphicsAutoTune, Error, TEXT("The options menu does not have the expected rows/functions; auto-tuning disabled for this session"));
        RecordOutcome(TEXT("skipped: the options menu lacks the expected rows"), false);
        bPending = false;
        Phase = EPhase::Idle;
        return;
    }

    int32 Attempts = 0;
    GConfig->GetInt(GfxAutoTune::ConfigSection, TEXT("Attempts"), Attempts, GGameUserSettingsIni);
    if (!bForced && Attempts >= GfxAutoTune::MaxAttempts)
    {
        UE_LOG(LogGraphicsAutoTune, Warning, TEXT("Not tuning this launch: %d runs in a row were cancelled; the menu's settings stay"), Attempts);
        RecordOutcome(FString::Printf(TEXT("stood down after %d cancelled runs; will try again next launch"), Attempts), false);
        GConfig->SetInt(GfxAutoTune::ConfigSection, TEXT("Attempts"), 0, GGameUserSettingsIni);
        GConfig->Flush(false, GGameUserSettingsIni);
        bPending = false;
        Phase = EPhase::Idle;
        return;
    }
    GConfig->SetInt(GfxAutoTune::ConfigSection, TEXT("Attempts"), Attempts + 1, GGameUserSettingsIni);
    GConfig->Flush(false, GGameUserSettingsIni);

    OriginalRowIndex.Reset();
    auto Remember = [this](const TCHAR* RowName)
    {
        const int32 Index = GetRowIndex(RowName);
        if (Index >= 0)
        {
            OriginalRowIndex.Add(RowName, Index);
        }
    };
    for (const GfxAutoTune::FTunableRow& Row : GfxAutoTune::TunableRows)
    {
        Remember(Row.Name);
    }
    for (const GfxAutoTune::FFixedRow& Row : GfxAutoTune::FixedRows)
    {
        Remember(Row.Name);
    }
    Remember(GfxAutoTune::MaxFpsRow);
    Remember(GfxAutoTune::ScreenModeRow);
    Remember(GfxAutoTune::ResolutionRow);
    OriginalScreenPercent = GfxAutoTune::GetDoubleProperty(MenuWidget->GetWidgetFromName(FName(GfxAutoTune::ScreenScaleRow)), TEXT("SliderValue"), 100.0);

    // Console commands that undo the run's frame-cap/V-Sync changes if it is cut short after the menu is gone.
    const int32* OriginalFps = OriginalRowIndex.Find(GfxAutoTune::MaxFpsRow);
    RestoreFrameCapCommand = (OriginalFps && *OriginalFps >= 0 && *OriginalFps < static_cast<int32>(UE_ARRAY_COUNT(GfxAutoTune::MaxFpsValues)))
        ? FString::Printf(TEXT("t.MaxFPS %d"), GfxAutoTune::MaxFpsValues[*OriginalFps]) : FString();
    const int32* OriginalVSync = OriginalRowIndex.Find(GfxAutoTune::VSyncRow);
    RestoreVSyncCommand = OriginalVSync ? FString::Printf(TEXT("r.VSync %d"), *OriginalVSync != 0 ? 1 : 0) : FString();

    Results.Reset();
    ResolutionSteps = 0;
    bRemeasured = false;
    bScreenPercentTouched = false;
    bGpuTimingAvailable = true;
    RunStartTime = FPlatformTime::Seconds();

    FVector2D ViewportSize(0, 0);
    if (UGameViewportClient* Viewport = GetGameInstance()->GetGameViewportClient())
    {
        Viewport->GetViewportSize(ViewportSize);
    }
    UE_LOG(LogGraphicsAutoTune, Display, TEXT("Tuning started, attempt %d (viewport %dx%d, resolution scale %.0f%%, budgets %.1f/%.1f ms)"),
        Attempts + 1, static_cast<int32>(ViewportSize.X), static_cast<int32>(ViewportSize.Y), OriginalScreenPercent,
        GfxAutoTune::Budget60Ms(), GfxAutoTune::Budget30Ms());

    SetGameplayInputBlocked(true);
    ShowOverlay();

    // Windowed fullscreen at the display's resolution and the operator's fixed rows. Then V-Sync and the frame cap go
    // off for the measurement (behind the overlay): with them on, the render thread's time includes waiting for the
    // display (measured 15-16 ms on every rung of an RTX 5070 whose GPU needed 7 ms), and a 30 fps cap lets
    // integrated GPUs clock down. Commit applies V-Sync and the chosen cap through the menu; aborts restore them.
    SetRowIfDifferent(GfxAutoTune::ScreenModeRow, GfxAutoTune::WindowedFullscreenIndex);
    const int32 ResolutionIndex = FindDisplayResolutionIndex();
    if (ResolutionIndex >= 0)
    {
        SetRowIfDifferent(GfxAutoTune::ResolutionRow, ResolutionIndex);
    }
    for (const GfxAutoTune::FFixedRow& Row : GfxAutoTune::FixedRows)
    {
        SetRow(Row.Name, Row.Index);
    }
    ExecConsole(TEXT("r.VSync 0"));
    ExecConsole(TEXT("t.MaxFPS 0"));
    ApplyCandidate(0, 100);
    StartSettling();
}

void UGraphicsAutoTuneSubsystem::ApplyCandidate(int32 Rung, int32 ScreenPercent)
{
    CurrentRung = Rung;
    CurrentScreenPercent = ScreenPercent;
    for (const GfxAutoTune::FTunableRow& Row : GfxAutoTune::TunableRows)
    {
        SetRow(Row.Name, Row.Index[Rung]);
    }
    if (bScreenPercentTouched || FMath::Abs(OriginalScreenPercent - ScreenPercent) > 0.5)
    {
        // Trial only; the menu's Resolution Scale row is set once, at commit.
        ExecConsole(FString::Printf(TEXT("r.ScreenPercentage %d"), ScreenPercent));
        bScreenPercentTouched = true;
    }
    UpdateOverlay();
}

void UGraphicsAutoTuneSubsystem::StartSettling()
{
    CostSamples.Reset();
    CpuSamples.Reset();
    GameSamples.Reset();
    RenderSamples.Reset();
    RhiSamples.Reset();
    GpuSamples.Reset();
    Phase = EPhase::Settling;
    PhaseStartTime = FPlatformTime::Seconds();
}

void UGraphicsAutoTuneSubsystem::AddSample()
{
    // The cost is the real frame time, measured uncapped with V-Sync off. The per-thread and GPU times are kept to
    // tell GPU-bound from CPU-bound and for the log.
    const float FrameMs = static_cast<float>(FApp::GetDeltaTime() * 1000.0);
    const float GameMs = FPlatformTime::ToMilliseconds(GGameThreadTime);
    const float RenderMs = FPlatformTime::ToMilliseconds(GRenderThreadTime);
    const float RhiMs = FPlatformTime::ToMilliseconds(GRHIThreadTime);
    const float GpuMs = FPlatformTime::ToMilliseconds(RHIGetGPUFrameCycles(0));
    GameSamples.Add(GameMs);
    RenderSamples.Add(RenderMs);
    RhiSamples.Add(RhiMs);
    GpuSamples.Add(GpuMs);
    CpuSamples.Add(FMath::Max(GameMs, RenderMs));
    CostSamples.Add(FrameMs);
}

void UGraphicsAutoTuneSubsystem::FinishStep()
{
    using namespace GfxAutoTune;

    FStepResult Result;
    Result.Rung = CurrentRung;
    Result.ScreenPercent = CurrentScreenPercent;
    Result.Frames = CostSamples.Num();
    Result.CostP95 = Percentile95(CostSamples);
    Result.CostP50 = Percentile(CostSamples, 0.5f);
    Result.CpuP95 = Percentile95(CpuSamples);
    Result.GameP95 = Percentile95(GameSamples);
    Result.RenderP95 = Percentile95(RenderSamples);
    Result.RhiP95 = Percentile95(RhiSamples);
    Result.GpuP95 = Percentile95(GpuSamples);

    if (Result.GpuP95 <= 0.f)
    {
        if (bGpuTimingAvailable)
        {
            UE_LOG(LogGraphicsAutoTune, Warning, TEXT("This GPU/driver reports no GPU timing; treating the frame time as GPU time"));
        }
        bGpuTimingAvailable = false;
        Result.GpuP95 = Result.CostP95;
    }

    const float StepBudget = ResolutionSteps == 0 ? Budget60Ms() : Budget30Ms();
    if (!bRemeasured && Result.CostP95 > StepBudget && Result.CostP50 <= HitchMedianFraction * StepBudget)
    {
        UE_LOG(LogGraphicsAutoTune, Display, TEXT("%s at %d%%: median %.1f ms but p95 %.1f ms - hitches (likely first-time shader compilation); measuring again"),
            RungNames[Result.Rung], Result.ScreenPercent, Result.CostP50, Result.CostP95);
        bRemeasured = true;
        StartSettling();
        return;
    }
    bRemeasured = false;

    Results.Add(Result);
    UE_LOG(LogGraphicsAutoTune, Display, TEXT("Step %d: %s at %d%% -> p95 frame time %.1f ms, median %.1f (p95 game %.1f, render %.1f, RHI %.1f, GPU %.1f) over %d frames"),
        Results.Num(), RungNames[Result.Rung], Result.ScreenPercent, Result.CostP95, Result.CostP50, Result.GameP95, Result.RenderP95, Result.RhiP95, Result.GpuP95, Result.Frames);

    if (ResolutionSteps == 0)
    {
        // Quality ladder at native resolution: the first rung that holds 60 wins.
        if (Result.CostP95 <= Budget60Ms())
        {
            Commit(Result.Rung, 60, 100);
            return;
        }
        if (Result.Rung < 2)
        {
            ApplyCandidate(Result.Rung + 1, 100);
            StartSettling();
            return;
        }
        // Low misses 60: keep the highest rung that holds 30 (results are in High, Medium, Low order).
        for (const FStepResult& Earlier : Results)
        {
            if (Earlier.ScreenPercent == 100 && Earlier.CostP95 <= Budget30Ms())
            {
                Commit(Earlier.Rung, 30, 100);
                return;
            }
        }
        // Lowering the resolution only helps if the GPU itself misses the budget. The GPU time is the deciding number:
        // the render/RHI threads can block on the GPU without that being counted as idle (seen on an AMD 780M and on
        // Metal), so they can look busy when the GPU is the real limit.
        if (Result.GpuP95 <= Budget30Ms())
        {
            // Not GPU-limited: the CPU (or an outside limit such as a laptop's battery frame cap) sets the frame rate,
            // so neither a lower resolution nor lower settings help. Keep the highest rung that is not materially
            // slower than Low.
            int32 KeepRung = 2;
            for (const FStepResult& Earlier : Results)
            {
                if (Earlier.ScreenPercent == 100 && Earlier.CostP95 <= Result.CostP95 * NoGainTolerance)
                {
                    KeepRung = Earlier.Rung;
                    break;
                }
            }
            UE_LOG(LogGraphicsAutoTune, Warning, TEXT("30 fps not reached even at Low, but the GPU is within budget (%.1f ms): the limit is the CPU or an outside frame cap, so lower settings or resolution would not help; keeping %s at native resolution"),
                Result.GpuP95, RungNames[KeepRung]);
            Commit(KeepRung, 30, 100);
            return;
        }
        // GPU-bound at Low: estimate the resolution scale from pixel-count scaling, then verify.
        const float Estimate = 100.f * FMath::Sqrt(Budget30Ms() / FMath::Max(Result.GpuP95, 1.f));
        const int32 Percent = FMath::Clamp(FMath::FloorToInt(Estimate / 5.f) * 5, MinScreenPercent, 95);
        ResolutionSteps = 1;
        ApplyCandidate(2, Percent);
        StartSettling();
        return;
    }

    // Lowering the resolution percentage at Low, 30 fps target.
    if (Result.CostP95 <= Budget30Ms())
    {
        Commit(2, 30, Result.ScreenPercent);
        return;
    }
    // Stop when the floor is reached, or when the last step no longer helped and the GPU is within budget (then the
    // CPU is the limit). The GPU number alone is not enough: the render thread can wait on the GPU without that
    // counting as idle, so it keeps the frame over budget until the GPU has real headroom.
    const FStepResult& Previous = Results[Results.Num() - 2];
    const bool bStillHelping = Result.CostP95 < Previous.CostP95 * MinResolutionGain;
    if (Result.ScreenPercent <= MinScreenPercent || ResolutionSteps >= MaxResolutionSteps || (!bStillHelping && Result.GpuP95 <= Budget30Ms()))
    {
        UE_LOG(LogGraphicsAutoTune, Warning, TEXT("Below minimum spec: 30 fps not reached at %d%% resolution (%s); keeping the lowest settings"),
            Result.ScreenPercent, Result.ScreenPercent <= MinScreenPercent || ResolutionSteps >= MaxResolutionSteps
                ? TEXT("resolution floor reached")
                : TEXT("a lower resolution stopped helping, so the CPU is the limit"));
        Commit(2, 30, Result.ScreenPercent);
        return;
    }
    ++ResolutionSteps;
    ApplyCandidate(2, FMath::Max(MinScreenPercent, Result.ScreenPercent - 10));
    StartSettling();
}

void UGraphicsAutoTuneSubsystem::CommitBestSoFar()
{
    if (Results.Num() == 0)
    {
        Abort(TEXT("nothing could be measured in time"), true);
        return;
    }
    for (const FStepResult& Step : Results)
    {
        if (Step.ScreenPercent == 100 && Step.CostP95 <= GfxAutoTune::Budget60Ms())
        {
            Commit(Step.Rung, 60, 100);
            return;
        }
    }
    for (const FStepResult& Step : Results)
    {
        if (Step.ScreenPercent == 100 && Step.CostP95 <= GfxAutoTune::Budget30Ms())
        {
            Commit(Step.Rung, 30, 100);
            return;
        }
    }
    int32 LowestPercent = 100;
    for (const FStepResult& Step : Results)
    {
        LowestPercent = FMath::Min(LowestPercent, Step.ScreenPercent);
    }
    Commit(2, 30, LowestPercent);
}

void UGraphicsAutoTuneSubsystem::Commit(int32 Rung, int32 TargetFps, int32 ScreenPercent)
{
    UUserWidget* MenuWidget = Menu.Get();
    for (const GfxAutoTune::FTunableRow& Row : GfxAutoTune::TunableRows)
    {
        SetRow(Row.Name, Row.Index[Rung]);
    }
    for (const GfxAutoTune::FFixedRow& Row : GfxAutoTune::FixedRows)
    {
        SetRow(Row.Name, Row.Index); // includes V-Sync On (switched off for the measurement)
    }
    SetRow(GfxAutoTune::MaxFpsRow, TargetFps >= 60 ? GfxAutoTune::MaxFps60Index : GfxAutoTune::MaxFps30Index);
    SetRowIfDifferent(GfxAutoTune::ScreenModeRow, GfxAutoTune::WindowedFullscreenIndex);
    const int32 ResolutionIndex = FindDisplayResolutionIndex();
    if (ResolutionIndex >= 0)
    {
        SetRowIfDifferent(GfxAutoTune::ResolutionRow, ResolutionIndex);
    }
    if (bScreenPercentTouched || FMath::Abs(OriginalScreenPercent - ScreenPercent) > 0.5)
    {
        if (!SetScreenPercentRow(ScreenPercent))
        {
            UE_LOG(LogGraphicsAutoTune, Warning, TEXT("Could not set the menu's Resolution Scale row; applying %d%% for this session only"), ScreenPercent);
            ExecConsole(FString::Printf(TEXT("r.ScreenPercentage %d"), ScreenPercent));
        }
    }

    // The per-row values no longer match a preset: show the Global Graphics row as "Custom".
    GfxAutoTune::CallNoParams(GfxAutoTune::GetObjectProperty(MenuWidget, TEXT("Widget_GlobalRef")), TEXT("GraphicsEdited"));

    bool bSaved = WriteGraphicsSave();
    if (!bSaved)
    {
        UE_LOG(LogGraphicsAutoTune, Warning, TEXT("Could not write the graphics settings directly; saving through the options menu instead"));
        GfxAutoTune::CallSaveOptions(MenuWidget, bSaved);
    }
    // Make the tuned values the menu's "Cancel" point (clears its unsaved-changes state).
    GfxAutoTune::CallNoParams(MenuWidget, TEXT("MakeBackUp"));

    const FString Summary = FString::Printf(TEXT("%s, %d fps, %d%% resolution%s"), GfxAutoTune::RungNames[Rung], TargetFps, ScreenPercent,
        GfxAutoTune::IsOnBatteryPower() ? TEXT(" (measured on battery)") : TEXT(""));
    FString Steps;
    for (const FStepResult& Step : Results)
    {
        Steps += FString::Printf(TEXT("%s%s@%d%%=%.1fms(game %.1f render %.1f rhi %.1f gpu %.1f)"), Steps.IsEmpty() ? TEXT("") : TEXT("; "),
            GfxAutoTune::RungNames[Step.Rung], Step.ScreenPercent, Step.CostP95, Step.GameP95, Step.RenderP95, Step.RhiP95, Step.GpuP95);
    }
    GConfig->SetString(GfxAutoTune::ConfigSection, TEXT("LastSteps"), *Steps, GGameUserSettingsIni);
    RecordOutcome(bSaved ? Summary : Summary + TEXT(" (NOT saved; will tune again next launch)"), bSaved);

    UE_LOG(LogGraphicsAutoTune, Display, TEXT("Result: %s (settings save %s) in %.0f s. Steps: %s"),
        *Summary, bSaved ? TEXT("written") : TEXT("FAILED"), FPlatformTime::Seconds() - RunStartTime, *Steps);

    // Done for this session either way; an unsaved result is tuned again at the next launch (TunedVersion not written).
    bPending = false;
    bForced = false;
    EndRun();
    Phase = EPhase::Idle;
}

void UGraphicsAutoTuneSubsystem::Abort(const TCHAR* Reason, bool bRestoreSettings)
{
    UE_LOG(LogGraphicsAutoTune, Warning, TEXT("Tuning cancelled because %s; %s"), Reason,
        bRestoreSettings ? TEXT("previous settings restored, will try again next launch") : TEXT("will try again in the next level with the options menu"));
    if (bRestoreSettings && Menu.IsValid())
    {
        for (const TPair<FString, int32>& Original : OriginalRowIndex)
        {
            const bool bResizesWindow = Original.Key == GfxAutoTune::ScreenModeRow || Original.Key == GfxAutoTune::ResolutionRow;
            if (bResizesWindow)
            {
                SetRowIfDifferent(*Original.Key, Original.Value);
            }
            else
            {
                SetRow(*Original.Key, Original.Value);
            }
        }
        if (bScreenPercentTouched)
        {
            ExecConsole(FString::Printf(TEXT("r.ScreenPercentage %s"), *FString::SanitizeFloat(OriginalScreenPercent)));
        }
        // The restored values are the menu's saved/default ones: make them the menu's "Cancel" point again.
        GfxAutoTune::CallNoParams(Menu.Get(), TEXT("MakeBackUp"));
    }
    else
    {
        // The menu is gone (level change): undo what could matter in a level without it. Quality levels are
        // re-applied by the next level's menu.
        if (bScreenPercentTouched)
        {
            ExecConsole(FString::Printf(TEXT("r.ScreenPercentage %s"), *FString::SanitizeFloat(OriginalScreenPercent)));
        }
        if (!RestoreFrameCapCommand.IsEmpty())
        {
            ExecConsole(RestoreFrameCapCommand);
        }
        if (!RestoreVSyncCommand.IsEmpty())
        {
            ExecConsole(RestoreVSyncCommand);
        }
    }
    EndRun();
    // Do not retry in this level (the player is busy); OnPostLoadMap re-arms a pending run.
    Phase = EPhase::Idle;
}

void UGraphicsAutoTuneSubsystem::EndRun()
{
    HideOverlay();
    SetGameplayInputBlocked(false);
    CostSamples.Reset();
    CpuSamples.Reset();
    GameSamples.Reset();
    RenderSamples.Reset();
    RhiSamples.Reset();
    GpuSamples.Reset();
}

void UGraphicsAutoTuneSubsystem::RepairMacWindow(double Now)
{
#if PLATFORM_MAC
    if (CVarMacWindowRepair.GetValueOnGameThread() == 0)
    {
        return;
    }
    UGameViewportClient* Viewport = GetGameInstance() ? GetGameInstance()->GetGameViewportClient() : nullptr;
    const TSharedPtr<SWindow> Window = Viewport ? Viewport->GetWindow() : nullptr;
    if (!Window.IsValid())
    {
        return;
    }

    // Wait for the windowed switch to take, then leave it there.
    if (MacRepairStep == 1)
    {
        if (Window->GetWindowMode() == MacRepairWant)
        {
            MacRepairStep = 0;
            MacRepairCooldown = Now + GfxAutoTune::MacRepairCooldownSeconds;
            MacRepairAfter = 0.0;
            if (IConsoleVariable* Var = IConsoleManager::Get().FindConsoleVariable(TEXT("r.setres")))
            {
                MacLastSetRes = Var->GetString();       // our own change must not trigger us again
            }
            UE_LOG(LogGraphicsAutoTune, Display, TEXT("macOS: %s applied; at any taller size Slate's hit test is a menu bar out of step with the picture and clicks land about a centimetre off"),
                *MacRepairRestore);
        }
        else if (Now - MacRepairTime >= GfxAutoTune::MacRepairTransitionTimeout)
        {
            UE_LOG(LogGraphicsAutoTune, Warning, TEXT("macOS: asked for %s but the window never reported that mode; leaving it alone"), *MacRepairRestore);
            MacRepairStep = 0;
            MacRepairCooldown = Now + GfxAutoTune::MacRepairCooldownSeconds;
            MacRepairAfter = 0.0;
        }
        return;
    }

    // Every time the game re-applies a fullscreen mode — the options menu does it at login, the tuner does it when it
    // sets the resolution row — macOS hands Slate the wrong window rect again and the repair has to be redone. The
    // window's own size does not change on those calls (a fullscreen window always fills the screen), so watch what
    // the game asked for instead.
    if (IConsoleVariable* Var = IConsoleManager::Get().FindConsoleVariable(TEXT("r.setres")))
    {
        const FString SetRes = Var->GetString();
        if (SetRes != MacLastSetRes)
        {
            MacLastSetRes = SetRes;
            if (Now >= MacRepairCooldown)
            {
                MacRepairAfter = Now + GfxAutoTune::MacRepairSettleSeconds;
            }
        }
    }
    // And to the knobs themselves, so setting one from the console does something instead of waiting for the game to
    // change the resolution on its own.
    const int32 Knobs = CVarMacWindowRepair.GetValueOnGameThread() * 1000000
        + CVarMacFullscreenTrim.GetValueOnGameThread() * 1000 + CVarMacWindowedTrim.GetValueOnGameThread();
    if (MacLastKnobs != Knobs)
    {
        const bool bFirst = MacLastKnobs == MIN_int32;
        MacLastKnobs = Knobs;
        if (!bFirst)
        {
            MacRepairCount = 0;             // a deliberate change deserves a fresh budget
            MacRepairCooldown = 0.0;
            MacRepairAfter = Now;
        }
    }
    if (MacRepairCount == 0 && MacRepairAfter <= 0.0 && LevelStartTime > 0.0
        && Now - LevelStartTime >= GfxAutoTune::MacRepairDelaySeconds)
    {
        MacRepairAfter = Now;       // the first one: the window was created in fullscreen and is already wrong
    }
    if (MacRepairAfter <= 0.0 || Now < MacRepairAfter || Now < MacRepairCooldown)
    {
        return;
    }

    if (MacRepairCount >= GfxAutoTune::MacRepairMaxPerSession)
    {
        MacRepairAfter = 0.0;
        return;
    }
    FDisplayMetrics Metrics;
    FDisplayMetrics::RebuildDisplayMetrics(Metrics);
    const FVector2D WindowSize = Window->GetSizeInScreen();
    const int32 DisplayWidth = Metrics.PrimaryDisplayWidth > 0 ? Metrics.PrimaryDisplayWidth : FMath::RoundToInt(WindowSize.X);
    const int32 DisplayHeight = Metrics.PrimaryDisplayHeight > 0 ? Metrics.PrimaryDisplayHeight : FMath::RoundToInt(WindowSize.Y);
    const int32 WorkWidth = Metrics.PrimaryDisplayWorkAreaRect.Right - Metrics.PrimaryDisplayWorkAreaRect.Left;
    const int32 WorkHeight = Metrics.PrimaryDisplayWorkAreaRect.Bottom - Metrics.PrimaryDisplayWorkAreaRect.Top;
    if (CVarMacWindowRepair.GetValueOnGameThread() == 2)
    {
        // Fullscreen at the display height less the menu bar. The engine's own metrics disagree with the OS about
        // that height, so it comes from gfx.MacFullscreenTrim rather than from a calculation.
        const int32 Trim = FMath::Clamp(CVarMacFullscreenTrim.GetValueOnGameThread(), 0, DisplayHeight / 4);
        MacRepairRestore = FString::Printf(TEXT("r.setres %dx%df"), FMath::Max(640, DisplayWidth), FMath::Max(480, DisplayHeight - Trim));
        MacRepairWant = EWindowMode::Fullscreen;
    }
    else
    {
        // Windowed. A windowed window cannot use the menu bar strip or the Dock's space, and the engine's work area
        // leaves the Dock out, so the height comes off a measured trim instead — otherwise the bottom of the game,
        // and with it the video player's controls, sits behind the Dock.
        const int32 Trim = FMath::Clamp(CVarMacWindowedTrim.GetValueOnGameThread(), 0, DisplayHeight / 3);
        MacRepairRestore = FString::Printf(TEXT("r.setres %dx%dw"),
            FMath::Max(640, WorkWidth > 0 ? WorkWidth : DisplayWidth), FMath::Max(480, DisplayHeight - Trim));
        MacRepairWant = EWindowMode::Windowed;
    }
    // Now that the wanted mode and size are known, see whether the window is already there. Checking before this
    // point compared against the PREVIOUS target, so changing gfx.MacWindowRepair from the console looked inert.
    const FString WantedSetRes = MacRepairRestore.RightChop(FString(TEXT("r.setres ")).Len());
    if (Window->GetWindowMode() == MacRepairWant && MacLastSetRes == WantedSetRes)
    {
        MacRepairAfter = 0.0;
        return;
    }
    UE_LOG(LogGraphicsAutoTune, Display, TEXT("macOS: display %dx%d, work area %dx%d (top %d); applying %s"),
        DisplayWidth, DisplayHeight, WorkWidth, WorkHeight, Metrics.PrimaryDisplayWorkAreaRect.Top, *MacRepairRestore);
    ExecConsole(MacRepairRestore);
    MacRepairTime = Now;
    MacRepairAfter = 0.0;
    MacRepairStep = 1;
    ++MacRepairCount;
#else
    (void)Now;
#endif
}

void UGraphicsAutoTuneSubsystem::RecordOutcome(const FString& Result, bool bFinished)
{
    if (bFinished)
    {
        GConfig->SetInt(GfxAutoTune::ConfigSection, TEXT("TunedVersion"), GfxAutoTune::TuneVersion, GGameUserSettingsIni);
        GConfig->SetInt(GfxAutoTune::ConfigSection, TEXT("Attempts"), 0, GGameUserSettingsIni);
    }
    GConfig->SetString(GfxAutoTune::ConfigSection, TEXT("LastResult"), *Result, GGameUserSettingsIni);
    GConfig->SetString(GfxAutoTune::ConfigSection, TEXT("LastRunUtc"), *FDateTime::UtcNow().ToIso8601(), GGameUserSettingsIni);
    GConfig->Flush(false, GGameUserSettingsIni);
}

bool UGraphicsAutoTuneSubsystem::SetRow(const TCHAR* RowName, int32 Index)
{
    UUserWidget* Row = Menu.IsValid() ? Cast<UUserWidget>(Menu->GetWidgetFromName(FName(RowName))) : nullptr;
    if (!Row)
    {
        UE_LOG(LogGraphicsAutoTune, Warning, TEXT("Options menu row %s not found"), RowName);
        return false;
    }
    const int32 NumOptions = GfxAutoTune::GetButtonOptions(Row).Num();
    if (NumOptions == 0)
    {
        UE_LOG(LogGraphicsAutoTune, Warning, TEXT("Options menu row %s has no options"), RowName);
        return false;
    }
    return GfxAutoTune::CallWithInt(Row, TEXT("ByGlobalSetting"), TEXT("NewButtonIndex"), FMath::Clamp(Index, 0, NumOptions - 1));
}

bool UGraphicsAutoTuneSubsystem::SetRowIfDifferent(const TCHAR* RowName, int32 Index)
{
    // Used for rows whose command re-issues r.SetRes (display mode, resolution): skip no-op window changes.
    return GetRowIndex(RowName) == Index ? true : SetRow(RowName, Index);
}

int32 UGraphicsAutoTuneSubsystem::GetRowIndex(const TCHAR* RowName) const
{
    const UUserWidget* Row = Menu.IsValid() ? Cast<UUserWidget>(Menu->GetWidgetFromName(FName(RowName))) : nullptr;
    return GfxAutoTune::GetIntProperty(Row, TEXT("ButtonIndex"), INDEX_NONE);
}

int32 UGraphicsAutoTuneSubsystem::FindDisplayResolutionIndex() const
{
    // In (windowed) fullscreen the viewport is the display the game is on, in physical pixels; otherwise use the
    // primary display.
    FIntPoint Size(0, 0);
    float DpiScale = 1.f;
    UGameViewportClient* Viewport = GetGameInstance() ? GetGameInstance()->GetGameViewportClient() : nullptr;
    const TSharedPtr<SWindow> Window = Viewport ? Viewport->GetWindow() : nullptr;
    if (Window.IsValid())
    {
        DpiScale = FMath::Max(1.f, Window->GetDPIScaleFactor());
        if (Window->GetWindowMode() != EWindowMode::Windowed)
        {
            FVector2D ViewportSize(0, 0);
            Viewport->GetViewportSize(ViewportSize);
            Size = FIntPoint(static_cast<int32>(ViewportSize.X), static_cast<int32>(ViewportSize.Y));
        }
    }
    if (Size.X <= 0 || Size.Y <= 0)
    {
        FDisplayMetrics Metrics;
        FDisplayMetrics::RebuildDisplayMetrics(Metrics);
        Size = FIntPoint(Metrics.PrimaryDisplayWidth, Metrics.PrimaryDisplayHeight);
    }

    const UObject* Row = Menu.IsValid() ? Menu->GetWidgetFromName(FName(GfxAutoTune::ResolutionRow)) : nullptr;
    const TArray<FString> Options = GfxAutoTune::GetButtonOptions(Row);
    // The row lists GetSupportedFullscreenResolutions: physical pixels on Windows; on macOS the RHI divides the
    // display modes by the backing scale, so also try the size in points and in points / scale.
    const float Divisors[] = { 1.f, DpiScale, DpiScale * DpiScale };
    for (const float Divisor : Divisors)
    {
        const FString Wanted = FString::Printf(TEXT("%dx%d"), FMath::RoundToInt(Size.X / Divisor), FMath::RoundToInt(Size.Y / Divisor));
        const int32 Index = Options.IndexOfByKey(Wanted);
        if (Index != INDEX_NONE)
        {
            return Index;
        }
    }

    // No exact match. On macOS there cannot be one: the Metal RHI divides every display mode by the Retina backing
    // scale when it builds this list (MetalRHI.cpp, RHIGetAvailableResolutions), so the list tops out at half the
    // display in each axis — 1440x932 for a 2880x1864 panel, which is the desktop's size in points and renders at
    // full resolution through bAllowHighDPIInGameMode. Rather than leave the row alone, which is what left Macs at
    // whatever the menu happened to default to, take the largest entry that still fits inside the display.
    int32 Best = INDEX_NONE;
    int64 BestArea = 0;
    int32 Smallest = INDEX_NONE;
    int64 SmallestArea = 0;
    for (int32 Index = 0; Index < Options.Num(); ++Index)
    {
        FString WidthText, HeightText;
        if (!Options[Index].Split(TEXT("x"), &WidthText, &HeightText))
        {
            continue;
        }
        const int64 Width = FCString::Atoi(*WidthText);
        const int64 Height = FCString::Atoi(*HeightText);
        if (Width <= 0 || Height <= 0)
        {
            continue;
        }
        const int64 Area = Width * Height;
        if (Smallest == INDEX_NONE || Area < SmallestArea)
        {
            Smallest = Index;
            SmallestArea = Area;
        }
        if (Width <= Size.X && Height <= Size.Y && Area > BestArea)
        {
            Best = Index;
            BestArea = Area;
        }
    }
    const int32 Chosen = Best != INDEX_NONE ? Best : Smallest;      // every entry bigger than the display: take the least bad
    if (Chosen == INDEX_NONE)
    {
        UE_LOG(LogGraphicsAutoTune, Warning, TEXT("The menu's resolution row has no usable entries (%d); leaving it as it is"), Options.Num());
        return INDEX_NONE;
    }
    UE_LOG(LogGraphicsAutoTune, Display, TEXT("Display is %dx%d and the menu's list has no such entry (%d entries); choosing its largest that fits: %s"),
        Size.X, Size.Y, Options.Num(), *Options[Chosen]);
    return Chosen;
}

bool UGraphicsAutoTuneSubsystem::SetScreenPercentRow(double Percent)
{
    // Same effect as the row's Apply button (value into the menu's graphics array + console command), without its click sound.
    UUserWidget* Row = Menu.IsValid() ? Cast<UUserWidget>(Menu->GetWidgetFromName(FName(GfxAutoTune::ScreenScaleRow))) : nullptr;
    if (!Row || !GfxAutoTune::CallWithDouble(Row, TEXT("SetSliderValue"), TEXT("Value"), Percent))
    {
        return false;
    }
    const int32 SettingIndex = GfxAutoTune::GetByteProperty(Row, TEXT("SettingName"), INDEX_NONE);
    const FString Value = FString::SanitizeFloat(Percent);
    if (!GfxAutoTune::SetMenuGraphicValue(Menu.Get(), SettingIndex, Value))
    {
        return false;
    }
    FString Command = GfxAutoTune::GetStringProperty(Row, TEXT("SliderCommand")).TrimEnd();
    if (Command.IsEmpty())
    {
        Command = TEXT("r.ScreenPercentage");
    }
    ExecConsole(Command + TEXT(" ") + Value);
    return true;
}

bool UGraphicsAutoTuneSubsystem::WriteGraphicsSave()
{
    // Write the menu's graphics array into the menu's own save object and save it. The object's key bindings, audio
    // and UI stay exactly as loaded (on a first launch: the class defaults, same as a first launch without tuning),
    // so key bindings are not frozen the way W_Options.SaveOptions would (it sets Saved? on them).
    UUserWidget* MenuWidget = Menu.Get();
    USaveGame* Save = Cast<USaveGame>(GfxAutoTune::GetObjectProperty(MenuWidget, TEXT("AntizeSave")));
    FArrayProperty* Source = MenuWidget ? FindFProperty<FArrayProperty>(MenuWidget->GetClass(), FName(TEXT("MyGraphicIndex"))) : nullptr;
    FArrayProperty* Target = Save ? FindFProperty<FArrayProperty>(Save->GetClass(), FName(TEXT("SaveGraphicIndex"))) : nullptr;
    if (!Save || !Source || !Target || !Source->SameType(Target))
    {
        return false;
    }
    Target->CopyCompleteValue(Target->ContainerPtrToValuePtr<void>(Save), Source->ContainerPtrToValuePtr<void>(MenuWidget));
    return UGameplayStatics::SaveGameToSlot(Save, GfxAutoTune::MenuSlotName, 0);
}

void UGraphicsAutoTuneSubsystem::ExecConsole(const FString& Command) const
{
    UKismetSystemLibrary::ExecuteConsoleCommand(GetGameInstance(), Command, nullptr);
}

void UGraphicsAutoTuneSubsystem::ShowOverlay()
{
    UGameViewportClient* Viewport = GetGameInstance() ? GetGameInstance()->GetGameViewportClient() : nullptr;
    if (!Viewport || Overlay.IsValid())
    {
        return;
    }
    Overlay = SNew(SBorder)
        .BorderImage(FCoreStyle::Get().GetBrush(TEXT("WhiteBrush")))
        .BorderBackgroundColor(FLinearColor(0.f, 0.f, 0.f, 0.82f))
        .HAlign(HAlign_Center)
        .VAlign(VAlign_Center)
        [
            SNew(SVerticalBox)
            + SVerticalBox::Slot()
            .AutoHeight()
            .HAlign(HAlign_Center)
            .Padding(0.f, 0.f, 0.f, 12.f)
            [
                SNew(STextBlock)
                .Text(FText::FromString(TEXT("Optimizing graphics for this computer...")))
                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 30))
                .ColorAndOpacity(FLinearColor::White)
            ]
            + SVerticalBox::Slot()
            .AutoHeight()
            .HAlign(HAlign_Center)
            [
                SAssignNew(OverlayStatus, STextBlock)
                .Font(FCoreStyle::GetDefaultFontStyle("Regular", 18))
                .ColorAndOpacity(FLinearColor(0.8f, 0.8f, 0.8f, 1.f))
            ]
        ];
    Viewport->AddViewportWidgetContent(Overlay.ToSharedRef(), 10000);
}

void UGraphicsAutoTuneSubsystem::UpdateOverlay()
{
    if (OverlayStatus.IsValid())
    {
        OverlayStatus->SetText(FText::FromString(FString::Printf(
            TEXT("Measuring performance (step %d). This happens once and takes about half a minute."), Results.Num() + 1)));
    }
}

void UGraphicsAutoTuneSubsystem::HideOverlay()
{
    UGameInstance* GameInstance = GetGameInstance();
    UGameViewportClient* Viewport = GameInstance ? GameInstance->GetGameViewportClient() : nullptr;
    if (Overlay.IsValid() && Viewport)
    {
        Viewport->RemoveViewportWidgetContent(Overlay.ToSharedRef());
    }
    Overlay.Reset();
    OverlayStatus.Reset();
}

void UGraphicsAutoTuneSubsystem::SetGameplayInputBlocked(bool bBlocked)
{
    if (bBlocked == bInputBlocked)
    {
        return;
    }
    APlayerController* PC = TunedController.Get();
    APawn* Pawn = TunedPawn.Get();
    if (bBlocked)
    {
        if (!PC)
        {
            return;
        }
        // Pawn input off (movement, look and the pawn's Escape binding that opens the options menu). Remember whether
        // it was on, so a pawn whose input the game itself had switched off is left that way.
        bPawnInputWasEnabled = Pawn && Pawn->InputEnabled();
        if (bPawnInputWasEnabled)
        {
            Pawn->DisableInput(nullptr);
        }
        PC->SetIgnoreMoveInput(true);
        PC->SetIgnoreLookInput(true);
        bInputBlocked = true;
    }
    else
    {
        if (PC)
        {
            PC->SetIgnoreMoveInput(false);
            PC->SetIgnoreLookInput(false);
        }
        if (bPawnInputWasEnabled && Pawn)
        {
            Pawn->EnableInput(nullptr); // nullptr: re-enable even if the pawn was re-possessed meanwhile
        }
        bPawnInputWasEnabled = false;
        bInputBlocked = false;
    }
}
