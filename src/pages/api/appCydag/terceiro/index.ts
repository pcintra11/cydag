import type { NextApiRequest, NextApiResponse } from 'next';

import { ConnectDbASync, CloseDbASync } from '../../../../libServer/dbMongo';

import { ErrorPlus, SleepMsDevRandom } from '../../../../libCommon/util';
import { csd } from '../../../../libCommon/dbg';
//import { CheckRoleAllowed } from '../../../../libCommon/endPoints';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { isAmbNone } from '../../../../app_base/envs';

import { Terceiro } from '../../../../appCydag/modelTypes';
import { OperInProcessoOrcamentario, ProcessoOrcamentarioStatusMd, RevisaoValor } from '../../../../appCydag/types';
import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { apisApp, rolesApp } from '../../../../appCydag/endPoints';
import { FuncaoTerceiroModel, UserModel } from '../../../../appCydag/models';
import { ProcessoOrcamentarioCentroCustoModel, ProcessoOrcamentarioModel, TerceiroModel } from '../../../../appCydag/models';
import { ccsAuthArray, CheckProcCentroCustosAuth, IAuthCC, procsCentroCustosConfigAuthAllYears } from '../../../../appCydag/utilServer';
import { amountParseApp } from '../../../../appCydag/util';

import { CmdApi_Terceiro as CmdApi, IChangedLine, LineState } from './types';
import { configCydag } from '../../../../appCydag/configCydag';

