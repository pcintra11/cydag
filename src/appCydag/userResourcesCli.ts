
//import { IGenericObject } from '../libCommon/types';

import { CallApiCliASync } from '../fetcher/fetcherCli';

import { CmdApi_UserAuth, CmdApi_UserOthers, UserLinkType } from '../pages/api/appCydag/user/types';

//import { User } from './types';
import { apisApp } from './endPoints';
import { LoggedUser } from './loggedUser';

//#region  apiCalls
export async function UserResetPswASync(token: string, email: string, psw: string, pswConfirm: string) {
  const apiReturn = await CallApiCliASync<any>(apisApp.userOthers.apiPath, { cmd: CmdApi_UserOthers.resetPsw, token, email, psw, pswConfirm });
  return LoggedUser.deserialize(apiReturn.value);
}

export async function UserEmailLinkASync(email: string, linkType: UserLinkType) {
  const apiReturn = await CallApiCliASync<any>(apisApp.userOthers.apiPath, { cmd: CmdApi_UserOthers.emailLink, email, linkType });
  return apiReturn.value.message as string;
}

export async function UserSignInASync(email: string, psw: string): Promise<LoggedUser> {
  const apiReturn = await CallApiCliASync<any>(apisApp.userAuth.apiPath, { cmd: CmdApi_UserAuth.signIn, email, psw });
  //{ callId: globals.callId() }
  //globalUser.setValue(apiReturn.value);
  return LoggedUser.deserialize(apiReturn.value);
}

export async function UserSimulateASync(email?: string): Promise<LoggedUser> {
  const apiReturn = await CallApiCliASync<any>(apisApp.userSimulate.apiPath, { email });
  return LoggedUser.deserialize(apiReturn.value);
}

export async function UserSignOut(caller: string) {
  //dbgWarn(`UserSignOut - from ${caller}`);
  CallApiCliASync<any>(apisApp.userAuth.apiPath, { cmd: CmdApi_UserAuth.signOut, caller }, { fetchAndForget: true });
  //.catch((error) => LogErrorUnmanaged(error, 'UserSignOut'));
}
