import type { NextApiRequest, NextApiResponse } from 'next';
import _ from 'underscore';

import { ConnectDbASync, CloseDbASync } from '../../../../base/db/functions';

import { BinSearchItem, ConcatArrays, ErrorPlus, SleepMsDevRandom } from '../../../../libCommon/util';
import { csd } from '../../../../libCommon/dbg';
import { FromCsvUpload, IUploadMessage, MessageLevelUpload } from '../../../../libCommon/uploadCsv';
import { CheckRoleAllowed } from '../../../../libCommon/endPoints';
import { isAmbNone } from '../../../../libCommon/isAmb';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { FuncionarioRevisao, Funcionario, ProcessoOrcamentario } from '../../../../appCydag/modelTypes';
import { OperInProcessoOrcamentario, OrigemFunc, ProcessoOrcamentarioStatusMd, RevisaoValor } from '../../../../appCydag/types';
import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';

import { apisApp, rolesApp } from '../../../../appCydag/endPoints';
import { DiretoriaModel, GerenciaModel, UnidadeNegocioModel, UserModel } from '../../../../appCydag/models';
import { configApp } from '../../../../appCydag/config';

import { PremissaModel, ProcessoOrcamentarioCentroCustoModel, ProcessoOrcamentarioModel, FuncionarioModel } from '../../../../appCydag/models';

import { CmdApi_Funcionario as CmdApi, IChangedLine, FuncionarioClient, LineState, DataEdit } from './types';
import { accessAllCCs, ccsAuthArray, CheckProcCentroCustosAuth, IAuthCC, procsCentroCustosConfigAuthAllYears } from '../../../../appCydag/utilServer';
import { amountParse } from '../../../../appCydag/util';

