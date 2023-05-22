import type { NextApiRequest, NextApiResponse } from 'next';
import _ from 'underscore';

import { ConnectDbASync, CloseDbASync } from '../../../../libServer/dbMongo';
import { NotifyAdmASync } from '../../../../libServer/notifyAdm';

import { BinSearchIndex, BinSearchItem, BinSearchProp, compareForBinSearch, compareForBinSearchArray, CtrlCollect, DateDisp, ErrorPlus, OnlyPropsInClass, SleepMsDevRandom } from '../../../../libCommon/util';
import { csd, dbgError } from '../../../../libCommon/dbg';
import { CallApiSvrASync } from '../../../../fetcher/fetcherSvr';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { CtrlApiExec, GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync, CheckTimeOutAndAbort } from '../../../../libServer/alertTimeExecApi';
//import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { EnvSvrInterfaceSapRealizadoConfig } from '../../../../appCydag/envs';
import { apisApp, quadroPage, rolesApp } from '../../../../appCydag/endPoints';
import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { ViagemModel, TerceiroModel, UserModel, ValoresLocalidadeModel, ValoresTransferModel, UnidadeNegocioModel, ValoresRealizadosInterfaceSapModel, DiretoriaModel, CtrlInterfaceModel, ValoresPlanejadosHistoricoModel, GerenciaModel, databaseInterfaceSap } from '../../../../appCydag/models';
import { agrupPremissasCoringa, empresaCoringa, Premissa, ProcessoOrcamentario, ProcessoOrcamentarioCentroCusto, ValoresRealizados, ValoresPremissa, UnidadeNegocio, CtrlInterface, ValoresRealizadosInterfaceSap } from '../../../../appCydag/modelTypes';
import { InterfaceSapStatus, InterfaceSapCateg, OperInProcessoOrcamentario, OrigemClasseCusto, ProcessoOrcamentarioStatus, ProcessoOrcamentarioStatusMd, RevisaoValor, TipoSegmCentroCusto, ValoresAnaliseAnual, ValoresComparativoAnual, ValoresPlanejadosDetalhes, ValoresTotCentroCustoClasseCusto, ValoresAnaliseRealPlan } from '../../../../appCydag/types';

import { ClasseCustoModel, ClasseCustoRestritaModel, FatorCustoModel, FuncionarioModel, PremissaModel, ProcessoOrcamentarioCentroCustoModel, ProcessoOrcamentarioModel, ValoresImputadosModel, ValoresPlanejadosCalcModel, ValoresPremissaModel, ValoresRealizadosModel } from '../../../../appCydag/models';
import { ValoresImputados } from '../../../../appCydag/modelTypes';
import { anoAdd, mesesFld, roundInterface, sumValMeses } from '../../../../appCydag/util';
import { accessAllCCs, ccsAuthArray, CheckProcCentroCustosAuth, IAuthCC, procsCentroCustosConfigAuthAllYears } from '../../../../appCydag/utilServer';

import { CmdApi_ValoresContas as CmdApi, IChangedLine } from './types';
import { calcContaDespCorr, contasCalc, FuncionariosForCalc, premissaCod, PremissaValores, ValsContaCalc } from './calcsCydag';
import { isAmbNone } from '../../../../app_base/envs';

