// First-launch graphics auto-tuning (2026-09-18).

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Containers/Ticker.h"
#include "GraphicsAutoTuneSubsystem.generated.h"

class APawn;
class APlayerController;
class IConsoleObject;
class SWidget;
class STextBlock;
class UUserWidget;
class UWorld;

DECLARE_LOG_CATEGORY_EXTERN(LogGraphicsAutoTune, Log, All);

/**
 * Picks graphics settings for this computer the first time the game reaches a level with the options menu.
 *
 * The AntizeMenuSystem options menu (W_Options) owns every graphics setting: about 2 s after the local pawn spawns,
 * BP_MainMenuComponent creates it hidden and each row runs its console command, from the save slot
 * "/Settings/MyOptions" or, on a first launch, from the row's ButtonDefaultIndex. Console-set values outrank
 * GameUserSettings/scalability, so this subsystem works THROUGH the live menu: it changes rows with the menu's own
 * ByGlobalSetting event, measures real frame cost in the level, then writes the menu's graphics array into the save
 * slot (key bindings, audio and UI in the save are left exactly as they were) and makes the result the menu's
 * "Cancel" point, so the menu shows it and every later launch loads it.
 *
 * Two profiles, one per power source (2026-09-21, operator spec): laptops cut GPU power on battery, so what holds
 * 60 fps plugged in does not hold it unplugged, and a student should never have to think about it.
 *   AC      : aim for 60 fps, lowering the tunable rows High -> Medium -> Low; if Low misses 60, cap at 30 fps and keep
 *             the highest level that holds 30 at native resolution; only if Low misses 30 lower the resolution
 *             percentage (floor 50 %).
 *   Battery : at most Medium, 30 fps cap: Medium -> Low at native resolution for 30 fps, then the resolution steps.
 * Each profile is measured on the first launch in that power state (the overlay runs once per state) and stored as
 * [GraphicsAutoTune] ProfileAC / ProfileBattery = "rung,fps,percent" with its own TunedVersion/Attempts/LastResult.
 * Whichever profile matches the current power source is applied through the menu — at launch once the menu exists,
 * and live when the cable is plugged or unplugged (polled every 2 s, 5 s debounce). Until the battery profile has
 * been measured, a provisional one derived from the AC result (rung capped at Medium, 30 fps) is used; an AC profile is
 * never derived from a battery measurement (an unplugged machine can only do less). Desktops report AC always and get
 * one profile. Shadows and GI stay Low, motion blur Off, V-Sync On, windowed fullscreen at the display's resolution
 * (Windowed on macOS). Each candidate is measured behind the overlay with V-Sync and the frame cap off; its cost is
 * the 95th percentile of the real frame time (the GPU time decides whether a lower resolution can help).
 *
 * Runs at most MaxAttempts times per profile if runs keep getting cancelled, and at most MaxFinishedFailures times if
 * runs finish but cannot be applied or saved (then the profile is marked tuned and the menu's settings stay). Raising
 * TuneVersion re-tunes both profiles of installs tuned by an older version.
 * Console: gfx.AutoTune.Run (force a run in the current level), gfx.AutoTune.Enable 0 (kill switch).
 * Command line: -GraphicsAutoTune (force), -NoGraphicsAutoTune (disable).
 */
UCLASS()
class AWSTUTORIAL_API UGraphicsAutoTuneSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual bool ShouldCreateSubsystem(UObject* Outer) const override;
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    /** Run the tuner in the current (or next) level with the options menu, even if it already ran. */
    UFUNCTION(BlueprintCallable, Category = "Graphics")
    void RequestRun();

    /** True while a tuning pass is measuring (overlay up, input paused). */
    UFUNCTION(BlueprintPure, Category = "Graphics")
    bool IsTuning() const;