const apiSelf = apisApp.funcionario;
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
      if (loggedUserReq == null) throw new ErrorPlus('Usu??rio n??o est?? logado.');
      await CheckBlockAsync(loggedUserReq);
      const userDb = await UserModel.findOne({ email: loggedUserReq?.email }).lean();
      CheckApiAuthorized(apiSelf, userDb, loggedUserReq?.email);

      const UserCanWrite = (ccConfig: any) => (
        ccConfig.emailResponsavel == loggedUserReq.email
        //|| loggedUserReq.roles.includes(rolesApp.gestorContr) 
      );

      const authCC: IAuthCC = { incluiPerfilGestorContr: true };

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
        if (processoOrcamentario == null) throw new ErrorPlus(`Processo Or??ament??rio para ${ano} n??o encontrado`);
        const processoOrcamentarioCentroCusto = await ProcessoOrcamentarioCentroCustoModel.findOne({ ano, centroCusto }).lean();
        if (processoOrcamentarioCentroCusto == null) throw new ErrorPlus(`Centro de Custo ${centroCusto} n??o configurado para o Processo Or??ament??rio`);
        CheckProcCentroCustosAuth(loggedUserReq, processoOrcamentarioCentroCusto, authCC);
        if (parm.cmd == CmdApi.itensGet) {
          const filterDb: any = { ano, centroCusto };
          const funcionarios = await FuncionarioModel.find(filterDb).lean().sort({ origem: 1, refer: 1 });
          const premissaDespRecorrArray = await PremissaModel.find({ anoIni: { $lte: ano }, anoFim: { $gte: ano }, revisao: RevisaoValor.atual, despRecorrFunc: true }).lean().sort({ cod: 1 });

          const funcionariosClient = funcionarios.map((funcionario) => {
            const funcionarioRevisao = funcionario[Funcionario.funcionarioRevisao(revisao)];
            const salarioLegado = Funcionario.unscrambleSalario(funcionario.salario_messy, funcionario.centroCusto, funcionario.refer);
            const salario = Funcionario.unscrambleSalario(funcionarioRevisao.salario_messy, funcionario.centroCusto, funcionario.refer);
            const salarioPromo = Funcionario.unscrambleSalario(funcionarioRevisao.salarioPromo_messy, funcionario.centroCusto, funcionario.refer);
            const result = new FuncionarioClient().Fill({
              ...funcionario,
              ...funcionarioRevisao,
              salarioLegado,
              salario,
              salarioPromo,
            });
            return result;
          });

          const userCanWrite = UserCanWrite(processoOrcamentarioCentroCusto);
          resumoApi.jsonData({
            value: {
              processoOrcamentario, processoOrcamentarioCentroCusto,
              funcionariosClient, premissaDespRecorrArray, userCanWrite
            }
          });
          deleteIfOk = true;
        }

        else if (parm.cmd == CmdApi.itensSet) {
          if (revisao != RevisaoValor.atual) throw new ErrorPlus('Essa revis??o n??o pode ser alterada');
          ProcessoOrcamentarioStatusMd.checkOperAllowed(OperInProcessoOrcamentario.altValoresPlanejados, processoOrcamentario.status);
          if (processoOrcamentarioCentroCusto.planejamentoEmAberto != true) throw new ErrorPlus('Centro de Custo n??o est?? aberto para lan??amentos');
          if (!UserCanWrite(processoOrcamentarioCentroCusto)) throw new ErrorPlus('Sem autoriza????o para grava????o');

          const changedLines = parm.data.changedLines as IChangedLine[];
          //csd(JSON.stringify(changedLines, null, 2));

          // valida????o antes de iniciar atualiza????o
          for (const changedLine of changedLines) {
            if (changedLine.lineState !== LineState.deleted)
              DataEdit.check(changedLine.dataEdit);
          }

          let lastReferSeq = 0;
          if (changedLines.find((x) => x.lineState == LineState.inserted) != null) {
            if (!processoOrcamentarioCentroCusto.permiteNovosClb)
              throw new ErrorPlus('Centro de Custo esta bloqueado para inclus??o de novos colaboradores');
            const lastRefer = await FuncionarioModel.aggregate([
              { $match: { ano, centroCusto, origem: OrigemFunc.local } },
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
                  throw new ErrorPlus(`N??o foi poss??vel determinar a referencia para novo funcion??rio devido a erro no ??ltimo inclu??do (${lastRefer[0].refer})`);
              }
            }
          }

          for (const changedLine of (changedLines as IChangedLine[])) {
            const dataEdit = changedLine.dataEdit;
            const key = changedLine.key;
            let origem;
            let refer;
            if (changedLine.lineState === LineState.inserted) {
              origem = OrigemFunc.local;
              if ((++lastReferSeq) > 999)
                throw new ErrorPlus('Excedido o m??ximo de funcion??rios novos para o centro de custo (999)');
              refer = `NOVO_${lastReferSeq.toString().padStart(3, '0')}`;
            }
            else {
              origem = key.origem;
              refer = key.refer;
            }

            let funcionarioData: Funcionario = null;
            if (changedLine.lineState === LineState.inserted ||
              changedLine.lineState === LineState.updated) {
              funcionarioData = {
                nome: dataEdit.nome,
                idVaga: dataEdit.idVaga,
                tipoColaborador: dataEdit.tipoColaborador,
                funcao: dataEdit.funcao,
                revisaoAtual: {
                  ativo: dataEdit.ativo,
                  tipoIni: dataEdit.tipoIni,
                  mesIni: dataEdit.mesIni != null ? amountParse(dataEdit.mesIni, 0) : undefined,
                  tipoFim: dataEdit.tipoFim,
                  mesFim: dataEdit.mesFim != null ? amountParse(dataEdit.mesFim, 0) : undefined,
                  salario_messy: Funcionario.scrambleSalario(amountParse(dataEdit.salario, configApp.decimalsSalario), centroCusto, refer),
                  dependentes: dataEdit.dependentes != null ? amountParse(dataEdit.dependentes, 0) : undefined,
                  valeTransp: dataEdit.valeTransp != null ? amountParse(dataEdit.valeTransp, configApp.decimalsSalario) : undefined,
                  mesPromo: dataEdit.mesPromo != null ? amountParse(dataEdit.mesPromo, 0) : undefined,
                  tipoColaboradorPromo: dataEdit.tipoColaboradorPromo,
                  salarioPromo_messy: dataEdit.salarioPromo != null ? Funcionario.scrambleSalario(amountParse(dataEdit.salarioPromo, configApp.decimalsSalario), centroCusto, refer) : undefined,
                  despsRecorr: dataEdit.despsRecorr,
                },
                lastUpdated: agora,
              } as Funcionario;
            }
            if (changedLine.lineState === LineState.inserted)
              await FuncionarioModel.create({ ano, centroCusto, origem, refer, ...funcionarioData, created: agora });
            else if (changedLine.lineState === LineState.updated)
              await FuncionarioModel.updateOne({ ano, centroCusto, origem, refer } as Funcionario, funcionarioData);
            else if (changedLine.lineState === LineState.deleted)
              await FuncionarioModel.deleteOne({ ano, centroCusto, origem, refer } as Funcionario);
            else
              throw new Error(`lineState inv??lido (${changedLine.lineState})`);
          }
          resumoApi.jsonData({});
        }
      }

      else if (parm.cmd == CmdApi.upload) {
        CheckRoleAllowed([rolesApp.cargaFunc], ConcatArrays(userDb.roles, userDb.rolesControlled));

        const ano = parm.ano;
        const uploadData: string[][] = parm.data;
        const deleteAllBefore = parm.deleteAllBefore;

        const processoOrcamentario = await ProcessoOrcamentarioModel.findOne({ ano }).lean();
        if (processoOrcamentario == null) throw new ErrorPlus('Processo Or??ament??rio n??o encontrado');
        ProcessoOrcamentarioStatusMd.checkOperAllowed(OperInProcessoOrcamentario.cargaFunc, processoOrcamentario.status);
        const documentsCentroCustoProc = await ProcessoOrcamentarioCentroCustoModel.find({ ano }).lean().sort({ centroCusto: 1 });

        const messages: IUploadMessage[] = [];
        let linesError = 0, linesOk = 0;
        const headerCsv = [...uploadData[0]].map((x) => x.trim());

        let lastKey = null;

        const fldsCsvDef = Funcionario.fldsCsvDefUpload;
        const fldsMissing = fldsCsvDef.filter((x) => !x.suppressColumn && x.mandatoryValue).reduce((prev, curr) => headerCsv.findIndex((x) => x == curr.fldDisp) == -1 ? [...prev, curr] : prev, []);
        const fldsIgnored = headerCsv.reduce((prev, curr) => {
          const fldCsvDef = fldsCsvDef.find((x) => x.fldDisp == curr);
          if (fldCsvDef == null || fldCsvDef.suppressColumn) return [...prev, curr];
          else return prev;
        }, []);

        if (fldsIgnored.length > 0)
          messages.push({ level: MessageLevelUpload.warn, message: `Colunas n??o previstas ignoradas: ${fldsIgnored.map(x => `"${x}"`).join(', ')} (aten????o para mai??sculas e min??sculas)` });

        if (fldsMissing.length > 0)
          messages.push({ level: MessageLevelUpload.error, message: `Colunas obrigat??rias n??o informadas: ${fldsMissing.map(x => `"${x.fldDisp}"`).join(', ')}` });
        else {

          // tratamento das linhas
          const documentsInsert: Funcionario[] = [];
          for (let line = 1; line < uploadData.length; line++) {
            const uploadColumArray = uploadData[line] as string[];
            const documentCsv: any = {};
            try {
              const allFlds = uploadColumArray.reduce((prev, curr) => prev + curr, '');
              if (allFlds.trim() === '')
                continue;

              headerCsv.forEach((prop, index) => documentCsv[prop] = uploadColumArray[index]); // monta o objeto com base no header
              const errosThisLine: string[] = [];

              const { documentCsvDb, allErrorsMessages } = FromCsvUpload(documentCsv, fldsCsvDef, configApp.csvStrForNull);
              if (allErrorsMessages.length > 0)
                errosThisLine.push(allErrorsMessages.join(', '));

              if (documentCsvDb.centroCusto != null &&
                documentCsvDb.refer != null) {
                const key = `${documentCsvDb.centroCusto}-${documentCsvDb.refer}`;
                if (lastKey != null &&
                  key <= lastKey)
                  errosThisLine.push('centroCusto/refer fora de ordem');
                else
                  lastKey = key;
              }

              // aqui checar se o sal??rio ?? v??lido #!!!!!!!

              const masterDataChecks = [
                { fld: 'centroCusto', md: documentsCentroCustoProc, fldMd: 'centroCusto', msg: 'n??o configurado para o ano' },
              ];
              for (let sxMdCheck = 0; sxMdCheck < masterDataChecks.length; sxMdCheck++) {
                const mdCheck = masterDataChecks[sxMdCheck];
                if (documentCsvDb[mdCheck.fld] != null &&
                  BinSearchItem(mdCheck.md, documentCsvDb[mdCheck.fld], mdCheck.fldMd) == null)
                  errosThisLine.push(`${mdCheck.fld} (${documentCsvDb[mdCheck.fld]}) ${mdCheck.msg}`);
              }

              if (errosThisLine.length != 0)
                throw new Error(errosThisLine.join(', '));

              const documentInsert = new Funcionario().Fill({
                ...documentCsvDb,
                ano,
                origem: OrigemFunc.legado,
                revisaoAtual: new FuncionarioRevisao().Fill({ ...documentCsvDb, ativo: true }),
                lastUpdated: agora,
                created: agora,
              });

              documentsInsert.push(documentInsert);
              messages.push({ level: MessageLevelUpload.ok, message: `Linha ${line} - ${documentCsvDb.centroCusto}/${documentCsvDb.refer} inclus??o pr?? validada` });
              linesOk++;

            } catch (error) {
              messages.push({ level: MessageLevelUpload.error, message: `Linha ${line} com erro - ${error.message}` });
              linesError++;
            }
          }
          if (documentsInsert.length > 0) {
            // await FuncionarioPremissasModel.deleteMany({ ano }); //  melhor se for sub documentos?
            // await FuncionarioValorEventualModel.deleteMany({ ano });
            if (deleteAllBefore)
              await FuncionarioModel.deleteMany({ ano });
            try {
              //throw new Error('aaaaaaa');
              const result = await FuncionarioModel.insertMany(documentsInsert, { ordered: false });
              if (result.length != documentsInsert.length) {
                const keysOk = result.map((x) => `${x.centroCusto}-${x.refer}`);
                const keysNotOk = documentsInsert.filter((x) => !keysOk.includes(`${x.centroCusto}-${x.refer}`));
                linesOk -= keysNotOk.length;
                linesError += keysNotOk.length;
                keysNotOk.forEach((x) => messages.push({ level: MessageLevelUpload.error, message: `Houve erro na efetiva????o da inclus??o para: ${x.centroCusto}/${x.refer}` }));
                // for (let index = 0; index < keysNotOk.length; index++) {
                //   const insertAgain = keysNotOk[index];
                //   checar proximidade com o timeOut api e abortar 
                //   try {
                //     const result = await FuncionarioModel.create(insertAgain);
                //     linesOk++;
                //   } catch (error) {
                //     messages.push({ level: MessageLevelUpload.error, message: `Houve erro na efetiva????o da inclus??o pr??-validada para ${insertAgain.centroCusto}/${insertAgain.refer}: ${error.message}` });
                //   }
                // }
                //keysNotOk.forEach((x) => messages.push({ level: MessageLevel.error, message: `Houve erro na efetiva????o da inclus??o para: ${x.centroCusto}/${x.refer}` }));
              }
              else
                messages.push({ level: MessageLevelUpload.ok, message: 'As inclus??es pr??-validadas foram efetivadas com sucesso' });
            } catch (error) {
              error.writeErrors.forEach((x) => messages.push({ level: MessageLevelUpload.error, message: `Erro ao inserir em lote: ${x.err.errmsg}` }));
            }
            if (deleteAllBefore)
              await ProcessoOrcamentarioModel.updateOne({ _id: processoOrcamentario._id }, { horaLoadFuncFull: agora, horaLoadFuncIncr: null } as ProcessoOrcamentario);
            else
              await ProcessoOrcamentarioModel.updateOne({ _id: processoOrcamentario._id }, { horaLoadFuncIncr: agora } as ProcessoOrcamentario);
          }
          else
            messages.push({ level: MessageLevelUpload.error, message: 'Nada a carregar' });
        }

        resumoApi.jsonData({ value: { messages, linesOk, linesError } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.getProcsOrcCCsAuthFuncionarios) {
        const procsCentrosCustoConfigAllYears = await procsCentroCustosConfigAuthAllYears(loggedUserReq, authCC);
        const centroCustoArray = await ccsAuthArray(procsCentrosCustoConfigAllYears);
        resumoApi.jsonData({ value: { procsCentrosCustoConfigAllYears, centroCustoArray } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.exportFuncionarios) {
        const { ano, centroCustoArray } = parm.filter || {};
        const revisao = RevisaoValor.atual;
        const processoOrcamentario = await ProcessoOrcamentarioModel.findOne({ ano }).lean();
        if (processoOrcamentario == null) throw new ErrorPlus(`Processo Or??ament??rio para ${ano} n??o encontrado`);

        let centroCustoArrayUse: string[] = null;
        if (centroCustoArray.length > 0) {
          for (const centroCusto of centroCustoArray) {
            const processoOrcamentarioCentroCusto = await ProcessoOrcamentarioCentroCustoModel.findOne({ ano, centroCusto }).lean();
            if (processoOrcamentarioCentroCusto == null) throw new ErrorPlus(`Centro de Custo ${centroCusto} n??o configurado para o Processo Or??ament??rio`);
            CheckProcCentroCustosAuth(loggedUserReq, processoOrcamentarioCentroCusto, authCC);
          }
          centroCustoArrayUse = centroCustoArray;
        }
        else {
          if (accessAllCCs(loggedUserReq, authCC))
            centroCustoArrayUse = [];
          else {
            const procsCentrosCustoConfigAllYears = await procsCentroCustosConfigAuthAllYears(loggedUserReq, authCC, ano);
            centroCustoArrayUse = procsCentrosCustoConfigAllYears[0].centroCustoConfig.map((x) => x.centroCusto);
          }
        }

        const centroCustoConfigMdArray = await ProcessoOrcamentarioCentroCustoModel.find({ ano }).lean().sort({ centroCusto: 1 });
        const unidadeNegocioMdArray = await UnidadeNegocioModel.find().lean().sort({ cod: 1 });
        const diretoriaMdArray = await DiretoriaModel.find().lean().sort({ cod: 1 });
        const gerenciaMdArray = await GerenciaModel.find().lean().sort({ cod: 1 });

        const filterCC = centroCustoArray.length > 0 ? { centroCusto: { $in: centroCustoArrayUse } } : {};
        const filterDb: any = { ano, ...filterCC };
        const funcionarios = await FuncionarioModel.find(filterDb).lean().sort({ centroCusto: 1, origem: 1, refer: 1 });

        const funcionariosClient = funcionarios.map((funcionario) => {
          const funcionarioRevisao = funcionario[Funcionario.funcionarioRevisao(revisao)];
          const salarioLegado = Funcionario.unscrambleSalario(funcionario.salario_messy, funcionario.centroCusto, funcionario.refer);
          const salario = Funcionario.unscrambleSalario(funcionarioRevisao.salario_messy, funcionario.centroCusto, funcionario.refer);
          const salarioPromo = Funcionario.unscrambleSalario(funcionarioRevisao.salarioPromo_messy, funcionario.centroCusto, funcionario.refer);
          const result = new FuncionarioClient().Fill({
            ...funcionario,
            ...funcionarioRevisao,
            salarioLegado,
            salario,
            salarioPromo,
          });
          return result;
        });

        resumoApi.jsonData({
          value: {
            funcionariosClient, centroCustoConfigMdArray,
            unidadeNegocioMdArray, diretoriaMdArray, gerenciaMdArray
          }
        });
        deleteIfOk = true;
      }

      else
        throw new Error(`Cmd '${parm.cmd}' inv??lido.`);

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