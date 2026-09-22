// Immersive Mode: watching a video from inside it (2026-09-19).

#include "ImmersiveViewSubsystem.h"

#include "Blueprint/UserWidget.h"
#include "Blueprint/WidgetTree.h"
#include "Camera/PlayerCameraManager.h"
#include "Components/Button.h"
#include "Components/BoxComponent.h"
#include "Components/CanvasPanelSlot.h"
#include "MediaSoundComponent.h"
#include "Components/PanelSlot.h"
#include "Components/PanelWidget.h"
#include "Components/StaticMeshComponent.h"
#include "Components/TextBlock.h"
#include "Engine/Engine.h"
#include "Engine/GameInstance.h"
#include "Engine/StaticMesh.h"
#include "Engine/World.h"
#include "GameFramework/Character.h"
#include "GameFramework/Pawn.h"
#include "GameFramework/PlayerController.h"
#include "MediaPlayer.h"
#include "MediaTexture.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"
#include "EngineUtils.h"
#include "Misc/App.h"
#include "UObject/UnrealType.h"

DEFINE_LOG_CATEGORY(LogImmersiveView);

namespace ImmersiveView
{
    const TCHAR* SphereMeshPath = TEXT("/Game/VP360_Content/Screen/Screen_360.Screen_360");
    const TCHAR* FlatMeshPath = TEXT("/Game/VP360_Content/Screen/Screen_2D.Screen_2D");
    const TCHAR* DiscMeshPath = TEXT("/Engine/BasicShapes/Cylinder.Cylinder");
    const TCHAR* BlackoutMaterialPath = TEXT("/Game/Blueprints/Immersive/M_ImmersiveBlackout.M_ImmersiveBlackout");
    const TCHAR* FloorMaterialPath = TEXT("/Game/Blueprints/Immersive/M_ImmersiveFloor.M_ImmersiveFloor");
    const TCHAR* ScreenProperty = TEXT("CurrentOrbitTarget");
    const TCHAR* WidgetProperty = TEXT("CurrentWidget");
    const TCHAR* PointOfViewEvent = TEXT("Set Point of View");
    const FName PovButtonName(TEXT("Button_POV"));
    const FName ImmersiveButtonName(TEXT("EVC_ImmersiveButton"));

    TAutoConsoleVariable<int32> CVarEnable(TEXT("immersive.Enable"), 1, TEXT("Immersive Mode on/off."));
    TAutoConsoleVariable<int32> CVarAutoEnter(TEXT("immersive.AutoEnter"), 1, TEXT("Start Immersive Mode by itself when a video plays."));
    TAutoConsoleVariable<float> CVarDomeRadius(TEXT("immersive.DomeRadius"), 400.f, TEXT("How far the video sits from the viewer (cm)."));
    TAutoConsoleVariable<float> CVarFadeTime(TEXT("immersive.FadeTime"), 0.25f, TEXT("Fade in/out when entering and leaving (s)."));
    TAutoConsoleVariable<int32> CVarCenterAudio(TEXT("immersive.CenterAudio"), 1, TEXT("Centre the video's sound on the viewer while immersed."));
    TAutoConsoleVariable<int32> CVarHideRoomScreen(TEXT("immersive.HideRoomScreen"), 1, TEXT("Hide the room's own screen while immersed (it is behind the copy)."));
    TAutoConsoleVariable<int32> CVarBorrowScreen(TEXT("immersive.BorrowRoomScreen"), 1, TEXT("Bring the room's own screen around the viewer instead of drawing a copy of it. Only that player sees it move."));
    TAutoConsoleVariable<int32> CVarComfortFloor(TEXT("immersive.ComfortFloor"), 1, TEXT("Show a faint grid floor under the viewer."));
    TAutoConsoleVariable<float> CVarFloorRadius(TEXT("immersive.FloorRadius"), 250.f, TEXT("Comfort floor radius (cm)."));
    TAutoConsoleVariable<float> CVarFloorOpacity(TEXT("immersive.FloorOpacity"), 0.25f, TEXT("Comfort floor opacity."));
    TAutoConsoleVariable<float> CVarFloorDrop(TEXT("immersive.FloorDrop"), 90.f, TEXT("How far below the camera the comfort floor sits (cm)."));
    TAutoConsoleVariable<float> CVarCinemaDistance(TEXT("immersive.CinemaDistance"), 450.f, TEXT("Cinema screen distance (cm)."));
    TAutoConsoleVariable<float> CVarCinemaYaw(TEXT("immersive.CinemaYaw"), 0.f, TEXT("Cinema screen facing correction (degrees)."));
    TAutoConsoleVariable<float> CVarCinemaHeight(TEXT("immersive.CinemaHeight"), 0.f, TEXT("Cinema screen height offset (cm)."));
    TAutoConsoleVariable<float> CVarCinemaSize(TEXT("immersive.CinemaSize"), 360.f, TEXT("Cinema screen height (cm); width follows the video's shape."));
    TAutoConsoleVariable<int32> CVarCinemaSurround(TEXT("immersive.CinemaSurround"), 1, TEXT("Black surround in cinema mode."));

    UObject* GetObjectValue(UObject* Object, const TCHAR* Name)
    {
        FObjectPropertyBase* Property = Object ? FindFProperty<FObjectPropertyBase>(Object->GetClass(), Name) : nullptr;
        return Property ? Property->GetObjectPropertyValue_InContainer(Object) : nullptr;
    }

