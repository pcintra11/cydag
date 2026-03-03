import type { NextApiRequest, NextApiResponse } from 'next';

import { apisApp } from '../../../../appCydag/endPoints';
import { CloseDbASync, ConnectDbASync } from '../../../../libServer/dbMongo';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { EnvDeployConfig, isAmbNone } from '../../../../app_base/envs';
import { GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../../libServer/util';
import { getBetterAuthSession } from '../../../../lib/betterAuthSesion';
import { ProcessoOrcamentarioCentroCustoModel, UserMd, UserModel } from '../../../../appCydag/models';
import { LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { User } from '../../../../appCydag/modelTypes';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
//import { CookieUserConfig } from '../../../../libCommon/loggedUserSvr';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
import { CookieHttpMake } from '../../../../libServer/cookieHttpMake';
import { cookiesSys } from '../../../../libCommon/cookies_sys';
import { ErrorPlus } from '../../../../libCommon/util';

const apiSelf = apisApp.setLoggedUserServer;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  const loggedUserReq = await LoggedUserReqASync(req, res);
  const ctrlApiExec = GetCtrlApiExec(req, res, loggedUserReq);

  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();

  try {
    await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext });

    try {

      const betterAuthSession = await getBetterAuthSession(req, res);
      //console.log('setLoggedUser - betterAuthSession', betterAuthSession);
      //const cookieUserConfig = CookieUserConfig();

      if (betterAuthSession != null) {
        const email = betterAuthSession.user.email;

        const userDb = await UserModel.findOne({ email }).lean() as UserMd;
        if (userDb == null) throw new ErrorPlus(`E-mail '${email}' não cadastrado para o Cydag`);

        const hasSomeCCResponsavel = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailResponsavel: userDb.email })) != null;
        const hasSomeCCPlanejador = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailPlanejador: userDb.email })) != null;
        const hasSomeCCConsulta = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailConsulta: userDb.email })) != null;
        const loggedUserNow = User.loggedUser(userDb, email, agora, agora, agora, hasSomeCCResponsavel, hasSomeCCPlanejador, hasSomeCCConsulta);
        await CheckBlockAsync(loggedUserNow);

        //   const { cripto, normal } = CookieLoggedUserMake(loggedUserNow, mantainConnected, `${apiSelf.pathname}`);
        // ctrlSvrExec.setCookie(normal); // será usado para agilizar o relogin
        // ctrlSvrExec.setCookie(cripto); // será usado para confirmar o relogin
        // ctrlSvrExec.setCookie(CookieLastAccountSignedMake(loggedUserNow));

        //await HttpCriptoCookieCmdASync(req, res, apiSelf.apiPath, cookieUserConfig, 'set', { domain: EnvDeployConfig().domain }, loggedUserNow);
        ctrlApiExec.setCookie(CookieHttpMake(cookiesSys.loggedUser, JSON.stringify(loggedUserNow), { httpOnly: true }));
        resumoApi.jsonData({ value: loggedUserNow });
      }
      else {
        //await HttpCriptoCookieCmdASync(req, res, apiSelf.apiPath, cookieUserConfig, 'set', { domain: EnvDeployConfig().domain }, null);
        ctrlApiExec.removeCookie(cookiesSys.loggedUser);
        resumoApi.jsonData({ value: { loggedUser: null } });
      }

    } catch (error: any) {
      const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 1', {}, ctrlApiExec);
      resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
    }

    await CloseDbASync({ ctrlContext: ctrlApiExec.ctrlContext });

  } catch (error: any) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 2', {}, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }

  const elapsedMsApi = resumoApi.json();
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, loggedUserReq);
};