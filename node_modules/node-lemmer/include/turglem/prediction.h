/*
 * Copyright (C) 2007, libturglem development team.
 *
 * This file is released under the LGPL.
 */

#ifndef __turglem_PREDICTION_H__
#define __turglem_PREDICTION_H__

#include <MAFSA/automaton_int_pair.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Do prediction
 */
extern size_t turglem_prediction_predict(MAFSA_automaton pred, const MAFSA_letter *l, size_t sz_l, MAFSA_letter delim, int *out_pair_array, size_t sz_array);

#ifdef __cplusplus
}
#endif

#endif /* __turglem_PREDICTION_H__ */

