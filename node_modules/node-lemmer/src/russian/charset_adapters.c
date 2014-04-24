/*
 * Copyright (C) 2007, libturglem development team.
 *
 * This file is released under the LGPL.
*/

#include <turglem/russian/charset_adapters.h>
#include <stdio.h>

ssize_t LEM_RUSSIAN_conv_string_to_letters_cp1251(const char *s, MAFSA_letter *l, size_t sz)
{
	const char *i = s;
	ssize_t pos = 0;
	while (*i && (pos < sz))
	{
		if (i[0] == '-')
		{
			l[pos] = RUSSIAN_LETTER_DIFFIS;
		}
		else
		{
			if ((unsigned char)i[0] >= 0xC0)
			{
				if ((unsigned char)i[0] >= 0xE0)
				{
					l[pos] = (unsigned char)i[0] - 0xE0;
				} else l[pos] = (unsigned char)i[0] - 0xC0;
			}
			else
			if (((unsigned char)i[0] == 0xA8) || ((unsigned char)i[0] == 0xB8))
			{
				l[pos] = 5;
			}
			else return -1;
		}
		i++;
		pos++;
	}
	return pos;
}

size_t LEM_RUSSIAN_conv_letters_to_string_cp1251(const MAFSA_letter *l, size_t sz_l, char *s, size_t sz_s)
{
	ssize_t pos = 0;
	while ((pos < sz_l) && (pos < sz_s - 1))
	{
		switch (l[pos])
		{
			case RUSSIAN_LETTER_DIFFIS:
				s[pos] = '-';
				break;
			case RUSSIAN_LETTER_DELIM:
				s[pos] = '|';
				break;
			default:
				s[pos] = 0xC0 + l[pos];
				break;
		}
		pos++;
	}
	s[pos] = 0;
	return pos;
}

ssize_t LEM_RUSSIAN_conv_string_to_letters_utf8(const char *s, MAFSA_letter *l, size_t sz)
{
	u_int32_t cur_letter;
	ssize_t pos = 0;
	const char *i = s;
	while (*i && (pos < sz))
	{
		if (i[0] == '-')
		{
			l[pos] = RUSSIAN_LETTER_DIFFIS;
			i++;
			pos++;
		}
		else
		{
			if ((i[0] & 0xe0) != 0xc0) return -1;
			if ((i[1] & 0xc0) != 0x80) return -1;

			cur_letter = ((i[0] & 0x1f) << 6) | (i[1] & 0x3f);

			if ((cur_letter >= 1040) && (cur_letter <= 1071))
			{
				l[pos] = cur_letter - 1040;
			}
			else
			if ((cur_letter >= 1072) && (cur_letter <= 1103))
			{
				l[pos] = cur_letter - 1072;
			}
			else
			if ((cur_letter == 1025) || (cur_letter == 1105))
			{
				l[pos] = 5;
			}
			else
			{
				return -1;
			}
			i += 2;
			pos++;
		}
	}
	return pos;
}

size_t LEM_RUSSIAN_conv_letters_to_string_utf8(const MAFSA_letter *l, size_t sz_l, char *s, size_t sz_s)
{
	size_t pos_w = 0;
	size_t pos_r = 0;
	u_int32_t c;

	while ((pos_w + 1 < sz_s) && (pos_r < sz_l))
	{
		if (l[pos_r] < RUSSIAN_LETTER_DIFFIS)
		{
			if (pos_w + 2 >= sz_s) break;
			c = l[pos_r] + 1040;
			s[pos_w] = (c >> 6) | 0xc0;
			s[pos_w + 1] = (c & 0x3f) | 0x80;
			pos_w += 2;
		}
		else
		{
			switch (l[pos_r])
			{
				case RUSSIAN_LETTER_DIFFIS:
					s[pos_w] = '-';
					break;
				default:
					s[pos_w] = '|';
					break;
			}
			pos_w++;
		}
		pos_r++;
	}
	s[pos_w] = 0;
	return pos_w;
}

static u_int8_t koi8r_string2letters [] = {
	30,  0,  1, 22,  4,  5, 20,  3, 21,  8,  9, 10, 11, 12, 13, 14, 
	15, 31, 16, 17, 18, 19,  6,  2, 28, 27,  7, 24, 29, 25, 23, 26
};

static u_int8_t koi8r_letters2string [] = { 
	0xE1, 0xE2, 0xF7, 0xE7, 0xE4, 0xE5, 0xF6, 0xFA, 0xE9, 0xEA, 0xEB, 0xEC, 0xED, 0xEE, 0xEF, 0xF0, 
	0xF2, 0xF3, 0xF4, 0xF5, 0xE6, 0xE8, 0xE3, 0xFE, 0xFB, 0xFD, 0xFF, 0xF9, 0xF8, 0xFC, 0xE0, 0xF1,
	0x2D, 0x7C
};

ssize_t LEM_RUSSIAN_conv_string_to_letters_koi8r(const char *s, MAFSA_letter *l, size_t sz)
{
	const char *i = s;
	ssize_t pos = 0;
	while (*i && (pos < sz))
	{
		if (i[0] == '-')
		{
			l[pos] = RUSSIAN_LETTER_DIFFIS;
		}
		else
		{
			if ((unsigned char)i[0] >= 0xC0)
			{
				if ((unsigned char)i[0] >= 0xE0)
				{
					l[pos] = koi8r_string2letters[(unsigned char)i[0] - 0xE0];
				} else l[pos] = koi8r_string2letters[(unsigned char)i[0] - 0xC0];
			}
			else
			if (((unsigned char)i[0] == 0xA3) || ((unsigned char)i[0] == 0xB3))
			{
				l[pos] = 5;
			}
			else return -1;
		}
		i++;
		pos++;
	}
	return pos;
}

size_t LEM_RUSSIAN_conv_letters_to_string_koi8r(const MAFSA_letter *l, size_t sz_l, char *s, size_t sz_s)
{
	ssize_t pos = 0;
	while ((pos < sz_l) && (pos < sz_s - 1))
	{
		s[pos] = koi8r_letters2string[l[pos]];
		pos++;
	}
	s[pos] = 0;
	return pos;
}


