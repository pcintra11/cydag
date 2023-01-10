import type { NextApiRequest, NextApiResponse } from 'next';
//import { ObjectId } from 'mongodb';

import { apisBase } from '../../../../base/endPoints';
import { RefererLogModel } from '../../../../base/db/models';
import { ConnectDbASync, CloseDbASync } from '../../../../base/db/functions';

import { csd, dbg, dbgWarn, ScopeDbg } from '../../../../libCommon/dbg';
import { isAmbNone } from '../../../../libCommon/isAmb';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ResumoApi } from '../../../../libServer/util';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { CmdApi_Others } from './types';

const apiSelf = apisBase.others;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true }); // @@!! pesquisar melhor sobre credentials !
  const ctrlApiExec = GetCtrlApiExec(req, res, ['cmd', 'attrSector'], ['email']);
  //await SleepMsDevApi(varsReq);
  const parm = ctrlApiExec.parm;

  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();
  const deleteIfOk = true;
  ctrlApiExec.checkElapsed('ini');

  const dbgA = (level: number, ...params) => dbg({ level, levelScope: ScopeDbg.a, context: ctrlApiExec.context(), color: ctrlApiExec?.colorDestaq }, ...params);

  try {
    await ConnectDbASync({ ctrlApiExec });
    const apiLogProc = await ApiLogStart(ctrlApiExec);

    try {
      ctrlApiExec.checkElapsed(`pre ${parm.cmd}`);

      if (parm.cmd == CmdApi_Others.logReferer) {
        await RefererLogModel.create({ date: agora, url: ctrlApiExec.url, referer: ctrlApiExec.referer });
        resumoApi.jsonData({});
      }

      else
        throw new Error(`Cmd '${parm.cmd}' não previsto.`);

      ctrlApiExec.checkElapsed(`pos ${parm.cmd}`);

    } catch (error) {
      const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 1', parm, ctrlApiExec);
      resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
    }

    await ApiLogFinish(apiLogProc, resumoApi.resultProc(), deleteIfOk);
    await CloseDbASync({ ctrlApiExec });
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 2', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }

  const elapsedMsApi = resumoApi.json();
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec);
};