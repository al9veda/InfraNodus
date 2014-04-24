/*
 * Copyright (C) 2007, libMAFSA development team.
 *
 * This file is released under the LGPL.
 */

#ifndef __MAFSA_MAFSA_INTERNAL_H__
#define __MAFSA_MAFSA_INTERNAL_H__

#include <sys/types.h>

#ifdef __cplusplus
extern "C" {
#endif

#if defined(_MSC_EXTENSIONS) && !defined(__BEOS__) && !defined(__CYGWIN__)
#define MAFSA_USE_MSC_EXTENSIONS 1
#endif

#ifndef MAFSACALL
#if defined(MAFSA_USE_MSC_EXTENSIONS)
#define MAFSACALL __cdecl
#elif defined(__GNUC__) && defined(__i386)
#define MAFSACALL __attribute__((cdecl))
#else
#define MAFSACALL
#endif
#endif /* MAFSACALL */

typedef u_int8_t MAFSA_letter;

#ifdef __cplusplus
}
#endif

#endif /* __MAFSA_MAFSA_INTERNAL_H__ */

