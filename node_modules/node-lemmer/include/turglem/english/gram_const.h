#ifndef __LEMMATIZER_ENGLISH_GRAM_CONST_H__
#define __LEMMATIZER_ENGLISH_GRAM_CONST_H__

namespace lem_english
{

enum part_of_speech
{
	NOUN  = 0,
	ADJ_FULL = 1,
	VERB = 2,
	VBE = 3,
	MOD = 4,
	NUMERAL = 5,
	CONJ = 6,
	INTERJ = 7,
	PREP = 8,
	PARTICLE = 9,
	ART = 10,
	ADV = 11,
	PN = 12,
	ORDNUM = 13,
	PRON = 14,
	POSS = 15,
	PN_ADJ = 16
};

enum grammem
{
	Plural = 0,
	Singular = 1,

	Masculinum = 2,
	Feminum = 3,
	Animative = 4,
	Perfective = 5,
	Nominative = 6,
	ObjectCase = 7,
	Narrative = 8,
	Geographics = 9,
	Proper = 10,
	PersonalPronoun = 11,
	Possessive = 12,
	Predicative = 13,
	Uncountable = 14,
	ReflexivePronoun = 15,
	DemonstrativePronoun = 16,
	Mass = 17,
	Comparativ  = 18,
	Supremum = 19,
	FirstPerson = 20,
	SecondPerson = 21,
	ThirdPerson = 22,
	PresentIndef = 23,
	Infinitive = 24,
	PastIndef = 25,
	PastParticiple = 26,
	Gerund = 27,
	Futurum = 28,
	Conditional = 29,

	ApostropheS = 30,
	Apostrophe = 31,
	Names = 32,
	Organisation = 33
};




}

#endif

