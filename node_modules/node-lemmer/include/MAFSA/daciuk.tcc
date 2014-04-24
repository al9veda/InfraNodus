/*
 * Copyright (C) 2007, libMAFSA development team.
 *
 * This file is released under the LGPL.
 *
 * Daciuk minimal automation implementation
 * Gadjikurbanov A (sspin@mail.ru), begun.ru
 *
 */

struct node
{
	u_int32_t data;

	u_int32_t get_children_start()
	{
		return data & 0x7FFFFFFF;
	}

	bool is_final()
	{
		return (data & 0x80000000) != 0;
	}

	void set_children_start(u_int32_t v)
	{
		data = (data & 0x80000000) | v;
	}

	void set_final(bool v)
	{
		if (v)
		{
			data |= 0x80000000;
		} else data &= 0x7FFFFFFF;
	}
	
	node():data(0){}
};


struct link
{
	u_int32_t data;

	bool is_terminating()const			
	{
		return get_label() == 0xFF;
	}
	
	void set_terminating()	
	{
		set_label(0xFF);
		set_link(0);
	}
	
	u_int32_t get_link()const
	{
		return data & 0x00FFFFFF;
	}

	MAFSA_letter get_label()const
	{
		return data >> 24;
	}

	void set_link(u_int32_t v)
	{
		data = (0xFF000000 & data) | v;
	}

	void set_label(MAFSA_letter v)
	{
		data = (0x00FFFFFF & data) | (v << 24);
	}
};

template<int max_letter>
daciuk<max_letter>::node::node() : parent_count(0), is_final(false)
{
	memset(children, 0, sizeof(node*) * (max_letter + 1));
}

template<int max_letter>
daciuk<max_letter>::node::node(const typename daciuk<max_letter>::node& v) : parent_count(0), is_final(0)
{
	memcpy(children, v.children, sizeof(node*) * (max_letter + 1));	
}

template<int max_letter>
daciuk<max_letter>::node::~node()
{
	
}

template<int max_letter>
inline int daciuk<max_letter>::node::add_ref(int count)
{
	return parent_count+=count;
}
		
template<int max_letter>
inline bool daciuk<max_letter>::node::operator<(const typename daciuk<max_letter>::node& v)const
{
	if(is_final != v.is_final) return !is_final;
	
	for(int i = 0; i < max_letter + 1; i++)
	{
		if(children[i] != v.children[i])
			return children[i] < v.children[i];		
	}
	
	return false;
}
template<int max_letter>
inline void* daciuk<max_letter>::node::operator new(size_t sz, typename MAFSA::pool<typename daciuk<max_letter>::node>& p)
{
	return p.allocate();
}

template<int max_letter>
inline void daciuk<max_letter>::node::operator delete(void* ptr, typename MAFSA::pool<typename daciuk<max_letter>::node>& p)
{
	p.free(reinterpret_cast<node*>(ptr));
}

template<int max_letter>
daciuk<max_letter>::daciuk()
{
	prefix.reserve(1024);
	//1024 should be enough for almost all words
	root = new(nodes_pool) node;	
}

template<int max_letter>
daciuk<max_letter>::~daciuk()
{
	delete_branch(root);
}

template<int max_letter>
typename daciuk<max_letter>::node*& daciuk<max_letter>::node::get_child(int position)
{
	return children[position];
}

template<int max_letter>
inline void daciuk<max_letter>::replace_state(typename daciuk<max_letter>::node * fr, typename daciuk<max_letter>::node * v, MAFSA_letter label, bool is_final, bool killed)
{
	node*& child = fr->get_child(label);
	
	if(child && v != child && !killed)
	{
		delete_branch(child);
	}

	child = v;
}

template<int max_letter>
inline void daciuk<max_letter>::delete_branch(typename daciuk<max_letter>::node*& base)
{
	if(base->add_ref(0))
	{
		base->add_ref(-1);
	}
	
	if(0 == base->add_ref(0))
	{
		for(int i = 0; i < max_letter + 1; i++)
		{
			node*& child = base->get_child(i);
					
			if(child)
			{
				delete_branch(child);				
			}
		}
		
		base->~node();
		nodes_pool.free(base);
				
		base = 0;		
	}	
}
template<int max_letter>
inline int daciuk<max_letter>::first_state(const typename daciuk<max_letter>::word_path& path)const
{
	for(unsigned int i = 0; i <  path.size(); i++)
	{
		if(path[i].node->parent_count > 1) return i;
	}
	
	return -1;
}

