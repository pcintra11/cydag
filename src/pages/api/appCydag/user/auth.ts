import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
//import _ from 'underscore';

//import { CookieUserConfig } from '../../../../libCommon/loggedUserSvr';
import { ConnectDbASync, CloseDbASync } from '../../../../libServer/dbMongo';

import { ErrorPlus, HttpStatusCode, SleepMsDevRandom } from '../../../../libCommon/util';
import { csd } from '../../../../libCommon/dbg';
import { EnvDeployConfig, isAmbDev, isAmbNone } from '../../../../app_base/envs';
import { RolesDevArray } from '../../../../libCommon/endPoints';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
//import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { apisApp, rolesApp } from '../../../../appCydag/endPoints';
import { CheckApiAuthorized, CheckUserAllowed, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { ProcessoOrcamentarioCentroCustoModel, UserMd, UserModel } from '../../../../appCydag/models';
import { User } from '../../../../appCydag/modelTypes';
import { CmdApi_UserAuth as CmdApi } from './types';
import { LoggedUser } from '../../../../appCydag/loggedUser';
import { auth, BetterAuthUserExist, cookieBetterAuthSession } from '../../../../lib/auth';
import { CookiesInResponse } from '../../../../libServer/utilsResponse';
import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { CategMsgSystem } from '../../../../libCommon/logSystemMsg_cliSvr';
import { cookiesSys } from '../../../../libCommon/cookies_sys';
import { CookieHttpMake } from '../../../../libServer/cookieHttpMake';

export const accountDeveloper = 'paulocintra@cyrela.com.br';
const apiSelf = apisApp.userAuth;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  const loggedUserReq = await LoggedUserReqASync(req, res);
  const ctrlApiExec = GetCtrlApiExec(req, res, loggedUserReq, ['cmd'], ['_id']);
  const parm = ctrlApiExec.parm;
  const parmPsw = parm.psw;
  if (parm.psw != null) parm.psw = '****';

  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();
  let deleteIfOk = false;
  await SleepMsDevRandom(null, ctrlApiExec.ctrlContext, 'main');
  ctrlApiExec.ctrlContext.checkElapsed('ini');

  try {
    await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
    const apiLogProc = await ApiLogStart(ctrlApiExec, loggedUserReq);

    //#region pre-carga
    {
      const anyDocDb = await UserModel.findOne({ email: accountDeveloper }).lean();
      if (anyDocDb == null) {
        const documentInsert: User = {
          email: accountDeveloper,
          nome: 'Paulo Cintra (dev/suporte)',
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
      ctrlApiExec.ctrlContext.checkElapsed('check/create first');
    }
    //#endregion

    try {

      //const cookieUserConfig = CookieUserConfig();

      ctrlApiExec.ctrlContext.checkElapsed(`pre ${parm.cmd}`);

      if (parm.cmd == CmdApi.signInEmail) {
        let loggedUserNow: LoggedUser = null;
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
          const userDb = await UserModel.findOne({ email: parm.email }).lean() as UserMd;
          CheckUserAllowed(userDb, parm.email);
          // if (EnvDeployConfig().mode_auth == 'azure') {
          //   if (parmPsw != pswSignInAzure)
          //     throw new ErrorPlus('login inválido', { httpStatusCode: HttpStatusCode.unAuthorized });
          // }
          // else {
          //   if (userDb.psw == null) {
          //     //throw new ErrorPlus('Senha ainda não definida. Faça um reset para defini-la.', { data: { fldName: 'psw' }, httpStatusCode: HttpStatusCode.unAuthorized });
          //     const pswCheck = (parm.email !== accountDeveloper) ? `${parm.email}senha` : null; // `${parm.email}senhasenha`
          //     if (pswCheck == null)
          //       throw new ErrorPlus('Não foi possível determinar a forma de checagem de senha para esse usuário', { data: { fldName: 'email' }, httpStatusCode: HttpStatusCode.unAuthorized });
          //     if (parmPsw != pswCheck)
          //       throw new ErrorPlus('Senha incorreta.', { data: { fldName: 'psw' }, httpStatusCode: HttpStatusCode.unAuthorized });
          //   }
          //   else {
          //     let senhaOk = false;
          //     try {
          //       senhaOk = Crypt.compareSync(parmPsw, userDb.psw);
          //     } catch (error) {
          //       throw new Error(`Erro na conferência da senha. ${error.message}`);
          //     }
          //     if (!senhaOk)
          //       throw new ErrorPlus('Senha incorreta.', { data: { fldName: 'psw' }, httpStatusCode: HttpStatusCode.unAuthorized });
          //   }
          // }
          if (await BetterAuthUserExist(parm.email)) {
            try {
              const dataBetterAuthResp = await auth.api.signInEmail({
                body: {
                  email: parm.email,
                  password: parmPsw,
                  rememberMe: true,
                },
                //headers: new Headers(req.headers as any),
                asResponse: true
              });
              const dataBetterAuth = await dataBetterAuthResp.json();
              //console.log('auth.api.signInEmail - json', dataBetterAuth)
              if (dataBetterAuth.user == null) throw new ErrorPlus('Senha incorreta.', { httpStatusCode: HttpStatusCode.unAuthorized });
              const cookiesArray = await CookiesInResponse(dataBetterAuthResp.headers.getSetCookie());
              for (const item of cookiesArray) {
                ctrlApiExec.setCookie(CookieHttpMake(item.name, item.value, { httpOnly: true }))
                if (item.name != cookieBetterAuthSession.data &&
                  item.name != cookieBetterAuthSession.token)
                  await SystemMsgSvrASync(CategMsgSystem.error, 'auth.api.signInEmail', `cookie betterAuth '${item.name}' não previsto`, ctrlApiExec.ctrlContext, { email: parm.email });
              }
            }
            catch (error: any) {
              throw new ErrorPlus('Email ou senha inválida');
            }
          }
          else {
            try {
              console.log('email não existe em betterAuth', parm.email);
              const signUpEmailResp = await auth.api.signUpEmail({
                body: {
                  email: parm.email,
                  password: parmPsw,
                  name: userDb.nome || parm.email,
                },
                headers: new Headers(req.headers as any),
              });
              console.log('signUpEmail', signUpEmailResp);
            }
            catch (error: any) {
              throw new ErrorPlus('Erro na criação do usuário');
            }
          }
          // if (dataBetterAuth.headers) {
          //   dataBetterAuth.headers.forEach((value, key) => {
          //     res.setHeader(key, value);
          //   });
          // }
          //const dataBetterAuth = await dataBetterAuthResp.json();
          //if (dataBetterAuth.user == null) throw new ErrorPlus('Senha incorreta.', { httpStatusCode: HttpStatusCode.unAuthorized });
          // const cookiesArray = await CookiesInResponse(ctrlSvrExec, dataBetterAuthResp.headers.getSetCookie());
          // for (const item of cookiesArray) {
          //   ctrlSvrExec.setCookie(CookieBetterAuthMake(item.name, item.value));
          //   if (item.name != cookieBetterAuthSession.data &&
          //     item.name != cookieBetterAuthSession.token)
          //     await SystemMsgSvrError('auth.api.signInEmail', `cookie betterAuth '${item.name}' não previsto`, ctrlSvrExec.ctrlContext, `email: ${parmUse.email}`);
          // }

          const hasSomeCCResponsavel = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailResponsavel: userDb.email })) != null;
          const hasSomeCCPlanejador = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailPlanejador: userDb.email })) != null;
          const hasSomeCCConsulta = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailConsulta: userDb.email })) != null;
          loggedUserNow = User.loggedUser(userDb, parm.email, agora, agora, agora, hasSomeCCResponsavel, hasSomeCCPlanejador, hasSomeCCConsulta); // , cookieUserConfig.TTLSeconds
          await CheckBlockAsync(loggedUserNow);
        }

        //await HttpCriptoCookieCmdASync(req, res, `user:${parm.cmd}`, cookieUserConfig, 'set', { domain: EnvDeployConfig().domain }, loggedUserNow); // , `user-${parm.cmd}`
        ctrlApiExec.setCookie(CookieHttpMake(cookiesSys.loggedUser, JSON.stringify(loggedUserNow), { httpOnly: true }));
        resumoApi.jsonData({ value: loggedUserNow });
      }

      else if (parm.cmd == CmdApi.signOut) {

        try {
          await auth.api.signOut({
            headers: new Headers(req.headers as any),
            // asResponse: true  não funciona com signOut @!!!!!!!!!!
          });
        }
        catch (error: any) {
          console.log('signOut error', error.message);
        }
        ctrlApiExec.removeCookie(cookieBetterAuthSession.data);
        ctrlApiExec.removeCookie(cookieBetterAuthSession.token);

        if (loggedUserReq == null) { } // dbgWarn('signOut para usuario não logado', parm);
        else {
          // //await UserLogWriteASync(new ObjectId(loggedUserReq.userIdStr), loggedUserReq.email, `${parm.cmd}`, ctrlApiExec, new ObjectId(loggedUserReq.sessionIdStr));
          // await LoggedUserSessionModel.updateOne({ _id: new ObjectId(loggedUserReq.sessionIdStr) }, { dateSignOut: agora } as LoggedUserSession);
          //await HttpCriptoCookieCmdASync(req, res, `user:${parm.cmd}`, cookieUserConfig, 'set', { domain: EnvDeployConfig().domain }, null); // , `user-${parm.cmd}(${parm.caller})`
          ctrlApiExec.removeCookie(cookiesSys.loggedUser);
        }
        resumoApi.jsonData({});
      }

      else if (parm.cmd == CmdApi.getLoggedUserCookie) {
        let loggedUserFromCookie: LoggedUser = null;
        if (loggedUserReq != null) {
          loggedUserFromCookie = loggedUserReq;
          const userDb = await UserModel.findOne({ _id: new ObjectId(loggedUserFromCookie.userIdStr) }).lean() as UserMd;
          if (userDb != null) {
            const hasSomeCCResponsavel = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailResponsavel: userDb.email })) != null;
            const hasSomeCCPlanejador = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailPlanejador: userDb.email })) != null;
            const hasSomeCCConsulta = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailConsulta: userDb.email })) != null;
            loggedUserFromCookie = User.loggedUser(userDb, loggedUserReq.emailSigned, loggedUserFromCookie.firstSignIn, loggedUserFromCookie.lastReSignIn,
              loggedUserFromCookie.lastActivity, hasSomeCCResponsavel, hasSomeCCPlanejador, hasSomeCCConsulta); // , cookieUserConfig.TTLSeconds
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
        const userDb = await UserModel.findOne({ email: loggedUserReq?.email }).lean() as UserMd;
        CheckApiAuthorized(apiSelf, userDb, loggedUserReq?.email);

        if (parm.cmd == CmdApi.reSignIn) {
          const hasSomeCCResponsavel = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailResponsavel: userDb.email })) != null;
          const hasSomeCCPlanejador = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailPlanejador: userDb.email })) != null;
          const hasSomeCCConsulta = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailConsulta: userDb.email })) != null;
          const loggedUser = User.loggedUser(userDb, loggedUserReq.emailSigned, loggedUserReq.firstSignIn, agora, agora, hasSomeCCResponsavel, hasSomeCCPlanejador, hasSomeCCConsulta); // , cookieUserConfig.TTLSeconds
          loggedUser.emailSigned = loggedUserReq.emailSigned;
          //await CookieUserSetApiAccessASync(ctrlApiExec, loggedUser);
          //await UserLogWriteASync(userDb._id, Unscramble(userDb.email_messy), `${parm.cmd}`, agora, loggedUserSessionIdUse);
          resumoApi.jsonData({ value: loggedUser });
          //await HttpCriptoCookieCmdASync(req, res, `user:${parm.cmd}`, cookieUserConfig, 'set', { domain: EnvDeployConfig().domain }, loggedUser);
          ctrlApiExec.setCookie(CookieHttpMake(cookiesSys.loggedUser, JSON.stringify(loggedUser), { httpOnly: true }));
          deleteIfOk = true;
        }

        else
          throw new Error(`Cmd '${parm.cmd}' inválido.`);
      }

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
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, loggedUserReq);
};