const apiSelf = apisApp.valoresContas;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  const ctrlApiExec = GetCtrlApiExec(req, res, ['cmd'], ['ano']);  // #!!!! filter

  const loggedUserReq = await LoggedUserReqASync(ctrlApiExec);
  const parm = ctrlApiExec.parm;

  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();
  let deleteIfOk = false;
  await SleepMsDevRandom(null, ctrlApiExec.ctrlContext, 'main');

  try {
    await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
    await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext, database: databaseInterfaceSap });
    const apiLogProc = await ApiLogStart(ctrlApiExec, loggedUserReq);

    try {
      if (loggedUserReq == null) throw new ErrorPlus('Usuário não está logado.');
      await CheckBlockAsync(loggedUserReq);
      CheckApiAuthorized(apiSelf, await UserModel.findOne({ email: loggedUserReq?.email }).lean(), loggedUserReq?.email);

      const classeCustoRestritaArrayGet = async () => {
        const documentsDb = await ClasseCustoRestritaModel.find().lean().sort({ classeCusto: 1 });
        return documentsDb;
      };

      const UserCanWrite = (ccConfig: any) => (
        ccConfig.emailResponsavel == loggedUserReq.email ||
        ccConfig.emailPlanejador == loggedUserReq.email ||
        loggedUserReq.roles.includes(rolesApp.gestorContr) ||
        loggedUserReq.roles.includes(rolesApp.operContr)
      );

      const authCCQuadroInput: IAuthCC = { incluiPlanejadorCC: true, incluiPerfilGestorContr: true, incluiPerfilOperContr: true };
      const authCCQuadroCons: IAuthCC = { ...authCCQuadroInput, incluiConsultaCC: true, incluiPerfilConsTodosCCs: true };

      if (parm.cmd == CmdApi.quadroInitialization) {
        const variant = parm.variant;
        const incluiContasCalc = variant === quadroPage.variant.cons ? true : false;
        const authCC = variant === quadroPage.variant.cons ? authCCQuadroCons : authCCQuadroInput;

        const classeCustoRestritaArray = await classeCustoRestritaArrayGet();
        const fatorCustoArray = await FatorCustoModel.find().lean().sort({ fatorCusto: 1 });
        const classeCustoArray = incluiContasCalc
          ? await ClasseCustoModel.find().lean().sort({ classeCusto: 1 })
          : await ClasseCustoModel.find({ origem: { $in: [OrigemClasseCusto.inputada, OrigemClasseCusto.totalImputada] } }).lean().sort({ classeCusto: 1 });
        const procsCentrosCustoConfigAllYears = await procsCentroCustosConfigAuthAllYears(loggedUserReq, authCC);
        const centroCustoArray = await ccsAuthArray(procsCentrosCustoConfigAllYears);

        resumoApi.jsonData({ value: { procsCentrosCustoConfigAllYears, centroCustoArray, classeCustoRestritaArray, fatorCustoArray, classeCustoArray } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.getProcsOrcCCsAuthQuadroCons) {
        const procsCentrosCustoConfigAllYears = await procsCentroCustosConfigAuthAllYears(loggedUserReq, authCCQuadroCons);
        const centroCustoArray = await ccsAuthArray(procsCentrosCustoConfigAllYears);
        resumoApi.jsonData({ value: { procsCentrosCustoConfigAllYears, centroCustoArray } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.quadroInputItensGet ||
        parm.cmd == CmdApi.quadroInputItensSet) {
        const { ano, centroCusto, revisao } = parm.filter || {};
        const processoOrcamentario = await ProcessoOrcamentarioModel.findOne({ ano }).lean();
        if (processoOrcamentario == null) throw new ErrorPlus(`Processo Orçamentário para ${ano} não encontrado`);
        const processoOrcamentarioCentroCusto = await ProcessoOrcamentarioCentroCustoModel.findOne({ ano, centroCusto }).lean();
        if (processoOrcamentarioCentroCusto == null) throw new ErrorPlus(`Centro de Custo ${centroCusto} não configurado para o Processo Orçamentário`);
        CheckProcCentroCustosAuth(loggedUserReq, processoOrcamentarioCentroCusto, authCCQuadroInput);
        if (parm.cmd == CmdApi.quadroInputItensGet) {
          const valsPlanejados = await GetValsPlanejados(processoOrcamentario, revisao, [centroCusto], false, false, true, false, ctrlApiExec);

          const anoAnt = anoAdd(ano, -1);
          const processoOrcamentarioAnoAnt = await ProcessoOrcamentarioModel.findOne({ ano: anoAnt }).lean();
          let valoresPlanejadosAnoAnt: ValoresTotCentroCustoClasseCusto[] = [];
          let valoresRealizadosAnoAnt: ValoresTotCentroCustoClasseCusto[] = [];
          if (processoOrcamentarioAnoAnt != null) {
            valoresPlanejadosAnoAnt = await GetValsPlanejadosTotAno(processoOrcamentarioAnoAnt, RevisaoValor.atual, [centroCusto], false, false, ctrlApiExec);
            valoresRealizadosAnoAnt = await GetValsRealizadosTotAno(processoOrcamentarioAnoAnt, [centroCusto], false, false);
          }

          const userCanWrite = UserCanWrite(processoOrcamentarioCentroCusto);
          resumoApi.jsonData({
            value: {
              processoOrcamentario, processoOrcamentarioCentroCusto,
              valoresPlanejados: valsPlanejados.vals, userCanWrite, valoresPlanejadosAnoAnt, valoresRealizadosAnoAnt
            }
          });
          deleteIfOk = true;
        }

        else if (parm.cmd == CmdApi.quadroInputItensSet) {
          if (revisao != RevisaoValor.atual) throw new ErrorPlus('Essa revisão não pode ser alterada');
          ProcessoOrcamentarioStatusMd.checkOperAllowed(OperInProcessoOrcamentario.altValoresPlanejados, processoOrcamentario.status);
          if (processoOrcamentarioCentroCusto.planejamentoEmAberto != true) throw new ErrorPlus('Centro de Custo não está aberto para lançamentos');
          // const procsCentrosCustoConfig = await procsCentroCustosConfigAuth(loggedUserReq, { incluiPlanejadorCC: true, incluiPerfilOperContr: true, incluiPerfilConsTodosCCs: true });
          // let userCanWrite = false;
          // const proc = procsCentrosCustoConfig.find((x) => x.ano == ano);
          // if (proc != null) {
          //   const ccConfig = proc.centroCustoConfig.find((x) => x.centroCusto == centroCusto);
          //   if (ccConfig != null)
          //     userCanWrite = UserCanWrite(processoOrcamentarioCentroCusto);
          // }
          if (!UserCanWrite(processoOrcamentarioCentroCusto)) throw new ErrorPlus('Sem autorização para gravação');

          const changedLines = parm.data.changedLines as IChangedLine[];

          // validação antes de iniciar atualização
          const classeCustoRestritaArray = await classeCustoRestritaArrayGet();
          for (const changedLine of changedLines) {
            const someInf = changedLine.valMeses.reduce((prev, curr) => prev || curr != null, false);
            if (someInf) {
              const classeRestrita = BinSearchItem(classeCustoRestritaArray, changedLine.key.classeCusto, 'classeCusto');
              if (classeRestrita != null &&
                !classeRestrita.centroCustoArray.includes(centroCusto))
                throw new ErrorPlus(`Centro de Custo não autorizado a lançar na Classe de Custo ${changedLine.key.classeCusto}`);
            }
          }

          //csl(JSON.stringify(data, null,2));
          for (const changedLine of changedLines) {
            // if (changedLine.type != 'classeCusto')
            //   throw new Error('type inválido em valoresImputadosSet');
            const someInf = changedLine.valMeses.reduce((prev, curr) => prev || curr != null, false);
            if (someInf)
              await ValoresImputadosModel.findOneAndUpdate(ValoresImputados.fill({ ano, revisao, centroCusto, classeCusto: changedLine.key.classeCusto, idDetalhe: changedLine.key.idDetalhe }), { descr: changedLine.descr, valMeses: changedLine.valMeses, lastUpdated: agora }, { upsert: true });
            else
              await ValoresImputadosModel.deleteOne(ValoresImputados.fill({ ano, revisao, centroCusto, classeCusto: changedLine.key.classeCusto, idDetalhe: changedLine.key.idDetalhe }));
          }
          resumoApi.jsonData({});
        }
      }

      else if (parm.cmd == CmdApi.quadroConsValoresGet) {
        const { ano, centroCustoArray, revisao } = parm.filter || {};
        const processoOrcamentario = await ProcessoOrcamentarioModel.findOne({ ano }).lean();
        if (processoOrcamentario == null) throw new ErrorPlus(`Processo Orçamentário para ${ano} não encontrado`);
        for (const centroCusto of centroCustoArray) {
          const processoOrcamentarioCentroCusto = await ProcessoOrcamentarioCentroCustoModel.findOne({ ano, centroCusto }).lean();
          if (processoOrcamentarioCentroCusto == null) throw new ErrorPlus(`Centro de Custo ${centroCusto} não configurado para o Processo Orçamentário`);
          CheckProcCentroCustosAuth(loggedUserReq, processoOrcamentarioCentroCusto, authCCQuadroCons);
        }

        const sumarizaCCs = centroCustoArray.length > 1;
        const withDetails = centroCustoArray.length <= 1;
        const valsPlanejados = await GetValsPlanejados(processoOrcamentario, revisao, centroCustoArray, true, sumarizaCCs, withDetails, false, ctrlApiExec);

        let valoresPlanejadosAnoAnt: ValoresTotCentroCustoClasseCusto[] = [];
        let valoresRealizadosAnoAnt: ValoresTotCentroCustoClasseCusto[] = [];
        const anoAnt = anoAdd(ano, -1);
        const processoOrcamentarioAnoAnt = await ProcessoOrcamentarioModel.findOne({ ano: anoAnt }).lean();
        if (processoOrcamentarioAnoAnt != null) {
          valoresPlanejadosAnoAnt = await GetValsPlanejadosTotAno(processoOrcamentarioAnoAnt, revisao, centroCustoArray, true, sumarizaCCs, ctrlApiExec);
          valoresRealizadosAnoAnt = await GetValsRealizadosTotAno(processoOrcamentarioAnoAnt, centroCustoArray, true, sumarizaCCs);
        }

        resumoApi.jsonData({
          value: {
            processoOrcamentario,
            valoresPlanejados: valsPlanejados.vals, valoresPlanejadosAnoAnt, valoresRealizadosAnoAnt
          }
        });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.exportPlanejValoresGet) {
        const { ano, revisao, centroCustoArray, withDetails, showCalc } = parm.filter || {};
        const processoOrcamentario = await ProcessoOrcamentarioModel.findOne({ ano }).lean();
        if (processoOrcamentario == null) throw new ErrorPlus(`Processo Orçamentário para ${ano} não encontrado`);
        let centroCustoArrayUse: string[] = null;
        if (centroCustoArray.length > 0) {
          for (const centroCusto of centroCustoArray) {
            const processoOrcamentarioCentroCusto = await ProcessoOrcamentarioCentroCustoModel.findOne({ ano, centroCusto }).lean();
            if (processoOrcamentarioCentroCusto == null) throw new ErrorPlus(`Centro de Custo ${centroCusto} não configurado para o Processo Orçamentário`);
            CheckProcCentroCustosAuth(loggedUserReq, processoOrcamentarioCentroCusto, authCCQuadroCons);
          }
          centroCustoArrayUse = centroCustoArray;
        }
        else {
          if (accessAllCCs(loggedUserReq, authCCQuadroCons))
            centroCustoArrayUse = [];
          else {
            const procsCentrosCustoConfigAllYears = await procsCentroCustosConfigAuthAllYears(loggedUserReq, authCCQuadroCons, ano);
            centroCustoArrayUse = procsCentrosCustoConfigAllYears[0].centroCustoConfig.map((x) => x.centroCusto);
          }
        }
        const { vals, memoriaCalc } = await GetValsPlanejados(processoOrcamentario, revisao, centroCustoArrayUse, true, false, withDetails, showCalc, ctrlApiExec);

        resumoApi.jsonData({ value: { vals, memoriaCalc } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.exportRealPlanValoresGet) {
        const { ano, centroCustoArray } = parm.filter || {};
        const processoOrcamentario = await ProcessoOrcamentarioModel.findOne({ ano }).lean();
        if (processoOrcamentario == null) throw new ErrorPlus(`Processo Orçamentário para ${ano} não encontrado`);
        let centroCustoArrayUse: string[] = null;
        if (centroCustoArray.length > 0) {
          for (const centroCusto of centroCustoArray) {
            const processoOrcamentarioCentroCusto = await ProcessoOrcamentarioCentroCustoModel.findOne({ ano, centroCusto }).lean();
            if (processoOrcamentarioCentroCusto == null) throw new ErrorPlus(`Centro de Custo ${centroCusto} não configurado para o Processo Orçamentário`);
            CheckProcCentroCustosAuth(loggedUserReq, processoOrcamentarioCentroCusto, authCCQuadroCons);
          }
          centroCustoArrayUse = centroCustoArray;
        }
        else {
          if (accessAllCCs(loggedUserReq, authCCQuadroCons))
            centroCustoArrayUse = [];
          else {
            const procsCentrosCustoConfigAllYears = await procsCentroCustosConfigAuthAllYears(loggedUserReq, authCCQuadroCons, ano);
            centroCustoArrayUse = procsCentrosCustoConfigAllYears[0].centroCustoConfig.map((x) => x.centroCusto);
          }
        }

        const centroCustoConfigMdArray = await ProcessoOrcamentarioCentroCustoModel.find({ ano }).lean().sort({ centroCusto: 1 });
        const classeCustoMdArray = await ClasseCustoModel.find().lean().sort({ classeCusto: 1 });
        const unidadeNegocioMdArray = await UnidadeNegocioModel.find().lean().sort({ cod: 1 });
        const diretoriaMdArray = await DiretoriaModel.find().lean().sort({ cod: 1 });
        const gerenciaMdArray = await GerenciaModel.find().lean().sort({ cod: 1 });

        const { vals: valsPlan } = await GetValsPlanejados(processoOrcamentario, RevisaoValor.atual, centroCustoArrayUse, true, false, false, false, ctrlApiExec);
        const valsReal = await GetValsRealizados(processoOrcamentario, centroCustoArrayUse, true, false);

        const ctrlCollect = new CtrlCollect<ValoresAnaliseRealPlan>(['centroCusto', 'classeCusto'],
          { fldsSum: [{ fld: 'valMesesPlan', arrayLen: mesesFld.length }, { fld: 'valMesesReal', arrayLen: mesesFld.length }] });

        valsPlan.forEach(val => ctrlCollect.newItem({ ..._.pick(val, ['centroCusto', 'classeCusto']), valMesesPlan: val.valMeses }));
        valsReal.forEach(val => ctrlCollect.newItem({ ..._.pick(val, ['centroCusto', 'classeCusto']), valMesesReal: val.valMeses }));
        const vals = ctrlCollect.getArray();

        resumoApi.jsonData({
          value: {
            vals, centroCustoConfigMdArray,
            unidadeNegocioMdArray, diretoriaMdArray, gerenciaMdArray, classeCustoMdArray
          }
        });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.importRealizadoStart) {
        //const ctrlInterfaceMdRunning = await CtrlInterfaceModel.findOne({ categ: InterfaceSapCateg.importReal, status: { $in: [InterfaceSapStatus.queued, InterfaceSapStatus.running] } }).lean();
        const ctrlInterfaceMdRunning = await CtrlInterfaceModel.findOne({ categ: InterfaceSapCateg.importReal, pending: true }).lean();
        if (ctrlInterfaceMdRunning != null) throw new ErrorPlus(`Já há um processo em andamento, iniciado em ${DateDisp(ctrlInterfaceMdRunning.started, 'dmyhm')}`);

        const interfaceSapRealizado = EnvSvrInterfaceSapRealizadoConfig();

        await ValoresRealizadosInterfaceSapModel.deleteMany({});

        const apiReturn = await CallApiSvrASync(interfaceSapRealizado.url, ctrlApiExec.ctrlContext, null, { conf: {} }, { auth: { username: interfaceSapRealizado.auth.user, password: interfaceSapRealizado.auth.pass } });
        const info: any = { resultSap: apiReturn };
        const ctrlInterfaceMd = (await CtrlInterfaceModel.create({
          categ: InterfaceSapCateg.importReal,
          dag_run_id: apiReturn.dag_run_id,
          started: agora,
          lastChecked: agora,
          status: apiReturn.state,
          pending: true,
          info,
        }) as any)._doc as CtrlInterface;

        resumoApi.jsonData({ value: { ctrlInterfaceMd } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.importRealizadoCheck) {

        let ctrlInterfaceMd: CtrlInterface;
        //const ctrlInterfaceMdArray = await CtrlInterfaceModel.find({ categ: InterfaceSapCateg.importReal, status: { $in: [InterfaceSapStatus.queued, InterfaceSapStatus.running] } }).lean();
        const ctrlInterfaceMdArray = await CtrlInterfaceModel.find({ categ: InterfaceSapCateg.importReal, pending: true }).lean();
        if (ctrlInterfaceMdArray.length > 1) throw new ErrorPlus('Controle de interface com mais de um processo no status de Running');
        if (ctrlInterfaceMdArray.length === 1) {
          ctrlInterfaceMd = ctrlInterfaceMdArray[0];
          const interfaceSapRealizado = EnvSvrInterfaceSapRealizadoConfig();
          const apiReturn = await CallApiSvrASync(interfaceSapRealizado.url, ctrlApiExec.ctrlContext, null, { params: [ctrlInterfaceMd.dag_run_id] }, { method: 'getParams', auth: { username: interfaceSapRealizado.auth.user, password: interfaceSapRealizado.auth.pass } });
          const info: any = { resultSap: apiReturn };
          const errosImport = [];
          let inseridos = 0;
          if (apiReturn.state === InterfaceSapStatus.success) {
            const valsInterface = await ValoresRealizadosInterfaceSapModel.find({}).lean().sort({ ano: 1, centroCusto: 1, classeCusto: 1 });
            if (valsInterface.length !== 0) {
              const ano = valsInterface[0].ano;
              info.ano = ano;
              const centroCustoConfigArray = await ProcessoOrcamentarioCentroCustoModel.find({ ano }, { _id: 0, centroCusto: 1 }).lean().sort({ centroCusto: 1 });
              const classeCustoArray = await ClasseCustoModel.find({ ano }, { _id: 0, classeCusto: 1 }).lean().sort({ classeCusto: 1 });
              const centroCustoNotFoundArray = [];
              const classeCustoNotFoundArray = [];
              const valsOk: ValoresRealizadosInterfaceSap[] = [];
              let lastCentroCusto: string = null; let lastCentroCustoOk = false;
              for (let index = 0; index < valsInterface.length; index++) {
                const item = valsInterface[index];
                if (item.ano != ano) {
                  errosImport.push(`foram encontrados dois anos no fluxo de carga: ${ano} e ${item.ano}`);
                  break;
                }
                if (item.centroCusto != lastCentroCusto) {
                  if (!BinSearchIndex(centroCustoConfigArray, item.centroCusto, 'centroCusto').found) {
                    centroCustoNotFoundArray.push(item.centroCusto);
                    lastCentroCustoOk = false;
                  }
                  else
                    lastCentroCustoOk = true;
                  lastCentroCusto = item.centroCusto;
                }
                let tudoOk = lastCentroCustoOk;
                if (!BinSearchIndex(classeCustoArray, item.classeCusto, 'classeCusto').found) {
                  if (!classeCustoNotFoundArray.includes(item.classeCusto))
                    classeCustoNotFoundArray.push(item.classeCusto);
                  tudoOk = false;
                }
                if (tudoOk)
                  valsOk.push(item);
              }
              if (centroCustoNotFoundArray.length > 0)
                errosImport.push(`Centros de Custo não configurados para o Processo Orçamentário de ${ano}: ${centroCustoNotFoundArray.join(', ')}`);
              if (classeCustoNotFoundArray.length > 0) {
                classeCustoNotFoundArray.sort((x, y) => compareForBinSearch(x, y));
                errosImport.push(`Classes de Custo não cadastradas: ${classeCustoNotFoundArray.join(', ')}`);
              }
              if (valsOk.length !== 0) {
                //if (errosImport.length == 0) {
                const resultDel = await ValoresRealizadosModel.deleteMany(ValoresRealizados.fill({ ano }));
                //resultProc.push(`Valores anteriores removidos: ${resultDel.deletedCount}`);
                const resultIncl = await ValoresRealizadosModel.insertMany(valsOk.map((x) => ({
                  ..._.pick(x, ['ano', 'centroCusto', 'classeCusto']),
                  valMeses: [
                    roundInterface(x.m01), roundInterface(x.m02), roundInterface(x.m03), roundInterface(x.m04),
                    roundInterface(x.m05), roundInterface(x.m06), roundInterface(x.m07), roundInterface(x.m08),
                    roundInterface(x.m09), roundInterface(x.m10), roundInterface(x.m11), roundInterface(x.m12)]
                })));
                inseridos = resultIncl.length;
                //await ValoresRealizadosInterfaceSapModel.deleteMany({});
              }
            }
            else
              errosImport.push('Nenhum registro SAP');
            info.registrosSap = valsInterface.length;
            info.inseridos = inseridos;
            info.errosImport = errosImport;
            await ValoresRealizadosInterfaceSapModel.deleteMany({});
          }
          else if (apiReturn.state === InterfaceSapStatus.failed)
            await NotifyAdmASync('interfaceSapRealizado-carga', `dag_run_id ${ctrlInterfaceMd.dag_run_id}`, ctrlApiExec.ctrlContext, apiReturn);
          const pending = !(apiReturn.state === InterfaceSapStatus.success || apiReturn.state === InterfaceSapStatus.failed);
          ctrlInterfaceMd = await CtrlInterfaceModel.findOneAndUpdate({ _id: ctrlInterfaceMd._id }, { status: apiReturn.state, pending, info, lastChecked: agora }, { new: true }).lean();
        }
        else
          ctrlInterfaceMd = await CtrlInterfaceModel.findOne().lean().sort({ started: -1 }).limit(1);
        resumoApi.jsonData({ value: { ctrlInterfaceMd } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.analiseAnualCentroCustoInitialization) {
        const authCC = authCCQuadroCons;

        const procsCentrosCustoConfigAllYears = await procsCentroCustosConfigAuthAllYears(loggedUserReq, authCC);
        const centroCustoArray = await ccsAuthArray(procsCentrosCustoConfigAllYears);
        const fatorCustoArray = await FatorCustoModel.find().lean().sort({ fatorCusto: 1 });
        const classeCustoArray = await ClasseCustoModel.find().lean().sort({ classeCusto: 1 });

        resumoApi.jsonData({ value: { procsCentrosCustoConfigAllYears, centroCustoArray, fatorCustoArray, classeCustoArray } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.analiseAnualControladoriaInitialization) {
        const processoOrcamentarioArray = await ProcessoOrcamentarioModel.find({}, { _id: 0, ano: 1, status: 1 }).lean().sort({ ano: -1 });
        const unidadeNegocioArray: UnidadeNegocio[] = await UnidadeNegocioModel.find().lean().sort({ cod: 1, descr: 1, categRegional: 1 });
        const diretoriaArray = await DiretoriaModel.find().lean().sort({ cod: 1, descr: 1 });
        const fatorCustoArray = await FatorCustoModel.find().lean().sort({ fatorCusto: 1 });
        const classeCustoArray = await ClasseCustoModel.find().lean().sort({ classeCusto: 1 });

        resumoApi.jsonData({ value: { processoOrcamentarioArray, unidadeNegocioArray, diretoriaArray, fatorCustoArray, classeCustoArray } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.comparativoAnualControladoriaInitialization) {
        const processoOrcamentarioArray = await ProcessoOrcamentarioModel.find({}, { _id: 0, ano: 1, status: 1 }).lean().sort({ ano: -1 });
        const unidadeNegocioArray: UnidadeNegocio[] = await UnidadeNegocioModel.find().lean().sort({ cod: 1, descr: 1, categRegional: 1 });
        const diretoriaArray = await DiretoriaModel.find().lean().sort({ cod: 1, descr: 1 });
        const fatorCustoArray = await FatorCustoModel.find().lean().sort({ fatorCusto: 1 });
        const classeCustoArray = await ClasseCustoModel.find().lean().sort({ classeCusto: 1 });

        resumoApi.jsonData({ value: { processoOrcamentarioArray, unidadeNegocioArray, diretoriaArray, fatorCustoArray, classeCustoArray } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.analiseAnualCentroCustoValoresGet ||
        parm.cmd == CmdApi.analiseAnualControladoriaValoresGet) {
        let centroCustoArray = null;
        const { ano, mes } = parm.filter || {};
        const processoOrcamentario = await ProcessoOrcamentarioModel.findOne({ ano }).lean();
        if (processoOrcamentario == null) throw new ErrorPlus(`Processo Orçamentário para ${ano} não encontrado`);
        if (mes == null) throw new ErrorPlus('Mês não informado');

        let centroCustoArrayUse: string[] = [];
        if (parm.cmd == CmdApi.analiseAnualCentroCustoValoresGet) {
          centroCustoArray = parm.filter.centroCustoArray;
          const authCC: IAuthCC = { incluiPlanejadorCC: true, incluiPerfilGestorContr: true, incluiPerfilOperContr: true, incluiConsultaCC: true, incluiPerfilConsTodosCCs: true };
          if (accessAllCCs(loggedUserReq, authCC)) {
            if (centroCustoArray.length >= 0)
              centroCustoArrayUse = centroCustoArray;
          }
          else {
            const procsCentrosCustoConfigAllYears = await procsCentroCustosConfigAuthAllYears(loggedUserReq, authCC, ano);
            if (procsCentrosCustoConfigAllYears.length === 0) throw new ErrorPlus('Nenhum Centro de Custo autorizado');
            const centrosCustoConfigAuth = procsCentrosCustoConfigAllYears[0].centroCustoConfig.map((x) => x.centroCusto);
            if (centroCustoArray.length == 0)
              centroCustoArrayUse = centrosCustoConfigAuth;
            else {
              for (let index = 0; index < centroCustoArray.length; index++) {
                if (!centrosCustoConfigAuth.includes(centroCustoArray[index])) throw new ErrorPlus(`Centro de Custo ${centroCustoArray[index]} não autorizado`);
              }
              centroCustoArrayUse = centroCustoArray;
            }
          }
        }

        const valoresAnaliseAnual = await GetValoresAnaliseAnual(processoOrcamentario, centroCustoArrayUse, mes, parm.cmd == CmdApi.analiseAnualControladoriaValoresGet, ctrlApiExec);

        const classeCustoArray = await ClasseCustoModel.find({}, { _id: 0, classeCusto: 1, fatorCusto: 1 }).lean().sort({ classeCusto: 1 });
        valoresAnaliseAnual.forEach((x) => {
          x.fatorCusto = BinSearchProp(classeCustoArray, x.classeCusto, 'fatorCusto', 'classeCusto', true);
        });

        resumoApi.jsonData({ value: { valoresAnaliseAnual } }); // classeCustoArray
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.comparativoAnualControladoriaValoresGet) {
        const { ano } = parm.filter || {};
        const anoAnt = anoAdd(ano, -1);
        const processoOrcamentario = await ProcessoOrcamentarioModel.findOne({ ano }).lean();
        const processoOrcamentarioAnt = await ProcessoOrcamentarioModel.findOne({ ano: anoAnt }).lean();
        if (processoOrcamentario == null) throw new ErrorPlus(`Processo Orçamentário para ${ano} não encontrado`);
        if (processoOrcamentarioAnt == null) throw new ErrorPlus(`Processo Orçamentário para ${anoAnt} não encontrado`);

        const valoresComparativoAnual = await GetValoresComparativoAnual(processoOrcamentario, processoOrcamentarioAnt, ctrlApiExec);

        const classeCustoArray = await ClasseCustoModel.find({}, { _id: 0, classeCusto: 1, fatorCusto: 1 }).lean().sort({ classeCusto: 1 });
        valoresComparativoAnual.forEach((x) => {
          x.fatorCusto = BinSearchProp(classeCustoArray, x.classeCusto, 'fatorCusto', 'classeCusto', true);
        });

        resumoApi.jsonData({ value: { processoOrcamentario, valoresComparativoAnual } });
        deleteIfOk = true;
      }

      else
        throw new Error(`Cmd '${parm.cmd}' inválido.`);

    } catch (error) {
      const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 1', parm, ctrlApiExec);
      resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
    }

    await ApiLogFinish(apiLogProc, resumoApi.resultProc(), deleteIfOk);
    await CloseDbASync({ ctrlContext: ctrlApiExec.ctrlContext, database: databaseInterfaceSap });
    await CloseDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 2', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }

  const elapsedMsApi = resumoApi.json();
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, loggedUserReq);
};

export const GetValsPlanejados = async (processoOrcamentario: ProcessoOrcamentario, revisao: RevisaoValor, centroCustoArray: string[],
  incluiContasCalc: boolean, sumarizaCCs: boolean, withDetails: boolean, showCalc: boolean, ctrlApiExec: CtrlApiExec) => {
  let memoriaCalc = null;
  let vals: ValoresPlanejadosDetalhes[];
  const classeCustoCalcArray = Object.keys(contasCalc).reduce((prev, curr) => [...prev, contasCalc[curr].classeCusto], []);
  if (processoOrcamentario.status === ProcessoOrcamentarioStatus.encerrado) {
    vals = await ValoresPlanejadosHistoricoGet(processoOrcamentario, centroCustoArray, sumarizaCCs);
    if (!incluiContasCalc)
      vals = vals.filter((x) => !classeCustoCalcArray.includes(x.classeCusto));
  }
  else {
    vals = await ValoresImputadosGet(processoOrcamentario, revisao, centroCustoArray, sumarizaCCs, withDetails);
    const valoresDespr = vals.filter((x) => classeCustoCalcArray.includes(x.classeCusto));
    if (valoresDespr.length > 0) {
      dbgError('GetValsPlanejados', 'valores inputados desprezados, por serem da origem calc', valoresDespr);
      vals = vals.filter((x) => !classeCustoCalcArray.includes(x.classeCusto));
    }
    //let needSort = false;
    if (incluiContasCalc) {
      const valsContasCalc = await ValoresPlanejadosCalc(processoOrcamentario, revisao, centroCustoArray, withDetails, showCalc, ctrlApiExec);
      vals = [...vals, ...valsContasCalc.vals];
      memoriaCalc = valsContasCalc.memoriaCalc;
      //needSort = true; 
    }
  }
  if (sumarizaCCs)
    vals = (new CtrlCollect<ValoresPlanejadosDetalhes>(['classeCusto'], { fldsSum: [{ fld: 'valMeses', arrayLen: mesesFld.length }] }, vals)).getArray();
  vals.sort((a, b) => compareForBinSearchArray([a.centroCusto, a.classeCusto, a.idDetalhe], [b.centroCusto, b.classeCusto, b.idDetalhe]));
  return { vals, memoriaCalc };
};

/**
* Obtem os valor total anual planejado para as classes de custo
*/
const GetValsPlanejadosTotAno = async (processoOrcamentario: ProcessoOrcamentario, revisao: RevisaoValor, centroCustoArray: string[],
  incluiContasCalc: boolean, sumarizaCCs: boolean, ctrlApiExec: CtrlApiExec) => {
  const ano = processoOrcamentario.ano;
  const filterCC = centroCustoArray.length > 0 ? { centroCusto: { $in: centroCustoArray } } : {};
  const filterDb: any = { ano, revisao, ...filterCC };
  const classeCustoCalcArray = Object.keys(contasCalc).reduce((prev, curr) => [...prev, contasCalc[curr].classeCusto], []);
  let vals: ValoresTotCentroCustoClasseCusto[];
  if (processoOrcamentario.status === ProcessoOrcamentarioStatus.encerrado) {
    let valsDets = await ValoresPlanejadosHistoricoGet(processoOrcamentario, centroCustoArray, sumarizaCCs);
    if (!incluiContasCalc)
      valsDets = valsDets.filter((x) => !classeCustoCalcArray.includes(x.classeCusto));
    vals = valsDets.map((x) => (ValoresTotCentroCustoClasseCusto.fill({ centroCusto: x.centroCusto, classeCusto: x.classeCusto, tot: x.valMeses.reduce((prev, curr) => prev + curr, 0) })));
  }
  else {
    vals = await ValoresImputadosModel.aggregate([
      { $match: filterDb },
      {
        $group: {
          _id: { centroCusto: '$centroCusto', classeCusto: '$classeCusto' },
          tot: { $sum: { $sum: mesesFld.map((_, index) => ({ $arrayElemAt: ['$valMeses', index] })) } },
        }
      },
      {
        $project: {
          _id: 0,
          centroCusto: '$_id.centroCusto',
          classeCusto: '$_id.classeCusto',
          tot: '$tot',
        }
      },
      { $sort: { centroCusto: 1, classeCusto: 1 } },
    ]);
    const valoresDespr = vals.filter((x) => classeCustoCalcArray.includes(x.classeCusto));
    if (valoresDespr.length > 0) {
      dbgError('GetValsPlanejadosTotAno', `valores inputados (tot ano ${ano}) desprezados, por serem da origem calc`, valoresDespr);
      vals = vals.filter((x) => !classeCustoCalcArray.includes(x.classeCusto));
    }
    //let needSort = false;
    if (incluiContasCalc) {
      const valsContasCalc = await ValoresPlanejadosCalc(processoOrcamentario, revisao, centroCustoArray, false, false, ctrlApiExec);
      //contasCalc.valoresCalc.forEach(x => vals.push({ classeCusto: x.classeCusto, tot: x.valMeses.reduce((prev, curr) => prev + curr, 0) }));
      vals = [...vals, ...valsContasCalc.vals.map(x => ValoresTotCentroCustoClasseCusto.fill({ centroCusto: x.centroCusto, classeCusto: x.classeCusto, tot: x.valMeses.reduce((prev, curr) => prev + curr, 0) }))];
      //needSort = true;
    }
  }
  if (sumarizaCCs)
    vals = (new CtrlCollect<ValoresTotCentroCustoClasseCusto>(['classeCusto'], { fldsSum: ['tot'] }, vals)).getArray();
  vals.sort((a, b) => compareForBinSearchArray([a.centroCusto, a.classeCusto], [b.centroCusto, b.classeCusto]));
  return vals;
};

const GetValsRealizados = async (processoOrcamentario: ProcessoOrcamentario, centroCustoArray: string[],
  incluiContasCalc: boolean, sumarizaCCs: boolean) => {
  const ano = processoOrcamentario.ano;
  const filterCC = centroCustoArray.length > 0 ? { centroCusto: { $in: centroCustoArray } } : {};
  const filterDb: any = { ano, ...filterCC };
  const classeCustoCalcArray = Object.keys(contasCalc).reduce((prev, curr) => [...prev, contasCalc[curr].classeCusto], []);
  let vals: ValoresRealizados[] = await ValoresRealizadosModel.find(filterDb,
    { centroCusto: 1, classeCusto: 1, valMeses: 1 }
  ).lean().sort({ centroCusto: 1, classeCusto: 1 });
  if (!incluiContasCalc)
    vals = vals.filter((x) => !classeCustoCalcArray.includes(x.classeCusto));
  if (sumarizaCCs)
    vals = (new CtrlCollect<ValoresRealizados>(['classeCusto'], { fldsSum: [{ fld: 'valMeses', arrayLen: mesesFld.length }] }, vals)).getArray();
  return vals;
};

const GetValsRealizadosTotAno = async (processoOrcamentario: ProcessoOrcamentario, centroCustoArray: string[],
  incluiContasCalc: boolean, sumarizaCCs: boolean) => {
  const ano = processoOrcamentario.ano;
  const filterCC = centroCustoArray.length > 0 ? { centroCusto: { $in: centroCustoArray } } : {};
  const filterDb: any = { ano, ...filterCC };
  const classeCustoCalcArray = Object.keys(contasCalc).reduce((prev, curr) => [...prev, contasCalc[curr].classeCusto], []);
  let vals: ValoresRealizados[] = await ValoresRealizadosModel.find(filterDb,
    { centroCusto: 1, classeCusto: 1, tot: { $sum: mesesFld.map((_, index) => ({ $arrayElemAt: ['$valMeses', index] })) } }
  ).lean().sort({ centroCusto: 1, classeCusto: 1 });
  if (!incluiContasCalc)
    vals = vals.filter((x) => !classeCustoCalcArray.includes(x.classeCusto));
  if (sumarizaCCs)
    vals = (new CtrlCollect<ValoresTotCentroCustoClasseCusto>(['classeCusto'], { fldsSum: ['tot'] }, vals)).getArray();
  return vals;
};
// const GetValsAnaliseAnual = async (ano: string, mes: string, centroCustoArray: string[]) => {
//   const vals: ValoresAnaliseAnual[] = [];
//   return vals;
// };

export const ValoresImputadosGet = async (processoOrcamentario: ProcessoOrcamentario, revisao: RevisaoValor, centroCustoArray: string[],
  sumarizaCCs: boolean, withDetails: boolean) => {
  const ano = processoOrcamentario.ano;
  const filterCC = centroCustoArray.length > 0 ? { centroCusto: { $in: centroCustoArray } } : {};
  const filterDb: any = { ano, revisao, ...filterCC };
  let vals: ValoresPlanejadosDetalhes[] = [];
  if (withDetails) {
    const db = await ValoresImputadosModel.find(filterDb, { _id: 0, lastUpdated: 0 })
      .lean().sort({ centroCusto: 1, classeCusto: 1, idDetalhe: 1 });
    vals = db.map((x) => ValoresPlanejadosDetalhes.fill(OnlyPropsInClass(x, ValoresPlanejadosDetalhes.new())));
  }
  else {
    const db = await ValoresImputadosModel.aggregate([
      { $match: filterDb },
      {
        $group: {
          _id: { centroCusto: '$centroCusto', classeCusto: '$classeCusto' },
          ...mesesFld.reduce((prev, curr, index) => ({ ...prev, [curr]: { $sum: { $arrayElemAt: ['$valMeses', index] } } }), {}),
        }
      },
      {
        $project: {
          _id: 0,
          centroCusto: '$_id.centroCusto',
          classeCusto: '$_id.classeCusto',
          idDetalhe: null,
          descr: null,
          //...mesesFld.reduce((prev, curr) => ({ ...prev, [curr]: 1 }), {}),
          valMeses: [...mesesFld.map((x) => `$${x}`),],
        }
      },
      { $sort: { centroCusto: 1, classeCusto: 1 } },
    ]);
    vals = db.map((x) => ValoresPlanejadosDetalhes.fill(OnlyPropsInClass(x, ValoresPlanejadosDetalhes.new())));
  }

  if (sumarizaCCs)
    vals = (new CtrlCollect<ValoresPlanejadosDetalhes>(['classeCusto'], { fldsSum: [{ fld: 'valMeses', arrayLen: mesesFld.length }] }, vals)).getArray();
  return vals;
};

export const ValoresPlanejadosHistoricoGet = async (processoOrcamentario: ProcessoOrcamentario, centroCustoArray: string[], sumarizaCCs: boolean) => {
  if (processoOrcamentario.status !== ProcessoOrcamentarioStatus.encerrado) throw new Error('ValoresPlanejadosHistoricoGet para ano com outro status');
  const ano = processoOrcamentario.ano;
  const filterCC = centroCustoArray.length > 0 ? { centroCusto: { $in: centroCustoArray } } : {};
  const filterDb: any = { ano, ...filterCC };
  let vals: ValoresPlanejadosDetalhes[] = [];
  const db = await ValoresPlanejadosHistoricoModel.find(filterDb, { _id: 0 })
    .lean().sort({ centroCusto: 1, classeCusto: 1 });
  vals = db.map((x) => ValoresPlanejadosDetalhes.fill(OnlyPropsInClass(x, ValoresPlanejadosDetalhes.new())));
  if (sumarizaCCs)
    vals = (new CtrlCollect<ValoresPlanejadosDetalhes>(['classeCusto'], { fldsSum: [{ fld: 'valMeses', arrayLen: mesesFld.length }] }, vals)).getArray();
  return vals;
};

const getValPremissa = (premissaCod: string, premissas: Premissa[], premissasValores: ValoresPremissa[], processoOrcamentarioCentroCusto?: ProcessoOrcamentarioCentroCusto) => {
  const premissa = premissas.find((x) => x.cod == premissaCod);
  if (premissa == null)
    throw new Error(`premissa ${premissaCod} não encontrada`);
  const agrupPremissas = processoOrcamentarioCentroCusto.agrupPremissas;
  const empresa = processoOrcamentarioCentroCusto.centroCusto.substring(0, 5);
  let valoresPrior1: ValoresPremissa[] = [];
  let valoresPrior2: ValoresPremissa[] = [];
  const selectMain = (x) => x.tipoSegmCentroCusto == premissa.tipoSegmCentroCusto && x.segmTipoClb == premissa.segmTipoClb && x.premissa == premissa.cod;
  if (premissa.tipoSegmCentroCusto == TipoSegmCentroCusto.agrupPremissas) {
    if (agrupPremissas != null)
      valoresPrior1 = premissasValores.filter((x) => selectMain(x) && x.agrupPremissas == agrupPremissas);
    //if (valoresPrior1.length == 0)
    valoresPrior2 = premissasValores.filter((x) => selectMain(x) && x.agrupPremissas == agrupPremissasCoringa.cod);
  }
  if (premissa.tipoSegmCentroCusto == TipoSegmCentroCusto.empresa) {
    valoresPrior1 = premissasValores.filter((x) => selectMain(x) && x.empresa == empresa);
    //if (valoresPrior1.length == 0)
    valoresPrior2 = premissasValores.filter((x) => selectMain(x) && x.empresa == empresaCoringa.cod);
  }
  //csl({ premissa, agrupPremissas, empresa, valores });
  if (valoresPrior1.length + valoresPrior2.length == 0)
    return null;
  else
    return PremissaValores.fill({ premissa, valoresPrior1, valoresPrior2 });
};

//#ctrlContext
export const ValoresPlanejadosCalc = async (processoOrcamentario: ProcessoOrcamentario, revisao: RevisaoValor, centroCustoArray: string[], withDetails: boolean, showCalcGlobal: boolean, ctrlApiExec: CtrlApiExec) => {
  const ano = processoOrcamentario.ano;
  const filtroCC = centroCustoArray.length > 0 ? { centroCusto: { $in: centroCustoArray } } : {};
  const vals: ValoresPlanejadosDetalhes[] = [];
  const memoriaCalc: any[] = [];
  if (revisao !== RevisaoValor.atual ||
    (processoOrcamentario.status === ProcessoOrcamentarioStatus.preCalculado &&
      withDetails === false &&
      showCalcGlobal === false)) {
    const valsCalc = await ValoresPlanejadosCalcModel.find({ ano, revisao, ...filtroCC }).lean().sort({ centroCusto: 1, classeCusto: 1 });
    valsCalc.forEach((x) => vals.push(ValoresPlanejadosDetalhes.fill(OnlyPropsInClass(x, ValoresPlanejadosDetalhes.new()))));
  }
  else {
    // premissas
    const premissas = await PremissaModel.find({ anoIni: { $lte: ano }, anoFim: { $gte: ano }, revisao }, { _id: 0, cod: 1, tipoSegmCentroCusto: 1, segmTipoClb: 1, despRecorrFunc: 1, descrDespRecorrFunc: 1, classeCusto: 1 }).lean();
    const valoresPremissas = await ValoresPremissaModel.find({ ano, revisao, ativa: true }, { _id: 0, premissa: 1, tipoSegmCentroCusto: 1, segmTipoClb: 1, empresa: 1, agrupPremissas: 1, tipoColaborador: 1, valMeses: 1 }).lean().sort({ premissa: 1, agrupPremissas: 1, empresa: 1, tipoColaborador: 1 });
    const valoresLocalidades = await ValoresLocalidadeModel.find({ ano, revisao }, { _id: 0, localidade: 1, valMeses: 1 }).lean().sort({ localidade: 1 });
    const valoresTransfers = await ValoresTransferModel.find({ ano, revisao }, { _id: 0, localidadeOrigem: 1, localidadeDestino: 1, valMeses: 1 }).lean().sort({ localidadeOrigem: 1, localidadeDestino: 1 });

    // controle
    const processoOrcamentarioCentroCustos = await ProcessoOrcamentarioCentroCustoModel.find({ ano, ...filtroCC }, { _id: 0, centroCusto: 1, agrupPremissas: 1, localidade: 1 }).lean().sort({ centrocusto: 1 });

    // valores
    const funcionarios = await FuncionarioModel.find({ ano, ...filtroCC }).lean().sort({ centroCusto: 1 });
    const terceiros = await TerceiroModel.find({ ano, revisao, ...filtroCC }).lean().sort({ centroCusto: 1 });
    const viagens = await ViagemModel.find({ ano, revisao, ...filtroCC }).lean().sort({ centroCusto: 1 });
    const pushVals = (centroCusto, classeCusto, idDetalhe, descr, valsContaCalc: ValsContaCalc, infoMemoriaCalc = {}, showCalc = showCalcGlobal) => {
      if (valsContaCalc.anyValue) {
        vals.push(ValoresPlanejadosDetalhes.fill({
          centroCusto, classeCusto, idDetalhe, descr,
          valMeses: valsContaCalc.valMeses,
          //...mesesFld.reduce((prev, curr, index) => ({ ...prev, [curr]: valsContaCalc.valMeses[index] }), {})
        }));
        if (showCalc)
          memoriaCalc.push({ classeCusto, tipoCalc: valsContaCalc.tipoCalc, ...infoMemoriaCalc, memoriaCalcDets: valsContaCalc.memoriaCalcDets });
      }
    };

    const loteForMsg = Math.max(Math.floor(processoOrcamentarioCentroCustos.length / 10), 1);
    for (let sxCC = 0; sxCC < processoOrcamentarioCentroCustos.length; sxCC++) {
      const processoOrcamentarioCentroCusto = processoOrcamentarioCentroCustos[sxCC];
      //for (const processoOrcamentarioCentroCusto of processoOrcamentarioCentroCustos) {
      // if (processoOrcamentarioCentroCusto.centroCusto != 'C0042TESTE')
      //   continue;
      //memoriaCalc = [];
      if (processoOrcamentarioCentroCustos.length > 0 &&
        (sxCC == 0 ||
          (sxCC % loteForMsg) == 0 ||
          sxCC == (processoOrcamentarioCentroCustos.length - 1)))
        csd(`processando cc ${sxCC + 1}/${processoOrcamentarioCentroCustos.length}:`, processoOrcamentarioCentroCusto.centroCusto);
      if (showCalcGlobal)
        memoriaCalc.push({ inicioCalc: '***********************', cc: _.pick(processoOrcamentarioCentroCusto, ['centroCusto', 'agrupPremissas', 'localidade']) });

      const showCalcFunc = showCalcGlobal;
      const premissa_dissidio_vals = getValPremissa(premissaCod.dissidio, premissas, valoresPremissas, processoOrcamentarioCentroCusto);
      const funcionariosForCalc = FuncionariosForCalc(processoOrcamentarioCentroCusto.centroCusto, premissa_dissidio_vals, funcionarios, revisao);
      if (funcionariosForCalc.length > 0) {
        //csd('funcionariosForCalc', JSON.stringify(funcionariosForCalc, null, 2));

        // #!!!! esse processo está muito demorado na produção, 3 segs para cada 100 CCs !

        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.salario.classeCusto, null, null, contasCalc.salario.calc(funcionariosForCalc, showCalcFunc));
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.admServs.classeCusto, null, null, contasCalc.admServs.calc(funcionariosForCalc, showCalcFunc));
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.bolsaAux.classeCusto, null, null, contasCalc.bolsaAux.calc(funcionariosForCalc, showCalcFunc));
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.prolabore.classeCusto, null, null, contasCalc.prolabore.calc(funcionariosForCalc, showCalcFunc));

        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.avisoPrevio.classeCusto, null, null, contasCalc.avisoPrevio.calc(funcionariosForCalc, showCalcFunc));

        const premissa_inss_vals = getValPremissa(premissaCod.inss, premissas, valoresPremissas, processoOrcamentarioCentroCusto);
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.inss.classeCusto, null, null, contasCalc.inss.calc(funcionariosForCalc, premissa_inss_vals, showCalcFunc), { premissa_inss_vals });
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.inssHonorarios.classeCusto, null, null, contasCalc.inssHonorarios.calc(funcionariosForCalc, premissa_inss_vals, showCalcFunc), { premissa_inss_vals });

        const premissa_fgts_vals = getValPremissa(premissaCod.fgts, premissas, valoresPremissas, processoOrcamentarioCentroCusto);
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.fgts.classeCusto, null, null, contasCalc.fgts.calc(funcionariosForCalc, premissa_fgts_vals, showCalcFunc), { premissa_fgts_vals });

        const premissa_provFerias_vals = getValPremissa(premissaCod.provFerias, premissas, valoresPremissas, processoOrcamentarioCentroCusto);
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.provFerias.classeCusto, null, null, contasCalc.provFerias.calc(funcionariosForCalc, premissa_provFerias_vals, showCalcFunc), { premissa_provFerias_vals });

        const premissa_encProvFerias_vals = getValPremissa(premissaCod.encProvFeriasEmpr, premissas, valoresPremissas, processoOrcamentarioCentroCusto);
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.encProvFerias.classeCusto, null, null, contasCalc.encProvFerias.calc(funcionariosForCalc, premissa_encProvFerias_vals, showCalcFunc), { premissa_encProvFerias_vals });

        const premissa_prov13_vals = getValPremissa(premissaCod.prov13, premissas, valoresPremissas, processoOrcamentarioCentroCusto);
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.prov13.classeCusto, null, null, contasCalc.prov13.calc(funcionariosForCalc, premissa_prov13_vals, showCalcFunc), { premissa_prov13_vals });
        const premissa_encProv13_vals = getValPremissa(premissaCod.encProv13Empr, premissas, valoresPremissas, processoOrcamentarioCentroCusto);
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.encProv13.classeCusto, null, null, contasCalc.encProv13.calc(funcionariosForCalc, premissa_encProv13_vals, showCalcFunc), { premissa_encProv13_vals });

        const premissa_segVida_vals = getValPremissa(premissaCod.segVida, premissas, valoresPremissas, processoOrcamentarioCentroCusto);
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.segVida.classeCusto, null, null, contasCalc.segVida.calc(funcionariosForCalc, premissa_segVida_vals, showCalcFunc), { premissa_segVida_vals });

        const premissa_assMed_vals = getValPremissa(premissaCod.assMed, premissas, valoresPremissas, processoOrcamentarioCentroCusto);
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.assMed.classeCusto, null, null, contasCalc.assMed.calc(funcionariosForCalc, premissa_assMed_vals, showCalcFunc), { premissa_assMed_vals });
        const premissa_vr_vals = getValPremissa(premissaCod.vr, premissas, valoresPremissas, processoOrcamentarioCentroCusto);
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.vr.classeCusto, null, null, contasCalc.vr.calc(funcionariosForCalc, premissa_vr_vals, showCalcFunc), { premissa_vr_vals });

        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.vt.classeCusto, null, null, contasCalc.vt.calc(funcionariosForCalc, showCalcFunc));

        interface IValsContaCalcDets { classeCusto: string; idDetalhe: string; descr?: string, valsContaCalc: ValsContaCalc }

        const premissas_despCorr_vals: any = {}; // 5200502003 = tel ramal; 5200504020 = SAP (dois tipos de premissas)
        const valsDespRecorrArray: IValsContaCalcDets[] = [];
        premissas.filter(x => x.despRecorrFunc).forEach(premissa => {
          const premissa_despCorr_vals = getValPremissa(premissa.cod, premissas, valoresPremissas, processoOrcamentarioCentroCusto);
          premissas_despCorr_vals[premissa.cod] = premissa_despCorr_vals;
          valsDespRecorrArray.push({ classeCusto: premissa.classeCusto, idDetalhe: premissa.cod, descr: premissa.descrDespRecorrFunc, valsContaCalc: calcContaDespCorr(premissa.cod, funcionariosForCalc, premissa_despCorr_vals, showCalcFunc) });
        });
        //csd('valsDespRecorrArray', JSON.stringify(valsDespRecorrArray,null,2));
        let valsDespRecorrFinalArray: IValsContaCalcDets[] = [];
        if (!withDetails) {
          valsDespRecorrArray.forEach(valsDespRecorr => {
            const item = valsDespRecorrFinalArray.find(valsClasse => valsClasse.classeCusto == valsDespRecorr.classeCusto);
            if (item == null)
              valsDespRecorrFinalArray.push({
                classeCusto: valsDespRecorr.classeCusto, idDetalhe: null, descr: null,
                valsContaCalc: {
                  tipoCalc: 'despRecorr',
                  valMeses: [...valsDespRecorr.valsContaCalc.valMeses],
                  countMeses: [...valsDespRecorr.valsContaCalc.countMeses],
                  memoriaCalcDets: [{ despRecorr: valsDespRecorr.valsContaCalc.tipoCalc, memoriaCalcDets: valsDespRecorr.valsContaCalc.memoriaCalcDets }],
                  anyValue: valsDespRecorr.valsContaCalc.anyValue,
                }
              });
            else {
              sumValMeses(item.valsContaCalc.valMeses, valsDespRecorr.valsContaCalc.valMeses);
              sumValMeses(item.valsContaCalc.countMeses, valsDespRecorr.valsContaCalc.countMeses);
              item.valsContaCalc.memoriaCalcDets.push({ despRecorr: valsDespRecorr.valsContaCalc.tipoCalc, memoriaCalcDets: valsDespRecorr.valsContaCalc.memoriaCalcDets });
              item.valsContaCalc.anyValue = item.valsContaCalc.anyValue || valsDespRecorr.valsContaCalc.anyValue;
            }
          });
        }
        else
          valsDespRecorrFinalArray = valsDespRecorrArray;
        //csd('valsDespRecorrFinalArray', JSON.stringify(valsDespRecorrFinalArray, null, 2));
        valsDespRecorrFinalArray.forEach(x => pushVals(processoOrcamentarioCentroCusto.centroCusto, x.classeCusto, x.idDetalhe, x.descr, x.valsContaCalc, { premissas_despCorr_vals }));
      }

      const viagensCC = viagens.filter((x) => x.centroCusto === processoOrcamentarioCentroCusto.centroCusto);
      if (viagensCC.length > 0) {
        const valoresTransfersCCOrigem = valoresTransfers.filter((x) => x.localidadeOrigem === processoOrcamentarioCentroCusto.localidade);
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.viagens.classeCusto, null, null, contasCalc.viagens.calc(viagensCC, valoresLocalidades, valoresTransfersCCOrigem), { valoresTransfersCCOrigem, valoresLocalidades });
      }

      const terceirosForCalc = terceiros.filter(((x) => x.centroCusto == processoOrcamentarioCentroCusto.centroCusto));
      if (terceirosForCalc.length > 0) {
        pushVals(processoOrcamentarioCentroCusto.centroCusto, contasCalc.terceiros.classeCusto, null, null, contasCalc.terceiros.calc(terceirosForCalc));
      }

      // if (memoriaCalc.length > 0)
      //   csd('memoriaCalc', processoOrcamentarioCentroCusto.centroCusto, JSON.stringify(memoriaCalc, null, 2));

      await CheckTimeOutAndAbort(ctrlApiExec, 2000);
    }
  }
  return { vals, memoriaCalc };
};