const apiSelf = apisApp.terceiro;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  const loggedUserReq = await LoggedUserReqASync(req, res);
  const ctrlApiExec = GetCtrlApiExec(req, res, loggedUserReq, ['cmd'], ['_id']);
  const parm = ctrlApiExec.parm;

  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();
  let deleteIfOk = false;
  await SleepMsDevRandom(null, ctrlApiExec.ctrlContext, 'main');

  try {
    await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
    const apiLogProc = await ApiLogStart(ctrlApiExec, loggedUserReq);

    try {
      if (loggedUserReq == null) throw new ErrorPlus('Usuário não está logado.');
      await CheckBlockAsync(loggedUserReq);
      const userDb = await UserModel.findOne({ email: loggedUserReq?.email }).lean();
      CheckApiAuthorized(apiSelf, userDb, loggedUserReq?.email);

      const UserCanWrite = (ccConfig: any) => (
        ccConfig.emailResponsavel == loggedUserReq.email ||
        ccConfig.emailPlanejador == loggedUserReq.email ||
        loggedUserReq.roles.includes(rolesApp.gestorContr) ||
        loggedUserReq.roles.includes(rolesApp.operContr)
      );

      const authCC: IAuthCC = { incluiPlanejadorCC: true, incluiConsultaCC: true, incluiPerfilGestorContr: true, incluiPerfilOperContr: true, incluiPerfilConsTodosCCs: true };

      if (parm.cmd == CmdApi.crudInitialization) {
        const procsCentrosCustoConfigAllYears = await procsCentroCustosConfigAuthAllYears(loggedUserReq, authCC);
        const centroCustoArray = await ccsAuthArray(procsCentrosCustoConfigAllYears);
        const funcaoTerceirosArray = await FuncaoTerceiroModel.find().lean().sort({ cod: 1 });

        resumoApi.jsonData({ value: { procsCentrosCustoConfigAllYears, centroCustoArray, funcaoTerceirosArray } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.itensGet ||
        parm.cmd == CmdApi.itensSet) {
        const { ano, centroCusto, revisao } = parm.filter || {};
        const processoOrcamentario = await ProcessoOrcamentarioModel.findOne({ ano }).lean();
        if (processoOrcamentario == null) throw new ErrorPlus(`Processo Orçamentário para ${ano} não encontrado`);
        const processoOrcamentarioCentroCusto = await ProcessoOrcamentarioCentroCustoModel.findOne({ ano, centroCusto }).lean();
        if (processoOrcamentarioCentroCusto == null) throw new ErrorPlus(`Centro de Custo ${centroCusto} não configurado para o Processo Orçamentário`);
        CheckProcCentroCustosAuth(loggedUserReq, processoOrcamentarioCentroCusto, authCC);
        if (parm.cmd == CmdApi.itensGet) {
          const filterDb: any = { ano, revisao, centroCusto };
          const terceiroItens = await TerceiroModel.find(filterDb).lean().sort({ refer: 1 });

          const userCanWrite = UserCanWrite(processoOrcamentarioCentroCusto);
          resumoApi.jsonData({
            value: {
              processoOrcamentario, processoOrcamentarioCentroCusto,
              terceiroItens, userCanWrite
            }
          });
          deleteIfOk = true;
        }

        else if (parm.cmd == CmdApi.itensSet) {
          if (revisao != RevisaoValor.atual) throw new ErrorPlus('Essa revisão não pode ser alterada');
          ProcessoOrcamentarioStatusMd.checkOperAllowed(OperInProcessoOrcamentario.altValoresPlanejados, processoOrcamentario.status);
          if (processoOrcamentarioCentroCusto.planejamentoEmAberto != true) throw new ErrorPlus('Centro de Custo não está aberto para lançamentos');
          if (!UserCanWrite(processoOrcamentarioCentroCusto)) throw new ErrorPlus('Sem autorização para gravação');

          const changedLines = parm.data.changedLines as IChangedLine[];

          let lastReferSeq = 0;
          if (changedLines.find((x) => x.lineState == LineState.inserted) != null) {
            if (!processoOrcamentarioCentroCusto.permiteNovosClb)
              throw new ErrorPlus('Centro de Custo esta bloqueado para inclusão de novos colaboradores');
            const lastRefer = await TerceiroModel.aggregate([
              { $match: { ano, revisao, centroCusto } },
              { $sort: { refer: 1 } },
              {
                $group: {
                  _id: { all: '*' },
                  refer: { $last: '$refer' },
                }
              },
              {
                $project: {
                  _id: 0,
                  refer: '$refer',
                }
              },
            ]);
            if (lastRefer.length === 1) {
              const comps = lastRefer[0].refer.split('_');
              if (comps.length == 2) {
                lastReferSeq = Number(comps[1]);
                if (isNaN(lastReferSeq))
                  throw new ErrorPlus(`Não foi possível determinar a referencia para novo terceiro devido a erro no último incluído (${lastRefer[0].refer})`);
              }
            }
          }

          for (const changedLine of (changedLines as IChangedLine[])) {
            const terceirosEdit = changedLine.dataEdit;
            const key = changedLine.key;
            let refer;
            if (changedLine.lineState === LineState.inserted) {
              if ((++lastReferSeq) > 999)
                throw new ErrorPlus('Excedido o máximo de terceiros para o centro de custo (999)');
              refer = `NOVO_${lastReferSeq.toString().padStart(3, '0')}`;
            }
            else
              refer = key.refer;

            let terceiroData: Terceiro = null;
            if (changedLine.lineState === LineState.inserted ||
              changedLine.lineState === LineState.updated) {
              terceiroData = Terceiro.fill({
                nome: terceirosEdit.nome,
                fornecedor: terceirosEdit.fornecedor,
                funcaoTerceiros: terceirosEdit.funcaoTerceiros,
                valMeses: terceirosEdit.valMeses.map((x) => amountParseApp(x, configCydag.decimalsValsInput)),
                lastUpdated: agora,
              });
            }
            if (changedLine.lineState === LineState.inserted)
              await TerceiroModel.create({ ano, revisao, centroCusto, refer, ...terceiroData, created: agora });
            else if (changedLine.lineState === LineState.updated)
              await TerceiroModel.updateOne(Terceiro.fill({ ano, revisao, centroCusto, refer }), terceiroData);
            else if (changedLine.lineState === LineState.deleted)
              await TerceiroModel.deleteOne(Terceiro.fill({ ano, revisao, centroCusto, refer }));
            else
              throw new Error(`lineState inválido (${changedLine.lineState})`);
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
    await CloseDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 2', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }

  const elapsedMsApi = resumoApi.json();
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, loggedUserReq);
};