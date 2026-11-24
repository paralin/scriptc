/* The malloc family of wasm32-wasi executables.
 *
 * Every runtime object, string and buffer of a wasm program comes from
 * malloc (SCR_SMALL_ALLOC is 0 on wasm), and a wasm memory never shrinks, so
 * the allocator's fragmentation is the program's peak memory. zig's libc
 * supplies malloc as weak symbols, and which allocator they are depends on
 * the zig that links the program: 0.15 links wasi-libc's emmalloc, which
 * coalesces free neighbors, while 0.17 wraps a power-of-two size class
 * allocator (std.heap.BrkAllocator) that puts a 16-byte header in front of
 * every block and never reuses a freed block for another class. The same
 * program took 1.6 times as much memory when linked by 0.17.
 *
 * These definitions replace the weak ones with dlmalloc 2.8.6 as wasi-libc
 * configures it (vendor/dlmalloc, wasi-libc's dlmalloc/src/dlmalloc.c): best
 * fit with coalescing, 8 bytes of overhead per block, memory taken with sbrk
 * and never returned, which matches a memory that cannot shrink. Every
 * dlmalloc function is static, so only the names below are exported and the
 * compiler never sees dlmalloc's own reads of block headers as accesses
 * outside a "malloc" result. They stay out of the bitcode programs import
 * (noinline), as scr_musl.c's do. The memory a program needs is then a
 * property of scriptc, not of the host that linked it. */
#include <errno.h>
#include <stddef.h>
#include <stdint.h>
#include <unistd.h>

#define HAVE_MMAP 0
#define MORECORE_CANNOT_TRIM 1
#define ABORT __builtin_unreachable()
#define LACKS_TIME_H 1
#define NO_MALLINFO 1
#define NO_MALLOC_STATS 1
#define MALLOC_ALIGNMENT 16
/* WebAssembly's page; sysconf is not needed for it. */
#define malloc_getpagesize ((size_t)65536)
#define USE_DL_PREFIX 1
#define DLMALLOC_EXPORT static inline
static size_t dlmalloc_usable_size(void *);
#include "../vendor/dlmalloc/malloc.c"

#define SCR_WASM_ALLOC __attribute__((no_builtin, noinline))
SCR_WASM_ALLOC void *malloc(size_t n) { return dlmalloc(n); }
SCR_WASM_ALLOC void free(void *p) { dlfree(p); }
SCR_WASM_ALLOC void *calloc(size_t m, size_t n) { return dlcalloc(m, n); }
SCR_WASM_ALLOC void *realloc(void *p, size_t n) { return dlrealloc(p, n); }
SCR_WASM_ALLOC void *reallocarray(void *p, size_t m, size_t n) {
  size_t bytes;
  if (__builtin_mul_overflow(m, n, &bytes)) {
    errno = ENOMEM;
    return NULL;
  }
  return dlrealloc(p, bytes);
}
SCR_WASM_ALLOC int posix_memalign(void **out, size_t align, size_t n) {
  return dlposix_memalign(out, align, n);
}
SCR_WASM_ALLOC void *aligned_alloc(size_t align, size_t n) { return dlmemalign(align, n); }
SCR_WASM_ALLOC void *memalign(size_t align, size_t n) { return dlmemalign(align, n); }
SCR_WASM_ALLOC void *valloc(size_t n) { return dlmemalign(malloc_getpagesize, n); }
SCR_WASM_ALLOC size_t malloc_usable_size(void *p) { return dlmalloc_usable_size(p); }
/* musl's internal names for the family, which wasi-libc's string and stdio
 * code calls. */
void *__libc_malloc(size_t) __attribute__((alias("malloc")));
void __libc_free(void *) __attribute__((alias("free")));
void *__libc_calloc(size_t, size_t) __attribute__((alias("calloc")));
