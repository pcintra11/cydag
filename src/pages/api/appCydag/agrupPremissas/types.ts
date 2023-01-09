import * as yup from 'yup';

import { msgValidRequired } from '../../../../libCommon/validationsYup';

import { AgrupPremissas } from '../../../../appCydag/modelTypes';

enum CmdApi_AgrupPremissas {
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
  upload = 'upload',
  download = 'download',
  reset = 'reset',
}
export {
  CmdApi_AgrupPremissas,
  CmdApi_AgrupPremissas as CmdApi_Crud,
  AgrupPremissas as Entity_Crud,
};

const codYup = yup
  .string()
  .required(msgValidRequired)
  .trim()
  .uppercase()
  .matches(/^((([A-Z])|([0-9])){1,20})$/, 'Deve ter até 20 posições com letras ou números e sem acentos');  

const descrYup = yup
  .string()
  .trim()
  .required(msgValidRequired);

export const crudValidations = yup.object().shape({
  cod: codYup,
  descr: descrYup,
});