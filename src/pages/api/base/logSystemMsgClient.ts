import type { NextApiRequest, NextApiResponse } from 'next';

import { apisBase } from '../../../base/endPoints';
import { ConnectDbASync, CloseDbASync, UriDb } from '../../../base/db/functions';

import { CorsWhitelist } from '../../../libServer/corsWhiteList';
import { ResumoApi, GetCtrlApiExec } from '../../../libServer/util';
import { ApiStatusDataByErrorASync } from '../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../libServer/cors';
import { _SystemMsgSvrFromClientASync } from '../../../libServer/systemMsgSvr';
import { AlertTimeExecApiASync } from '../../../libServer/alertTimeExecApi';

//import { CategMsgSystem } from './logSystemMsg_cliSvr';

const apiSelf = apisBase.logSystemMsgClient;
export default async function (req: NextApiRequest, res: NextApiResponse) {
  await CorsMiddlewareAsync(req, res, CorsWhitelist());
  const ctrlApiExec = GetCtrlApiExec(req, res, ['categ', 'point']);
  const parm = ctrlApiExec.parm;
  const resumoApi = new ResumoApi(ctrlApiExec);

  try {
    if (UriDb() != null)
      await ConnectDbASync({ ctrlApiExec });

    try {
      await _SystemMsgSvrFromClientASync(parm.categ, parm.point, parm.msg, ctrlApiExec, parm.details);
      resumoApi.jsonData({});
    } catch (error) {
      const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 1', parm, ctrlApiExec);
      resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
    }

    if (UriDb() != null)
      await CloseDbASync({ ctrlApiExec });
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 2', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }

  const elapsedMsApi = resumoApi.json();
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, null);
}