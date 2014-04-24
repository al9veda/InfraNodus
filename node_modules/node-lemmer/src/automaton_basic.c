/*
 * Copyright (C) 2007, libMAFSA Development Team
 *
 * This file is released under the LGPL
 */

#include <MAFSA/automaton.h>
#include <MAFSA/automaton_int.h>
#include <MAFSA/automaton_int_pair.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>

MAFSA_letter link_get_label(const u_int32_t data)
{
	return data >> 24;
}

MAFSA_letter link_set_label(const u_int32_t data, const MAFSA_letter v)
{
	return (0x00FFFFFF & data) | (v << 24);
}

u_int32_t link_get_link(const u_int32_t data)
{
	return data & 0x00FFFFFF;
}

u_int32_t link_set_link(const u_int32_t data, const u_int32_t l)
{
	return (0xFF000000 & data) | l;
}

int link_is_terminating(const u_int32_t data)
{
	return data == 0xFF000000;
}

u_int32_t link_set_terminating()
{
	return 0xFF000000;
}

int node_is_final(const u_int32_t data)
{
	return (data & 0x80000000);
}

u_int32_t node_get_children_start(const u_int32_t data)
{
	return data & 0x7FFFFFFF;
}

u_int32_t node_set_children_start(const u_int32_t data, u_int32_t v)
{
	return (data & 0x80000000) | v;
}

u_int32_t node_set_final(const u_int32_t data, int v)
{
	return v ? (data | 0x80000000) : (data & 0x7FFFFFFF);
}

u_int32_t delta(const u_int32_t * links, u_int32_t state, MAFSA_letter label)
{
	u_int32_t links_begin = node_get_children_start(state);

	u_int32_t t = links[links_begin];

	while (!link_is_terminating(t))
	{
		if (link_get_label(t) == label)
		{
			return link_get_link(t);
		}

		t = links[++links_begin];
	}

	return 0;
}

MAFSA_automaton MAFSA_automaton_load_from_binary_file(const char *fname, int *error)
{
	u_int32_t nodes_count;
	u_int32_t links_count;
	FILE *fp;

	MAFSA_automaton ret_data;

	if (error) *error = 0;

	fp = fopen(fname, "r");
	if (0 == fp)
	{
		if (error) *error = MAFSA_ERROR_CANT_OPEN_FILE;
		return 0;
	}	

	ret_data = (MAFSA_automaton)malloc(sizeof(struct MAFSA_automaton_struct));
	if (0 == ret_data)
	{
		if (error) *error = MAFSA_ERROR_NOMEM;
		return 0;
	}

	if ((1 != fread(&nodes_count, sizeof(u_int32_t), 1, fp)) || (1 != fread(&links_count, sizeof(u_int32_t), 1, fp)))
	{
		if (error) *error = MAFSA_ERROR_CORRUPTED_FILE;
		fclose(fp);
		free(ret_data);
		return 0;
	}

	ret_data->ptr_nodes = (u_int32_t*)malloc(nodes_count * sizeof(u_int32_t));
	if (0 == ret_data->ptr_nodes)
	{
		if (error) *error = MAFSA_ERROR_NOMEM;
		fclose(fp);
		free(ret_data);
		return 0;
	}

	if (nodes_count != fread(ret_data->ptr_nodes, sizeof(u_int32_t), nodes_count, fp))
	{
		if (error) *error = MAFSA_ERROR_CORRUPTED_NODES;
		fclose(fp);
		free(ret_data->ptr_nodes);
		free(ret_data);
		return 0;
	}

	ret_data->ptr_links = (u_int32_t*)malloc(links_count * sizeof(u_int32_t));
	if (0 == ret_data->ptr_links)
	{
		if (error) *error = MAFSA_ERROR_NOMEM;
		fclose(fp);
		free(ret_data->ptr_nodes);
		free(ret_data);
		return 0;
	}

	if (links_count != fread(ret_data->ptr_links, sizeof(u_int32_t), links_count, fp))
	{
		if (error) *error = MAFSA_ERROR_CORRUPTED_LINKS;
		fclose(fp);
		free(ret_data->ptr_nodes);
		free(ret_data->ptr_links);
		free(ret_data);
		return 0;
	}

	fclose(fp);
	ret_data->shared = 0;
	return ret_data;
}

