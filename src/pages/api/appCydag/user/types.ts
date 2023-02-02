import * as yup from 'yup';

import { validationsYup } from '../../../../libCommon/validationsYup';

import { User } from '../../../../appCydag/modelTypes';
import { validationsYupApp } from '../../../../appCydag/validationsYup';

enum CmdApiCrud {
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
  upload = 'upload',
  download = 'download',
  reset = 'reset',
}
enum CmdApiOthers {
  resetPsw = 'resetPsw',
  emailLink = 'emailLink',
}
enum CmdApiAuth {
  signIn = 'signIn',
  signOut = 'signOut',
  reSignIn = 'reSignIn',
  getLoggedUserCookie = 'getLoggedUserCookie',
}

export const pswSignInAzure = 'psw:azure';

export enum UserLinkType {
  //completeSignUp = 'completeSignUpLink',
  resetPsw = 'resetPswLink',
}

export {
  CmdApiCrud as CmdApi_UserCrud,
  CmdApiOthers as CmdApi_UserOthers,
  CmdApiAuth as CmdApi_UserAuth,
  User as Entity_Crud,
};

export const crudValidations = yup.object().shape({ // sempre em types @!!!!!!
  email: validationsYup.email,
  nome: validationsYupApp.nomeUser,
});


export const signInValidations = yup.object().shape({
  email: validationsYup.email,
  psw: validationsYupApp.psw,
});

export const resetPswValidations = yup.object().shape({
  email: validationsYup.email,
  psw: validationsYupApp.psw,
  pswConfirm: validationsYupApp.psw,
});
