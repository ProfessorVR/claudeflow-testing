// Speaker selection in the microphone menu (2026-09-19).

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Containers/Ticker.h"
#include "Engine/EngineBaseTypes.h"
#include "Types/SlateEnums.h"
#include "AudioOutputSelectorSubsystem.generated.h"

class UComboBoxString;
class UUserWidget;
class UWorld;
enum class EAudioDeviceChangedRole : uint8;

DECLARE_LOG_CATEGORY_EXTERN(LogAudioOutputSelector, Log, All);

/**
 * Adds an "Output Device:" row under the microphone row of the microphone menu (BP_AudioInput, opened with M) and
 * plays the game - voice chat included - on the speakers chosen there.
 *
 * BP_FirstPersonCharacter creates a new BP_AudioInput each time the menu opens, so the row is built in C++ on every
 * instance, in the frame it is created and before it is drawn: a copy of the microphone row (same size, font, styles
 * and refresh button), with its own list and handlers. The first entry, "Default (<name>)", follows the system
 * default output, as the game always did; the other entries are the connected output devices. The choice is kept in
 * GameUserSettings.ini [AudioOutput] and applied again at every launch, and whenever the chosen device reconnects.
 *
 * Windows: the engine's XAudio2 mixer moves its stream to the chosen device. The engine moves the game to the new
 * system default whenever Windows changes it, so a chosen device is re-applied after such a move. The voice echo
 * canceller follows the device the game plays on (EmbeddedVoiceChat FAECCaptureStream).
 * Mac: the engine's Core Audio mixer and the voice echo canceller (VoiceProcessingIO) both always use the system
 * default output, so choosing a device makes it the Mac's output device (as the Sound menu does).
 */
UCLASS()
class AWSTUTORIAL_API UAudioOutputSelectorSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual bool ShouldCreateSubsystem(UObject* Outer) const override;
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    /** Mac: a Core Audio device list or default output change, on the game thread. */
    void OnPlatformDevicesChanged(bool bDeviceListChanged);

private:
    struct FOutputDevice
    {
        FString Id;
        FString Name;
        bool bIsSystemDefault = false;
    };

    bool Tick(float DeltaTime);
    void OnWorldPostActorTick(UWorld* World, ELevelTick TickType, float DeltaSeconds);
    void AddOutputRow(UUserWidget* Menu);

    void RefreshDevices();
    void OnDevicesListed(TArray<FOutputDevice> InDevices, FString InCurrentId);
    void UpdateCombos();
    void ApplyPreference();
    void SwitchTo(const FString& DeviceId);
    void AttemptSwitch();
    void OnSwitchRequested(const FString& DeviceId, bool bAccepted);
    void SavePreference() const;

    void OnDefaultRenderDeviceChanged(EAudioDeviceChangedRole Role, FString DeviceId);
    void OnDeviceAdded(FString DeviceId);
    void OnDeviceRemoved(FString DeviceId);
    void OnDeviceSwitched(FString DeviceId);

    UFUNCTION()
    void OnOutputSelectionChanged(FString SelectedItem, ESelectInfo::Type SelectionType);

    UFUNCTION()
    void OnRefreshClicked();

    // The player's choice; an empty Id is the system default.
    FString PreferredId;
    FString PreferredName;

    // The last device list and the device the game plays on.
    TArray<FOutputDevice> Devices;
    FString CurrentId;
    bool bHaveDeviceList = false;
    bool bRefreshInFlight = false;
    bool bRefreshAgain = false;
    double RefreshStartTime = 0.0;
    FString LastSummary;
    bool bStartupApplied = false;
    bool bApplyPreference = false;      // after the next list: move the game back to the chosen device if needed

    // Menu entry -> device Id, for the entries last put in the lists.
    TMap<FString, FString> EntryToId;
    TArray<TWeakObjectPtr<UComboBoxString>> Combos;
    bool bUpdatingCombos = false;

    TWeakObjectPtr<UClass> MenuClass;
    TSet<TWeakObjectPtr<UUserWidget>> MenusWithoutRow;     // menus whose layout was not recognized (logged once)
    double NextMenuClassLookup = 0.0;

    // Switch retries (a switch already in progress refuses new requests) and re-apply rate limit.
    bool bSwitchPending = false;
    FString PendingSwitchId;            // empty = the system default
    int32 SwitchAttempts = 0;
    double NextSwitchAttempt = 0.0;
    double NextRefresh = 0.0;
    TArray<double> ReapplyTimes;

    FTSTicker::FDelegateHandle TickHandle;
    FDelegateHandle PostActorTickHandle;
    FDelegateHandle DefaultChangedHandle;
    FDelegateHandle AddedHandle;
    FDelegateHandle RemovedHandle;
    FDelegateHandle SwitchedHandle;
};
