import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';

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

import { Viagem } from '../../../../appCydag/modelTypes';
import { OperInProcessoOrcamentario, ProcessoOrcamentarioStatusMd, RevisaoValor, TipoPlanejViagem } from '../../../../appCydag/types';
import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { apisApp, rolesApp } from '../../../../appCydag/endPoints';
import { FuncionarioModel, LocalidadeModel, UserModel, ValoresTransferModel } from '../../../../appCydag/models';
import { ProcessoOrcamentarioCentroCustoModel, ProcessoOrcamentarioModel, ViagemModel } from '../../../../appCydag/models';
import { ccsAuthArray, CheckProcCentroCustosAuth, IAuthCC, procsCentroCustosConfigAuthAllYears } from '../../../../appCydag/utilServer';
import { amountParseApp } from '../../../../appCydag/util';

import { CmdApi_Viagem as CmdApi, IChangedLine, LineState } from './types';
import { configCydag } from '../../../../appCydag/configCydag';

const apiSelf = apisApp.viagem;
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
        resumoApi.jsonData({ value: { procsCentrosCustoConfigAllYears, centroCustoArray } });
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
        const funcionarioArray = await FuncionarioModel.find({ ano, centroCusto }).lean().sort({ origem: 1, refer: 1 });
        //const localidadeArray = await LocalidadeModel.find({ cod: { $ne: processoOrcamentarioCentroCusto.localidade } }).sort({ cod: 1 });
        const localidadeArray = await LocalidadeModel.find().lean().sort({ cod: 1 });
        const valoresLocalidadeDestinoArray = await ValoresTransferModel.find({ localidadeOrigem: processoOrcamentarioCentroCusto.localidade }).lean().sort({ localidadeDestino: 1 });
        const localidadesComValor = valoresLocalidadeDestinoArray.map((x) => x.localidadeDestino);
        const localidadeDestinoArray = localidadeArray.filter((x) => localidadesComValor.includes(x.cod));
        if (parm.cmd == CmdApi.itensGet) {
          const filterDb: any = { ano, revisao, centroCusto };
          const viagemItens = await ViagemModel.find(filterDb).lean().sort({ localidadeDestino: 1, funcId: 1, obs: 1 });

          const userCanWrite = UserCanWrite(processoOrcamentarioCentroCusto);
          resumoApi.jsonData({
            value: {
              processoOrcamentario, processoOrcamentarioCentroCusto, localidadeArray, localidadeDestinoArray, funcionarioArray,
              viagemItens, userCanWrite
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

          for (const changedLine of (changedLines as IChangedLine[])) {
            const viagemEdit = changedLine.dataEdit;
            const key = changedLine.key;

            let viagemData: any = null;
            if (changedLine.lineState === LineState.inserted ||
              changedLine.lineState === LineState.updated) {
              viagemData = viagemEdit.tipoPlanejViagem === TipoPlanejViagem.porPremissa
                ? {
                  localidadeDestino: viagemEdit.localidadeDestino,
                  funcId: viagemEdit.funcId,
                  qtdViagens: amountParseApp(viagemEdit.qtdViagens, 0),
                  mediaPernoites: amountParseApp(viagemEdit.mediaPernoites, 0),
                }
                : {
                  obs: viagemEdit.obs,
                  valor: amountParseApp(viagemEdit.valor, configCydag.decimalsValsInput),
                };
              viagemData.tipoPlanejViagem = viagemEdit.tipoPlanejViagem;
              viagemData.lastUpdated = agora;
            }
            if (changedLine.lineState === LineState.inserted) {
              // try {
              await ViagemModel.create({ ano, revisao, centroCusto, ...viagemData, created: agora });
              // } catch (error) {
              //   if (error.code == DbErrors.duplicateKey.code)
              //     throw new ErrorPlus(`Registro duplicado para Localidade Destino ${viagemEdit.localidadeDestino}, Func: ${viagemEdit.funcId || ''}`);
              //   else
              //     throw error;
              // }
            }
            else if (changedLine.lineState === LineState.updated)
              await ViagemModel.updateOne(Viagem.fill({ ano, revisao, centroCusto, _id: new ObjectId(key._id) }), viagemData);
            else if (changedLine.lineState === LineState.deleted)
              await ViagemModel.deleteOne(Viagem.fill({ ano, revisao, centroCusto, _id: new ObjectId(key._id) }));
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