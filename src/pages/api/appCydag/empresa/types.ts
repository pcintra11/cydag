import * as yup from 'yup';

import { Empresa } from '../../../../appCydag/modelTypes';
import { validationsYupApp } from '../../../../appCydag/validationsYup';

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

export const crudValidations = yup.object().shape({
  cod: validationsYupApp.empresa,
  descr: validationsYupApp.descrGenerico,
});