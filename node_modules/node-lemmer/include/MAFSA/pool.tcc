/*
 * Copyright (C) 2007, libMAFSA development team.
 *
 * This file is released under the LGPL.
 */

template <typename _T, int objects_per_page>
inline pool<_T, objects_per_page>::page::page() : data(new _T[objects_per_page]), free_node(data), next(0)
{
	
}

template <typename _T, int objects_per_page>
inline pool<_T, objects_per_page>::page::~page()
{
	delete[] data;
	
	if(next)
	{
		delete next;
	}
}

template <typename _T, int objects_per_page>
inline bool pool<_T, objects_per_page>::page::full()const
{
	return free_node >= data + objects_per_page;
}

template <typename _T, int objects_per_page>
inline void pool<_T, objects_per_page>::page::attach(typename pool<_T, objects_per_page>::page * pg)
{
	next = pg;
}

template <typename _T, int objects_per_page>
inline _T * pool<_T, objects_per_page>::page::allocate()
{
	return full() ? 0 : free_node++;
}

template <typename _T, int objects_per_page>
inline pool<_T, objects_per_page>::pool() : free_nodes(objects_per_page), root(new page), pages_num(1), objects_num(0)
{

}

template <typename _T, int objects_per_page>
inline pool<_T, objects_per_page>::~pool()
{
	delete root;
}

template <typename _T, int objects_per_page>
inline u_int16_t pool<_T, objects_per_page>::allocated_pages()const
{
	return pages_num;
}

template <typename _T, int objects_per_page>
inline u_int32_t pool<_T, objects_per_page>::allocated_objects()const
{
	return objects_num;
}

template <typename _T, int objects_per_page>
inline u_int32_t pool<_T, objects_per_page>::allocated_bytes()const
{
	return objects_num * sizeof(_T);
}

template <typename _T, int objects_per_page>
inline size_t pool<_T, objects_per_page>::page_size()const
{
	return objects_per_page * sizeof(_T);
}

template <typename _T, int objects_per_page>
inline _T * pool<_T, objects_per_page>::allocate()
{
	_T * ret_ptr = 0;
		
	if(!free_nodes.empty())
	{
		ret_ptr = free_nodes.pop();
	}
	else
	{
		ret_ptr = root->allocate();
		
		if(0 == ret_ptr)
		{
			page * n = root;
			root = new page;
			root->attach(n);
			
			pages_num++;
			
			ret_ptr = root->allocate();
		}
	}
	
	objects_num++;
	
	return ret_ptr;
}

template <typename _T, int objects_per_page>
inline void pool<_T, objects_per_page>::free(_T * elem)
{
	free_nodes.push(elem);
	objects_num--;	
}


