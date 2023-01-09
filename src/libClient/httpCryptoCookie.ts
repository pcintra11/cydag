import { apisBase } from '../base/endPoints';
import { HttpCriptoCookieCmd } from '../pages/api/base/httpCryptoCookie/types';

import { dbg } from '../libCommon/dbg';
import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';

import { CallApiCliASync } from '../fetcher/fetcherCli';

import { globals } from './clientGlobals';
import { SystemMsgCli } from './systemMsgCli';

export async function GetHttpCryptoCookieASync(cookieName: string) {
  try {
    const apiReturn = await CallApiCliASync(apisBase.httpCryptoCookie.apiPath, globals.windowId, { cookieName, cmd: HttpCriptoCookieCmd.get });
    return apiReturn.value;
  } catch (error) {
    SystemMsgCli(CategMsgSystem.error, 'GetHttpCriptoCookie', error.message);
    return null;
  }
}
export async function SetHttpCryptoCookie(cookieName: string, value: any) {
  try {
    dbg({ level: 1 }, 'SetHttpCriptoCookie', cookieName, value);
    CallApiCliASync(apisBase.httpCryptoCookie.apiPath, globals.windowId, { cookieName, cmd: HttpCriptoCookieCmd.set, value });
  } catch (error) {
    SystemMsgCli(CategMsgSystem.error, 'SetHttpCriptoCookie', error.message);
  }
}
