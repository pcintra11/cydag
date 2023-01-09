import * as yup from 'yup';

import { msgValidRequired } from '../../../../libCommon/validationsYup';

import { Localidade } from '../../../../appCydag/modelTypes';

enum CmdApi_Localidade {
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
  upload = 'upload',
  download = 'download',
  reset = 'reset',
}
export {
  CmdApi_Localidade,
  CmdApi_Localidade as CmdApi_Crud,
  Localidade as Entity_Crud,
};

const codYup = yup
  .string()
  .required(msgValidRequired)
  .trim()
  .uppercase()
  .matches(/^(([A-Z]){2})$/, 'Deve ter 2 posições com letras');

const descrYup = yup
  .string()
  .trim()
  .required(msgValidRequired);

export const crudValidations = yup.object().shape({
  cod: codYup,
  descr: descrYup,
});