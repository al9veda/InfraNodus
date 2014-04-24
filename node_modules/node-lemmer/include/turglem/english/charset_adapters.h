/*
 * Copyright (C) 2007, libturglem development team.
 *
 * This file is released under the LGPL.
*/

#ifndef __LEMMATIZER_ENGLISH_CHARSET_ADAPTERS_H__
#define __LEMMATIZER_ENGLISH_CHARSET_ADAPTERS_H__

#include <MAFSA/charset_adapter.h>

/*
 * Letters: 0 = 'A', 25 = 'Z'.
 * 26 -- '-' (diffis)
 * 27 -- '\'' (
 * 28 == '|' (automaton delimiter)
 */

#define ENGLISH_LETTER_A		0
#define ENGLISH_LETTER_Z		25
#define ENGLISH_LETTER_DIFFIS		26
#define ENGLISH_LETTER_APOSTROPHE	27
#define ENGLISH_LETTER_DELIM		28

#ifdef __cplusplus
extern "C" {
#endif

ssize_t LEM_ENGLISH_conv_string_to_letters_utf8(const char *s, MAFSA_letter *l, size_t sz);
size_t LEM_ENGLISH_conv_letters_to_string_utf8(const MAFSA_letter *l, size_t sz_l, char *s, size_t sz_s);

#ifdef __cplusplus
}
#endif

#endif /* __LEMMATIZER_ENGLISH_CHARSET_ADAPTERS_H__ */

