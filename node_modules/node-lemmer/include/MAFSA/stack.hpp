/*
 * Copyright (C) 2007, libMAFSA development team.
 *
 * This file is released under the LGPL.
 */

#ifndef __STACK_AUTOMATON_HPP__
#define __STACK_AUTOMATON_HPP__

namespace MAFSA {

template <typename _DATA>
class stack
{
	private:	
		_DATA * buffer;		
		size_t reserved;
		size_t current;
	
	public:
		stack(size_t reserve = 1024) : buffer(new _DATA[reserve]), reserved(reserve), current(-1){}
		~stack(){delete[] buffer;}
		
		void push(_DATA l)
		{
			if(current + 1 >= reserved)
			{
				_DATA * _t = new _DATA[2 * reserved];
				memcpy(_t, buffer, reserved * sizeof(_DATA));
				
				reserved *= 2;
				
				delete[] buffer;
				
				buffer = _t;
			}
			buffer[++current] = l;
		}
		
		_DATA pop()
		{
			return current >= 0 ? buffer[current--] : buffer[0];
		}			
		
		size_t size()const
		{
			return current + 1;
		}
		
		size_t capacity()const
		{
			return reserved;
		}
		
		bool empty()const
		{
			return size() == 0;
		}			
		
		void erase()
		{
			current = 0;
		}
		
		_DATA * data()
		{
			return buffer;
		}
};

typedef stack<MAFSA_letter> output_stack;

}
#endif // __STACK_AUTOMATON_HPP__

