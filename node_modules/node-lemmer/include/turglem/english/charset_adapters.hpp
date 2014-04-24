/*
 * Copyright (C) 2007, libturglem development team.
 *
 * This file is released under the LGPL.
*/

#ifndef __TURGLEM_ENGLISH_CPP_ADAPTERS__
#define __TURGLEM_ENGLISH_CPP_ADAPTERS__

#include <turglem/english/charset_adapters.h>

struct english_utf8_adapter
{
	static MAFSA::l_string string2letters(const char *s)
	{
		MAFSA::l_string out;
		MAFSA_letter arr[1024];
		ssize_t l = LEM_ENGLISH_conv_string_to_letters_utf8(s, arr, 1024);
		if (l > 0) out = MAFSA::l_string(arr, l);

		return out;
	}
	static std::string letters2string(const MAFSA_letter *s, size_t sz)
	{
		char arr[1024];
		LEM_ENGLISH_conv_letters_to_string_utf8(s, sz, arr, 1024);	
		return arr;
	}

	enum {max_letter = ENGLISH_LETTER_DELIM};
};

#endif // __TURGLEM_ENGLISH_CPP_ADAPTERS__