    // Calls a Blueprint event with a single bool, e.g. the character's "Set Point of View".
    void CallBoolEvent(UObject* Object, const TCHAR* Name, bool Value)
    {
        UFunction* Function = Object ? Object->FindFunction(FName(Name)) : nullptr;
        if (!Function)
        {
            return;
        }
        TArray<uint8, TAlignedHeapAllocator<16>> Params;
        Params.SetNumZeroed(FMath::Max<int32>(Function->ParmsSize, 1));
        for (TFieldIterator<FBoolProperty> It(Function); It && It->HasAnyPropertyFlags(CPF_Parm); ++It)
        {
            It->SetPropertyValue_InContainer(Params.GetData(), Value);
            break;
        }
        Object->ProcessEvent(Function, Params.GetData());
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

    // A copy of a widget and everything under it, in the same widget tree.
    UWidget* CopyWidget(UWidgetTree* Tree, const UWidget* Source, const FString& Prefix, TMap<FName, UWidget*>& OutCopies)
    {
        UWidget* Copy = Tree->ConstructWidget<UWidget>(Source->GetClass(), FName(*(Prefix + Source->GetName())));
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
                UWidget* ChildCopy = Child ? CopyWidget(Tree, Child, Prefix, OutCopies) : nullptr;
                UPanelSlot* SlotCopy = ChildCopy ? CopyPanel->AddChild(ChildCopy) : nullptr;
                if (SlotCopy && Child->Slot && Child->Slot->GetClass() == SlotCopy->GetClass())
                {
                    CopyDesignerProperties(Child->Slot, SlotCopy);
                }
            }
        }
        return Copy;
    }

    // The media player a material shows, if any.
    UMediaPlayer* GetMaterialMediaPlayer(UMaterialInterface* Material)
    {
        if (!Material)
        {
            return nullptr;
        }
        TArray<UTexture*> Textures;
        Material->GetUsedTextures(Textures, EMaterialQualityLevel::Num, true, ERHIFeatureLevel::Num, true);
        for (UTexture* Texture : Textures)
        {
            if (UMediaTexture* MediaTexture = Cast<UMediaTexture>(Texture))
            {
                if (UMediaPlayer* Player = MediaTexture->GetMediaPlayer())
                {
                    return Player;
                }
            }
        }
        return nullptr;
    }
}

using namespace ImmersiveView;

bool UImmersiveViewSubsystem::ShouldCreateSubsystem(UObject* Outer) const
{
    return !IsRunningDedicatedServer() && FApp::CanEverRender();
}

void UImmersiveViewSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
    TickHandle = FTSTicker::GetCoreTicker().AddTicker(FTickerDelegate::CreateUObject(this, &UImmersiveViewSubsystem::Tick), 0.25f);
    PostActorTickHandle = FWorldDelegates::OnWorldPostActorTick.AddUObject(this, &UImmersiveViewSubsystem::OnWorldPostActorTick);

#if !UE_BUILD_SHIPPING
    FString TestArgument;
    if (FParse::Param(FCommandLine::Get(), TEXT("ImmersiveTest2D")))
    {
        StartTest(-1);      // stand at a 2D screen instead, where the screen itself starts the video
    }
    else if (FParse::Value(FCommandLine::Get(), TEXT("ImmersiveTest="), TestArgument))
    {
        StartTest(FCString::Atoi(*TestArgument));
    }
    else if (FParse::Param(FCommandLine::Get(), TEXT("ImmersiveTest")))
    {
        StartTest(0);
    }
#endif

    UE_LOG(LogImmersiveView, Log, TEXT("Immersive Mode ready"));
}

void UImmersiveViewSubsystem::Deinitialize()
{
    Exit(TEXT("shutdown"));
    FWorldDelegates::OnWorldPostActorTick.Remove(PostActorTickHandle);
    FTSTicker::GetCoreTicker().RemoveTicker(TickHandle);
    Super::Deinitialize();
}

bool UImmersiveViewSubsystem::Tick(float DeltaTime)
{
    return true;
}

APlayerController* UImmersiveViewSubsystem::GetController(UWorld* World) const
{
    return World ? World->GetFirstPlayerController() : nullptr;
}

UUserWidget* UImmersiveViewSubsystem::GetVideoPlayerWidget(UWorld* World) const
{
    APlayerController* Controller = GetController(World);
    APawn* Pawn = Controller ? Controller->GetPawn() : nullptr;
    return Cast<UUserWidget>(GetObjectValue(Pawn, WidgetProperty));
}

void UImmersiveViewSubsystem::RefreshScreenList(UWorld* World)
{
    // Every actor that can show a video: one with a mesh whose material carries a media texture. Refreshed now and
    // then, because screens stream in and out with the level.
    const double Now = FPlatformTime::Seconds();
    if (Now < NextScreenScan && Screens.Num() > 0)
    {
        return;
    }
    NextScreenScan = Now + 3.0;
    Screens.Reset();
    for (TActorIterator<AActor> It(World); It; ++It)
    {
        TArray<UStaticMeshComponent*> Meshes;
        It->GetComponents(Meshes);
        for (UStaticMeshComponent* Mesh : Meshes)
        {
            if (Mesh && GetMaterialMediaPlayer(Mesh->GetMaterial(0)))
            {
                Screens.Add(*It);
                break;
            }
        }
    }
}

