/*
 * Copyright (C) 2007, libturglem development team.
 *
 * This file is released under the LGPL.
*/

#ifndef __TURGLEM_RUSSIAN_CPP_ADAPTERS__
#define __TURGLEM_RUSSIAN_CPP_ADAPTERS__

#include <turglem/russian/charset_adapters.h>

struct russian_utf8_adapter
{
	static MAFSA::l_string string2letters(const char *s)
	{
		MAFSA::l_string out;
		MAFSA_letter arr[1024];
		ssize_t l = LEM_RUSSIAN_conv_string_to_letters_utf8(s, arr, 1024);
		if (l > 0) out = MAFSA::l_string(arr, l);

		return out;
	}
	static std::string letters2string(const MAFSA_letter *s, size_t sz)
	{
		char arr[1024];
		LEM_RUSSIAN_conv_letters_to_string_utf8(s, sz, arr, 1024);	

		return arr;
	}

	enum {max_letter = RUSSIAN_LETTER_DELIM};
};

struct russian_cp1251_adapter
{
	static MAFSA::l_string string2letters(const char *s)
	{
		MAFSA::l_string out;
		MAFSA_letter arr[1024];
		ssize_t l = LEM_RUSSIAN_conv_string_to_letters_cp1251(s, arr, 1024);
		if (l > 0) out = MAFSA::l_string(arr, l);

		return out;
	}
	static std::string letters2string(const MAFSA_letter *s, size_t sz)
	{
		char arr[1024];
		LEM_RUSSIAN_conv_letters_to_string_cp1251(s, sz, arr, 1024);	
		return arr;
	}

	enum {max_letter = RUSSIAN_LETTER_DELIM};
};

struct russian_koi8r_adapter
{
	static MAFSA::l_string string2letters(const char *s)
	{
		MAFSA::l_string out;
		MAFSA_letter arr[1024];
		ssize_t l = LEM_RUSSIAN_conv_string_to_letters_koi8r(s, arr, 1024);
		if (l > 0) out = MAFSA::l_string(arr, l);

		return out;
	}
	static std::string letters2string(const MAFSA_letter *s, size_t sz)
	{
		char arr[1024];
		LEM_RUSSIAN_conv_letters_to_string_koi8r(s, sz, arr, 1024);
		return arr;
	}

	enum {max_letter = RUSSIAN_LETTER_DELIM};
};

#endif // __TURGLEM_RUSSIAN_CPP_ADAPTERS__

