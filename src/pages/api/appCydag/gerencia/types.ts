import * as yup from 'yup';

import { Gerencia } from '../../../../appCydag/modelTypes';
import { validationsYupApp } from '../../../../appCydag/validationsYup';

enum CmdApi_Gerencia {
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
  upload = 'upload',
  download = 'download',
  reset = 'reset',
}
export {
  CmdApi_Gerencia,
  CmdApi_Gerencia as CmdApi_Crud,
  Gerencia as Entity_Crud,
};

export const crudValidations = yup.object().shape({
  cod: validationsYupApp.codGenerico,
  descr: validationsYupApp.descrGenerico,
});