UImmersiveViewSubsystem::FActiveVideo UImmersiveViewSubsystem::FindActiveVideo(UWorld* World) const
{
    FActiveVideo Video;
    APlayerController* Controller = GetController(World);
    APawn* Pawn = Controller ? Controller->GetPawn() : nullptr;
    if (!Pawn)
    {
        return Video;
    }
    const FVector CameraLocation = Controller->PlayerCameraManager ? Controller->PlayerCameraManager->GetCameraLocation() : Pawn->GetActorLocation();
    // The screen the player opened with E, when there is one. The 2D screens play by themselves on overlap and set no
    // such reference, so the nearest playing screen is used instead.
    const AActor* Preferred = Cast<AActor>(GetObjectValue(Pawn, ScreenProperty));

    float BestDistance = TNumericLimits<float>::Max();
    for (const TWeakObjectPtr<AActor>& ScreenPtr : Screens)
    {
        AActor* ScreenActor = ScreenPtr.Get();
        if (!ScreenActor)
        {
            continue;
        }
        const float Distance = (ScreenActor->GetActorLocation() - CameraLocation).Size();
        if (ScreenActor != Preferred && (Preferred != nullptr || Distance > MaxScreenDistance))
        {
            continue;       // a chosen screen wins; otherwise only screens nearby count
        }

        // Which view is on screen is decided by which mesh is visible, so only visible meshes count. The material's
        // media texture says which player feeds that mesh, with no component names involved.
        TArray<UStaticMeshComponent*> Meshes;
        ScreenActor->GetComponents(Meshes);
        for (UStaticMeshComponent* Mesh : Meshes)
        {
            if (!Mesh || !Mesh->IsVisible())
            {
                continue;
            }
            UMediaPlayer* Player = GetMaterialMediaPlayer(Mesh->GetMaterial(0));
            if (!Player || !Player->IsPlaying())
            {
                continue;
            }
            const bool bSphere = (Mesh->GetStaticMesh() && Mesh->GetStaticMesh()->GetName().Contains(TEXT("360")))
                || Mesh->Bounds.GetBox().IsInsideOrOn(CameraLocation);
            // A 360 sphere wins over a flat overlay (e.g. the POV panel) on the same screen.
            if (Video.IsValid() && Video.Screen == ScreenActor && (Video.bSphere || !bSphere))
            {
                continue;
            }
            if (!Video.IsValid() || Video.Screen == ScreenActor || Distance < BestDistance)
            {
                Video.Screen = ScreenActor;
                Video.Mesh = Mesh;
                Video.Player = Player;
                Video.bSphere = bSphere;
                Video.Sound = nullptr;
                TArray<UMediaSoundComponent*> Sounds;
                ScreenActor->GetComponents(Sounds);
                for (UMediaSoundComponent* Sound : Sounds)
                {
                    if (Sound && Sound->GetMediaPlayer() == Player)
                    {
                        Video.Sound = Sound;
                        break;
                    }
                }
                BestDistance = Distance;
            }
        }
    }
    return Video;
}

void UImmersiveViewSubsystem::OnWorldPostActorTick(UWorld* World, ELevelTick TickType, float DeltaSeconds)
{
    if (!World || !World->IsGameWorld() || World->GetGameInstance() != GetGameInstance() || CVarEnable.GetValueOnGameThread() == 0)
    {
        return;
    }

    // The "Immersive Mode" button lives in the video player, next to "Hide POV".
    UUserWidget* Widget = GetVideoPlayerWidget(World);
    if (Widget != PlayerWidget.Get())
    {
        PlayerWidget = Widget;
        if (Widget)
        {
            AddImmersiveButton(Widget);
        }
    }

#if !UE_BUILD_SHIPPING
    if (TestStage > 0)
    {
        RunTest(World);
    }
#endif

    if (Mode == EMode::Off)
    {
        RefreshScreenList(World);
        if (CVarAutoEnter.GetValueOnGameThread() != 0)
        {
            const FActiveVideo Video = FindActiveVideo(World);
            const double Now = FPlatformTime::Seconds();
            if (!Video.IsValid() || Video.Player == DeclinedFor.Get())
            {
                PlayingSince = 0.0;
            }
            else
            {
                // A short wait, so a stream that re-opens (picking another quality) doesn't flicker the mode.
                PlayingSince = PlayingSince > 0.0 ? PlayingSince : Now;
                if (Now - PlayingSince > 0.5)
                {
                    Enter(Video);
                }
            }
        }
        return;
    }

    UpdateWhileImmersed(World, DeltaSeconds);
}

FString UImmersiveViewSubsystem::DescribeState() const
{
    UWorld* World = GetGameInstance() ? GetGameInstance()->GetWorld() : nullptr;
    const FActiveVideo Video = World ? FindActiveVideo(World) : FActiveVideo();
    return FString::Printf(TEXT("mode=%s screen=%s playing=%s mesh=%s sphere=%d buttons=%d"),
        Mode == EMode::Off ? TEXT("off") : (Mode == EMode::Sphere ? TEXT("360") : TEXT("cinema")),
        *GetNameSafe(Video.Screen), *GetNameSafe(Video.Player), *GetNameSafe(Video.Mesh), Video.bSphere ? 1 : 0, Buttons.Num());
}

#if !UE_BUILD_SHIPPING
void UImmersiveViewSubsystem::StartTest(int32 TriggerIndex)
{
    TestTrigger = TriggerIndex;
    TestStage = 1;
    TestTime = FPlatformTime::Seconds();
    UE_LOG(LogImmersiveView, Log, TEXT("IMMTEST start (trigger %d)"), TriggerIndex);
}

