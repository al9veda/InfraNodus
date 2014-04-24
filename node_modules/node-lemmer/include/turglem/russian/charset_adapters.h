/*
 * Copyright (C) 2007, libturglem development team.
 *
 * This file is released under the LGPL.
*/

#ifndef __LEMMATIZER_RUSSIAN_CHARSET_ADAPTERS_H__
#define __LEMMATIZER_RUSSIAN_CHARSET_ADAPTERS_H__

#include <MAFSA/charset_adapter.h>

/*
 * Letters: 0 = 'russian A', 31 = 'russian YA', no YO.
 * 32 -- '-' (diffis)
 * 33 == '|' (automaton delimiter)
 */

#define RUSSIAN_LETTER_A	0
#define RUSSIAN_LETTER_YA	31
#define RUSSIAN_LETTER_DIFFIS	32
#define RUSSIAN_LETTER_DELIM	33

#ifdef __cplusplus
extern "C" {
#endif


ssize_t LEM_RUSSIAN_conv_string_to_letters_utf8(const char *s, MAFSA_letter *l, size_t sz);
size_t LEM_RUSSIAN_conv_letters_to_string_utf8(const MAFSA_letter *l, size_t sz_l, char *s, size_t sz_s);

ssize_t LEM_RUSSIAN_conv_string_to_letters_cp1251(const char *s, MAFSA_letter *l, size_t sz);
size_t LEM_RUSSIAN_conv_letters_to_string_cp1251(const MAFSA_letter *l, size_t sz_l, char *s, size_t sz_s);

ssize_t LEM_RUSSIAN_conv_string_to_letters_koi8r(const char *s, MAFSA_letter *l, size_t sz);
size_t LEM_RUSSIAN_conv_letters_to_string_koi8r(const MAFSA_letter *l, size_t sz_l, char *s, size_t sz_s);

ssize_t LEM_RUSSIAN_conv_string_to_letters_translit_1(const char *s, MAFSA_letter *l, size_t sz);
size_t LEM_RUSSIAN_conv_letters_to_string_translit_1(const MAFSA_letter *l, size_t sz_l, char *s, size_t sz_s);

ssize_t LEM_RUSSIAN_conv_string_to_letters_translit_2(const char *s, MAFSA_letter *l, size_t sz);
size_t LEM_RUSSIAN_conv_letters_to_string_translit_2(const MAFSA_letter *l, size_t sz_l, char *s, size_t sz_s);

#ifdef __cplusplus
}
#endif

#endif

