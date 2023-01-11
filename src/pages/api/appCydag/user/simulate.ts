import type { NextApiRequest, NextApiResponse } from 'next';
//import _ from 'underscore';

import { CookieUserConfig } from '../../../../base/loggedUserSvr';
import { ConnectDbASync, CloseDbASync } from '../../../../base/db/functions';

import { ErrorPlus, SleepMsDevRandom } from '../../../../libCommon/util';
import { EnvDeployConfig } from '../../../../libCommon/envs';
import { isAmbNone } from '../../../../libCommon/isAmb';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ResumoApi } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';
import { HttpCriptoCookieCmdASync } from '../../../../libServer/httpCryptoCookie';

import { apisApp } from '../../../../appCydag/endPoints';
import { CheckApiAuthorized, CheckUserAllowed, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { ProcessoOrcamentarioCentroCustoModel, UserModel } from '../../../../appCydag/models';
import { User } from '../../../../appCydag/modelTypes';

const apiSelf = apisApp.userSimulate;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  const ctrlApiExec = GetCtrlApiExec(req, res, ['cmd'], ['_id']);
  const loggedUserReq = await LoggedUserReqASync(ctrlApiExec);
  const parm = ctrlApiExec.parm;

  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();
  const deleteIfOk = true;
  await SleepMsDevRandom(null, ctrlApiExec.context());

  try {
    await ConnectDbASync({ ctrlApiExec });
    const apiLogProc = await ApiLogStart(ctrlApiExec, loggedUserReq);

    try {
      const cookieUserConfig = CookieUserConfig();

      if (loggedUserReq == null) throw new ErrorPlus('Usuário não está logado.');
      await CheckBlockAsync(loggedUserReq);
      const subCmd = parm.email != null ? 'simulStart' : 'simulCancel';
      const userDbSigned = await UserModel.findOne({ email: loggedUserReq.emailSigned }).lean();
      CheckApiAuthorized(apiSelf, userDbSigned);

      const userDbNew = subCmd == 'simulCancel' ? userDbSigned : await UserModel.findOne({ email: parm.email }).lean();
      CheckUserAllowed(userDbNew, parm.email);
      const hasSomeCCResponsavel = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailResponsavel: userDbNew.email })) != null;
      const hasSomeCCPlanejador = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailPlanejador: userDbNew.email })) != null;
      const hasSomeCCConsulta = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailConsulta: userDbNew.email })) != null;
      const loggedUserNow = User.loggedUser(userDbNew, loggedUserReq.emailSigned, agora, agora, agora, hasSomeCCResponsavel, hasSomeCCPlanejador, hasSomeCCConsulta, cookieUserConfig.TTLSeconds);
      await HttpCriptoCookieCmdASync(ctrlApiExec, `main-${parm.cmd}-${subCmd}`, cookieUserConfig, 'set', { domain: EnvDeployConfig().domain }, loggedUserNow); // , `user-${parm.cmd}`
      resumoApi.jsonData({ value: loggedUserNow });

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
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, loggedUserReq);
};