void UImmersiveViewSubsystem::RunTest(UWorld* World)
{
    APlayerController* Controller = GetController(World);
    APawn* Pawn = Controller ? Controller->GetPawn() : nullptr;
    if (!Pawn)
    {
        return;
    }
    const double Elapsed = FPlatformTime::Seconds() - TestTime;
    if (TestStage == 1)
    {
        // Stand in an orbit trigger; the 2D run then picks a flat video source instead of the 360 one.
        const bool b2D = TestTrigger < 0;
        bTest2D = b2D;
        TArray<AActor*> Triggers;
        for (TActorIterator<AActor> It(World); It; ++It)
        {
            const FString ClassName = It->GetClass()->GetName();
            if (ClassName.StartsWith(TEXT("BP_OrbitTrigger")))
            {
                Triggers.Add(*It);
            }
        }
        if (b2D)
        {
            TestTrigger = 0;
        }
        Triggers.Sort([](const AActor& A, const AActor& B) { return A.GetName() < B.GetName(); });
        AActor* Trigger = Triggers.IsValidIndex(TestTrigger) ? Triggers[TestTrigger] : nullptr;
        UE_LOG(LogImmersiveView, Log, TEXT("IMMTEST %d orbit triggers; using %s"), Triggers.Num(), *GetNameSafe(Trigger));
        if (!Trigger)
        {
            TestStage = 0;
            return;
        }
        Pawn->SetActorLocation(Trigger->GetActorLocation(), false, nullptr, ETeleportType::TeleportPhysics);
        TestStage = 2;
        TestTime = FPlatformTime::Seconds();
    }
    else if (TestStage == 2 && Elapsed > 1.0)
    {
        if (UFunction* Show = Pawn->FindFunction(TEXT("ShowFromActiveTrigger")))
        {
            Pawn->ProcessEvent(Show, nullptr);      // what the E key does
        }
        TestStage = 3;
        TestTime = FPlatformTime::Seconds();
    }
    else if (TestStage == 3 && Elapsed > 1.5)
    {
        // Choosing a video source is what opens the stream; Play alone does nothing until then.
        UUserWidget* Widget = GetVideoPlayerWidget(World);
        UButton* Source = nullptr;
        FString Names;
        if (Widget && Widget->WidgetTree)
        {
            Widget->WidgetTree->ForEachWidget([this, &Source, &Names](UWidget* Child)
            {
                UButton* Button = Cast<UButton>(Child);
                if (!Button)
                {
                    return;
                }
                const FString Name = Button->GetName();
                if (Name.StartsWith(TEXT("Button_VideoSource")) || Name.StartsWith(TEXT("Button_VS")))
                {
                    Names += Name + TEXT(" ");
                    const bool bFlat = Name.Contains(TEXT("2D")) || Name.Contains(TEXT("ITV"));
                    if (!Source || (bTest2D && bFlat && !Source->GetName().Contains(TEXT("2D"))))
                    {
                        Source = Button;
                    }
                }
            });
        }
        UE_LOG(LogImmersiveView, Log, TEXT("IMMTEST video player %s; sources: %s"), *GetNameSafe(Widget), Names.IsEmpty() ? TEXT("none") : *Names);
        if (Source)
        {
            Source->OnClicked.Broadcast();          // what choosing a video does
        }
        TestStage = 5;
        TestTime = FPlatformTime::Seconds();
    }
    else if (TestStage == 5 && Elapsed > 3.0)
    {
        UUserWidget* Widget = GetVideoPlayerWidget(World);
        UButton* Play = Widget && Widget->WidgetTree ? Cast<UButton>(Widget->WidgetTree->FindWidget(TEXT("Button_Play"))) : nullptr;
        UE_LOG(LogImmersiveView, Log, TEXT("IMMTEST pressing play (%s)"), *GetNameSafe(Play));
        if (Play)
        {
            Play->OnClicked.Broadcast();            // what pressing Play does
        }
        TestStage = 4;
        TestTime = FPlatformTime::Seconds();
    }
    else if (TestStage == 4 && Elapsed > 4.0)
    {
        UE_LOG(LogImmersiveView, Log, TEXT("IMMTEST state: %s"), *DescribeState());
        TestStage = 0;
    }
}
#endif

