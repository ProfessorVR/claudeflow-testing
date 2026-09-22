// Immersive Mode: watching a video from inside it (2026-09-19).

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Containers/Ticker.h"
#include "Engine/EngineBaseTypes.h"
#include "ImmersiveViewSubsystem.generated.h"

class AActor;
class APlayerController;
class UButton;
class UMediaPlayer;
class UMediaSoundComponent;
class UStaticMeshComponent;
class UUserWidget;
class UWorld;

DECLARE_LOG_CATEGORY_EXTERN(LogImmersiveView, Log, All);

/**
 * Immersive Mode: while a video plays, the viewer watches it from inside, with nothing in the way.
 *
 * Each viewer gets their own copy of the picture on their own machine, so their avatar's body, the floor, the ceiling
 * and other avatars can never block it, and several people can watch the same video without spoiling each other's
 * view. Nothing is replicated.
 *  - 360 and 180 videos: a copy of the video sphere around the viewer's camera, using the same material, so the video
 *    is decoded once and shown twice. The room's own sphere is hidden meanwhile, so only one sphere is ever drawn.
 *  - 2D, POV and interview videos: a black surround with a copy of the flat picture squarely in front of the viewer.
 *
 * It starts by itself when a video starts playing, and there is an "Immersive Mode" button in the video player under
 * "Hide POV" that turns it off and on. While immersed: the viewer's own body is hidden (the character's own
 * "Set Point of View" event), movement is locked, mouse look works as usual, and the video's sound is centred on the
 * viewer. Leaving restores all of it, and so does closing the video player (Q), the video ending, leaving the area,
 * or the level changing.
 *
 * Optional comfort aid, for a 360 video with no floor to orient by: a faint grid disc under the viewer.
 *
 * Console (for tuning during review; the chosen values become the defaults):
 *   immersive.Enable, immersive.AutoEnter, immersive.DomeRadius, immersive.FadeTime, immersive.CenterAudio,
 *   immersive.HideRoomScreen, immersive.ComfortFloor, immersive.FloorRadius, immersive.FloorOpacity,
 *   immersive.FloorDrop, immersive.CinemaDistance, immersive.CinemaYaw, immersive.CinemaHeight, immersive.Status
 */
UCLASS()
class AWSTUTORIAL_API UImmersiveViewSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual bool ShouldCreateSubsystem(UObject* Outer) const override;
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    /** The video player's "Immersive Mode" button, and the console. */
    UFUNCTION()
    void ToggleImmersive();

    /** What the mode is doing, for the console command immersive.Status. */
    FString DescribeState() const;

#if !UE_BUILD_SHIPPING
    /** immersive.Test: stand at a screen, open the video player and press play, for remote testing. */
    void StartTest(int32 TriggerIndex);
#endif

private:
    enum class EMode : uint8
    {
        Off,
        Sphere,     // 360 / 180: the video all around the viewer
        Cinema,     // 2D / POV / interview: a flat picture in front, everything else black
    };

    // What is on screen right now, found on the player's current screen actor.
    struct FActiveVideo
    {
        AActor* Screen = nullptr;
        UStaticMeshComponent* Mesh = nullptr;           // the mesh showing the video in the room
        UMediaSoundComponent* Sound = nullptr;          // that video's sound
        UMediaPlayer* Player = nullptr;
        bool bSphere = false;                           // the 360 sphere rather than a flat screen
        bool IsValid() const { return Screen && Mesh; }
    };

    void OnWorldPostActorTick(UWorld* World, ELevelTick TickType, float DeltaSeconds);
    bool Tick(float DeltaTime);

    void RefreshScreenList(UWorld* World);
    FActiveVideo FindActiveVideo(UWorld* World) const;
    UUserWidget* GetVideoPlayerWidget(UWorld* World) const;
    APlayerController* GetController(UWorld* World) const;

    void Enter(const FActiveVideo& Video);
    void Exit(const TCHAR* Reason);
    void UpdateWhileImmersed(UWorld* World, float DeltaSeconds);

    AActor* SpawnPiece(UWorld* World, UStaticMesh* Mesh, UMaterialInterface* Material, const TCHAR* Name);
    float MeasureEnclosure(UWorld* World, UStaticMeshComponent* Keep, const FVector& CameraLocation, FString& OutNames) const;
    void UpdateComfortFloor(UWorld* World);
    void SetVideoAudioCentred(bool bCentred);
    void FadeCamera(UWorld* World, bool bOut);
    void AddImmersiveButton(UUserWidget* Widget);
    void UpdateButtonLabel();

    EMode Mode = EMode::Off;

    UPROPERTY()
    TObjectPtr<AActor> Dome;            // the video sphere, or the black surround in cinema mode

    UPROPERTY()
    TObjectPtr<AActor> CinemaScreen;    // the flat picture in cinema mode

    UPROPERTY()
    TObjectPtr<AActor> ComfortFloor;    // the optional grid disc

    TWeakObjectPtr<AActor> Screen;                  // the screen actor being watched
    TWeakObjectPtr<UStaticMeshComponent> RoomMesh;  // hidden while immersed
    TWeakObjectPtr<UMediaSoundComponent> VideoSound;
    TWeakObjectPtr<UMediaPlayer> VideoPlayer;
    FTransform SoundTransform;                      // the sound's place in the room, put back on exit
    bool bSoundMoved = false;
    bool bRoomMeshWasVisible = true;
    bool bBorrowed = false;                         // the room's own screen was brought around the viewer
    FTransform RoomTransform;                       // where that screen belongs, put back on exit

    TArray<TWeakObjectPtr<AActor>> Screens;         // actors that can show a video
    double NextScreenScan = 0.0;
    double PlayingSince = 0.0;                      // debounce: a stream re-opening blinks IsPlaying off
    static constexpr float MaxScreenDistance = 4000.f;

    TWeakObjectPtr<UUserWidget> PlayerWidget;       // the open video player
    TArray<TWeakObjectPtr<UButton>> Buttons;        // "Immersive Mode" buttons added to video players
    TWeakObjectPtr<UMediaPlayer> DeclinedFor;       // the viewer turned it off for this video
    double LastPlayingTime = 0.0;

    FTSTicker::FDelegateHandle TickHandle;
    FDelegateHandle PostActorTickHandle;

#if !UE_BUILD_SHIPPING
    void RunTest(UWorld* World);
    int32 TestStage = 0;
    int32 TestTrigger = 0;
    bool bTest2D = false;
    double TestTime = 0.0;
#endif
};
