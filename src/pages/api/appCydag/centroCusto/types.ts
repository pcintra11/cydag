import * as yup from 'yup';

import { CentroCusto } from '../../../../appCydag/modelTypes';
import { validationsYupApp } from '../../../../appCydag/validationsYup';

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

export const crudValidations = yup.object().shape({
  cod: validationsYupApp.codGenerico,
  descr: validationsYupApp.descrGenerico,
});