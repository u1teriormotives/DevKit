static const char alphabet[] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_";
#if defined(_POSIX_VERSION) || defined(__unix__) || defined(__APPLE__)

#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <fcntl.h>
#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

static int urandom_fd = -1;

static void urandom_close(void) {
    if (urandom_fd >= 0) {
        close(urandom_fd);
        urandom_fd = -1;
    }
}

static void urandom_open_once(void) {
    if (urandom_fd >= 0) return;

    urandom_fd = open("/dev/urandom", O_RDONLY | O_CLOEXEC);
    if (urandom_fd < 0) {
        perror("open(/dev/urandom)");
        exit(EXIT_FAILURE);
    }
    atexit(urandom_close);
}

static void read_exact(int fd, void *buf, size_t n) {
    uint8_t *p = (uint8_t *)buf;
    while (n > 0) {
        ssize_t r = read(fd, p, n);
        if (r < 0) {
            if (errno == EINTR) continue;
            perror("read(/dev/urandom)");
            exit(EXIT_FAILURE);
        }
        if (r == 0) {
            fprintf(stderr, "Unexpected EOF reading /dev/urandom\n");
            exit(EXIT_FAILURE);
        }
        p += (size_t)r;
        n -= (size_t)r;
    }
}

static uint64_t urandom_u64(void) {
    urandom_open_once();
    uint64_t x;
    read_exact(urandom_fd, &x, sizeof(x));
    return x;
}

static uint64_t uniform_u64_bounded(uint64_t bound) {
    if (bound == 0) {
        fprintf(stderr, "uniform_u64_bounded: bound must be > 0\n");
        exit(EXIT_FAILURE);
    }

    uint64_t threshold = (uint64_t)(-bound) % bound;

    for (;;) {
        uint64_t r = urandom_u64();
        if (r >= threshold) {
            return r % bound;
        }
    }
}

int64_t uniform_i64_range(int64_t min, int64_t max) {
    if (max <= min) {
        fprintf(stderr, "uniform_i64_range: require max > min\n");
        exit(EXIT_FAILURE);
    }

    uint64_t span = (uint64_t)((uint64_t)max - (uint64_t)min);

    uint64_t offset = uniform_u64_bounded(span);
    return (int64_t)((uint64_t)min + offset);
}

static void zero(void *p, size_t n) {
    volatile unsigned char *vp = (volatile unsigned char *)p;
    while (n--) *vp++ = 0;
}

static const char alphabet[] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_";

int main(void) {
    const size_t length = 128;
    char key[length + 1];

    for (size_t i = 0; i < length; i++) {
        key[i] = alphabet[(size_t)uniform_i64_range(0, 64)];
    }

    key[length] = '\0';

    printf("%s\n", key);
    zero(key, length + 1);

    return 0;
}

// i don't readily have access to a windows machine, so i cannot guarantee this will work
#elif defined(_WIN32) || defined(_WIN64)

#define WIN32_LEAN_AND_MEAN
#include <windows.h>

#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#ifndef BCRYPT_USE_SYSTEM_PREFERRED_RNG
#define BCRYPT_USE_SYSTEM_PREFERRED_RNG 0x00000002
#endif

typedef LONG NTSTATUS;
__declspec(dllimport) NTSTATUS __stdcall BCryptGenRandom(
    void *hAlgorithm,
    unsigned char *pbBuffer,
    unsigned long cbBuffer,
    unsigned long dwFlags
);

static void die_last_error(const char *what) {
    DWORD e = GetLastError();
    fprintf(stderr, "%s failed (GetLastError=%lu)\n", what, (unsigned long)e);
    exit(EXIT_FAILURE);
}

static void rng_bytes(void *buf, size_t n) {
    unsigned char *p = (unsigned char *)buf;
    while (n > 0) {
        unsigned long chunk = (n > 0xFFFFFFFFu) ? 0xFFFFFFFFu : (unsigned long)n;
        NTSTATUS st = BCryptGenRandom(NULL, p, chunk, BCRYPT_USE_SYSTEM_PREFERRED_RNG);
        if (st != 0) {
            fprintf(stderr, "BCryptGenRandom failed (NTSTATUS=0x%08lx)\n", (unsigned long)st);
            exit(EXIT_FAILURE);
        }
        p += chunk;
        n -= chunk;
    }
}

static uint64_t rng_u64(void) {
    uint64_t x;
    rng_bytes(&x, sizeof(x));
    return x;
}

static uint64_t uniform_u64_bounded(uint64_t bound) {
    if (bound == 0) {
        fprintf(stderr, "uniform_u64_bounded: bound must be > 0\n");
        exit(EXIT_FAILURE);
    }

    uint64_t threshold = (uint64_t)(-bound) % bound;

    for (;;) {
        uint64_t r = rng_u64();
        if (r >= threshold) {
            return r % bound;
        }
    }
}

int64_t uniform_i64_range(int64_t min, int64_t max) {
    if (max <= min) {
        fprintf(stderr, "uniform_i64_range: require max > min\n");
        exit(EXIT_FAILURE);
    }

    uint64_t span = (uint64_t)((uint64_t)max - (uint64_t)min);
    uint64_t offset = uniform_u64_bounded(span);
    return (int64_t)((uint64_t)min + offset);
}

static void zero(void *p, size_t n) {
    SecureZeroMemory(p, n);
}

int main(void) {
    const size_t length = 128;
    char key[128 + 1];

    for (size_t i = 0; i < length; i++) {
        key[i] = alphabet[(size_t)uniform_i64_range(0, 64)];
    }

    key[length] = '\0';

    puts(key);
    zero(key, length + 1);

    return 0;
}

#endif
