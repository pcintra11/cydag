import * as yup from 'yup';

import { msgValidRequired } from '../libCommon/validationsYup';

const fld_psw_min = 3;
export const validationsYupApp = {
  psw: yup
    .string()
    .trim()
    .min(fld_psw_min, `Senha deve ter ao menos ${fld_psw_min} caracteres`),

  nomeUser: yup
    .string()
    .trim()
    .required(msgValidRequired),
  // .min(10, 'deve ter no mínimo 10 caracteres')
  // .max(50, 'deve ter no máximo 50 caracteres');

  codGenerico: yup
    .string()
    .required(msgValidRequired)
    .trim()
    .uppercase()
    .matches(/^((([A-Z])|([0-9])){1,20})$/, 'Deve ter até 20 posições com letras ou números e sem acentos'),

  descrGenerico: yup
    .string()
    .trim()
    .required(msgValidRequired),
  // .min(10, 'deve ter no mínimo 10 caracteres')
  // .max(100, 'deve ter no máximo 100 caracteres');

  classeCusto: yup
    .string()
    .required(msgValidRequired)
    .trim()
    .matches(/^(([0-9]){10,10})$/, 'Deve ter 10 posições com números'),

  localidade: yup
    .string()
    .required(msgValidRequired)
    .trim()
    .uppercase()
    .matches(/^(([A-Z]){2})$/, 'Deve ter 2 posições com letras'),

  empresa: yup
    .string()
    .required(msgValidRequired)
    .trim()
    .uppercase()
    .matches(/^C(([0-9]){4})$/, 'Deve estar no formato Cnnnn'),
};