void UImmersiveViewSubsystem::Enter(const FActiveVideo& Video)
{
    UWorld* World = Video.Screen ? Video.Screen->GetWorld() : nullptr;
    APlayerController* Controller = GetController(World);
    if (!World || !Controller || Mode != EMode::Off || !Video.IsValid())
    {
        return;
    }

    UStaticMesh* SphereMesh = LoadObject<UStaticMesh>(nullptr, SphereMeshPath);
    UStaticMesh* FlatMesh = LoadObject<UStaticMesh>(nullptr, FlatMeshPath);
    UMaterialInterface* VideoMaterial = Video.Mesh->GetMaterial(0);
    if (!SphereMesh || !VideoMaterial)
    {
        UE_LOG(LogImmersiveView, Warning, TEXT("Immersive Mode: the video sphere mesh or material is missing"));
        return;
    }

    FadeCamera(World, /*bOut*/ true);
    Mode = Video.bSphere ? EMode::Sphere : EMode::Cinema;
    Screen = Video.Screen;
    RoomMesh = Video.Mesh;
    VideoSound = Video.Sound;
    VideoPlayer = Video.Player;

    const float Radius = FMath::Max(50.f, CVarDomeRadius.GetValueOnGameThread());
    const float SphereBase = FMath::Max(1.f, SphereMesh->GetBounds().SphereRadius);
    bBorrowed = CVarBorrowScreen.GetValueOnGameThread() != 0;

    if (bBorrowed)
    {
        // The room's own screen is brought around the viewer, so the picture is exactly the one on the wall, and only
        // one screen is ever drawn. Other players see it where it always was; this move is local.
        RoomTransform = Video.Mesh->GetComponentTransform();
        const float MeshBase = FMath::Max(1.f, Video.Mesh->GetStaticMesh() ? Video.Mesh->GetStaticMesh()->GetBounds().SphereRadius : 50.f);
        if (Mode == EMode::Sphere)
        {
            Video.Mesh->SetWorldScale3D(FVector(Radius / MeshBase));
        }
        else
        {
            // Square in front of the viewer, at eye level, facing them the same way it faces the room.
            const FVector CameraLocation = Controller->PlayerCameraManager->GetCameraLocation();
            const FRotator CameraRotation = Controller->PlayerCameraManager->GetCameraRotation();
            const FVector Forward = FRotator(0.f, CameraRotation.Yaw, 0.f).Vector();

            FString Around;
            const float Free = MeasureEnclosure(World, Video.Mesh, CameraLocation, Around);
            const bool bEnclosed = Free < 100000.f;
            const float WantDistance = FMath::Max(100.f, CVarCinemaDistance.GetValueOnGameThread());
            // A seat inside the room's own 360 sphere has only so much space before the picture would be out in the
            // room with a wall in front of it, so it comes closer and shrinks to match: the same size to look at.
            const float Distance = bEnclosed ? FMath::Clamp(Free * 0.6f, 60.f, WantDistance) : WantDistance;
            const float Shrink = Distance / WantDistance;

            const FVector RoomScale = RoomTransform.GetScale3D();
            const FVector Extent = Video.Mesh->GetStaticMesh() ? Video.Mesh->GetStaticMesh()->GetBounds().BoxExtent : FVector(1.f, 50.f, 25.f);
            const float AspectYZ = RoomScale.Z > KINDA_SMALL_NUMBER ? RoomScale.Y / RoomScale.Z : 1.f;
            float Height = FMath::Max(50.f, CVarCinemaSize.GetValueOnGameThread()) * Shrink;
            float Scale = Height / FMath::Max(1.f, Extent.Z * 2.f);
            float Width = Extent.Y * 2.f * Scale * AspectYZ;
            // A very wide picture is held to the width of the view instead of the height, so nothing runs off the edges.
            const float MaxWidth = Distance * 1.5f;
            if (Width > MaxWidth)
            {
                Scale *= MaxWidth / Width;
                Height *= MaxWidth / Width;
                Width = MaxWidth;
            }
            Video.Mesh->SetWorldScale3D(FVector(RoomScale.X, Scale * AspectYZ, Scale));
            if (!bEnclosed && CVarCinemaSurround.GetValueOnGameThread() != 0)
            {
                // Out in the open nothing blacks out the room, so a black sphere goes around the viewer instead.
                UMaterialInterface* Blackout = LoadObject<UMaterialInterface>(nullptr, BlackoutMaterialPath);
                Dome = SpawnPiece(World, SphereMesh, Blackout, TEXT("ImmersiveSurround"));
                if (Dome)
                {
                    Dome->SetActorLocation(CameraLocation);
                    Dome->SetActorScale3D(FVector(FMath::Max(Radius, Distance * 1.6f) / SphereBase));
                }
            }
            const FVector Place = CameraLocation + Forward * Distance
                + FVector(0.f, 0.f, CVarCinemaHeight.GetValueOnGameThread() * Shrink);
            // These picture materials are one-sided, so the side that faced the room has to face the viewer now.
            const FVector RoomFace = RoomTransform.GetUnitAxis(EAxis::X);
            const FVector RoomToViewer = (CameraLocation - RoomTransform.GetLocation()).GetSafeNormal();
            const bool bFrontIsPlusX = FVector::DotProduct(RoomFace, RoomToViewer) >= 0.f;
            const FVector DesiredFace = bFrontIsPlusX ? -Forward : Forward;
            Video.Mesh->SetWorldLocation(Place);
            Video.Mesh->SetWorldRotation(FRotator(0.f, DesiredFace.Rotation().Yaw + CVarCinemaYaw.GetValueOnGameThread(), 0.f));
            Controller->SetControlRotation(FRotator(0.f, CameraRotation.Yaw, 0.f));
            UE_LOG(LogImmersiveView, Log, TEXT("Cinema: %.0f cm ahead, %.0f x %.0f cm, facing %s; around the viewer: %s"),
                Distance, Width, Height, bFrontIsPlusX ? TEXT("+X") : TEXT("-X"), Around.IsEmpty() ? TEXT("open room") : *Around);
        }
    }
    else if (Mode == EMode::Sphere)
    {
        Dome = SpawnPiece(World, SphereMesh, VideoMaterial, TEXT("ImmersiveDome"));
        if (Dome)
        {
            Dome->SetActorScale3D(FVector(Radius / SphereBase));
            Dome->SetActorRotation(Video.Mesh->GetComponentRotation());
        }
    }
    else
    {
        UMaterialInterface* Blackout = LoadObject<UMaterialInterface>(nullptr, BlackoutMaterialPath);
        Dome = SpawnPiece(World, SphereMesh, Blackout ? Blackout : VideoMaterial, TEXT("ImmersiveSurround"));
        if (Dome)
        {
            Dome->SetActorScale3D(FVector(Radius / SphereBase));
        }
        CinemaScreen = SpawnPiece(World, FlatMesh ? FlatMesh : SphereMesh, VideoMaterial, TEXT("ImmersiveScreen"));
        if (CinemaScreen)
        {
            // Square on to the viewer, at the same shape as the screen in the room.
            const FVector RoomScale = Video.Mesh->GetComponentScale();
            const float AspectYZ = RoomScale.Z > KINDA_SMALL_NUMBER ? RoomScale.Y / RoomScale.Z : 1.f;
            const float FlatBase = FMath::Max(1.f, FlatMesh ? FlatMesh->GetBounds().BoxExtent.Z * 2.f : 100.f);
            const float Height = FMath::Max(50.f, CVarCinemaSize.GetValueOnGameThread());
            const float Scale = Height / FlatBase;
            CinemaScreen->SetActorScale3D(FVector(1.f, Scale * AspectYZ, Scale));

            const FVector CameraLocation = Controller->PlayerCameraManager->GetCameraLocation();
            const FRotator CameraRotation = Controller->PlayerCameraManager->GetCameraRotation();
            const FVector Forward = FRotator(0.f, CameraRotation.Yaw, 0.f).Vector();
            const FVector Place = CameraLocation + Forward * FMath::Max(100.f, CVarCinemaDistance.GetValueOnGameThread())
                + FVector(0.f, 0.f, CVarCinemaHeight.GetValueOnGameThread());
            CinemaScreen->SetActorLocation(Place);
            CinemaScreen->SetActorRotation(FRotator(0.f, CameraRotation.Yaw + CVarCinemaYaw.GetValueOnGameThread(), 0.f));
            Controller->SetControlRotation(FRotator(0.f, CameraRotation.Yaw, 0.f));
        }
    }

    if (!bBorrowed && CVarHideRoomScreen.GetValueOnGameThread() != 0 && RoomMesh.IsValid())
    {
        bRoomMeshWasVisible = RoomMesh->IsVisible();
        RoomMesh->SetVisibility(false);         // it is behind the copy; this keeps one sphere on screen, not two
    }

    if (APawn* Pawn = Controller->GetPawn())
    {
        CallBoolEvent(Pawn, PointOfViewEvent, true);        // first person, own body hidden
    }
    Controller->SetIgnoreMoveInput(true);
    SetVideoAudioCentred(CVarCenterAudio.GetValueOnGameThread() != 0);
    UpdateComfortFloor(World);
    UpdateButtonLabel();
    LastPlayingTime = FPlatformTime::Seconds();
    FadeCamera(World, /*bOut*/ false);

    UE_LOG(LogImmersiveView, Log, TEXT("Immersive Mode on (%s) for %s on %s"), Mode == EMode::Sphere ? TEXT("360") : TEXT("cinema"),
        *GetNameSafe(Video.Player), *GetNameSafe(Video.Screen));
}

