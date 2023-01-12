import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
//import _ from 'underscore';

import { ConnectDbASync, CloseDbASync } from '../../../../base/db/functions';

import { ErrorPlus, SleepMsDevRandom } from '../../../../libCommon/util';
import { dbgWarn } from '../../../../libCommon/dbg';
import { isAmbNone } from '../../../../libCommon/isAmb';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ResumoApi } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
//import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { apisApp } from '../../../../appCydag/endPoints';
import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { AgrupPremissasModel, EmpresaModel, PremissaModel, ProcessoOrcamentarioModel, UserModel, ValoresPremissaModel } from '../../../../appCydag/models';
import { ValoresPremissa } from '../../../../appCydag/modelTypes';
import { OperInProcessoOrcamentario, ProcessoOrcamentarioStatusMd, RevisaoValor, TipoSegmCentroCusto } from '../../../../appCydag/types';

import { CmdApi_PremissaGeral as CmdApi, IChangedLine } from './types';

const apiSelf = apisApp.premissasGerais;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
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
      CheckApiAuthorized(apiSelf, await UserModel.findOne({ email: loggedUserReq?.email }).lean(), loggedUserReq?.email);

      const premissaArray = await PremissaModel.find().lean().sort({ cod: 1 });

      if (parm.cmd == CmdApi.initialization) {
        const processoOrcamentarioArray = await ProcessoOrcamentarioModel.find().lean().sort({ ano: -1 });
        const empresaArray = await EmpresaModel.find().lean().sort({ cod: 1 });
        const agrupPremissasArray = await AgrupPremissasModel.find().lean().sort({ cod: 1 });
        resumoApi.jsonData({ value: { processoOrcamentarioArray, premissaArray, empresaArray, agrupPremissasArray } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.valoresGet ||
        parm.cmd == CmdApi.valoresSet) {
        const { ano, revisao, empresa, agrupPremissas } = parm.filter || {};
        const processoOrcamentario = await ProcessoOrcamentarioModel.findOne({ ano }).lean();
        if (processoOrcamentario == null) throw new ErrorPlus(`Processo Orçamentário para ${ano} não encontrado`);
        if (parm.cmd == CmdApi.valoresGet) {
          const filterDb = {
            ano,
            revisao,
            $or: [
              { tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, empresa },
              { tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, agrupPremissas },
            ],
          };
          const valoresPremissa = await ValoresPremissaModel.find(filterDb).lean().sort({ premissa: 1, agrupPremissas: 1, empresa: 1, tipoColaborador: 1 });
          resumoApi.jsonData({ value: { processoOrcamentario, valoresPremissa } });
          deleteIfOk = true;
        }

        else if (parm.cmd == CmdApi.valoresSet) {
          if (revisao != RevisaoValor.atual) throw new ErrorPlus('Essa revisão não pode ser alterada');
          ProcessoOrcamentarioStatusMd.checkOperAllowed(OperInProcessoOrcamentario.altPremissas, processoOrcamentario.status);

          const changedLines = parm.data.changedLines as IChangedLine[];

          for (const changedLine of changedLines) {
            const someInf = changedLine.valMeses.reduce((prev, curr) => prev || curr != null, false) || changedLine.ativa;
            const key = {
              ano, revisao,
              premissa: changedLine.key.premissa, tipoSegmCentroCusto: changedLine.key.tipoSegmCentroCusto, segmTipoClb: changedLine.key.segmTipoClb,
              empresa: changedLine.key.empresa, agrupPremissas: changedLine.key.agrupPremissas, tipoColaborador: changedLine.key.tipoColaborador,
            } as ValoresPremissa;
            if (someInf)
              await ValoresPremissaModel.findOneAndUpdate(key, { ativa: changedLine.ativa, valMeses: changedLine.valMeses, lastUpdated: agora }, { upsert: true });
            else
              await ValoresPremissaModel.deleteOne(key);
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