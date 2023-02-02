import * as yup from 'yup';

import { UnidadeNegocio } from '../../../../appCydag/modelTypes';
import { validationsYupApp } from '../../../../appCydag/validationsYup';

enum CmdApi_UnidadeNegocio {
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
  upload = 'upload',
  download = 'download',
  reset = 'reset',
}
export {
  CmdApi_UnidadeNegocio,
  CmdApi_UnidadeNegocio as CmdApi_Crud,
  UnidadeNegocio as Entity_Crud,
};

export const crudValidations = yup.object().shape({
  cod: validationsYupApp.codGenerico,
  descr: validationsYupApp.descrGenerico,
});