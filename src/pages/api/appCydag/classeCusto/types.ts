import * as yup from 'yup';

import { msgValidRequired, validationsYup } from '../../../../libCommon/validationsYup';

import { ClasseCusto } from '../../../../appCydag/modelTypes';

enum SortType_ClasseCusto {
  classeCusto = 'classeCusto',
  fatorCusto = 'fatorCusto',
}

enum CmdApi_ClasseCusto {
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
  upload = 'upload',
  download = 'download',
  reset = 'reset',
}
export {
  CmdApi_ClasseCusto,
  CmdApi_ClasseCusto as CmdApi_Crud,
  ClasseCusto as Entity_Crud,
  SortType_ClasseCusto,
};

const classeCustoYup = yup
  .string()
  .required(msgValidRequired)
  .trim()
  //.uppercase()
  //.matches(/^((([A-Z])|([0-9])){1,20})$/, 'Deve ter até 20 posições com letras ou números e sem acentos');  
  .matches(/^(([0-9]){10,10})$/, 'Deve ter 10 posições com números');

const descrYup = yup
  .string()
  .trim()
  .required(msgValidRequired);

export const crudValidations = yup.object().shape({
  classeCusto: classeCustoYup,
  descr: descrYup,
  seqApresent: validationsYup.numberReqPositive,
});