import * as yup from 'yup';

import { msgValidRequired, validationsYup } from '../../../../libCommon/validationsYup';

import { User } from '../../../../appCydag/modelTypes';

enum CmdApiCrud {
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
  upload = 'upload',
  download = 'download',
  reset = 'reset',
}
enum CmdApiAuth {
  signIn = 'signIn',
  signOut = 'signOut',
  reSignIn = 'reSignIn',
  getLoggedUserCookie = 'getLoggedUserCookie',
}

export const pswSignInAzure = 'psw:azure';

export {
  CmdApiCrud as CmdApi_UserCrud,
  CmdApiAuth as CmdApi_UserAuth,
  User as Entity_Crud,
};

const nomeYup = yup
  .string()
  .trim()
  .required(msgValidRequired);
  // .min(10, 'deve ter no mínimo 10 caracteres')
  // .max(50, 'deve ter no máximo 50 caracteres');

export const crudValidations = yup.object().shape({ // sempre em types @!!!!!!
  email: validationsYup.email,
  nome: nomeYup,
});

const fld_psw_min = 3;
const pswYup = yup
  .string()
  .trim()
  .required(msgValidRequired)
  .min(fld_psw_min, `Senha deve ter ao menos ${fld_psw_min} caracteres`);

export const signInValidations = yup.object().shape({
  email: validationsYup.email,
  psw: pswYup,
});