template<int max_letter>
inline bool daciuk<max_letter>::is_already_there(typename daciuk<max_letter>::word_path& path)const
{
	node*& last = path[path.size()-1].node;
	return last->is_final;
}

template<int max_letter>
inline int daciuk<max_letter>::common_prefix(const MAFSA_letter * word, size_t sz, typename daciuk<max_letter>::word_path& path)const
{
	typename daciuk<max_letter>::node * current = root;
	int first_conf = -1;

	path.clear();

	for(unsigned int i = 0; i < sz; i++)
	{
		MAFSA_letter position = word[i];
		
		path.push_back(path_element(position, current));		
		
		current = current->get_child(position);
		
		if(0 == current) break;		
		

		if(first_conf < 0 && current->parent_count > 1)
			first_conf = i + 1; 				
	}	
	
	if(current)
		path.push_back(path_element(-1, current));
	
	return first_conf;
}

template<int max_letter>
typename daciuk<max_letter>::node* daciuk<max_letter>::clone(typename daciuk<max_letter>::node* current)
{
	node * cloned = new(nodes_pool) node(*current);
	cloned->is_final = current->is_final;
	
	for(int i = 0; i < max_letter + 1; i++)
	{
		node * child = cloned->get_child(i);
		if(child)
			child->add_ref();
	}
	
	return cloned;
}

template<int max_letter>
typename daciuk<max_letter>::node* daciuk<max_letter>::replace_or_register(typename daciuk<max_letter>::node* current)
{
	typename reg_type::iterator it = reg.find(current);
	if(it != reg.end() && current != *it)
	{		
		delete_branch(current);
		
		current = *it;
	}	
	else
	{
		reg.insert(current);
	}	
	
	current->add_ref();
	
	return current;
}

template<int max_letter>
void daciuk<max_letter>::unregister(typename daciuk<max_letter>::node* current)
{
	reg.erase(current);
}

template<int max_letter>
typename daciuk<max_letter>::node* daciuk<max_letter>::add_suffix(typename daciuk<max_letter>::node* base, const MAFSA_letter * s, size_t sz, size_t pos)
{
	if(pos < sz)
	{
		node*& next = base->get_child(s[pos]);
		next = new(nodes_pool) node;
		
		next = replace_or_register(add_suffix(next, s, sz, pos + 1));
	}
	else
	{
		base->is_final = true;
	}				  

	return base;		   
}
		
	
template<int max_letter>
bool daciuk<max_letter>::insert(const MAFSA_letter * current_string, size_t c_str_sz)
{
	if(0 == current_string || 0 == c_str_sz)
	{
		return false;
	}
	
	word_path prefix;
		
	
	node * current_state;
	node * last_state;
	
	int initial_conf = common_prefix(current_string, c_str_sz, prefix);
	
	if(prefix.size() == c_str_sz + 1 && is_already_there(prefix))
	{
		return true;
	}
	
	int last_pos = prefix.size() - 1;

	if(initial_conf > 0)
	{
		last_state = clone(prefix[last_pos].node);
			
		if(initial_conf > 1)
		{
			unregister(prefix[initial_conf - 1].node);
		}
		
		last_state = add_suffix(last_state, current_string, c_str_sz,prefix.size() - 1);
		
		int first_conf = first_state(prefix);
		first_conf = first_conf < 0 ? initial_conf : first_conf;
			
		for(last_pos-- ; last_pos >= first_conf; last_pos--)
		{
			last_state = replace_or_register(last_state);

			current_state = clone(prefix[last_pos].node);								
			replace_state(current_state, last_state, prefix[last_pos].label, true, false);
					
			last_state = current_state;
		}	  		
		last_state = replace_or_register(last_state);
		current_state = prefix[last_pos].node;
		
		if(last_pos)
		{
			//unregister(current_state);
			current_state->add_ref(-current_state->add_ref(0));
		}

		replace_state(current_state, last_state, prefix[last_pos].label, true, false);
		last_state = current_state;		
	}
	else
	{
		current_state = last_state = prefix[last_pos].node;
		
		if(prefix.size() < c_str_sz + 1)
		{
			if(last_pos)
			{
				unregister(current_state);
				current_state->add_ref(-current_state->add_ref(0));
			}			
			
			last_state = add_suffix(current_state, current_string, c_str_sz, prefix.size() - 1);			
		}
		else
		{
			current_state = prefix[last_pos].node;
			if(last_pos)
			{
				unregister(current_state);
				current_state->add_ref(-current_state->add_ref(0));				
			}
			current_state->is_final = true;
		}
	}
	
	bool modified = true;
	while(--last_pos > 0 && modified)
	{
		last_state = current_state;
		current_state = prefix[last_pos].node;
		node * n = replace_or_register(last_state);
		modified = (n != last_state);

		if(modified)
		{
			last_state = n;
			unregister(current_state);
			current_state->add_ref(-current_state->add_ref(0));
		}
		replace_state(current_state, last_state, prefix[last_pos].label, true, modified);
	}

	if(modified && last_pos == 0)
	{
		last_state = current_state;
		current_state = prefix[last_pos].node;
		
		node * n = replace_or_register(last_state);
		modified = (n != last_state);

		replace_state(current_state, n, prefix[last_pos].label, true, modified);		
	}	
	
	return true;
}

