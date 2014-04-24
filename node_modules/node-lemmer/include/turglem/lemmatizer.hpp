#ifndef __TURGLEM_LEMMATIZER_HPP__
#define __TURGLEM_LEMMATIZER_HPP__

#include <turglem/lemmatizer.h>
#include <MAFSA/mafsa_internal.h>
#include <string>
#include <vector>
#include <stdio.h>
#include <errno.h>
#include <stdexcept>
#include <cstring>
//#include <txml/txml.hpp>

namespace MAFSA {

typedef std::basic_string<MAFSA_letter> l_string;

}

namespace tl {

struct form_info
{
	u_int32_t paradigm;
	u_int32_t src_form;
};

struct lem_result
{
	MAFSA::l_string src;
	std::vector<form_info> fi;
};

class lemmatizer
{
	turglem tlem;

public:
	explicit lemmatizer() : tlem(0) {};
	virtual ~lemmatizer() throw()
	{
		if (tlem) turglem_close(tlem);
	}

	void load_lemmatizer(const char *fn_dic, const char *fn_paradigms, const char *fn_predict)
	{
		int err_no;
		int err_what;
		tlem = turglem_load(fn_dic, fn_predict, fn_paradigms, &err_no, &err_what);
		if (tlem == 0)
		{
			char errbuf[1024];
			snprintf(errbuf, 1024, "Error loading lemmatizer: (%d/%d): error loading %s: %s: %s",
			    err_no, err_what,
			    turglem_error_what_string(err_what),
                            turglem_error_no_string(err_no),
                            strerror(errno)
			);
			throw std::logic_error(errbuf);
		}
	}

	template <typename _CHA>
	size_t lemmatize(const char* src, lem_result &lr) const;

	template <typename _CHA>
	std::string get_text(const lem_result &lr, u_int32_t no, u_int32_t form_id) const;

	u_int8_t get_part_of_speech(const lem_result &lr, u_int32_t no, u_int32_t form_id = 0) const
	{
		return turglem_paradigms_get_part_of_speech(tlem->paradigms, lr.fi[no].paradigm, form_id);
	}

	u_int32_t get_paradigm(const lem_result &lr, size_t no) const
	{
		return lr.fi[no].paradigm;
	}

	u_int32_t get_src_form(const lem_result &lr, size_t no) const
	{
		return lr.fi[no].src_form;
	}

	size_t get_form_count(const lem_result &lr, size_t no) const
	{
		return turglem_paradigms_get_form_count(tlem->paradigms, lr.fi[no].paradigm);
	}

	u_int64_t get_grammem(const lem_result &lr, u_int32_t no, u_int32_t form_id) const
	{
		return turglem_paradigms_get_grammem(tlem->paradigms, lr.fi[no].paradigm, form_id);
	}
};


} // namespace tl

#include "lemmatizer.tcc"

#endif // __TURGLEM_LEMMATIZER_HPP__

