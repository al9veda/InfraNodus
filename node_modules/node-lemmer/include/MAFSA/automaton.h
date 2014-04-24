/*
 * Copyright (C) 2007, libMAFSA Development Team
 *
 * This file is released under the LGPL
 */

#ifndef __MAFSA_AUTOMATON_H__
#define __MAFSA_AUTOMATON_H__

#include <MAFSA/mafsa_internal.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Load and attach errors */
#define MAFSA_ERROR_NOMEM		1
#define MAFSA_ERROR_CANT_OPEN_FILE	2
#define MAFSA_ERROR_CORRUPTED_FILE	3
#define MAFSA_ERROR_CORRUPTED_NODES	4
#define MAFSA_ERROR_CORRUPTED_LINKS	5

struct MAFSA_automaton_struct
{
	u_int32_t *ptr_nodes;
	u_int32_t *ptr_links;
	int shared;
};

typedef struct MAFSA_automaton_struct *MAFSA_automaton;

/* Opens binary file, load it to memory. Remember to free by calling MAFSA_automaton_close()
*/
extern MAFSA_automaton MAFSA_automaton_load_from_binary_file(const char *fname, int *error);

/* Attaches automaton nodes and links
*/
extern MAFSA_automaton MAFSA_automaton_attach(const void *ptr_nodes, const void *ptr_links, int *error);

/* Frees memory, allocated by MAFSA_automaton_load_from_binary_file, Does nothing if 
 * MAFSA_automaton was created by MAFSA_automaton_attach
*/
extern void MAFSA_automaton_close(MAFSA_automaton mautomaton);

/* Checks, whether string *l of letter is in automaton
*/
extern int MAFSA_automaton_find(MAFSA_automaton mautomaton, const MAFSA_letter *l, size_t sz);

/* Enumerates all strings, which start with l, if l or sz are 0, enumerates all strings
*/
typedef void (MAFSACALL *MAFSA_automaton_string_handler) (void *user_data, const MAFSA_letter *s, size_t sz);

extern void MAFSA_automaton_enumerate(MAFSA_automaton mautomaton,
                                        const MAFSA_letter *l,
                                        size_t sz,
					MAFSA_letter *tmp,
					size_t tmp_size,
                                        void *user_data,
					MAFSA_automaton_string_handler fetcher);

/* raw automaton workshop, advanced usage */
MAFSA_letter link_get_label(const u_int32_t data);
MAFSA_letter link_set_label(const u_int32_t data, const MAFSA_letter v);
u_int32_t link_get_link(const u_int32_t data);
u_int32_t link_set_link(const u_int32_t data, const u_int32_t l);
int link_is_terminating(const u_int32_t data);
u_int32_t link_set_terminating();
int node_is_final(const u_int32_t data);
u_int32_t node_get_children_start(const u_int32_t data);
u_int32_t node_set_children_start(const u_int32_t data, u_int32_t v);
u_int32_t node_set_final(const u_int32_t data, int v);
u_int32_t delta(const u_int32_t * links, u_int32_t state, MAFSA_letter label);

#ifdef __cplusplus
}
#endif

#endif /* __MAFSA_AUTOMATON_H__ */