private:
    enum class EPhase : uint8
    {
        Idle,           // nothing to do (until the next level load if a run is still pending)
        WaitForMenu,    // waiting for the local pawn's W_Options
        WaitForSettle,  // menu found; waiting for its rows, shader precompiles and the level to settle
        Settling,       // a candidate is applied; letting it take effect before sampling
        Sampling,       // collecting per-frame costs for the candidate
    };

    enum class EPowerProfile : uint8
    {
        AC,             // plugged in (or a desktop)
        Battery,
    };

    struct FProfile
    {
        int32 Rung = 0;             // 0 High, 1 Medium, 2 Low
        int32 Fps = 60;             // 60 or 30: the frame cap applied at commit
        int32 Percent = 100;        // resolution scale
    };

    struct FStepResult
    {
        int32 Rung = 0;             // 0 High, 1 Medium, 2 Low
        int32 ScreenPercent = 100;
        int32 Frames = 0;
        float CostP95 = 0.f;        // the cost the ladder decides on: wall-clock frame time, uncapped, V-Sync off; on macOS the
                                    // real drawing time max(GPU, CPU) because a windowed Mac frame is locked to the refresh
        float CostP50 = 0.f;
        float WallP95 = 0.f;        // wall-clock frame time as measured (== CostP95 except on macOS), for the log
        float CpuP95 = 0.f;         // max(game, render); the RHI thread is left out because on Metal it blocks on GPU back-pressure
        float GameP95 = 0.f;
        float RenderP95 = 0.f;
        float RhiP95 = 0.f;
        float GpuP95 = 0.f;
    };

    bool Tick(float DeltaTime);
    void OnPostLoadMap(UWorld* LoadedWorld);

    UUserWidget* FindMenu(APawn*& OutPawn, APlayerController*& OutPC) const;
    bool IsMenuOpen() const;
    bool IsShaderWorkPending() const;
    bool IsWindowMinimized() const;

    void BeginRun(EPowerProfile Which);
    void ApplyCandidate(int32 Rung, int32 ScreenPercent);
    void StartSettling();
    void AddSample();
    void FinishStep();
    void CommitBestSoFar();
    void Commit(int32 Rung, int32 TargetFps, int32 ScreenPercent);
    void Abort(const TCHAR* Reason, bool bRestoreSettings);
    void EndRun();
    void RecordOutcome(EPowerProfile Which, const FString& Result, bool bFinished);
    void RecordMacWindow(const FString& What);   // [GraphicsAutoTune] MacWindow= — the repair's last action, for Shipping
    void RecordTrace(const FString& What);       // [GraphicsAutoTune] Trace1..3= — the last three decisions, for Shipping
    int32 ReadFinishedFailures(EPowerProfile Which) const; // FinishedFailures<Which>= for this TuneVersion (0 if for another)
    void WriteFinishedFailures(EPowerProfile Which, int32 Count);

    // Power profiles ([GraphicsAutoTune] keys carry the profile name as a suffix: TunedVersionAC, ProfileBattery, ...).
    static const TCHAR* ProfileName(EPowerProfile Which);
    static FString ProfileKey(EPowerProfile Which, const TCHAR* Key);
    EPowerProfile CurrentPowerProfile() const;
    bool IsProfileTuned(EPowerProfile Which) const;
    int32 ProfileGetInt(EPowerProfile Which, const TCHAR* Key, int32 Default = 0) const;
    void ProfileSetInt(EPowerProfile Which, const TCHAR* Key, int32 Value);
    void ProfileSetString(EPowerProfile Which, const TCHAR* Key, const FString& Value);
    bool ReadProfile(EPowerProfile Which, FProfile& Out) const;
    void WriteProfile(EPowerProfile Which, const FProfile& Settings);
    /** Sets every row the tuner owns from Settings, saves through the menu and records Which as applied. */
    bool ApplyProfile(EPowerProfile Which, const FProfile& Settings, bool bForceScreenPercent, bool& bOutSaved);
    /** Applies Which's stored profile if the menu currently holds the other one (or none). */
    void ReconcileAppliedProfile(EPowerProfile Which);
    /** Polls the power source; on a debounced change switches profiles, or cancels a run and re-arms. */
    void UpdatePowerState(double Now);

    bool SetRow(const TCHAR* RowName, int32 Index);
    bool SetRowIfDifferent(const TCHAR* RowName, int32 Index);
    int32 GetRowIndex(const TCHAR* RowName) const;
    int32 FindDisplayResolutionIndex() const;
    bool SetScreenPercentRow(double Percent);
    bool WriteGraphicsSave();
    /**
     * macOS only. Keeps the game window where clicks land under the pointer. In both fullscreen modes UE caches
     * `[NSScreen visibleFrame]` (the screen less the menu bar) as the window size (FMacApplication::OnWindowDidResize)
     * and nothing corrects it afterwards, because macOS has no AdjustCachedSize, so every click lands about a
     * centimetre from the pointer; a windowed window is cached correctly. The default (`gfx.MacWindowRepair 1`) is
     * therefore a windowed window the width of the display, placed under the menu bar and sized to stop above the
     * Dock (measured constants: gfx.MacMenuBarPx, gfx.MacTitleBarPx, gfx.MacDockPx — the engine's own work area is
     * wrong on this Mac). `2` is fullscreen at the display height less gfx.MacFullscreenTrim, which is only right once
     * the options menu has put the game in Fullscreen itself, never from launch. `0` leaves the window alone.
     *
     * It compares the window's actual mode, size and position with the target every tick and corrects them after
     * they have been wrong for a second: at launch, after the options menu re-applies its saved mode at login, after
     * the tuner commits. A resize is followed by a move, because the engine centres a resized window. It never
     * touches the window while a measurement is running, and after three corrections in a row that did not take it
     * stops until the window or a knob changes.
     */
    void RepairMacWindow(double Now);

    void ExecConsole(const FString& Command) const;
    void ShowOverlay(EPowerProfile Which);
    void UpdateOverlay();
    void HideOverlay();
    void SetGameplayInputBlocked(bool bBlocked);

    EPhase Phase = EPhase::Idle;
    bool bPending = false;          // a measurement is wanted for the current power state
    bool bForced = false;
    bool bDisabled = false;         // -NoGraphicsAutoTune or the editor: no measuring, no profile switching

    EPowerProfile CurrentProfile = EPowerProfile::AC;   // the profile the current (or last) run measures
    EPowerProfile LastPowerState = EPowerProfile::AC;   // debounced power source
    double PowerChangeSince = 0.0;                      // when a different power source was first seen (0 = none)
    double NextPowerPollTime = 0.0;

    double MacWindowWrongSince = 0.0;   // when the window was first seen away from the target (0 = it is there)
    double MacWindowLastApply = 0.0;    // last correction issued
    int32 MacWindowFailures = 0;        // corrections in a row that did not take; cleared when the window is right
    bool bMacWindowGaveUp = false;      // the failure budget is spent and that has been logged
    FString MacInsetsSignature;         // the OS-read insets as last logged; a change (display mode, Dock, menu bar) is logged again
    FString MacWindowTarget;            // the target the failures count against; a knob change resets them
    double MacWindowedReachedTime = 0.0; // when a correct windowed window was first seen in the current windowed stretch (0 = not yet / not windowed)
    bool bMacMenuModeKnown = false;     // the options menu has applied a screen mode this session (a mode change the repair did not issue)
    bool bMacMenuWantsFullscreen = false; // ... and it was Fullscreen or Windowed Fullscreen
    bool bMacLastWindowModeKnown = false;
    EWindowMode::Type MacLastWindowMode = EWindowMode::Windowed;   // the window mode seen on the previous tick
    bool bMacRepairModeChangePending = false;                      // the repair issued a mode-changing r.setres that has not landed yet
    EWindowMode::Type MacRepairPendingMode = EWindowMode::Windowed; // ... to this mode
    float MacPanelVirtualOverPanel = 1.f; // virtual framebuffer / physical panel, per axis (1 in an exact-2x mode)
    double LevelStartTime = 0.0;
    double MenuFoundTime = 0.0;
    double PhaseStartTime = 0.0;
    double NextPollTime = 0.0;
    double RunStartTime = 0.0;

    TWeakObjectPtr<UUserWidget> Menu;
    TWeakObjectPtr<APawn> TunedPawn;
    TWeakObjectPtr<APlayerController> TunedController;
    bool bInputBlocked = false;
    bool bPawnInputWasEnabled = false;

    // Candidate being measured, and what has been measured so far.
    int32 CurrentRung = 0;
    int32 CurrentScreenPercent = 100;
    int32 NativePercent = 100;      // the ladder's "native" resolution scale: 100, or the panel's share of a scaled macOS mode
    int32 ResolutionSteps = 0;
    TArray<FStepResult> Results;
    TArray<float> CostSamples;
    TArray<float> CpuSamples;
    TArray<float> GameSamples;
    TArray<float> RenderSamples;
    TArray<float> RhiSamples;
    TArray<float> GpuSamples;
    bool bGpuTimingAvailable = true;
    bool bScreenPercentTouched = false;
    bool bRemeasured = false;       // the current candidate is being measured a second time (hitch check)

    // Menu state before the run, restored on abort.
    TMap<FString, int32> OriginalRowIndex;
    double OriginalScreenPercent = 100.0;
    FString RestoreFrameCapCommand;     // t.MaxFPS / r.VSync as they were, for aborts after the menu is gone
    FString RestoreVSyncCommand;

    TSharedPtr<SWidget> Overlay;
    TSharedPtr<STextBlock> OverlayStatus;

    FTSTicker::FDelegateHandle TickHandle;
    FDelegateHandle PostLoadMapHandle;
    IConsoleObject* RunCommand = nullptr;
};
