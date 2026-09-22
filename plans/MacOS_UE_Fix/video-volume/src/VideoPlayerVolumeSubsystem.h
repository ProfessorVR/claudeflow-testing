// Video player volume slider (2026-09-19).

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Containers/Ticker.h"
#include "Engine/EngineBaseTypes.h"
#include "VideoPlayerVolumeSubsystem.generated.h"

class USlider;
class USoundClass;
class USoundMix;
class UUserWidget;
class UWorld;

DECLARE_LOG_CATEGORY_EXTERN(LogVideoPlayerVolume, Log, All);

/**
 * Makes the volume slider of the video player widgets (BP_WG_*, "Slider_Volume") set the volume of video audio only.
 *
 * Video audio plays in SC_Video (DefaultMediaSoundClassName), a child of the settings menu's SC_Master: the settings
 * Master slider still scales video, the Music/Effects/Voice sliders never touch it, and this slider changes nothing but
 * video. The slider sets SM_Video's adjustment of SC_Video; SM_Video is pushed once in every level. The level is kept in
 * GameUserSettings.ini [VideoPlayer] Volume (0-1) and every video player opens with its slider there (1 = far right).
 *
 * The widgets' own slider handler (SetSoundMixClassOverride with no mix and no class) does nothing and is left as is.
 *
 * Video audio: every MediaSoundComponent without a sound class gets SC_Video when it appears (the engine ignores
 * DefaultMediaSoundClassName when a synth component starts; the ini line stays for code that asks for the class).
 *
 * Settings menu: a "Video" row is added under Voice in the audio section of every W_Options — a real W_TemplateAudio
 * row (hover, description, navigation, Save/Cancel/Default all work through the menu's own logic) with SettingName 4,
 * which the menu stores as MyAudio[4] (its mix switch has no entry for 4, so it applies nothing itself). The row and
 * the video players' sliders move together; changes from a video player don't mark the menu as edited.
 * Development builds: -VideoVolumeSelfTest runs a scripted check of the effective class volumes, and
 * -VideoVolumeSelfTest=open opens a video player and leaves it open.
 */
UCLASS()
class AWSTUTORIAL_API UVideoPlayerVolumeSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual bool ShouldCreateSubsystem(UObject* Outer) const override;
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

private:
    bool Tick(float DeltaTime);
    void OnWorldPostActorTick(UWorld* World, ELevelTick TickType, float DeltaSeconds);
    bool IsVideoPlayerClass(UClass* WidgetClass);
    void LinkSlider(UUserWidget* Widget, USlider* Slider);
    void ApplyVolume(UWorld* World) const;
    void SaveVolume();
    void SetVolume(float NewVolume, bool bFromSettingsRow);

    // The "Video" row in the settings menu's audio section (W_Options, ScrollBox_Audio).
    void UpdateSettingsRow(UWorld* World);
    void AddSettingsRow(UUserWidget* Menu);
    void SyncSettingsRowQuietly();
    bool SetMenuAudioEntry(UUserWidget* Menu, const FString& Value) const;

    UFUNCTION()
    void OnVideoSliderChanged(float Value);

    UFUNCTION()
    void OnSettingsSliderChanged(float Value);

#if !UE_BUILD_SHIPPING
    void LogClassVolumes(const FString& Reason) const;
    void RunSelfTest();

    FString SelfTestMode;
    int32 SelfTestStep = 0;
    double SelfTestStart = 0.0;
    TWeakObjectPtr<UUserWidget> SelfTestWidget;
#endif

    UPROPERTY()
    TObjectPtr<USoundClass> VideoClass;

    UPROPERTY()
    TObjectPtr<USoundMix> VideoMix;

    float Volume = 1.f;
    bool bSaveDue = false;
    double SaveAt = 0.0;
    TWeakObjectPtr<UWorld> MixWorld;        // the world SM_Video was last pushed in
    TMap<TWeakObjectPtr<UClass>, bool> VideoPlayerClasses;
    TArray<TWeakObjectPtr<USlider>> Sliders;
    bool bSettingVolume = false;

    TWeakObjectPtr<UClass> OptionsClass;
    TWeakObjectPtr<UUserWidget> SettingsMenu;
    TWeakObjectPtr<UUserWidget> SettingsRow;
    int32 SettingsRowStage = 0;         // 0 none, 1 added (waiting to register), 2 registered (waiting to link), 3 linked
    double SettingsRowStageTime = 0.0;
    double NextOptionsLookup = 0.0;

    FTSTicker::FDelegateHandle TickHandle;
    FDelegateHandle PostActorTickHandle;
};
