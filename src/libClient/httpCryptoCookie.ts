import { dbg } from '../libCommon/dbg';
import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';

import { CallApiCliASync } from '../fetcher/fetcherCli';

import { apisBase } from '../app_base/endPoints';
import { HttpCriptoCookieCmd } from '../pages/api/app_base/httpCryptoCookie/types';

import { SystemMsgCli } from './systemMsgCli';

export async function GetHttpCryptoCookieASync(cookieName: string) {
  try {
    const apiReturn = await CallApiCliASync<{ value: { cookieValue: any } }>(apisBase.httpCryptoCookie.apiPath,
      { cmd: HttpCriptoCookieCmd.get, cookieName });
    const cookieValue = apiReturn.value.cookieValue;
    return cookieValue;
  } catch (error) {
    SystemMsgCli(CategMsgSystem.error, 'GetHttpCriptoCookie', error.message);
    return null;
  }
}
export async function SetHttpCryptoCookie(cookieName: string, value: any) {
  try {
    dbg({ level: 1 }, 'SetHttpCriptoCookie', cookieName, value);
    CallApiCliASync(apisBase.httpCryptoCookie.apiPath,
      { cmd: HttpCriptoCookieCmd.set, cookieName, value });
  } catch (error) {
    SystemMsgCli(CategMsgSystem.error, 'SetHttpCriptoCookie', error.message);
  }
}
