import * as yup from 'yup';

import { msgValidRequired } from '../../../../libCommon/validationsYup';

import { Empresa } from '../../../../appCydag/modelTypes';

enum CmdApi_Empresa {
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
  upload = 'upload',
  download = 'download',
  reset = 'reset',
}
export {
  CmdApi_Empresa,
  CmdApi_Empresa as CmdApi_Crud,
  Empresa as Entity_Crud,
};

const codYup = yup
  .string()
  .required(msgValidRequired)
  .trim()
  .uppercase()
  .matches(/^C(([0-9]){4})$/, 'Deve estar no formato Cnnnn');

const descrYup = yup
  .string()
  .trim()
  .required(msgValidRequired);
  // .min(20, 'deve ter no mínimo 20 caracteres')
  // .max(50, 'deve ter no máximo 50 caracteres');

export const crudValidations = yup.object().shape({
  cod: codYup,
  descr: descrYup,
});