const GetValoresAnaliseAnual = async (processoOrcamentario: ProcessoOrcamentario, centroCustoArrayUse: string[], mes: number, analiseControladoria: boolean, ctrlApiExec: CtrlApiExec) => {
  const filterCC = centroCustoArrayUse.length > 0 ? { centroCusto: { $in: centroCustoArrayUse } } : {};
  const centroCustoConfigMdArray = await ProcessoOrcamentarioCentroCustoModel.find({ ano: processoOrcamentario.ano, ...filterCC }, { _id: 0, centroCusto: 1, diretoria: 1, unidadeNegocio: 1 }).lean().sort({ centroCusto: 1 });

  let unidadeNegocioMdArray = null;
  if (analiseControladoria)
    unidadeNegocioMdArray = await UnidadeNegocioModel.find({}, { _id: 0, cod: 1, categRegional: 1 }).lean().sort({ cod: 1 });

  const indexMes = mes - 1;

  const ctrlCollect = new CtrlCollect<ValoresAnaliseAnual>(['categRegional', 'unidadeNegocio', 'diretoria', 'classeCusto'],
    { fldsSum: ['planTot', 'planComplReal', 'planYTD', 'planMes', 'realYTD', 'realMes'] });

  //#region planejamento
  {
    const { vals } = await GetValsPlanejados(processoOrcamentario, RevisaoValor.atual, centroCustoArrayUse, true, false, false, false, ctrlApiExec);
    // complementa categRegional e diretoria. Inclui apenas os CCs que não devem ser considerados. Sumariza os valores
    const valsTot: ValoresAnaliseAnual[] = [];
    let lastCentroCusto = null, ccConfig: ProcessoOrcamentarioCentroCusto = null, unidadeNegocioMd: UnidadeNegocio = null;
    for (let index = 0; index < vals.length; index++) {
      const val = vals[index];
      if (val.centroCusto != lastCentroCusto) {
        unidadeNegocioMd = null;
        ccConfig = BinSearchItem(centroCustoConfigMdArray, val.centroCusto, 'centroCusto', false);
        if (ccConfig == null)
          dbgError('GetValoresAnaliseAnual', `Centro de Custo ${val.centroCusto} não configurado para o ano (plan)`);
        else {
          if (analiseControladoria &&
            ccConfig.unidadeNegocio != null) {
            unidadeNegocioMd = BinSearchItem(unidadeNegocioMdArray, ccConfig.unidadeNegocio, 'cod', false);
            if (unidadeNegocioMd == null)
              dbgError('GetValoresAnaliseAnual', `Unidade Negocio ${ccConfig.unidadeNegocio} não cadastrada (plan)`);
          }
        }
        lastCentroCusto = val.centroCusto;
      }
      if (analiseControladoria &&
        (ccConfig?.diretoria == null &&
          unidadeNegocioMd?.categRegional == null))
        continue;
      valsTot.push(ValoresAnaliseAnual.fill({
        categRegional: unidadeNegocioMd?.categRegional,
        unidadeNegocio: ccConfig?.unidadeNegocio,
        diretoria: ccConfig?.diretoria,
        classeCusto: val.classeCusto,
        planTot: val.valMeses.reduce((prev, curr) => prev + curr, 0),
        planComplReal: val.valMeses.filter((x, index) => index > indexMes).reduce((prev, curr) => prev + curr, 0),
        planYTD: val.valMeses.filter((x, index) => index <= indexMes).reduce((prev, curr) => prev + curr, 0),
        planMes: val.valMeses[indexMes],
      }));
    }
    vals.length = 0;
    valsTot.forEach(val => ctrlCollect.newItem(val));
  }
  //#endregion

  //#region realizado
  {
    const vals = await GetValsRealizados(processoOrcamentario, centroCustoArrayUse, true, false);
    // complementa categRegional e diretoria. Inclui apenas os CCs que não devem ser considerados. Sumariza os valores
    const valsTot: ValoresAnaliseAnual[] = [];
    let lastCentroCusto = null, ccConfig: ProcessoOrcamentarioCentroCusto = null, unidadeNegocioMd: UnidadeNegocio = null;
    for (let index = 0; index < vals.length; index++) {
      const val = vals[index];
      if (val.centroCusto != lastCentroCusto) {
        unidadeNegocioMd = null;
        ccConfig = BinSearchItem(centroCustoConfigMdArray, val.centroCusto, 'centroCusto', false);
        if (ccConfig == null)
          dbgError('GetValoresAnaliseAnual', `Centro de Custo ${val.centroCusto} não configurado para o ano (reais)`);
        else {
          if (analiseControladoria &&
            ccConfig.unidadeNegocio != null) {
            unidadeNegocioMd = BinSearchItem(unidadeNegocioMdArray, ccConfig.unidadeNegocio, 'cod', false);
            if (unidadeNegocioMd == null)
              dbgError('GetValoresAnaliseAnual', `Unidade Negocio ${ccConfig.unidadeNegocio} não cadastrada (reais)`);
          }
        }
        lastCentroCusto = val.centroCusto;
      }
      if (analiseControladoria &&
        (ccConfig?.diretoria == null &&
          unidadeNegocioMd?.categRegional == null))
        continue;
      valsTot.push(ValoresAnaliseAnual.fill({
        categRegional: unidadeNegocioMd?.categRegional,
        unidadeNegocio: ccConfig?.unidadeNegocio,
        diretoria: ccConfig?.diretoria,
        classeCusto: val.classeCusto,
        realYTD: val.valMeses.filter((x, index) => index <= indexMes).reduce((prev, curr) => prev + curr, 0),
        realMes: val.valMeses[indexMes],
      }));
    }
    vals.length = 0;
    valsTot.forEach(val => ctrlCollect.newItem(val));
  }
  //#endregion

  return ctrlCollect.getArray();
};

