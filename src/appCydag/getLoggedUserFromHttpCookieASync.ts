import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';
import { dbgError } from '../libCommon/dbg';

import { CallApiCliASync } from '../fetcher/fetcherCli';

import { SystemMsgCli } from '../libClient/systemMsgCli';

import { CmdApi_UserAuth } from '../pages/api/appCydag/user/types';

import { apisApp } from './endPoints';
import { LoggedUser } from './loggedUser';

export const GetLoggedUserServer = async (point: string) => {
  try {
    //console.log('GetLoggedUserServer - started');
    const apiReturn = await CallApiCliASync<any>(apisApp.userAuth.apiPath, { cmd: CmdApi_UserAuth.getLoggedUserCookie, point });
    //await SleepMsDevClient('GetLoggedUserFromCookie', 3000);
    //console.log('GetLoggedUserServer - ended');
    return apiReturn.value != null ? LoggedUser.deserialize(apiReturn.value) : null;
  } catch (error) {
    //console.log('GetLoggedUserServer - error');
    //dbgError('GetLoggedUserServer', error.message); // mostra tb para o usuário comum, pois se for problema de APIs não liberadas no server nem o log será gravado
    SystemMsgCli(CategMsgSystem.error, 'GetLoggedUserServer', error.message);
    return null;
  }
};