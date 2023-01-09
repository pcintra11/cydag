import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';
import { dbgError } from '../libCommon/dbg';

import { CallApiCliASync } from '../fetcher/fetcherCli';

import { globals } from '../libClient/clientGlobals';
import { SystemMsgCli } from '../libClient/systemMsgCli';

import { CmdApi_UserAuth } from '../pages/api/appCydag/user/types';

import { apisApp } from './endPoints';
import { LoggedUser } from './loggedUser';

export const GetLoggedUserFromHttpCookieASync = async (point: string) => {
  //await SleepMs(500);
  try {
    const apiReturn = await CallApiCliASync(apisApp.userAuth.apiPath, globals.windowId, { cmd: CmdApi_UserAuth.getLoggedUserCookie, point });
    //await SleepMsDevClient('GetLoggedUserFromCookie', 3000);
    return apiReturn.value != null ? LoggedUser.deserialize(apiReturn.value) : null;
  } catch (error) {
    dbgError('erro em GetLoggedUserFromHttpCookieASync', error.message); // mostra tb para o usuario comum, pois se for problema de APIs não liberadas no server nem o log será gravado
    SystemMsgCli(CategMsgSystem.error, 'GetLoggedUserFromHttpCookieASync', error.message);
    return null;
  }
};