import type { NextApiRequest, NextApiResponse } from 'next';
//import _ from 'underscore';

import { ConnectDbASync, CloseDbASync } from '../../../../base/db/functions';

import { ErrorPlus, SleepMsDevRandom } from '../../../../libCommon/util';
import { csd, dbgWarn } from '../../../../libCommon/dbg';
import { isAmbNone } from '../../../../libCommon/isAmb';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
//import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { apisApp } from '../../../../appCydag/endPoints';
import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { LocalidadeModel, ProcessoOrcamentarioModel, UserModel, ValoresTransferModel } from '../../../../appCydag/models';
import { ValoresTransfer } from '../../../../appCydag/modelTypes';
import { OperInProcessoOrcamentario, ProcessoOrcamentarioStatusMd, RevisaoValor } from '../../../../appCydag/types';

import { CmdApi_ValoresTransfer as CmdApi, IChangedLine } from './types';
import { amountParse } from '../../../../appCydag/util';
import { configApp } from '../../../../appCydag/config';

const apiSelf = apisApp.valoresTransfer;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  const ctrlApiExec = GetCtrlApiExec(req, res, ['cmd'], ['_id']);
  const loggedUserReq = await LoggedUserReqASync(ctrlApiExec);
  const parm = ctrlApiExec.parm;

  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();
  let deleteIfOk = false;
  await SleepMsDevRandom(null, ctrlApiExec.context());

  try {
    await ConnectDbASync({ ctrlApiExec });
    const apiLogProc = await ApiLogStart(ctrlApiExec, loggedUserReq);

    try {
      if (loggedUserReq == null) throw new ErrorPlus('Usuário não está logado.');
      await CheckBlockAsync(loggedUserReq);
      const userDb = await UserModel.findOne({ email: loggedUserReq?.email }).lean();
      CheckApiAuthorized(apiSelf, userDb, loggedUserReq?.email);

      if (parm.cmd == CmdApi.initialization) {
        const processoOrcamentarioArray = await ProcessoOrcamentarioModel.find().lean().sort({ ano: -1 });
        const localidadeArray = await LocalidadeModel.find().lean().sort({ cod: 1 });
        resumoApi.jsonData({ value: { processoOrcamentarioArray, localidadeArray } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.valoresGet ||
        parm.cmd == CmdApi.valoresSet) {
        const { ano, revisao, localidadeOrigem } = parm.filter || {};
        const processoOrcamentario = await ProcessoOrcamentarioModel.findOne({ ano }).lean();
        if (processoOrcamentario == null) throw new ErrorPlus(`Processo Orçamentário para ${ano} não encontrado`);
        if (parm.cmd == CmdApi.valoresGet) {
          const filterDb = { ano, revisao, localidadeOrigem };
          const valoresTransfer = await ValoresTransferModel.find(filterDb).lean().sort({ localidadeDestino: 1 });
          resumoApi.jsonData({ value: { processoOrcamentario, valoresTransfer } });
          deleteIfOk = true;
        }

        else if (parm.cmd == CmdApi.valoresSet) {
          if (revisao != RevisaoValor.atual) throw new ErrorPlus('Essa revisão não pode ser alterada');
          ProcessoOrcamentarioStatusMd.checkOperAllowed(OperInProcessoOrcamentario.altPremissas, processoOrcamentario.status);

          const changedLines = parm.data.changedLines as IChangedLine[];

          for (const changedLine of changedLines) {
            const dataEdit = changedLine.dataEdit;
            const ValoresTransferData = {
              valMeses: dataEdit.valMeses.map((x) => amountParse(x, configApp.decimalsValsInput)),
            } as ValoresTransfer;
            const someInf = ValoresTransferData.valMeses.reduce((prev, curr) => prev || curr != null, false);
            const key = {
              ano, revisao, localidadeOrigem, localidadeDestino: changedLine.key.localidadeDestino,
            } as ValoresTransfer;
            if (someInf)
              await ValoresTransferModel.findOneAndUpdate(key, { valMeses: ValoresTransferData.valMeses, lastUpdated: agora }, { upsert: true });
            else
              await ValoresTransferModel.deleteOne(key);
          }
          resumoApi.jsonData({});
        }
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