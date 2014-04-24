/*
 * Copyright (C) 2007, libMAFSA development team.
 *
 * This file is released under the LGPL.
 */

#ifndef __MAFSA_AUTOMATON_INT_PAIR_H__
#define __MAFSA_AUTOMATON_INT_PAIR_H__

#include <MAFSA/automaton.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Enumerates all pairs (int, int) for a given word (l)
*/
extern size_t MAFSA_automaton_enumerate_int_pair(MAFSA_automaton mautomaton,
						 const MAFSA_letter *l,
	  					 size_t sz_l,
						 MAFSA_letter *tmp,
						 size_t tmp_size,
						 MAFSA_letter delim,
       						 int *out_array,
	      					 size_t max_out);
#ifdef __cplusplus
}
#endif

#endif /* __MAFSA_AUTOMATON_INT_PAIR_H__ */

