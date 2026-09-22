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
 * Order (operator spec): aim for 60 fps, lowering the tunable rows High -> Medium -> Low; if Low misses 60, cap at
 * 30 fps and keep the highest level that holds 30 at native resolution; only if Low misses 30 lower the resolution
 * percentage (floor 50 %). Shadows and GI stay Low, motion blur Off, V-Sync On, windowed fullscreen at the display's
 * resolution. Each candidate is measured behind the overlay with V-Sync and the frame cap off; its cost is the 95th
 * percentile of the real frame time (the GPU time decides whether a lower resolution can help). V-Sync and the
 * chosen 60/30 fps cap are applied at commit.
 *
 * Runs once per install (no menu save and no [GraphicsAutoTune] TunedVersion in GameUserSettings.ini), at most
 * MaxAttempts times if runs keep getting cancelled. Raising TuneVersion re-tunes installs tuned by an older version.
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

    struct FStepResult
    {
        int32 Rung = 0;             // 0 High, 1 Medium, 2 Low
        int32 ScreenPercent = 100;
        int32 Frames = 0;
        float CostP95 = 0.f;        // frame time, uncapped, V-Sync off
        float CostP50 = 0.f;
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

    void BeginRun();
    void ApplyCandidate(int32 Rung, int32 ScreenPercent);
    void StartSettling();
    void AddSample();
    void FinishStep();
    void CommitBestSoFar();
    void Commit(int32 Rung, int32 TargetFps, int32 ScreenPercent);
    void Abort(const TCHAR* Reason, bool bRestoreSettings);
    void EndRun();
    void RecordOutcome(const FString& Result, bool bFinished);

    bool SetRow(const TCHAR* RowName, int32 Index);
    bool SetRowIfDifferent(const TCHAR* RowName, int32 Index);
    int32 GetRowIndex(const TCHAR* RowName) const;
    int32 FindDisplayResolutionIndex() const;
    bool SetScreenPercentRow(double Percent);
    bool WriteGraphicsSave();
    /**
     * macOS only. Keeps the game in fullscreen at the display's height less the menu bar — the one size where
     * Slate's hit test agrees with what is drawn. UE caches `[NSScreen visibleFrame]` (the screen less the menu bar)
     * as the window size in both fullscreen modes (FMacApplication::OnWindowDidResize) and nothing corrects it
     * afterwards, because macOS has no AdjustCachedSize; at any taller size every click lands about a centimetre
     * from the pointer. Measured on a 2880x1864 MacBook: 2880x1790 is right, 2880x1864 is not. This applies it early
     * in loading and again whenever something — the options menu at login, the tuner — changes the mode.
     * Off with `gfx.MacWindowRepair 0`.
     */
    void RepairMacWindow(double Now);

    void ExecConsole(const FString& Command) const;
    void ShowOverlay();
    void UpdateOverlay();
    void HideOverlay();
    void SetGameplayInputBlocked(bool bBlocked);

    EPhase Phase = EPhase::Idle;
    bool bPending = false;          // should tune in this session
    bool bForced = false;

    int32 MacRepairStep = 0;        // 0 idle, 1 the windowed leg is applied and waiting (see RepairMacWindow)
    int32 MacRepairCount = 0;
    double MacRepairTime = 0.0;
    double MacRepairAfter = 0.0;    // a resolution change was seen; repair once it has settled
    double MacRepairCooldown = 0.0; // ignore the changes the repair itself makes
    FString MacRepairRestore;       // the r.setres that puts the window where it belongs
    FString MacLastSetRes;          // last value of the r.setres cvar, to notice the game re-applying the mode
    TEnumAsByte<EWindowMode::Type> MacRepairWant = EWindowMode::Windowed;
    int32 MacLastKnobs = MIN_int32; // gfx.MacWindowRepair/Trim packed, to notice the operator changing them
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