void UImmersiveViewSubsystem::UpdateWhileImmersed(UWorld* World, float DeltaSeconds)
{
    APlayerController* Controller = GetController(World);
    APawn* Pawn = Controller ? Controller->GetPawn() : nullptr;
    if (!Controller || !Pawn || !Controller->PlayerCameraManager)
    {
        Exit(TEXT("no player"));
        return;
    }
    // The 2D screens play by themselves and set no screen reference, so the video player widget is not required; but
    // if the player has walked to another screen, this one is over.
    const AActor* Chosen = Cast<AActor>(GetObjectValue(Pawn, ScreenProperty));
    if ((Chosen && Chosen != Screen.Get()) || !Screen.IsValid())
    {
        Exit(TEXT("left the screen"));
        return;
    }
    UMediaPlayer* Player = VideoPlayer.Get();
    if (!Player || !RoomMesh.IsValid())
    {
        Exit(TEXT("video gone"));
        return;
    }
    const double Now = FPlatformTime::Seconds();
    if (Player->IsPlaying() || Player->IsPaused())
    {
        LastPlayingTime = Now;
    }
    else if (Now - LastPlayingTime > 1.5)
    {
        Exit(TEXT("video ended"));
        return;
    }

    const FVector CameraLocation = Controller->PlayerCameraManager->GetCameraLocation();
    if (bBorrowed && Mode == EMode::Sphere && RoomMesh.IsValid())
    {
        RoomMesh->SetWorldLocation(CameraLocation); // the video stays centred on the viewer; looking around is free
    }
    if (Dome)
    {
        Dome->SetActorLocation(CameraLocation);
    }
    UpdateComfortFloor(World);
    if (bSoundMoved && VideoSound.IsValid())
    {
        VideoSound->SetWorldLocation(CameraLocation);
    }
}

void UImmersiveViewSubsystem::Exit(const TCHAR* Reason)
{
    if (Mode == EMode::Off)
    {
        return;
    }
    UWorld* World = Dome ? Dome->GetWorld() : (Screen.IsValid() ? Screen->GetWorld() : nullptr);
    APlayerController* Controller = GetController(World);

    FadeCamera(World, /*bOut*/ true);
    for (TObjectPtr<AActor>* Piece : { &Dome, &CinemaScreen, &ComfortFloor })
    {
        if (*Piece)
        {
            (*Piece)->Destroy();
            *Piece = nullptr;
        }
    }
    if (RoomMesh.IsValid())
    {
        if (bBorrowed)
        {
            RoomMesh->SetWorldTransform(RoomTransform);     // back where it belongs in the room
        }
        else
        {
            RoomMesh->SetVisibility(bRoomMeshWasVisible);
        }
    }
    bBorrowed = false;
    SetVideoAudioCentred(false);
    if (Controller)
    {
        Controller->SetIgnoreMoveInput(false);
        if (APawn* Pawn = Controller->GetPawn())
        {
            CallBoolEvent(Pawn, PointOfViewEvent, false);   // back to the normal third-person view
        }
    }
    Mode = EMode::Off;
    Screen.Reset();
    RoomMesh.Reset();
    VideoSound.Reset();
    VideoPlayer.Reset();
    UpdateButtonLabel();
    FadeCamera(World, /*bOut*/ false);
    UE_LOG(LogImmersiveView, Log, TEXT("Immersive Mode off (%s)"), Reason);
}

void UImmersiveViewSubsystem::ToggleImmersive()
{
    UWorld* World = GetGameInstance() ? GetGameInstance()->GetWorld() : nullptr;
    if (!World)
    {
        return;
    }
    if (Mode != EMode::Off)
    {
        DeclinedFor = VideoPlayer;      // stay out until another video is chosen
        Exit(TEXT("button"));
        return;
    }
    const FActiveVideo Video = FindActiveVideo(World);
    if (Video.IsValid())
    {
        DeclinedFor.Reset();
        Enter(Video);
    }
    else
    {
        UE_LOG(LogImmersiveView, Log, TEXT("Immersive Mode: nothing is playing here"));
    }
}

AActor* UImmersiveViewSubsystem::SpawnPiece(UWorld* World, UStaticMesh* Mesh, UMaterialInterface* Material, const TCHAR* Name)
{
    if (!World || !Mesh)
    {
        return nullptr;
    }
    FActorSpawnParameters Params;
    Params.Name = MakeUniqueObjectName(World, AActor::StaticClass(), FName(Name));
    Params.ObjectFlags |= RF_Transient;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    AActor* Actor = World->SpawnActor<AActor>(AActor::StaticClass(), FTransform::Identity, Params);
    if (!Actor)
    {
        return nullptr;
    }
    UStaticMeshComponent* Component = NewObject<UStaticMeshComponent>(Actor);
    Component->SetMobility(EComponentMobility::Movable);
    Component->SetStaticMesh(Mesh);
    if (Material)
    {
        Component->SetMaterial(0, Material);
    }
    Component->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    Component->SetCastShadow(false);
    Component->bReceivesDecals = false;
    Component->bHiddenInSceneCapture = true;        // the screens' own previews must not show it
    Actor->SetRootComponent(Component);
    Component->RegisterComponent();
    Actor->SetActorEnableCollision(false);
    return Actor;
}

