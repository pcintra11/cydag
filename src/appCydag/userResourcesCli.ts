
//import { IGenericObject } from '../libCommon/types';

import { globals } from '../libClient/clientGlobals';
import { CallApiCliASync } from '../fetcher/fetcherCli';

import { LogErrorUnmanaged } from '../components';

import { CmdApi_UserAuth } from '../pages/api/appCydag/user/types';

//import { User } from './types';
import { apisApp } from './endPoints';
import { LoggedUser } from './loggedUser';

//#region  apiCalls
export async function UserSignInASync(email: string, psw: string): Promise<LoggedUser> {
  const apiReturn = await CallApiCliASync(apisApp.userAuth.apiPath, globals.windowId, { cmd: CmdApi_UserAuth.signIn, email, psw });
  //{ callId: globals.callId() }
  //globalUser.setValue(apiReturn.value);
  return LoggedUser.deserialize(apiReturn.value);
}

export async function UserSimulateASync(email?: string): Promise<LoggedUser> {
  const apiReturn = await CallApiCliASync(apisApp.userSimulate.apiPath, globals.windowId, { email });
  return LoggedUser.deserialize(apiReturn.value);
}

export async function UserSignOut(caller: string) {
  //dbgWarn(`UserSignOut - from ${caller}`);
  try {
    //globalUser.setValue(null);
    //console.log(PreComp(), 'chamando api para logout');
    CallApiCliASync(apisApp.userAuth.apiPath, globals.windowId, { cmd: CmdApi_UserAuth.signOut, caller }, { fetchAndForget: true });
  } catch (error) {
    LogErrorUnmanaged(error, 'UserSignOut');
  }
}
