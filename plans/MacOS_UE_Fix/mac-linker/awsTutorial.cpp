// Copyright Epic Games, Inc. All Rights Reserved.

#include "awsTutorial.h"
#include "Modules/ModuleManager.h"

#if PLATFORM_MAC

// macOS (build 42, 2026-09-21): the primary game module's boilerplate, with one change to the replacement
// operator delete - see plans/MacOS_UE_Fix/mac-linker/README.md.
//
// Unreal replaces the global operator new/delete (REPLACEMENT_OPERATOR_NEW_AND_DELETE in ModuleBoilerplate.h) and the
// game executable exports them, so dyld binds every framework in the process - libc++ and Apple's own - to FMemory.
// That is what keeps C++ objects consistent across the libc++ boundary (build 41 tried to hide the operators and
// crashed at the first std::string growth inside libc++.dylib). Apple's VoiceProcessingIO, though, frees blocks it
// obtained from malloc() through operator delete[] - at unit creation on macOS 26, at disposal on macOS 15 - and
// FMallocBinned2 fatals on the unrecognized block. FMemory never allocates from a malloc zone (it maps its own
// regions), so a pointer that malloc_zone_from_ptr recognizes cannot be ours: it goes back to free(). Everything
// else is the engine's macro verbatim (UE 5.4.1 ModuleManager.h IMPLEMENT_PRIMARY_GAME_MODULE, PLATFORM_DESKTOP,
// monolithic).

#include <malloc/malloc.h>

TCHAR GInternalProjectName[64] = TEXT( PREPROCESSOR_TO_STRING(UE_PROJECT_NAME) );
bool GIsGameAgnosticExe = false;
IMPLEMENT_FOREIGN_ENGINE_DIR()
IMPLEMENT_LIVE_CODING_ENGINE_DIR()
IMPLEMENT_LIVE_CODING_PROJECT()
IMPLEMENT_SIGNING_KEY_REGISTRATION()
IMPLEMENT_ENCRYPTION_KEY_REGISTRATION()
IMPLEMENT_TARGET_NAME_REGISTRATION()
IMPLEMENT_GAME_MODULE( FDefaultGameModuleImpl, awsTutorial )
UE4_VISUALIZERS_HELPERS

static FORCEINLINE void AwsTutorialFree( void* Ptr )
{
	if ( Ptr && malloc_zone_from_ptr( Ptr ) )
	{
		free( Ptr ); // a system-malloc block freed through operator delete by a framework (VoiceProcessingIO)
		return;
	}
	FMemory::Free( Ptr );
}