//anoAdd(processoOrcamentario.ano, -1)
const GetValoresComparativoAnual = async (processoOrcamentarioAtu: ProcessoOrcamentario, processoOrcamentarioAnt: ProcessoOrcamentario, ctrlApiExec: CtrlApiExec) => {
  const centroCustoArrayUse: string[] = [];
  const filterCC = centroCustoArrayUse.length > 0 ? { centroCusto: { $in: centroCustoArrayUse } } : {};
  const centroCustoConfigMdArray = await ProcessoOrcamentarioCentroCustoModel.find({ ano: processoOrcamentarioAtu.ano, ...filterCC }, { _id: 0, centroCusto: 1, diretoria: 1, unidadeNegocio: 1 }).lean().sort({ centroCusto: 1 });
  const unidadeNegocioMdArray = await UnidadeNegocioModel.find({}, { _id: 0, cod: 1, categRegional: 1 }).lean().sort({ cod: 1 });

  const ctrlCollect = new CtrlCollect<ValoresComparativoAnual>(['categRegional', 'unidadeNegocio', 'diretoria', 'classeCusto'],
    { fldsSum: ['planAnt', 'planAtu', 'realAnt'] });

  //#region planejamento
  for (const anoPlanej of ['ant', 'atu']) {
    const processoOrcamentario = anoPlanej === 'ant' ? processoOrcamentarioAnt : processoOrcamentarioAtu;

    const { vals } = await GetValsPlanejados(processoOrcamentario, RevisaoValor.atual, centroCustoArrayUse, true, false, false, false, ctrlApiExec);
    // complementa categRegional e diretoria. Inclui apenas os CCs que não devem ser considerados. Sumariza os valores
    const valsTot: ValoresComparativoAnual[] = [];
    let lastCentroCusto = null, ccConfig: ProcessoOrcamentarioCentroCusto = null, unidadeNegocioMd: UnidadeNegocio = null;
    for (let index = 0; index < vals.length; index++) {
      const val = vals[index];
      if (val.centroCusto != lastCentroCusto) {
        unidadeNegocioMd = null;
        ccConfig = BinSearchItem(centroCustoConfigMdArray, val.centroCusto, 'centroCusto', false);
        if (ccConfig == null)
          dbgError('GetValoresComparativoAnual', `Centro de Custo ${val.centroCusto} não configurado para o ano (plan)`);
        else {
          if (ccConfig.unidadeNegocio != null) {
            unidadeNegocioMd = BinSearchItem(unidadeNegocioMdArray, ccConfig.unidadeNegocio, 'cod', false);
            if (unidadeNegocioMd == null)
              dbgError('GetValoresComparativoAnual', `Unidade Negocio ${ccConfig.unidadeNegocio} não cadastrada (plan)`);
          }
        }
        lastCentroCusto = val.centroCusto;
      }
      if ((ccConfig?.diretoria == null &&
        unidadeNegocioMd?.categRegional == null))
        continue;
      let planAnt = 0, planAtu = 0;
      if (anoPlanej === 'ant')
        planAnt = val.valMeses.reduce((prev, curr) => prev + curr, 0);
      else
        planAtu = val.valMeses.reduce((prev, curr) => prev + curr, 0);
      valsTot.push(ValoresComparativoAnual.fill({
        categRegional: unidadeNegocioMd?.categRegional,
        unidadeNegocio: ccConfig?.unidadeNegocio,
        diretoria: ccConfig?.diretoria,
        classeCusto: val.classeCusto,
        planAnt,
        planAtu,
      }));
    }
    vals.length = 0;
    valsTot.forEach(val => ctrlCollect.newItem(val));
  }
  //#endregion

  //#region realizado
  {
    const vals = await GetValsRealizados(processoOrcamentarioAnt, centroCustoArrayUse, true, false);
    // complementa categRegional e diretoria. Inclui apenas os CCs que não devem ser considerados. Sumariza os valores
    const valsTot: ValoresComparativoAnual[] = [];
    let lastCentroCusto = null, ccConfig: ProcessoOrcamentarioCentroCusto = null, unidadeNegocioMd: UnidadeNegocio = null;
    for (let index = 0; index < vals.length; index++) {
      const val = vals[index];
      if (val.centroCusto != lastCentroCusto) {
        unidadeNegocioMd = null;
        ccConfig = BinSearchItem(centroCustoConfigMdArray, val.centroCusto, 'centroCusto', false);
        if (ccConfig == null)
          dbgError('GetValoresComparativoAnual', `Centro de Custo ${val.centroCusto} não configurado para o ano (reais)`);
        else {
          if (ccConfig.unidadeNegocio != null) {
            unidadeNegocioMd = BinSearchItem(unidadeNegocioMdArray, ccConfig.unidadeNegocio, 'cod', false);
            if (unidadeNegocioMd == null)
              dbgError('GetValoresComparativoAnual', `Unidade Negocio ${ccConfig.unidadeNegocio} não cadastrada (reais)`);
          }
        }
        lastCentroCusto = val.centroCusto;
      }
      if ((ccConfig?.diretoria == null &&
        unidadeNegocioMd?.categRegional == null))
        continue;
      valsTot.push(ValoresComparativoAnual.fill({
        categRegional: unidadeNegocioMd?.categRegional,
        unidadeNegocio: ccConfig?.unidadeNegocio,
        diretoria: ccConfig?.diretoria,
        classeCusto: val.classeCusto,
        realAnt: val.valMeses.reduce((prev, curr) => prev + curr, 0),
      }));
    }
    vals.length = 0;
    valsTot.forEach(val => ctrlCollect.newItem(val));
  }
  //#endregion

  return ctrlCollect.getArray();
};
