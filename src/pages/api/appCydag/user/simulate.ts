import type { NextApiRequest, NextApiResponse } from 'next';
//import _ from 'underscore';

import { CookieUserConfig } from '../../../../libCommon/loggedUserSvr';
import { ConnectDbASync, CloseDbASync } from '../../../../libServer/dbMongo';

import { ErrorPlus, SleepMsDevRandom } from '../../../../libCommon/util';
import { EnvDeployConfig, isAmbNone } from '../../../../app_base/envs';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../../libServer/util';
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
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  const loggedUserReq = await LoggedUserReqASync(req, res);
  const ctrlApiExec = GetCtrlApiExec(req, res, loggedUserReq, ['cmd'], ['_id']);
  const parm = ctrlApiExec.parm;

  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();
  const deleteIfOk = true;
  await SleepMsDevRandom(null, ctrlApiExec.ctrlContext, 'main');

  try {
    await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
    const apiLogProc = await ApiLogStart(ctrlApiExec, loggedUserReq);

    try {
      const cookieUserConfig = CookieUserConfig();

      if (loggedUserReq == null) throw new ErrorPlus('Usuário não está logado.');
      await CheckBlockAsync(loggedUserReq);
      const subCmd = parm.email != null ? 'simulStart' : 'simulCancel';
      const userDbSigned = await UserModel.findOne({ email: loggedUserReq.emailSigned }).lean();
      CheckApiAuthorized(apiSelf, userDbSigned, loggedUserReq.emailSigned);
      let emailSession, userDbSession;
      if (subCmd === 'simulCancel') {
        emailSession = loggedUserReq.emailSigned;
        userDbSession = userDbSigned;
      }
      else {
        emailSession = parm.email;
        userDbSession = await UserModel.findOne({ email: parm.email }).lean();
        if (userDbSession.ctrl.rolesControlled.length !== 0) throw new ErrorPlus('Esse usuário não pode ser simulado');
      }
      CheckUserAllowed(userDbSession, emailSession);

      const hasSomeCCResponsavel = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailResponsavel: userDbSession.email })) != null;
      const hasSomeCCPlanejador = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailPlanejador: userDbSession.email })) != null;
      const hasSomeCCConsulta = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailConsulta: userDbSession.email })) != null;
      const loggedUserNow = User.loggedUser(userDbSession, loggedUserReq.emailSigned, agora, agora, agora, hasSomeCCResponsavel, hasSomeCCPlanejador, hasSomeCCConsulta); // , cookieUserConfig.TTLSeconds
      await HttpCriptoCookieCmdASync(req, res, `main-${parm.cmd}-${subCmd}`, cookieUserConfig, 'set', { domain: EnvDeployConfig().domain }, loggedUserNow); // , `user-${parm.cmd}`
      resumoApi.jsonData({ value: loggedUserNow });

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
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, loggedUserReq);
};