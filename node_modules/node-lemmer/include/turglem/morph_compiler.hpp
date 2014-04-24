/*
 * Copyright (C) 2007, libturglem development team.
 *
 * This file is released under the LGPL.
 */

#ifndef __MORPH_COMPILER___
#define __MORPH_COMPILER___

#include <txml/txml.hpp>
#include <MAFSA/daciuk.hpp>

namespace MAFSA
{
	typedef std::basic_string<MAFSA_letter> l_string;
}

namespace turglem
{

template<typename _ABC>
class morph_compiler
{
	struct paradigms_xml_loader : public txml::determination_object
	{
		struct ROOT : public txml::determination_object
		{
			struct PARADIGM : public txml::determination_object
			{
				struct FORM : public txml::determination_object
				{
					std::string	prefix;
					std::string	suffix;
					u_int32_t	pos;
					u_int64_t	grammem;
					u_int32_t	id;
			
					void determine(txml::parser *parser)
					{
						parser->determineMember("s", suffix);
						parser->determineMember("ps", pos);
						parser->determineMember("g", grammem);
						parser->determineMember("p", prefix);
						parser->determineMember("id", id);
					}
				};
			
				std::vector<FORM> forms;
			
				void determine(txml::parser *parser)
				{
					parser->determineMember("f", forms);
				}
			};			
		
			std::vector<PARADIGM> paradigms;
		
			void determine(txml::parser *parser)
			{
				parser->determineMember("paradigm", paradigms);
			}
		};

		ROOT root;

		void determine(txml::parser *parser)
		{
			parser->determineMember("paradigms", root);
		}
		
	} paradigms_loader;
	
	struct lemmas_xml_loader : public txml::determination_object
	{
	
		struct ROOT : public txml::determination_object
		{
			struct LEMMA : public txml::determination_object
			{
				std::string	word;
				std::string	prefix;
				u_int32_t	idx;
			
				void determine(txml::parser *parser)
				{
					std::string tmp;
				
					parser->determineMember("id", word);										
					parser->determineMember("p", idx);
					parser->determineMember("prefix", prefix);					
				}
			};
			
			std::vector<LEMMA> ls;
		
			void determine(txml::parser *parser)
			{
				parser->determineMember("l", ls);
			}
		};			
	
		ROOT root;

		void determine(txml::parser *parser)
		{
			parser->determineMember("lemmas", root);
		}
		
	} lemmas_loader;

	std::map<MAFSA::l_string, std::map<std::pair<uint, uint>, uint> > prediction_data;	
	
	void process_stat_data();
	void add_stats(const MAFSA::l_string& s, uint flex, uint form, uint max_pref_suf_len);
	void save_prediction_dict(const char * predict_out);
	void save_main_dict(const char * dict_out);
	
public:	
	
	bool load_and_convert_paradigms(const char * xml_source, const char * bin_out);
	bool load_lemmas(const char * xml_source);
	
	//if predict_out == 0 then prediction dict is not generated
	bool process_and_save_dicts(const char * dict_out, const char * predict_out);
};

#include <turglem/morph_compiler.tcc>

} // namespace turglem

#endif //__MORPH_COMPILER___

