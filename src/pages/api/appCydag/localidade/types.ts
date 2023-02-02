import * as yup from 'yup';

import { Localidade } from '../../../../appCydag/modelTypes';
import { validationsYupApp } from '../../../../appCydag/validationsYup';

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

export const crudValidations = yup.object().shape({
  cod: validationsYupApp.localidade,
  descr: validationsYupApp.descrGenerico,
});