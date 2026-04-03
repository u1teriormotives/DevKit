#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define IDLENGTH 16

static const char characters[] = "AZERTYUIOPQSDFGHJKLMWXCVBNazertyuiopqsdfghjklmwxcvbn";
static const char numbers[] = "1234567890";

int main(void) {
    srand(time(NULL)); // i'm well aware there are better alternatives to using rand() (like using my own keygen thing i made), but this will do
                       // since the internal ids don't *need* cryptographically secure randomness, so i'm using what's easiest: rand()
    int lenChars = sizeof(characters) - 1;
    int lenNums = sizeof(numbers) - 1;

    for (int i = 0; i < IDLENGTH; i++) {
        if (rand() % 3 == 0) {
            printf("%c", characters[rand() % lenChars]);
        } else {
            printf("%c", numbers[rand() % lenNums]);
        }
    }
    printf("\n");

    exit(EXIT_SUCCESS);
}
