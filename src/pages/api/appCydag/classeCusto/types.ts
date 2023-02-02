import * as yup from 'yup';

import { validationsYup } from '../../../../libCommon/validationsYup';

import { ClasseCusto } from '../../../../appCydag/modelTypes';
import { validationsYupApp } from '../../../../appCydag/validationsYup';

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

export const crudValidations = yup.object().shape({
  classeCusto: validationsYupApp.classeCusto,
  descr: validationsYupApp.descrGenerico,
  seqApresent: validationsYup.numberReqPositive,
});