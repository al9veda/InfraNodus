/*
 * Copyright (C) 2007, libturglem development team.
 *
 * This file is released under the LGPL.
*/

#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>

#include <turglem/paradigms.h>

/* Opens binary file, load it to memory. Remember to free by calling turglem_paradigms_close().
*/
turglem_paradigms turglem_paradigms_load_from_binary_file(const char *fname, int *error)
{
	size_t sz;
	size_t i;
	turglem_paradigms prdms;

	FILE *fp = fopen(fname, "rb");
	if(0 == fp)
	{
		if (error) *error = PARADIGMS_ERROR_CANT_OPEN_FILE;
		return 0;
	}

	fseek(fp, 0, SEEK_END);
	sz = ftell(fp);
	fseek(fp, 0, SEEK_SET);

	prdms = (turglem_paradigms)malloc(sizeof(struct turglem_paradigms_struct));
	if(0 == prdms)
	{
		if (error) *error = PARADIGMS_ERROR_NOMEM;
		fclose(fp);

		return 0;
	}
	
	prdms->_buffer = (u_int8_t*)malloc(sizeof(u_int8_t) * sz);
	if(0 == prdms->_buffer)
	{
		if (error) *error = PARADIGMS_ERROR_NOMEM;
		fclose(fp);
		free(prdms);

		return 0;
	}

	i = fread(prdms->_buffer, sizeof(u_int8_t), sz, fp);
	if (i != sz)
	{
		if (error) *error = PARADIGMS_ERROR_CORRUPTED_FILE;
		fclose(fp);
		free(prdms->_buffer);
		free(prdms);

		return 0;
	}

	fclose(fp);

	prdms->shared = 0;

	return prdms;
}

/* Attaches paradigms as ptr. Feel free to call turglem_paradigms_close(), memory won't be deallocated! 
*/
turglem_paradigms turglem_paradigms_attach(const void *ptr, int *error)
{
	turglem_paradigms prdms = (turglem_paradigms)malloc(sizeof(struct turglem_paradigms_struct));
	if (0 == prdms)
	{
		if (error) *error = PARADIGMS_ERROR_NOMEM;
		return 0;
	}

	prdms->shared = 1;
	return prdms;
}

/* Frees memory, allocated by turglem_paradigms_load_from_binary_file(). Does nothing if turglem_paradigms
 * was created by turglem_paradigms_attach()
*/
void turglem_paradigms_close(turglem_paradigms paradigms)
{
	if (paradigms->_buffer && !paradigms->shared)
	{
		free(paradigms->_buffer);
	}
	
	free(paradigms);
}

/* Returns paradigms count
*/
size_t turglem_paradigms_get_paradigms_count(turglem_paradigms paradigms)
{
	return *((u_int32_t*)paradigms->_buffer);
}

/* Returns form count for paradigm
*/
size_t turglem_paradigms_get_form_count(turglem_paradigms paradigms, u_int32_t paradigm)
{
	u_int32_t *head = (u_int32_t*)paradigms->_buffer;

	return head[head[paradigm + 1]];
}

/* Returns grammems of form of paradigm
*/
u_int64_t turglem_paradigms_get_grammem(turglem_paradigms paradigms, u_int32_t paradigm, u_int32_t flexia)
{
	u_int32_t *header = (u_int32_t*)paradigms->_buffer;
	u_int8_t *data_p = paradigms->_buffer + header[header[paradigm + 1] + flexia + 1] + 4;

	u_int64_t res_grammem;

	memcpy(&res_grammem, data_p, sizeof(u_int64_t));

	return res_grammem;
}

/* Returns part of speech of form of flexia
*/
u_int8_t turglem_paradigms_get_part_of_speech(turglem_paradigms paradigms, u_int32_t paradigm, u_int32_t flexia)
{
	u_int32_t *header = (u_int32_t*)paradigms->_buffer;
	u_int8_t *data_p = paradigms->_buffer + header[header[paradigm + 1] + flexia + 1] + 1;

	return *data_p;
}

/* Returns prefix and/or suffix of form of flexia and their sizes
*/
void turglem_paradigms_get_form_data(turglem_paradigms paradigms, u_int32_t paradigm, u_int32_t form, MAFSA_letter **prefix, size_t *prefix_sz, MAFSA_letter **suffix, size_t *suffix_sz)
{
	u_int32_t * header = (u_int32_t*)paradigms->_buffer;
	u_int8_t * data_p = paradigms->_buffer + header[header[paradigm + 1] + form + 1] + 2;
		
	*prefix_sz = *data_p++;
	*suffix_sz = *data_p++;
	
	data_p += sizeof(u_int64_t);
		
	*prefix = (MAFSA_letter*)data_p;
	*suffix = (MAFSA_letter*)data_p + *prefix_sz;
}


