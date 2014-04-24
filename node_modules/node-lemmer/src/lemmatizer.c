/*
 * Copyright (C) 2007, libturglem development team.
 *
 * This file is released under the LGPL.
*/

#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>

#include <turglem/lemmatizer.h>

const char *turglem_error_no_string(int err_no)
{
	switch (err_no)
	{
		case MAFSA_ERROR_NOMEM:
			return "SYS_NO_MEMORY";
		case MAFSA_ERROR_CANT_OPEN_FILE:
			return "can't open file";
		case MAFSA_ERROR_CORRUPTED_FILE:
		case MAFSA_ERROR_CORRUPTED_NODES:
		case MAFSA_ERROR_CORRUPTED_LINKS:
			return "corrupted file";
	}
	return "unknown";
}

const char *turglem_error_what_string(int err_what)
{
	switch (err_what)
	{
		case TURGLEM_ERROR_NOMEM:
			return "SYS_NO_MEMORY";
		case TURGLEM_ERROR_DICTIONARY:
			return "dictionary";
		case TURGLEM_ERROR_PARADIGMS:
			return "paradigms";
		case TURGLEM_ERROR_PREDICTION:
			return "prediction";
	}
	return "unknown";
}

/* Loads all lemmatizer data from files: main automaton, prediction automaton, flexias.
 * prediction may be 0, if you are not going to use prediction at all.
*/
turglem turglem_load(const char *fname_dic_autom, const char *fname_predict_autom, const char *fname_paradigms, int *err_no, int *err_what)
{
	turglem lem;

	if (err_no) *err_no = 0;
	if (err_what) *err_what = 0;	

	lem = (turglem)malloc(sizeof(struct turglem_struct));
	if (0 == lem)
	{
		if (err_what) *err_what = TURGLEM_ERROR_NOMEM;
		return 0;
	}

	if (err_what) *err_what = TURGLEM_ERROR_DICTIONARY;
	lem->words = MAFSA_automaton_load_from_binary_file(fname_dic_autom, err_no);
	if (0 == lem->words)
	{
		free(lem);
		return 0;
	}

	if (err_what) *err_what = TURGLEM_ERROR_PREDICTION;
	lem->prediction = MAFSA_automaton_load_from_binary_file(fname_predict_autom, err_no);
	if (0 == lem->prediction)
	{
		MAFSA_automaton_close(lem->words);
		free(lem);
		return 0;
	}

	if (err_what) *err_what = TURGLEM_ERROR_PARADIGMS;
	lem->paradigms = turglem_paradigms_load_from_binary_file(fname_paradigms, err_no);
	if (0 == lem->paradigms)
	{
		MAFSA_automaton_close(lem->words);
		MAFSA_automaton_close(lem->prediction);
		free(lem);
		return 0;
	}

	if (err_what) *err_what = 0;

	return lem;
}

/* Attaches lemmatizer data from pointers. Safe to do turglem_close() after this.
*/
turglem turglem_attach(const void *ptr_dic_autom_nodes, const void *ptr_dic_autom_links, const void *ptr_predict_autom_nodes, const void *ptr_predict_autom_links, const void *ptr_paradigms)
{
	turglem lem = (turglem)malloc(sizeof(struct turglem_struct));
	if (0 == lem) return 0;

	lem->words = MAFSA_automaton_attach(ptr_dic_autom_nodes, ptr_dic_autom_links, 0);
	if (0 == lem->words)
	{
		free(lem);
		return 0;
	}

	lem->prediction = MAFSA_automaton_attach(ptr_predict_autom_nodes, ptr_predict_autom_links, 0);
	if (0 == lem->prediction)
	{
		MAFSA_automaton_close(lem->words);
		free(lem);
		return 0;
	}

	lem->paradigms = turglem_paradigms_attach(ptr_paradigms, 0);
	if (0 == lem->paradigms)
	{
		MAFSA_automaton_close(lem->words);
		MAFSA_automaton_close(lem->prediction);
		free(lem);
		return 0;
	}

	return lem;
}

void turglem_close(turglem lem)
{
	MAFSA_automaton_close(lem->words);
	MAFSA_automaton_close(lem->prediction);
	turglem_paradigms_close(lem->paradigms);
	free(lem);
}

/* Lemmitizes string of letters, fills array of pairs (flexia_number, form_number)
 * and returns the number of such pairs.
*/
size_t turglem_lemmatize(turglem lem, const MAFSA_letter *l, size_t sz_l, int *out_pair_array, size_t sz_array, MAFSA_letter delim, int use_prediction)
{	
	int found = 0;
	int i;
	MAFSA_letter tmp[64];
	size_t tmp_sz = 64;

	size_t ret = MAFSA_automaton_enumerate_int_pair(lem->words, l, sz_l, tmp, tmp_sz, delim, out_pair_array, sz_array);
	
	if (0 == ret && use_prediction)
	{		
		for (i = sz_l - 2; i >= 3; i--)
		{
			size_t re = MAFSA_automaton_enumerate_int_pair(lem->words, l + sz_l - i - 1, i + 1, tmp, tmp_sz, delim, out_pair_array, sz_array);

			if(re)
			{
				found = 1;
				ret = re;
				
				break;
			}
		}
		if(!found)
		{
			ret = turglem_prediction_predict(lem->prediction, l, sz_l, delim, out_pair_array, sz_array);
		}
	}

	return ret;
}

/* Builds form number n_form. s_in/sz_s_in -- source string, for which was called turglem_lemmatize,
 * s_out/sz_s_out -- output buffer (RETURNS the number of letters used from buffer.
 * s_flexia + s_form -- flexia and form pair returned by turglem_lemmatize,
 * n_form -- form to build
*/
extern size_t turglem_build_form(turglem lem, const MAFSA_letter *s_in, size_t sz_s_in, MAFSA_letter *s_out, size_t sz_s_out, int src_paradigm, int src_form, int n_form)
{
	MAFSA_letter*	old_prefix;
	size_t 		old_prefix_sz;
	MAFSA_letter*	old_suffix;
	size_t 		old_suffix_sz;

	MAFSA_letter*	new_prefix;
	size_t 		new_prefix_sz;
	MAFSA_letter*	new_suffix;
	size_t 		new_suffix_sz;

	ssize_t new_s_sz;
	MAFSA_letter *out;

	turglem_paradigms_get_form_data(lem->paradigms, src_paradigm, src_form, &old_prefix, &old_prefix_sz, &old_suffix, &old_suffix_sz);
	turglem_paradigms_get_form_data(lem->paradigms, src_paradigm, n_form, &new_prefix, &new_prefix_sz, &new_suffix, &new_suffix_sz);

	new_s_sz = sz_s_in - old_prefix_sz - old_suffix_sz + new_prefix_sz + new_suffix_sz;
	if(new_s_sz > sz_s_out)
	{
		return 0;
	}

	out = s_out;

	memcpy(out, new_prefix, new_prefix_sz * sizeof(u_int8_t));
	out += new_prefix_sz;

	if (((ssize_t)sz_s_in - (ssize_t)old_prefix_sz - (ssize_t)old_suffix_sz) < 0)
	{
		return 0;
	}

	memcpy(out, s_in + old_prefix_sz, (sz_s_in - old_prefix_sz - old_suffix_sz) * sizeof(u_int8_t));
	out += sz_s_in - old_prefix_sz - old_suffix_sz;

	memcpy(out, new_suffix, new_suffix_sz * sizeof(u_int8_t));
	out += new_suffix_sz;

	return out - s_out;
}

