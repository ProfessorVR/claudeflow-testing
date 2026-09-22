// zone_check_cost.mm - how much does malloc_zone_from_ptr cost per call, for pointers that are NOT in any malloc
// zone (the common case in the game: every FMemory block) and for ones that are (the rare foreign frees)?
// Build: clang++ -O2 -fobjc-arc -framework Foundation zone_check_cost.mm -o zone_check_cost
#import <Foundation/Foundation.h>
#include <malloc/malloc.h>
#include <sys/mman.h>
#include <chrono>
#include <cstdio>
#include <cstdlib>

int main()
{
	@autoreleasepool { NSMutableArray* A = [NSMutableArray array]; [A addObject:@"warm"]; }
	const size_t N = 2000000;
	// Pointers the way FMemory gets them: mapped regions, no malloc zone.
	char* Region = (char*)mmap(nullptr, 64 << 20, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANON, -1, 0);
	// Pointers the way Apple's frameworks get them: malloc.
	void* Blocks[1024];
	for (int i = 0; i < 1024; ++i) Blocks[i] = malloc(16 + (i % 200) * 8);

	long Hits = 0;
	auto T0 = std::chrono::steady_clock::now();
	for (size_t i = 0; i < N; ++i) { if (malloc_zone_from_ptr(Region + (i * 64) % (64 << 20))) ++Hits; }
	auto T1 = std::chrono::steady_clock::now();
	for (size_t i = 0; i < N; ++i) { if (malloc_zone_from_ptr(Blocks[i % 1024])) ++Hits; }
	auto T2 = std::chrono::steady_clock::now();
	for (size_t i = 0; i < N; ++i) { if (malloc_size(Region + (i * 64) % (64 << 20))) ++Hits; }
	auto T3 = std::chrono::steady_clock::now();

	auto ns = [](auto A, auto B, size_t n) { return std::chrono::duration<double, std::nano>(B - A).count() / n; };
	printf("malloc_zone_from_ptr, non-zone pointer (FMemory case): %.1f ns/call\n", ns(T0, T1, N));
	printf("malloc_zone_from_ptr, malloc pointer (foreign case):   %.1f ns/call\n", ns(T1, T2, N));
	printf("malloc_size, non-zone pointer:                         %.1f ns/call\n", ns(T2, T3, N));
	printf("hits=%ld (expect %zu)\n", Hits, N);
	return 0;
}
