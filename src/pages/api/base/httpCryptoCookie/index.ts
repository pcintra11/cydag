import type { NextApiRequest, NextApiResponse } from 'next';

import { apisBase } from '../../../../base/endPoints';

import { EnvDeployConfig } from '../../../../libCommon/envs';
import { dbgError } from '../../../../libCommon/dbg';
import { isAmbNone } from '../../../../libCommon/isAmb';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ResumoApi } from '../../../../libServer/util';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { HttpCriptoCookieCmdASync, HttpCryptoCookieConfig } from '../../../../libServer/httpCryptoCookie';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';

import { HttpCriptoCookieCmd } from './types';

const SESSION_GENERIC_PSW = 'DC2192E7773B18CA9E74E5CF9C542DC2192E7773B18CA9E74E5CF9C542';

const apiSelf = apisBase.httpCryptoCookie;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  await CorsMiddlewareAsync(req, res, CorsWhitelist());
  const ctrlApiExec = GetCtrlApiExec(req, res, ['cmd'], ['cookieName']);
  const parm = ctrlApiExec.parm;
  const resumoApi = new ResumoApi(ctrlApiExec);

  try {
    const cookieSessionConfig: HttpCryptoCookieConfig = {
      name: parm.cookieName,
      TTLSeconds: null,
      psw: SESSION_GENERIC_PSW,
    };
    if (parm.cmd == HttpCriptoCookieCmd.set) {
      await HttpCriptoCookieCmdASync(ctrlApiExec, 'main', cookieSessionConfig, 'set', { domain: EnvDeployConfig().domain }, parm.value);
      resumoApi.jsonData({});
    }
    else if (parm.cmd == HttpCriptoCookieCmd.get) {
      const value = await HttpCriptoCookieCmdASync(ctrlApiExec, 'main', cookieSessionConfig, 'get', { domain: EnvDeployConfig().domain });
      resumoApi.jsonData({ value });
    }
    else {
      dbgError(`cmd inválido (${parm.cmd}) em httpCriptoCookie`);
      resumoApi.jsonData({});
    }
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }
  const elapsedMsApi = resumoApi.json();
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, null);
};