OPERATOR_NEW_MSVC_PRAGMA void* operator new  ( size_t Size                                                    ) OPERATOR_NEW_THROW_SPEC      { return FMemory::Malloc( Size ? Size : 1, __STDCPP_DEFAULT_NEW_ALIGNMENT__ ); }
OPERATOR_NEW_MSVC_PRAGMA void* operator new[]( size_t Size                                                    ) OPERATOR_NEW_THROW_SPEC      { return FMemory::Malloc( Size ? Size : 1, __STDCPP_DEFAULT_NEW_ALIGNMENT__ ); }
OPERATOR_NEW_MSVC_PRAGMA void* operator new  ( size_t Size,                             const std::nothrow_t& ) OPERATOR_NEW_NOTHROW_SPEC    { return FMemory::Malloc( Size ? Size : 1, __STDCPP_DEFAULT_NEW_ALIGNMENT__ ); }
OPERATOR_NEW_MSVC_PRAGMA void* operator new[]( size_t Size,                             const std::nothrow_t& ) OPERATOR_NEW_NOTHROW_SPEC    { return FMemory::Malloc( Size ? Size : 1, __STDCPP_DEFAULT_NEW_ALIGNMENT__ ); }
OPERATOR_NEW_MSVC_PRAGMA void* operator new  ( size_t Size, std::align_val_t Alignment                        ) OPERATOR_NEW_THROW_SPEC      { return FMemory::Malloc( Size ? Size : 1, (std::size_t)Alignment ); }
OPERATOR_NEW_MSVC_PRAGMA void* operator new[]( size_t Size, std::align_val_t Alignment                        ) OPERATOR_NEW_THROW_SPEC      { return FMemory::Malloc( Size ? Size : 1, (std::size_t)Alignment ); }
OPERATOR_NEW_MSVC_PRAGMA void* operator new  ( size_t Size, std::align_val_t Alignment, const std::nothrow_t& ) OPERATOR_NEW_NOTHROW_SPEC    { return FMemory::Malloc( Size ? Size : 1, (std::size_t)Alignment ); }
OPERATOR_NEW_MSVC_PRAGMA void* operator new[]( size_t Size, std::align_val_t Alignment, const std::nothrow_t& ) OPERATOR_NEW_NOTHROW_SPEC    { return FMemory::Malloc( Size ? Size : 1, (std::size_t)Alignment ); }
void operator delete  ( void* Ptr                                                                             ) OPERATOR_DELETE_THROW_SPEC   { AwsTutorialFree( Ptr ); }
void operator delete[]( void* Ptr                                                                             ) OPERATOR_DELETE_THROW_SPEC   { AwsTutorialFree( Ptr ); }
void operator delete  ( void* Ptr,                                                      const std::nothrow_t& ) OPERATOR_DELETE_NOTHROW_SPEC { AwsTutorialFree( Ptr ); }
void operator delete[]( void* Ptr,                                                      const std::nothrow_t& ) OPERATOR_DELETE_NOTHROW_SPEC { AwsTutorialFree( Ptr ); }
void operator delete  ( void* Ptr,             size_t Size                                                    ) OPERATOR_DELETE_THROW_SPEC   { AwsTutorialFree( Ptr ); }
void operator delete[]( void* Ptr,             size_t Size                                                    ) OPERATOR_DELETE_THROW_SPEC   { AwsTutorialFree( Ptr ); }
void operator delete  ( void* Ptr,             size_t Size,                             const std::nothrow_t& ) OPERATOR_DELETE_NOTHROW_SPEC { AwsTutorialFree( Ptr ); }
void operator delete[]( void* Ptr,             size_t Size,                             const std::nothrow_t& ) OPERATOR_DELETE_NOTHROW_SPEC { AwsTutorialFree( Ptr ); }
void operator delete  ( void* Ptr,                          std::align_val_t Alignment                        ) OPERATOR_DELETE_THROW_SPEC   { AwsTutorialFree( Ptr ); }
void operator delete[]( void* Ptr,                          std::align_val_t Alignment                        ) OPERATOR_DELETE_THROW_SPEC   { AwsTutorialFree( Ptr ); }
void operator delete  ( void* Ptr,                          std::align_val_t Alignment, const std::nothrow_t& ) OPERATOR_DELETE_NOTHROW_SPEC { AwsTutorialFree( Ptr ); }
void operator delete[]( void* Ptr,                          std::align_val_t Alignment, const std::nothrow_t& ) OPERATOR_DELETE_NOTHROW_SPEC { AwsTutorialFree( Ptr ); }
void operator delete  ( void* Ptr,             size_t Size, std::align_val_t Alignment                        ) OPERATOR_DELETE_THROW_SPEC   { AwsTutorialFree( Ptr ); }
void operator delete[]( void* Ptr,             size_t Size, std::align_val_t Alignment                        ) OPERATOR_DELETE_THROW_SPEC   { AwsTutorialFree( Ptr ); }
void operator delete  ( void* Ptr,             size_t Size, std::align_val_t Alignment, const std::nothrow_t& ) OPERATOR_DELETE_NOTHROW_SPEC { AwsTutorialFree( Ptr ); }
void operator delete[]( void* Ptr,             size_t Size, std::align_val_t Alignment, const std::nothrow_t& ) OPERATOR_DELETE_NOTHROW_SPEC { AwsTutorialFree( Ptr ); }
void* StdMalloc( size_t Size, size_t Alignment ) { return FMemory::Malloc( Size ? Size : 1, Alignment ); }
void* StdRealloc( void* Original, size_t Size, size_t Alignment ) { return FMemory::Realloc(Original, Size ? Size : 1, Alignment ); }
void StdFree( void *Ptr ) { AwsTutorialFree( Ptr ); }

#else

IMPLEMENT_PRIMARY_GAME_MODULE( FDefaultGameModuleImpl, awsTutorial, "awsTutorial" );

#endif
