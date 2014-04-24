/*
 * Copyright (C) 2007, libMAFSA development team.
 *
 * This file is released under the LGPL.
 *
 * Daciuk minimal automation implementation
 * Gadjikurbanov A (sspin@mail.ru), begun.ru
 *
 */

#ifndef __MAFSA_automata_daciuk_h__
#define __MAFSA_automata_daciuk_h__

#include <sys/types.h>
#include <stdio.h>
#include <set>
#include <vector>
#include <map>

#include <MAFSA/mafsa_internal.h>
#include <MAFSA/pool.hpp>

namespace MAFSA {


template<int max_letter>	
class daciuk
{
public:	
	daciuk();
	virtual ~daciuk();

	bool insert(const MAFSA_letter * s, size_t sz);

	bool load_from_file(char const * fn);
	bool save_to_file(char const * fn);

private:
	struct node
	{
		int parent_count;
		bool is_final;
	
		node * children[max_letter + 1];
		
		node();
		node(const node&);
		~node();
		
		int add_ref(int = 1);
		
		node*& get_child(int position);		
	
		bool operator<(const node&)const;
		node& operator=(const node&);
		void* operator new(size_t sz, typename MAFSA::pool<typename daciuk<max_letter>::node>& p);
		void  operator delete(void* ptr, typename MAFSA::pool<typename daciuk<max_letter>::node>& p);	
	};
		
	struct node_less : public std::less<typename daciuk<max_letter>::node*>
	{
		bool operator()(typename daciuk<max_letter>::node* const& a, typename daciuk<max_letter>::node* const& b)const
		{
			return *a < *b;
		}
	};	
	
	struct path_element
	{
		MAFSA_letter label;
		typename daciuk<max_letter>::node * node;
		path_element(): label(0), node(0){};
		path_element(int lab, typename daciuk<max_letter>::node * nd) : label(lab), node(nd) {}
	};
	
	typedef std::set<typename daciuk<max_letter>::node*, node_less> reg_type;
	typedef std::vector<path_element> word_path;	

	node * root;
	reg_type reg;
	
	word_path prefix;
	pool<node> nodes_pool;

	void delete_branch(typename daciuk<max_letter>::node*& base);
	void replace_state(typename daciuk<max_letter>::node * fr, typename daciuk<max_letter>::node * v, MAFSA_letter label, bool is_final = false, bool killed = false);
	
	int  first_state(const typename daciuk<max_letter>::word_path& path)const;
	int common_prefix(const MAFSA_letter * str, size_t sz, typename daciuk<max_letter>::word_path& path)const;
	typename daciuk<max_letter>::node* clone(typename daciuk<max_letter>::node* object);
	typename daciuk<max_letter>::node* replace_or_register(typename daciuk<max_letter>::node* current);
	void unregister(typename daciuk<max_letter>::node* current);
	typename daciuk<max_letter>::node* add_suffix(typename daciuk<max_letter>::node* base, const MAFSA_letter* str, size_t str_sz, size_t pos);
	bool is_already_there(typename daciuk<max_letter>::word_path& path)const;
};

#include <MAFSA/daciuk.tcc>

}

#endif
