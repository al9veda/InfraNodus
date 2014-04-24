
template <typename _CHA>
size_t tl::lemmatizer::lemmatize(const char* src, tl::lem_result &lr) const
{
	// convert string to letters
	lr.src = _CHA::string2letters(src);
	if (!lr.src.empty())
	{
		int fdata[1024*2];
		size_t fcount = turglem_lemmatize(tlem, lr.src.data(), lr.src.size(), fdata, 1024, _CHA::max_letter, 1);

		lr.fi.resize(fcount);

		for (size_t i = 0; i < fcount; i++)
		{
			tl::form_info &f = lr.fi[i];
			f.paradigm = fdata[i * 2];
			f.src_form = fdata[i * 2 + 1];
		}

		return fcount;
	}
	return 0;
}

template <typename _CHA>
std::string tl::lemmatizer::get_text(const tl::lem_result &lr, u_int32_t no, u_int32_t form_id) const
{
	MAFSA_letter out_letters[1024];
	size_t sz = turglem_build_form(tlem, lr.src.data(), lr.src.size(),
		out_letters, 1024, lr.fi[no].paradigm, lr.fi[no].src_form, form_id);

	return _CHA::letters2string(out_letters, sz);
}

