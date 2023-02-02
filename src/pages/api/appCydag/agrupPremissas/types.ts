import * as yup from 'yup';

import { AgrupPremissas } from '../../../../appCydag/modelTypes';
import { validationsYupApp } from '../../../../appCydag/validationsYup';

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

export const crudValidations = yup.object().shape({
  cod: validationsYupApp.codGenerico,
  descr: validationsYupApp.descrGenerico,
});