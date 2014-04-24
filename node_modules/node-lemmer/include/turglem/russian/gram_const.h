/*
 * Copyright (C) 2007, libturglem development team.
 *
 * This file is released under the LGPL.
*/

#ifndef __LEMMATIZER_RUSSIAN_GRAM_CONST_H__
#define __LEMMATIZER_RUSSIAN_GRAM_CONST_H__

namespace lem_russian
{

enum part_of_speech
{
	NOUN  = 0,
	ADJ_FULL = 1,
	VERB = 2,
	PRONOUN = 3,
	PRONOUN_P = 4,
	PRONOUN_PREDK = 5,
	NUMERAL = 6,
	NUMERAL_P = 7,
	ADV = 8,
	PREDK  = 9,
	PREP = 10,
	POSL = 11,
	CONJ = 12,
	INTERJ = 13,
	INP = 14,
	PHRASE = 15,
	PARTICLE = 16,
	ADJ_SHORT = 17,
	PARTICIPLE = 18,
	ADVERB_PARTICIPLE = 19,
	PARTICIPLE_SHORT = 20,
	INFINITIVE = 21
};

enum grammem
{
	Plural = 0,
	Singular = 1,

	Nominativ = 2,
	Genitiv = 3,
	Dativ = 4,
	Accusativ = 5,
	Instrumentalis = 6,
	Locativ = 7,
	Vocativ = 8,

	Masculinum = 9,
	Feminum = 10,
	Neutrum = 11,
	MascFem = 12,

	ShortForm = 13,

	PresentTense = 14,
	FutureTense = 15,
	PastTense = 16,

	FirstPerson = 17,
	SecondPerson = 18,
	ThirdPerson = 19,

	Imperative = 20,

	Animative = 21,
	NonAnimative = 22,

	Comparative = 23,

	Perfective = 24,
	NonPerfective = 25,

	NonTransitive = 26,
	Transitive = 27,

	ActiveVoice = 28,
	PassiveVoice = 29,

	Indeclinable = 30,
	Initialism = 31,

	Patronymic = 32,

	Toponym = 33,
	Organisation = 34,

	Qualitative = 35,
	DeFactoSingTantum = 36,

	Interrogative = 37,
	Demonstrative = 38,

	Name = 39,
	SurName = 40,
	Impersonal = 41,
	Slang = 42,
	Misprint = 43,
	Colloquial = 44,
	Possessive = 45,
	Archaism = 46,
	SecondCase = 47,
	Poetry = 48,
	Profession = 49,
	Superlative = 50,
	Positive = 51
};

}

#endif