float UImmersiveViewSubsystem::MeasureEnclosure(UWorld* World, UStaticMeshComponent* Keep, const FVector& CameraLocation, FString& OutNames) const
{
    // How much room there is around the viewer inside any screen they are standing in. The seat in front of a wall
    // screen sits inside that screen's own 360 sphere, which is black while a flat video plays: the cinema surround is
    // already there, and the picture only has to be put inside it instead of out in the room, where a wall hides it.
    float Free = TNumericLimits<float>::Max();
    if (!World)
    {
        return Free;
    }
    for (const TWeakObjectPtr<AActor>& Weak : Screens)
    {
        AActor* Actor = Weak.Get();
        if (!Actor)
        {
            continue;
        }
        TArray<UStaticMeshComponent*> Meshes;
        Actor->GetComponents(Meshes);
        for (UStaticMeshComponent* Mesh : Meshes)
        {
            if (!Mesh || Mesh == Keep || !Mesh->IsVisible() || !Mesh->Bounds.GetBox().IsInside(CameraLocation))
            {
                continue;
            }
            const float Inner = Mesh->Bounds.SphereRadius - FVector::Dist(Mesh->Bounds.Origin, CameraLocation);
            if (Inner > 10.f)
            {
                Free = FMath::Min(Free, Inner);
                OutNames += FString::Printf(TEXT("%s.%s(%.0f) "), *GetNameSafe(Actor), *Mesh->GetName(), Inner);
            }
        }
    }
    return Free;
}

void UImmersiveViewSubsystem::UpdateComfortFloor(UWorld* World)
{
    APlayerController* Controller = GetController(World);
    const bool bWanted = Mode != EMode::Off && CVarComfortFloor.GetValueOnGameThread() != 0;
    if (!bWanted || !Controller || !Controller->PlayerCameraManager)
    {
        if (ComfortFloor)
        {
            ComfortFloor->Destroy();
            ComfortFloor = nullptr;
        }
        return;
    }
    if (!ComfortFloor)
    {
        UStaticMesh* Disc = LoadObject<UStaticMesh>(nullptr, DiscMeshPath);
        UMaterialInterface* FloorMaterial = LoadObject<UMaterialInterface>(nullptr, FloorMaterialPath);
        ComfortFloor = SpawnPiece(World, Disc, FloorMaterial, TEXT("ImmersiveFloor"));
        if (ComfortFloor)
        {
            if (UStaticMeshComponent* Component = Cast<UStaticMeshComponent>(ComfortFloor->GetRootComponent()))
            {
                if (UMaterialInstanceDynamic* Dynamic = Component->CreateAndSetMaterialInstanceDynamic(0))
                {
                    Dynamic->SetScalarParameterValue(TEXT("Opacity"), CVarFloorOpacity.GetValueOnGameThread());
                }
            }
        }
    }
    if (!ComfortFloor)
    {
        return;
    }
    if (UStaticMeshComponent* Component = Cast<UStaticMeshComponent>(ComfortFloor->GetRootComponent()))
    {
        if (UMaterialInstanceDynamic* Dynamic = Cast<UMaterialInstanceDynamic>(Component->GetMaterial(0)))
        {
            Dynamic->SetScalarParameterValue(TEXT("Opacity"), CVarFloorOpacity.GetValueOnGameThread());
        }
        const float Base = FMath::Max(1.f, Component->GetStaticMesh() ? Component->GetStaticMesh()->GetBounds().BoxExtent.X : 50.f);
        const float Radius = FMath::Max(50.f, CVarFloorRadius.GetValueOnGameThread());
        ComfortFloor->SetActorScale3D(FVector(Radius / Base, Radius / Base, 0.02f));
    }
    const FVector CameraLocation = Controller->PlayerCameraManager->GetCameraLocation();
    ComfortFloor->SetActorLocation(FVector(CameraLocation.X, CameraLocation.Y, CameraLocation.Z - CVarFloorDrop.GetValueOnGameThread()));
    ComfortFloor->SetActorRotation(FRotator::ZeroRotator);
}

void UImmersiveViewSubsystem::SetVideoAudioCentred(bool bCentred)
{
    UMediaSoundComponent* Sound = VideoSound.Get();
    if (!Sound)
    {
        bSoundMoved = false;
        return;
    }
    if (bCentred && !bSoundMoved)
    {
        SoundTransform = Sound->GetRelativeTransform();
        bSoundMoved = true;
    }
    else if (!bCentred && bSoundMoved)
    {
        Sound->SetRelativeTransform(SoundTransform);    // back to coming from the screen
        bSoundMoved = false;
    }
}

