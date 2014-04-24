/*
 * Copyright (C) 2007, libMAFSA development team.
 *
 * This file is released under the LGPL.
 */

#ifndef __MAFSA_CHARSET_ADAPTER_H__
#define __MAFSA_CHARSET_ADAPTER_H__

#include <MAFSA/mafsa_internal.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef ssize_t (MAFSACALL *MAFSA_conv_string_to_letters) (const char *s, MAFSA_letter *l, size_t sz);
typedef size_t (MAFSACALL *MAFSA_conv_letters_to_string) (const MAFSA_letter *l, size_t sz_l, char *s, size_t sz_z);

#ifdef __cplusplus
}
#endif

#endif

