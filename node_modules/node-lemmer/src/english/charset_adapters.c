/*
 * Copyright (C) 2007, libturglem development team.
 *
 * This file is released under the LGPL.
*/

#include <turglem/english/charset_adapters.h>
#include <stdio.h>

ssize_t LEM_ENGLISH_conv_string_to_letters_utf8(const char *s, MAFSA_letter *l, size_t sz)
{
	const char *i = s;
	ssize_t pos = 0;
	while (*i && (pos < sz))
	{
		if (i[0] == '\'')
		{
			l[pos] = ENGLISH_LETTER_APOSTROPHE;
		}
		else
		if (i[0] == '-')
		{
			l[pos] = ENGLISH_LETTER_DIFFIS;
		}
		else
		{
			if (((unsigned char)i[0] >= 'A') && ((unsigned char)i[0] <= 'Z'))
			{
				l[pos] = (unsigned char)i[0] - 'A';
			}
			else
			if (((unsigned char)i[0] >= 'a') && ((unsigned char)i[0] <= 'z'))
			{
				l[pos] = (unsigned char)i[0] - 'a';
			}
			else return -1;
		}
		i++;
		pos++;
	}
	return pos;
}

size_t LEM_ENGLISH_conv_letters_to_string_utf8(const MAFSA_letter *l, size_t sz_l, char *s, size_t sz_s)
{
	ssize_t pos = 0;
	while ((pos < sz_l) && (pos < sz_s - 1))
	{
		switch (l[pos])
		{
			case ENGLISH_LETTER_DIFFIS:
				s[pos] = '-';
				break;
			case ENGLISH_LETTER_APOSTROPHE:
				s[pos] = '\'';
				break;
			case ENGLISH_LETTER_DELIM:
				s[pos] = '|';
				break;
			default:
				s[pos] = 'A' + l[pos];
				break;
		}
		pos++;
	}
	s[pos] = 0;
	return pos;
}