MAFSA_automaton MAFSA_automaton_attach(const void *ptr_nodes, const void *ptr_links, int *error)
{
	MAFSA_automaton ret_data = (MAFSA_automaton)malloc(sizeof(struct MAFSA_automaton_struct));

	if (error) *error = 0;

	if (0 == ret_data)
	{
		if (error) *error = MAFSA_ERROR_NOMEM;
		return 0;
	}

	ret_data->ptr_nodes = (u_int32_t*)ptr_nodes;
	ret_data->ptr_links = (u_int32_t*)ptr_links;
	ret_data->shared = 1;

	return ret_data;
}

void MAFSA_automaton_close(MAFSA_automaton mautomaton)
{
	if (0 == mautomaton)
	{
		return;
	}

	if (!mautomaton->shared)
	{
		if(mautomaton->ptr_nodes)
		{
			free(mautomaton->ptr_nodes);
		}

		if(mautomaton->ptr_links)
		{
			free(mautomaton->ptr_links);
		}
	}
	
	free(mautomaton);
}

int MAFSA_automaton_find(MAFSA_automaton mautomaton, const MAFSA_letter *l, size_t sz)
{
	u_int32_t current = mautomaton->ptr_nodes[0];
 	u_int32_t where = 0;

	u_int32_t i = 0;

	while(i < sz)
	{
		MAFSA_letter label = l[i++];

		where = delta(mautomaton->ptr_links, current, label);
		
		if (where)
		{
			current = mautomaton->ptr_nodes[where];
		} else break;
	}
	if (i == sz && node_is_final(current))
	{
		return 1;
	}
	else
	{
		return 0;
	}
}


struct MAFSA_stack_struct
{
	MAFSA_letter *buffer;
	size_t reserved;
	ssize_t current;
};

size_t stack_size(const struct MAFSA_stack_struct* st)
{
	return st->current + 1;
}

MAFSA_letter stack_pop(struct MAFSA_stack_struct* st)
{
	if (st->current < 0) return st->buffer[0];

	return st->buffer[st->current--];
}

void stack_push(struct MAFSA_stack_struct* st, MAFSA_letter l)
{
	if (st->current + 1 < st->reserved)
	{
		st->buffer[++st->current] = l;
	}
}

void enumerate(const MAFSA_automaton mautomaton, const u_int32_t current_state, struct MAFSA_stack_struct* out_stack, MAFSA_automaton_string_handler fetcher, void * user_data)
{
	u_int32_t links_begin;
	u_int32_t child;
	u_int32_t where;

	if(node_is_final(current_state))
	{
		fetcher(user_data, out_stack->buffer, stack_size(out_stack));
	}
	links_begin = node_get_children_start(current_state);

	for (child = mautomaton->ptr_links[links_begin]; !link_is_terminating(child); child = mautomaton->ptr_links[++links_begin])
	{
		stack_push(out_stack, link_get_label(child));
		where = link_get_link(child);
		enumerate(mautomaton, mautomaton->ptr_nodes[where], out_stack, fetcher, user_data);
		stack_pop(out_stack);
	}
}

extern void MAFSA_automaton_enumerate(MAFSA_automaton mautomaton, const MAFSA_letter *l, size_t sz, MAFSA_letter *tmp, size_t tmp_size, void *user_data, MAFSA_automaton_string_handler fetcher)
{
	u_int32_t current;
	u_int32_t where = 1;
	size_t i;

	struct MAFSA_stack_struct tmp_stack;

	tmp_stack.buffer = tmp;
	tmp_stack.reserved = tmp_size;
	tmp_stack.current = -1;

	current = mautomaton->ptr_nodes[0];
	for (i = 0; i < sz; i++)
	{
		MAFSA_letter label = l[i];
		stack_push(&tmp_stack, label);

		where = delta(mautomaton->ptr_links, current, label);
		if (where)
		{
			current = mautomaton->ptr_nodes[where];
		} else break;
	}

	if (((i == sz) && where) || (0 == l))
	{
		enumerate(mautomaton, current, &tmp_stack, fetcher, user_data);
	}
}


struct str_inner_params
{
	int *data;
	size_t data_sz;	
	MAFSA_letter delim;
	int processed;
};

void MAFSACALL MAFSA_str_to_int(void *user_data, const MAFSA_letter *s, size_t sz)
{
	int i;
	int count = 0;

	struct str_inner_params *data = (struct str_inner_params*)user_data;	

	for(i = sz - 1; i >= 0; i--)
	{
		MAFSA_letter ch = s[i];
	
		count *= data->delim;
		count += ch;
	}

	if(data->processed < data->data_sz)
	{
		data->data[data->processed++] = count;
	}		
}

