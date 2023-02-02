import * as yup from 'yup';

import { Diretoria } from '../../../../appCydag/modelTypes';
import { validationsYupApp } from '../../../../appCydag/validationsYup';

enum CmdApi_Diretoria {
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
}
export {
  CmdApi_Diretoria,
  CmdApi_Diretoria as CmdApi_Crud,
  Diretoria as Entity_Crud,
};

export const crudValidations = yup.object().shape({
  cod: validationsYupApp.codGenerico,
  descr: validationsYupApp.descrGenerico,
});