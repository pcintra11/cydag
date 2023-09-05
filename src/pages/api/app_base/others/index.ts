import type { NextApiRequest, NextApiResponse } from 'next';
import WhichBrowser from 'which-browser';

import { IPinfoVip } from '../../../../techno_ipInfo/types';
import { GetWhichBrowserInfo } from '../../../../techno_whichBrowser/clientInfoSvr';
import { GetIPinfoASync, GetIPinfoVip } from '../../../../techno_ipInfo/getIpInfoASync';

import { csd, dbg, dbgError, ScopeDbg } from '../../../../libCommon/dbg';

import { ConnectDbASync, CloseDbASync } from '../../../../libServer/dbMongo';
import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../../libServer/util';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { apisBase } from '../../../../app_base/endPoints';
import { SiteEntryPointModel } from '../../../../app_base/model';
import { SiteEntryPoint } from '../../../../app_base/modelTypes';
import { isAmbNone } from '../../../../app_base/envs';

import { CmdApi_Others } from './types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const apiSelf = apisBase.others;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true }); // @@!! pesquisar melhor sobre credentials !
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  const ctrlApiExec = GetCtrlApiExec(req, res, null, ['cmd', 'attrSector'], ['email']);
  //await SleepMsDevApi(varsReq);
  const parm = ctrlApiExec.parm;

  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();
  const deleteIfOk = true;
  ctrlApiExec.ctrlContext.checkElapsed('ini');

  const dbgA = (level: number, ...params) => dbg({ level, scopeMsg: ScopeDbg.a, ctrlContext: ctrlApiExec.ctrlContext }, ...params);

  try {
    await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
    const apiLogProc = await ApiLogStart(ctrlApiExec);

    try {
      ctrlApiExec.ctrlContext.checkElapsed(`pre ${parm.cmd}`);

      if (parm.cmd == CmdApi_Others.logSiteEntryPoint) {
        let ipInfoVip: IPinfoVip = null;
        try {
          const ipInfo = await GetIPinfoASync(ctrlApiExec.ip);
          ipInfoVip = GetIPinfoVip(ipInfo);
        } catch (error) {
          dbgError(parm.cmd, 'GetIPinfoASync', error.message);
        }

        const whichBrowser = new WhichBrowser(ctrlApiExec.req.headers);

        await SiteEntryPointModel.create(
          SiteEntryPoint.fill({
            date: agora,
            url: ctrlApiExec.url,
            referer: ctrlApiExec.referer,
            ip: ctrlApiExec.ip,
            ipInfo: ipInfoVip,
            browserId: ctrlApiExec.browserId,
            userAgent: ctrlApiExec.userAgent,
            browserInfo: GetWhichBrowserInfo(whichBrowser),
          }));
        resumoApi.jsonData({ value: { msg: 'ok' } });
      }

      // else if (parm.cmd == CmdApi_Others.checkBlock) {
      //   const loggedUserReq = await LoggedUserReqASync(ctrlApiExec);
      //   await CheckBlockAsync(loggedUserReq);
      //   resumoApi.jsonData({ value: { msg: 'ok' } });
      // }

      else
        throw new Error(`Cmd '${parm.cmd}' não previsto.`);

      ctrlApiExec.ctrlContext.checkElapsed(`pos ${parm.cmd}`);

    } catch (error) {
      const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 1', parm, ctrlApiExec);
      resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
    }

    await ApiLogFinish(apiLogProc, resumoApi.resultProc(), deleteIfOk);
    await CloseDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 2', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }

  const elapsedMsApi = resumoApi.json();
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec);
};