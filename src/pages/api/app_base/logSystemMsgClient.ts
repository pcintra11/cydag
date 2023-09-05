import type { NextApiRequest, NextApiResponse } from 'next';

import { ConnectDbASync, CloseDbASync, UriDb } from '../../../libServer/dbMongo';
import { CorsWhitelist } from '../../../libServer/corsWhiteList';
import { ResumoApi, GetCtrlApiExec, ReqNoParm } from '../../../libServer/util';
import { ApiStatusDataByErrorASync } from '../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../libServer/cors';
import { _SystemMsgSvrFromClientASync } from '../../../libServer/systemMsgSvr';
import { AlertTimeExecApiASync } from '../../../libServer/alertTimeExecApi';

import { apisBase } from '../../../app_base/endPoints';
import { isAmbNone } from '../../../app_base/envs';

//import { CategMsgSystem } from './logSystemMsg_cliSvr';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const apiSelf = apisBase.logSystemMsgClient;
export default async function (req: NextApiRequest, res: NextApiResponse) {
  await CorsMiddlewareAsync(req, res, CorsWhitelist());
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  const ctrlApiExec = GetCtrlApiExec(req, res, null, ['categ', 'point']);
  const parm = ctrlApiExec.parm;
  const resumoApi = new ResumoApi(ctrlApiExec);

  try {
    if (UriDb() != null)
      await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext });

    try {
      await _SystemMsgSvrFromClientASync(parm.categ, parm.point, parm.msg, ctrlApiExec.ctrlContext, parm.details);
      resumoApi.jsonData({});
    } catch (error) {
      const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 1', parm, ctrlApiExec);
      resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
    }

    if (UriDb() != null)
      await CloseDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 2', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }

  const elapsedMsApi = resumoApi.json();
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, null);
}