void MAFSACALL MAFSA_str_to_int_pair(void *user_data, const MAFSA_letter *s, size_t sz)
{
	int i;
	int valid = 0;
	struct str_inner_params * data = (struct str_inner_params*)user_data;

	int A = 0;
	int B = 0;		

	int count = 0;		

	for(i = sz - 1; i >= 0; i--)
	{
		MAFSA_letter ch = s[i];

		if(ch == data->delim)
		{
			valid = 1;
			break;
		}

		count *= data->delim;
		count += ch;			
	}
	B = count;

	count = 0;
	for(i--; i >= 0; i--)
	{
		MAFSA_letter ch = s[i];
		
		count *= data->delim;
		count += ch;			
	}
	A = count;

	if(valid && (data->processed < data->data_sz/2))
	{
		data->data[2 * data->processed + 0] = A;
		data->data[2 * data->processed + 1] = B;
		data->processed++;
	}		
}

void enumerate_ints(const MAFSA_automaton mautomaton, struct MAFSA_stack_struct * ptr_stack, const u_int32_t current_state, MAFSA_automaton_string_handler fetcher, void * user_data)
{
	u_int32_t links_begin;
	u_int32_t child;
	u_int32_t where;

	if(node_is_final(current_state))
	{
		fetcher(user_data, ptr_stack->buffer, stack_size(ptr_stack));
	}

	links_begin = node_get_children_start(current_state);

	for (child = mautomaton->ptr_links[links_begin]; !link_is_terminating(child); child = mautomaton->ptr_links[++links_begin])
	{
		stack_push(ptr_stack, link_get_label(child));
		
		where = link_get_link(child);

		enumerate_ints(mautomaton, ptr_stack, mautomaton->ptr_nodes[where], fetcher, user_data);
		
		stack_pop(ptr_stack);
	}	
}

void MAFSA_automaton_enumerate_ints(MAFSA_automaton mautomaton,
					const MAFSA_letter *l,
					size_t sz,
					MAFSA_letter *tmp,
					size_t tmp_size,
					MAFSA_letter delim,
					void *user_data,
					MAFSA_automaton_string_handler fetcher)
{
	u_int32_t current;
	u_int32_t where = 1;
	size_t i;

	struct MAFSA_stack_struct tmp_stack;

	tmp_stack.buffer = tmp;
	tmp_stack.reserved = tmp_size;
	tmp_stack.current = -1;

	current = mautomaton->ptr_nodes[0];
	for (i = 0; i < sz; i++)
	{
		MAFSA_letter label = l[i];

		where = delta(mautomaton->ptr_links, current, label);
		if (where)
		{
			current = mautomaton->ptr_nodes[where];
		} else break;
	}

	if ((i == sz) && where)
	{
		where = delta(mautomaton->ptr_links, current, delim);
		if(where)
		{
			enumerate_ints(mautomaton, &tmp_stack, mautomaton->ptr_nodes[where], fetcher, user_data);
		}
	}
}


size_t MAFSA_automaton_enumerate_int(MAFSA_automaton mautomaton, const MAFSA_letter *l, size_t sz_l, MAFSA_letter *tmp, size_t tmp_size, MAFSA_letter delim, int *out_array, size_t max_out)
{
	struct str_inner_params str;
	
	str.delim = delim;
	str.processed = 0;
	str.data = out_array;
	str.data_sz = max_out;
	
	MAFSA_automaton_enumerate_ints(mautomaton, l, sz_l, tmp, tmp_size, delim, &str, MAFSA_str_to_int);
	
	return str.processed;
}

size_t MAFSA_automaton_enumerate_int_pair(MAFSA_automaton mautomaton, const MAFSA_letter *l, size_t sz_l, MAFSA_letter *tmp, size_t tmp_size, MAFSA_letter delim, int *out_array, size_t max_out)
{
	struct str_inner_params str;
	
	str.delim = delim;
	str.processed = 0;
	str.data = out_array;
	str.data_sz = max_out;

	MAFSA_automaton_enumerate_ints(mautomaton, l, sz_l, tmp, tmp_size, delim, &str, MAFSA_str_to_int_pair);
	
	return str.processed;
}


