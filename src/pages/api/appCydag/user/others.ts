import type { NextApiRequest, NextApiResponse } from 'next';
//import _ from 'underscore';

import { CookieUserConfig } from '../../../../base/loggedUserSvr';
import { ConnectDbASync, CloseDbASync } from '../../../../base/db/functions';

import { ErrorPlus, SleepMsDevRandom } from '../../../../libCommon/util';
import { csd, dbgWarn } from '../../../../libCommon/dbg';
import { EnvDeployConfig } from '../../../../libCommon/envs';
import { isAmbNone } from '../../../../libCommon/isAmb';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
//import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';
import { HttpCriptoCookieCmdASync } from '../../../../libServer/httpCryptoCookie';

import { apisApp } from '../../../../appCydag/endPoints';
import { LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { ProcessoOrcamentarioCentroCustoModel, UserModel } from '../../../../appCydag/models';
import { User } from '../../../../appCydag/modelTypes';
import { CmdApi_UserOthers as CmdApi } from './types';
//import { LoggedUser } from '../../../../appCydag/loggedUser';
import { Crypt } from '../../../../libServer/crypt';
import { TokenResetPswDecodeASync, TokenResetPswEncodeASync } from '../../../../appCydag/token';
import { SendLink_resetPswASync } from '../../../../appCydag/emailMessages';

const saltRounds = 10;

const apiSelf = apisApp.userOthers;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  const ctrlApiExec = GetCtrlApiExec(req, res, ['cmd'], ['_id']);
  const loggedUserReq = await LoggedUserReqASync(ctrlApiExec);
  const parm = ctrlApiExec.parm;
  const parmPsw = parm.psw;
  const parmPswConfirm = parm.pswConfirm;
  if (parm.psw != null) parm.psw = '****';
  if (parm.pswConfirm != null) parm.pswConfirm = '****';

  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();
  const deleteIfOk = false;
  await SleepMsDevRandom(null, ctrlApiExec.context());

  try {
    await ConnectDbASync({ ctrlApiExec });
    const apiLogProc = await ApiLogStart(ctrlApiExec, loggedUserReq);

    try {

      const cookieUserConfig = CookieUserConfig();

      if (parm.cmd == CmdApi.resetPsw) {
        //const data = parm.data;
        let tokenDecode = null;
        try {
          tokenDecode = await TokenResetPswDecodeASync(parm.token);
          if (tokenDecode.expired)
            throw new Error('expirado');
        } catch (error) {
          throw new ErrorPlus(`Link inválido: ${error.message}.`);
        }
        const { payLoad } = tokenDecode;
        if (parm.email != payLoad.email)
          throw new ErrorPlus('Email incorreto.', { data: { fldName: User.F.email } });
        const email = payLoad.email;

        // const fldError = ValidateObjectFirstError({ ...data }, userSchema.resetPsw);
        // if (fldError != null)
        //   throw new ErrorPlus(fldError.msg, { data: { fldName: fldError.fldName } });
        if (parmPswConfirm != parmPsw)
          throw new ErrorPlus('Senha não confere.', { data: { fldName: 'pswConfirm' } });

        const userDb = await UserModel.findOne({ email: email }).lean();
        if (userDb == null) throw new ErrorPlus('Email não encontrado!');
        if (userDb.tokenResetPsw != parm.token) throw new ErrorPlus('O link utilizado já está defasado.');

        let psw = null;
        try {
          psw = Crypt.hashSync(parmPsw, saltRounds);
        } catch (error) {
          throw new Error(`Erro na geração da senha criptografada. ${error.message}`);
        }
        await UserModel.updateOne({ _id: userDb._id }, {
          psw,
          tokenResetPsw: null,
          lastUpdated: agora,
          //$push: { updates: { date: agora, reason: `user-${parm.cmd}` } as UpdateReason },
        });

        const hasSomeCCResponsavel = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailResponsavel: userDb.email })) != null;
        const hasSomeCCPlanejador = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailPlanejador: userDb.email })) != null;
        const hasSomeCCConsulta = (await ProcessoOrcamentarioCentroCustoModel.findOne({ emailConsulta: userDb.email })) != null;
        const loggedUserNow = User.loggedUser(userDb, parm.email, agora, agora, agora, hasSomeCCResponsavel, hasSomeCCPlanejador, hasSomeCCConsulta, cookieUserConfig.TTLSeconds);
        await CheckBlockAsync(loggedUserNow);

        await HttpCriptoCookieCmdASync(ctrlApiExec, `user:${parm.cmd}`, cookieUserConfig, 'set', { domain: EnvDeployConfig().domain }, loggedUserNow);
        resumoApi.jsonData({ value: loggedUserNow });
      }

      else if (parm.cmd == CmdApi.emailLink) {
        const userDb = await UserModel.findOne({ email: parm.email }).lean();
        if (userDb == null)
          throw new ErrorPlus('Conta não encontrada!', { data: { fldName: 'email' } });

        //await UserLogWriteASync(userDb._id, userDb.email, `${parm.cmd}-${parm.linkType}`, ctrlApiExec);

        const { token, expireIn } = await TokenResetPswEncodeASync(parm.email);
        await UserModel.updateOne({ _id: userDb._id }, {
          tokenResetPsw: token,
          lastUpdated: agora,
          //$push: { updates: { date: agora, reason: `user-${parm.cmd}-${parm.linkType}` } as UpdateReason },
        });
        const { sentSync } = await SendLink_resetPswASync(ctrlApiExec, userDb._id, userDb.email, userDb.nome, { token }, expireIn);
        if (sentSync)
          resumoApi.jsonData({ value: { message: 'O link para reset de senha foi enviado' } });
        else
          resumoApi.jsonData({ value: { message: 'O link para reset de senha será enviado em breve. Aguarde por favor para continuar o processo' } });
      }

      else
        throw new Error(`Cmd '${parm.cmd}' inválido.`);

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