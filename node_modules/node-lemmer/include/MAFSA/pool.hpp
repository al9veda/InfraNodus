/*
 * Copyright (C) 2007, libMAFSA development team.
 *
 * This file is released under the LGPL.
 */

#ifndef _AUTOMATON_ALLOCATOR_HPP__
#define _AUTOMATON_ALLOCATOR_HPP__

#include <MAFSA/stack.hpp>

namespace MAFSA
{

/*
Memory allocator for fixed size structures
*/

template <typename _T, int objects_per_page = 65536>
class pool
{	 
protected:	
	struct page
	{
		_T *data;
		_T *free_node;
		page * next;

		page();
		~page();

		bool 	full()const;
		_T * 	allocate();		
		void attach(page * p);
	};
	
	stack<_T*> free_nodes;
	
	page * root;
	
	u_int16_t pages_num;
	u_int32_t objects_num;

public:
	pool();
	~pool();
	
	u_int16_t allocated_pages()const;
	u_int32_t allocated_objects()const;
	u_int32_t allocated_bytes()const;
	size_t    page_size()const;
	
	_T * allocate();
	void free(_T * elem);
};

#include "pool.tcc"
}

#endif // _AUTOMATON_ALLOCATOR_HPP__

