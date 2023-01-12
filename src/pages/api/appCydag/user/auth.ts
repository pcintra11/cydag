import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
//import _ from 'underscore';

import { CookieUserConfig } from '../../../../base/loggedUserSvr';
import { ConnectDbASync, CloseDbASync } from '../../../../base/db/functions';

import { ErrorPlus, HttpStatusCode, SleepMsDevRandom } from '../../../../libCommon/util';
import { csd, dbgWarn } from '../../../../libCommon/dbg';
import { EnvDeployConfig } from '../../../../libCommon/envs';
import { RolesDevArray } from '../../../../libCommon/endPoints';
import { isAmbNone } from '../../../../libCommon/isAmb';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ResumoApi } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
//import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';
import { HttpCriptoCookieCmdASync } from '../../../../libServer/httpCryptoCookie';

import { apisApp, rolesApp } from '../../../../appCydag/endPoints';
import { CheckApiAuthorized, CheckUserAllowed, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { ProcessoOrcamentarioCentroCustoModel, UserModel } from '../../../../appCydag/models';
import { User } from '../../../../appCydag/modelTypes';
import { CmdApi_UserAuth as CmdApi, pswSignInAzure } from './types';
import { LoggedUser } from '../../../../appCydag/loggedUser';

const emailDeveloper = 'paulocintra@cyrela.com.br';
const apiSelf = apisApp.userAuth;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  const ctrlApiExec = GetCtrlApiExec(req, res, ['cmd'], ['_id']);
  const loggedUserReq = await LoggedUserReqASync(ctrlApiExec);
  const parm = ctrlApiExec.parm;

  const parmPsw = parm.psw;
  //const parmPswConfirm = parm.pswConfirm;
  if (parm.psw != null)
    parm.psw = '****';
  if (parm.pswConfirm != null)
    parm.pswConfirm = '****';

  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();
  let deleteIfOk = false;
  await SleepMsDevRandom(null, ctrlApiExec.context());
  ctrlApiExec.checkElapsed('ini');

  try {
    await ConnectDbASync({ ctrlApiExec });
    const apiLogProc = await ApiLogStart(ctrlApiExec, loggedUserReq);

    //#region pre-carga
    {
      const anyDocDb = await UserModel.findOne({ email: emailDeveloper }).lean();
      if (anyDocDb == null) {
        const documentInsert: User = {
          email: emailDeveloper,
          nome: 'Desenvolvedor do sistema',
          ativo: true,
          //email_superior: null,
          roles: [rolesApp.gestorContr, rolesApp.cargaFunc],
          rolesControlled: RolesDevArray(),
          searchTerms: '',
          created: agora,
          lastUpdated: agora,
        };
        documentInsert.searchTerms = User.SearchTermsGen(documentInsert);
        await UserModel.create(documentInsert);
      }
      ctrlApiExec.checkElapsed('check/create first');
    }
    //#endregion

    try {

      const cookieUserConfig = CookieUserConfig();

      ctrlApiExec.checkElapsed(`pre ${parm.cmd}`);

      if (parm.cmd == CmdApi.signIn) {
        let loggedUserNow = null;
        //let roles = null;
        // if (parm.email == 'gestor@cyrela.com.br' ||
        //   parm.email == 'planejador@cyrela.com.br') {

        //   if (parm.email == 'gestor@cyrela.com.br')
        //     roles = [perfilGestorContr, perfilPlanejadorDynamCC];
        //   else if (parm.email == 'planejador@cyrela.com.br')
        //     roles = [perfilPlanejadorDynamCC];

        //   if (parmPsw != `${parm.email}senha`)
        //     throw new ErrorPlus('Senha incorreta.', { data: { fldName: 'psw' }, httpStatusCode: HttpStatusCode.unAuthorized });

        //   const userId = new ObjectId();
        //   loggedUserNow = {
        //     sessionIdStr: null,
        //     userIdStr: userId.toString(),
        //     email: parm.email,
        //     name: 'Usuário fictício ' + parm.email,
        //     roles,
        //     firstSignIn: agora,
        //     lastReSignIn: agora,
        //     lastActivity: agora,
        //   } as LoggedUser;
        // }
        // else 
        {
          const userDb = await UserModel.findOne({ email: parm.email }).lean();
          CheckUserAllowed(userDb, parm.email);
          if (EnvDeployConfig().mode_auth == 'azure') {
            if (parmPsw != pswSignInAzure)
              throw new ErrorPlus('login inválido', { httpStatusCode: HttpStatusCode.unAuthorized });
          }
          else {
            const pswCheck = (parm.email == emailDeveloper) ? `${parm.email}senhasenha` : `${parm.email}senha`;
            if (parmPsw != pswCheck)
              throw new ErrorPlus('Senha incorreta.', { data: { fldName: 'psw' }, httpStatusCode: HttpStatusCode.unAuthorized });
          }
          const hasSomeCCResponsavel = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailResponsavel: userDb.email })) != null;
          const hasSomeCCPlanejador = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailPlanejador: userDb.email })) != null;
          const hasSomeCCConsulta = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailConsulta: userDb.email })) != null;
          loggedUserNow = User.loggedUser(userDb, parm.email, agora, agora, agora, hasSomeCCResponsavel, hasSomeCCPlanejador, hasSomeCCConsulta, cookieUserConfig.TTLSeconds);
          await CheckBlockAsync(loggedUserNow);
        }

        await HttpCriptoCookieCmdASync(ctrlApiExec, `user:${parm.cmd}`, cookieUserConfig, 'set', { domain: EnvDeployConfig().domain }, loggedUserNow); // , `user-${parm.cmd}`
        resumoApi.jsonData({ value: loggedUserNow });
      }

      else if (parm.cmd == CmdApi.signOut) {
        if (loggedUserReq == null) { } // dbgWarn('signOut para usuario não logado', parm);
        else {
          // //await UserLogWriteASync(new ObjectId(loggedUserReq.userIdStr), loggedUserReq.email, `${parm.cmd}`, ctrlApiExec, new ObjectId(loggedUserReq.sessionIdStr));
          // await LoggedUserSessionModel.updateOne({ _id: new ObjectId(loggedUserReq.sessionIdStr) }, { dateSignOut: agora } as LoggedUserSession);
          await HttpCriptoCookieCmdASync(ctrlApiExec, `user:${parm.cmd}`, cookieUserConfig, 'set', { domain: EnvDeployConfig().domain }, null); // , `user-${parm.cmd}(${parm.caller})`
        }
        resumoApi.jsonData({});
      }

      else if (parm.cmd == CmdApi.getLoggedUserCookie) {
        let loggedUserFromCookie: LoggedUser = null;
        if (loggedUserReq != null) {
          loggedUserFromCookie = loggedUserReq;
          const userDb = await UserModel.findOne({ _id: new ObjectId(loggedUserFromCookie.userIdStr) }).lean();
          if (userDb != null) {
            const hasSomeCCResponsavel = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailResponsavel: userDb.email })) != null;
            const hasSomeCCPlanejador = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailPlanejador: userDb.email })) != null;
            const hasSomeCCConsulta = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailConsulta: userDb.email })) != null;
            loggedUserFromCookie = User.loggedUser(userDb, loggedUserReq.emailSigned, loggedUserFromCookie.firstSignIn, loggedUserFromCookie.lastReSignIn,
              loggedUserFromCookie.lastActivity, hasSomeCCResponsavel, hasSomeCCPlanejador, hasSomeCCConsulta, cookieUserConfig.TTLSeconds);
          }
          else
            loggedUserFromCookie = null;
        }
        resumoApi.jsonData({ value: loggedUserFromCookie });
        deleteIfOk = true;
      }

      else {
        if (loggedUserReq == null) throw new ErrorPlus('Usuário não está logado.');
        await CheckBlockAsync(loggedUserReq);
        const userDb = await UserModel.findOne({ email: loggedUserReq?.email }).lean();
        CheckApiAuthorized(apiSelf, userDb, loggedUserReq?.email);

        if (parm.cmd == CmdApi.reSignIn) {
          const hasSomeCCResponsavel = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailResponsavel: userDb.email })) != null;
          const hasSomeCCPlanejador = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailPlanejador: userDb.email })) != null;
          const hasSomeCCConsulta = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailConsulta: userDb.email })) != null;
          const loggedUser = User.loggedUser(userDb, loggedUserReq.emailSigned, loggedUserReq.firstSignIn, agora, agora, hasSomeCCResponsavel, hasSomeCCPlanejador, hasSomeCCConsulta, cookieUserConfig.TTLSeconds);
          loggedUser.emailSigned = loggedUserReq.emailSigned;
          //await CookieUserSetApiAccessASync(ctrlApiExec, loggedUser);
          //await UserLogWriteASync(userDb._id, Unscramble(userDb.email_messy), `${parm.cmd}`, agora, loggedUserSessionIdUse);
          resumoApi.jsonData({ value: loggedUser });
          await HttpCriptoCookieCmdASync(ctrlApiExec, `user:${parm.cmd}`, cookieUserConfig, 'set', { domain: EnvDeployConfig().domain }, loggedUser);
          deleteIfOk = true;
        }

        else
          throw new Error(`Cmd '${parm.cmd}' inválido.`);
      }

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
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, loggedUserReq);
};