import * as yup from 'yup';

import { msgValidRequired } from '../../../../libCommon/validationsYup';

import { CentroCusto } from '../../../../appCydag/modelTypes';

enum CmdApi_CentroCusto {
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
  upload = 'upload',
  download = 'download',
  reset = 'reset',
}
export {
  CmdApi_CentroCusto,
  CmdApi_CentroCusto as CmdApi_Crud,
  CentroCusto as Entity_Crud,
};

const codYup = yup
  .string()
  .required(msgValidRequired)
  .trim()
  .uppercase()
  //.matches(/^((([A-Z])|([0-9])){10})$/, 'Deve ter 10 posições com letras ou números');
  .matches(/^((([A-Z])|([0-9])){1,20})$/, 'Deve ter até 20 posições com letras ou números e sem acentos');  


const descrYup = yup
  .string()
  .trim()
  .required(msgValidRequired);
  // .min(10, 'deve ter no mínimo 10 caracteres')
  // .max(100, 'deve ter no máximo 100 caracteres');

export const crudValidations = yup.object().shape({
  cod: codYup,
  descr: descrYup,
});