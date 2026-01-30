#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static const char alphabet[] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_";

static uint32_t randomint(uint32_t min, uint32_t max) {
    if (min >= max) {
        __builtin_trap();
    }

    uint32_t span = max - min;
    return min + arc4random_uniform(span);
}

static void zero(void *p, size_t n) {
    volatile unsigned char *vp = (volatile unsigned char *)p;
    while (n--) *vp++ = 0;
}

int main(void) {
    size_t length = 100;

    char key[length + 1];
    for (size_t i = 0; i < length; i++) {
        key[i] = alphabet[randomint(0, 64)];
    }
    key[length] = '\0';

    printf("%s\n", key);
    zero(key, length + 1);

    return 0;
}