void UImmersiveViewSubsystem::AddImmersiveButton(UUserWidget* Widget)
{
    UWidgetTree* Tree = Widget->WidgetTree;
    if (!Tree || Tree->FindWidget(ImmersiveButtonName))
    {
        return;
    }
    // The control column is the same in all 20 video players: CanvasPanel_Menu, in a 1920x1080 layout, with
    // "Hide POV" (360 players only) in the bottom right corner at (1740, 1028), 169 x 40.
    UPanelWidget* Parent = Cast<UPanelWidget>(Tree->FindWidget(TEXT("CanvasPanel_Menu")));
    UButton* Pov = Cast<UButton>(Tree->FindWidget(PovButtonName));
    if (!Parent)
    {
        UE_LOG(LogImmersiveView, Warning, TEXT("%s: no place for the Immersive Mode button"), *Widget->GetName());
        return;
    }

    UButton* Button = nullptr;
    if (Pov)
    {
        TMap<FName, UWidget*> Copies;
        Button = Cast<UButton>(CopyWidget(Tree, Pov, TEXT("EVC_Immersive_"), Copies));
        for (const TPair<FName, UWidget*>& Entry : Copies)
        {
            if (UTextBlock* Text = Cast<UTextBlock>(Entry.Value))
            {
                Text->SetText(NSLOCTEXT("ImmersiveView", "ImmersiveButton", "Immersive Mode"));
            }
        }
    }
    else
    {
        // The 2D players have no such button; a plain one matches them, since "Hide POV" uses the stock style too.
        Button = Tree->ConstructWidget<UButton>(UButton::StaticClass(), ImmersiveButtonName);
        UTextBlock* Text = Tree->ConstructWidget<UTextBlock>(UTextBlock::StaticClass(), TEXT("EVC_ImmersiveLabel"));
        Text->SetText(NSLOCTEXT("ImmersiveView", "ImmersiveButton", "Immersive Mode"));
        if (Button)
        {
            Button->AddChild(Text);
        }
    }
    if (!Button)
    {
        return;
    }
    Button->SetVisibility(ESlateVisibility::Visible);    // "Hide POV" is authored hidden, and the copy inherits that

    // "Immersive Mode" goes where "Hide POV" is, and "Hide POV" moves up one row, because a row below it would be off
    // the bottom of the screen. The box is widened for the longer label, keeping the right edge where it was.
    const float Right = 1909.07f;
    const float Width = 310.f;      // wide enough for "Exit Immersive Mode" in the stock font
    const float Height = 40.f;
    const float Row = 45.f;
    const float Top = Pov ? 1028.f : (1028.f + 6.f);     // the 2D players' panel lacks the 360 panel's 6 px shift
    UPanelSlot* NewSlot = Parent->AddChild(Button);
    if (UCanvasPanelSlot* Canvas = Cast<UCanvasPanelSlot>(NewSlot))
    {
        Canvas->SetAnchors(FAnchors(0.f, 0.f));
        Canvas->SetAlignment(FVector2D::ZeroVector);
        Canvas->SetAutoSize(false);
        Canvas->SetOffsets(FMargin(Right - Width, Top, Width, Height));
    }
    if (Pov)
    {
        if (UCanvasPanelSlot* PovSlot = Cast<UCanvasPanelSlot>(Pov->Slot))
        {
            FMargin Offsets = PovSlot->GetOffsets();
            Offsets.Top = Top - Row;
            PovSlot->SetOffsets(Offsets);
        }
    }
    Button->OnClicked.AddDynamic(this, &UImmersiveViewSubsystem::ToggleImmersive);
    Buttons.RemoveAll([](const TWeakObjectPtr<UButton>& Existing) { return !Existing.IsValid(); });
    Buttons.Add(Button);
    UpdateButtonLabel();
    UE_LOG(LogImmersiveView, Log, TEXT("%s: Immersive Mode button added (%s)"), *Widget->GetName(),
        Pov ? TEXT("below Hide POV") : TEXT("2D player"));
}

void UImmersiveViewSubsystem::UpdateButtonLabel()
{
    const FText Label = Mode == EMode::Off
        ? NSLOCTEXT("ImmersiveView", "ImmersiveButton", "Immersive Mode")
        : NSLOCTEXT("ImmersiveView", "ImmersiveButtonExit", "Exit Immersive Mode");
    for (const TWeakObjectPtr<UButton>& Button : Buttons)
    {
        if (!Button.IsValid())
        {
            continue;
        }
        for (int32 Index = 0; Index < Button->GetChildrenCount(); ++Index)
        {
            if (UTextBlock* Text = Cast<UTextBlock>(Button->GetChildAt(Index)))
            {
                Text->SetText(Label);
            }
        }
    }
}

namespace ImmersiveView
{
    UImmersiveViewSubsystem* Get(UWorld* World)
    {
        UGameInstance* GameInstance = World ? World->GetGameInstance() : nullptr;
        return GameInstance ? GameInstance->GetSubsystem<UImmersiveViewSubsystem>() : nullptr;
    }

    FAutoConsoleCommandWithWorld GImmersiveToggle(TEXT("immersive.Toggle"), TEXT("Turn Immersive Mode on or off."),
        FConsoleCommandWithWorldDelegate::CreateLambda([](UWorld* World)
        {
            if (UImmersiveViewSubsystem* Subsystem = Get(World))
            {
                Subsystem->ToggleImmersive();
            }
        }));

    FAutoConsoleCommandWithWorld GImmersiveStatus(TEXT("immersive.Status"), TEXT("Print what Immersive Mode is doing."),
        FConsoleCommandWithWorldDelegate::CreateLambda([](UWorld* World)
        {
            if (UImmersiveViewSubsystem* Subsystem = Get(World))
            {
                UE_LOG(LogImmersiveView, Log, TEXT("IMMTEST state: %s"), *Subsystem->DescribeState());
            }
        }));

#if !UE_BUILD_SHIPPING
    FAutoConsoleCommandWithWorldAndArgs GImmersiveTest(TEXT("immersive.Test"),
        TEXT("Stand at an orbit trigger (index, default 0), open the video player and press play."),
        FConsoleCommandWithWorldAndArgsDelegate::CreateLambda([](const TArray<FString>& Args, UWorld* World)
        {
            if (UImmersiveViewSubsystem* Subsystem = Get(World))
            {
                Subsystem->StartTest(Args.Num() > 0 ? FCString::Atoi(*Args[0]) : 0);
            }
        }));
#endif
}

void UImmersiveViewSubsystem::FadeCamera(UWorld* World, bool bOut)
{
    APlayerController* Controller = GetController(World);
    APlayerCameraManager* Camera = Controller ? Controller->PlayerCameraManager : nullptr;
    const float Time = FMath::Max(0.f, CVarFadeTime.GetValueOnGameThread()) * 0.5f;
    if (!Camera || Time <= 0.f)
    {
        return;
    }
    if (bOut)
    {
        Camera->StartCameraFade(0.f, 1.f, Time, FLinearColor::Black, false, true);
    }
    else
    {
        Camera->StartCameraFade(1.f, 0.f, Time, FLinearColor::Black, false, false);
    }
}