template<int max_letter>
bool daciuk<max_letter>::load_from_file(char const * fn)
{
	u_int32_t nodes_count = 0;
	u_int32_t links_count = 0;	
	
	FILE * fp = fopen(fn, "rb");
	
	if(0 == fp)
		return false;
	
	delete_branch(root);
	reg.clear();
	
	fread(&nodes_count, sizeof(u_int32_t), 1, fp);
	fread(&links_count, sizeof(u_int32_t), 1, fp);

	std::vector<node*> states;
	states.reserve(nodes_count);
	
	std::vector<u_int32_t> raw_data;
	raw_data.resize(nodes_count + links_count);
	
	fread(&raw_data[0], sizeof(u_int32_t), nodes_count + links_count, fp);
		
	for(u_int32_t i = 0; i < nodes_count; i++)
	{
		node * current = new(nodes_pool) node;
		
		states.push_back(current);		
	}
	
	root = states[0];
	
	for(u_int32_t i = 0; i < nodes_count; i++)
	{
		MAFSA::node a_node;
		a_node.data = raw_data[i];
		
		node*& current_node = states[i];
		
		current_node->is_final = a_node.is_final();
		
		u_int32_t links_begin = a_node.get_children_start();
		
		MAFSA::link a_child;
		for(a_child.data = raw_data[links_begin + nodes_count]; false == a_child.is_terminating(); a_child.data = raw_data[++links_begin + nodes_count])
		{
			u_int32_t where = a_child.get_link();
			
			current_node->get_child(a_child.get_label()) = states[where];
			states[where]->add_ref();
		}		
	}
	
	for(u_int32_t i = 1; i < nodes_count; i++)
	{
		reg.insert(states[i]);		
	}	
	
	fclose(fp);
	
	return true;
}

template<int max_letter>
bool daciuk<max_letter>::save_to_file(char const * fn)
{
	const size_t num_states = reg.size() + 1;
	
	std::map<node*, u_int32_t> node2index;
	std::vector<u_int32_t> index;
	
	index.reserve(num_states * (max_letter + 1) + num_states + 2);	
	
	index.push_back(num_states);			//Offset 0: 4 bytes - states num
	
	int links_number_index = index.size();
	index.push_back(0); // later we will refill it	//Offset 4: 4 bytes  - links num

	int current_index = index.size();
	
	int links_begin = index.size() + num_states;
	index.resize(links_begin, 0);
	
	u_int32_t k = 0;	
	
	node2index[root] = k++;	
	
	for(typename reg_type::iterator i = reg.begin(); i != reg.end(); ++i, k++)
	{
		node2index[*i] = k;
	}
		
	MAFSA::node n;
	MAFSA::link l;
			
	n.set_children_start(index.size() - links_begin);
	n.set_final(false);
	
	index[current_index++] = n.data;
	
	for(int child_id = 0; child_id < max_letter + 1; child_id++)
	{
		node * child = root->get_child(child_id);
		if(child)
		{
			l.set_label(child_id);
			l.set_link(node2index[child]);
			
			index.push_back(l.data);
		}		
	}
	
	l.set_terminating();
	index.push_back(l.data);	
	
	for(typename reg_type::iterator i = reg.begin(); i != reg.end(); ++i, k++)
	{
		n.set_children_start(index.size() - links_begin);
		n.set_final((*i)->is_final);
	
		index[current_index++] = n.data;
		
		for(int child_id = 0; child_id < max_letter + 1; child_id++)
		{
			node * child = (*i)->get_child(child_id);
			if(child)
			{
				l.set_label(child_id);
				l.set_link(node2index[child]);
				
				index.push_back(l.data);
			}
		}
		
		l.set_terminating();
		index.push_back(l.data);
	}	
	
	index[links_number_index] = index.size() - links_begin;
	
	FILE * fp = fopen(fn, "wb");
	
	fwrite(&index[0], sizeof(u_int32_t), index.size(), fp);
	
	fclose(fp);
	
	return true;
}

