import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import _ from 'underscore';

import { ConnectDbASync, CloseDbASync } from '../../../../base/db/functions';

import { BinSearchItem, ErrorPlus, SleepMsDevRandom } from '../../../../libCommon/util';
import { csd, dbgError, dbgWarn } from '../../../../libCommon/dbg';
import { FromCsvUpload, IUploadMessage, MessageLevelUpload } from '../../../../libCommon/uploadCsv';
import { isAmbNone } from '../../../../libCommon/isAmb';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { CtrlApiExec, GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync, CheckTimeOutAndAbort } from '../../../../libServer/alertTimeExecApi';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { ProcessoOrcamentarioCentroCusto } from '../../../../appCydag/modelTypes';
import { OperInProcessoOrcamentario, ProcessoOrcamentarioStatus, ProcessoOrcamentarioStatusMd, RevisaoValor } from '../../../../appCydag/types';
import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';

import { apisApp, rolesApp } from '../../../../appCydag/endPoints'; // @!!!!! agrupar num index !
import { configApp, UploadCsvCmd } from '../../../../appCydag/config';
import { FuncionarioModel, TerceiroModel, UserModel, ValoresImputadosModel, ValoresLocalidadeModel, ValoresPlanejadosCalcModel, ValoresPlanejadosHistoricoModel, ValoresPremissaModel, ValoresTransferModel, ViagemModel } from '../../../../appCydag/models';

import { AgrupPremissasModel, DiretoriaModel, GerenciaModel, LocalidadeModel, UnidadeNegocioModel, CentroCustoModel, ProcessoOrcamentarioCentroCustoModel, ProcessoOrcamentarioModel as EntityModel } from '../../../../appCydag/models';
import { ProcessoOrcamentario as Entity } from '../../../../appCydag/modelTypes';

import { CmdApi_Crud as CmdApi } from './types';
import { GetValsPlanejados, ValoresPlanejadosCalc } from '../valoresContas';

const apiSelf = apisApp.processoOrcamentario;
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
  ctrlApiExec.checkElapsed('ini');

  try {
    await ConnectDbASync({ ctrlApiExec });
    const apiLogProc = await ApiLogStart(ctrlApiExec, loggedUserReq);

    //#region pre-carga
    {
      const anyDocDb = await EntityModel.findOne({});
      if (anyDocDb == null) {
        const documentInsert: Entity = {
          ano: '2020',
          status: ProcessoOrcamentarioStatus.preparacao,
          created: agora,
          lastUpdated: agora,
        };
        await EntityModel.create(documentInsert);
      }
      ctrlApiExec.checkElapsed('check/create first');
    }
    //#endregion

    try {
      if (loggedUserReq == null) throw new ErrorPlus('Usuário não está logado.');
      await CheckBlockAsync(loggedUserReq);
      CheckApiAuthorized(apiSelf, await UserModel.findOne({ email: loggedUserReq?.email }).lean(), loggedUserReq?.email);
      ctrlApiExec.checkElapsed(`pre ${parm.cmd}`);

      if (parm.cmd == CmdApi.list) {
        const { status } = parm.filter || {};
        const filterDb: any = {};
        if (status !== undefined)
          filterDb.status = status;
        const documentsDb = await EntityModel.find(filterDb).sort({ ano: -1 });
        resumoApi.jsonData({ value: { documents: documentsDb } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.insert) {
        const data = parm.data;
        const documentConflict = await EntityModel.findOne({ ano: data.ano });
        if (documentConflict != null) throw new ErrorPlus('Processo Orçamentário já cadastrado.');
        const documentInsert: Entity = {
          ...data,
          created: agora,
          lastUpdated: agora,
        };
        const documentDb = await EntityModel.create(documentInsert);
        resumoApi.jsonData({ value: documentDb });
      }

      else if (parm.cmd == CmdApi.update) {
        const data = parm.data;
        let documentDb = await EntityModel.findOne({ _id: new ObjectId(parm._id) });
        if (documentDb == null) throw new ErrorPlus('Não foi encontrado o Processo Orçamentário.');
        const documentUpdate: Entity = {
          ...data,
          lastUpdated: agora,
        };
        if (data.status === ProcessoOrcamentarioStatus.preCalculado) {
          if (documentDb.status !== ProcessoOrcamentarioStatus.bloqueado) throw new ErrorPlus('O processo orçamentário não está bloqueado.');
          // if (data.status === ProcessoOrcamentarioStatus.inputPlanej) {
          //   documentUpdate.horaPreCalcValoresPlanejados = null;
          //   await ValoresPlanejadosCalcModel.deleteMany({ ano: documentDb.ano, revisao: RevisaoValor.atual });
          // }
          await PreCalcValores(documentDb, ctrlApiExec);
          documentUpdate.horaPreCalcValoresPlanejados = agora;
        }
        else if (data.status === ProcessoOrcamentarioStatus.encerrado) {
          if (documentDb.status !== ProcessoOrcamentarioStatus.preCalculado) throw new ErrorPlus('O processo orçamentário não está pré calculado.');
          await EncerraProcessoOrcamentario(documentDb, ctrlApiExec);
          documentUpdate.horaPreCalcValoresPlanejados = agora;
        }
        documentDb = await EntityModel.findOneAndUpdate({ _id: new ObjectId(parm._id) }, documentUpdate, { new: true });
        resumoApi.jsonData({ value: documentDb });
      }

      else if (parm.cmd == CmdApi.geraRevisaoValores) {
        let documentDb = await EntityModel.findOne({ _id: new ObjectId(parm._id) });
        if (documentDb == null) throw new ErrorPlus('Não foi encontrado o Processo Orçamentário.');
        if (documentDb.status !== ProcessoOrcamentarioStatus.preCalculado) throw new ErrorPlus('Os dados não estão pré calculados.');
        const revisaoTarget = [RevisaoValor.anterior];
        if (documentDb.horaRevisaoInicial == null)
          revisaoTarget.push(RevisaoValor.inicial);
        await GenerateRevisao(documentDb, revisaoTarget);
        const documentUpdate: any = {
          horaRevisaoAnterior: documentDb.horaPreCalcValoresPlanejados,
        };
        if (documentDb.horaRevisaoInicial == null)
          documentUpdate.horaRevisaoInicial = documentDb.horaPreCalcValoresPlanejados;
        documentDb = await EntityModel.findOneAndUpdate({ _id: new ObjectId(parm._id) }, documentUpdate, { new: true });
        resumoApi.jsonData({ value: documentDb });
      }

      else if (parm.cmd == CmdApi.downloadConfigCCs ||
        parm.cmd == CmdApi.uploadConfigCCs) {
        const ano = parm.ano;

        const configCCsDb = await ProcessoOrcamentarioCentroCustoModel.aggregate([
          { $match: { ano } },
          {
            $project: {
              _id: false,
              //binSearch: { $concat: ['$centroCusto'] },
              //binSearch: { $concat: ['$cod', '$descr'] }, //@@!!!!! concat          
              centroCusto: true,
              planejamentoEmAberto: true,
              permiteNovosClb: true,
              emailResponsavel: true,
              emailPlanejador: true,
              emailConsulta: true,
              agrupPremissas: true,
              //centroCustoBenef: true,
              localidade: true,
              unidadeNegocio: true,
              diretoria: true,
              gerencia: true,
              //depto: true,
            }
          },
          { $sort: { centroCusto: 1 } },
        ]);

        const documentsCentroCusto = await CentroCustoModel.aggregate([{ $project: { _id: false, cod: true, descr: true } }, { $sort: { cod: 1 } }]);
        const documentsUser = await UserModel.aggregate([{ $project: { _id: false, email: true, nome: true } }, { $sort: { email: 1 } }]);
        //const documentsAgrupPremissas = await AgrupPremissasModel.aggregate([{ $match: { cod: { $ne: codAgrupPremissasCoringa } } }, { $project: { _id: false, cod: true, descr: true } }, { $sort: { cod: 1 } }]);
        const documentsAgrupPremissas = await AgrupPremissasModel.aggregate([{ $project: { _id: false, cod: true, descr: true } }, { $sort: { cod: 1 } }]);
        const documentsLocalidade = await LocalidadeModel.aggregate([{ $project: { _id: false, cod: true, descr: true } }, { $sort: { cod: 1 } }]);
        const documentsUnidadeNegocio = await UnidadeNegocioModel.aggregate([{ $project: { _id: false, cod: true, descr: true } }, { $sort: { cod: 1 } }]);
        const documentsDiretoria = await DiretoriaModel.aggregate([{ $project: { _id: false, cod: true, descr: true } }, { $sort: { cod: 1 } }]);
        const documentsGerencia = await GerenciaModel.aggregate([{ $project: { _id: false, cod: true, descr: true } }, { $sort: { cod: 1 } }]);
        //const documentsDepto = await DeptoModel.aggregate([{ $project: { _id: false, cod: true, descr: true } }, { $sort: { cod: 1 } }]);

        if (parm.cmd == CmdApi.downloadConfigCCs) {
          resumoApi.jsonData({
            value: {
              configCCsDb, documentsCentroCusto, documentsUser,
              documentsAgrupPremissas, documentsLocalidade, documentsUnidadeNegocio, documentsDiretoria, documentsGerencia
            }
          });
          deleteIfOk = true;
        }

        else {
          const uploadData: string[][] = parm.data;
          const processoOrcamentario = await EntityModel.findOne({ ano });
          if (processoOrcamentario == null) throw new ErrorPlus('Processo Orçamentário não encontrado');
          ProcessoOrcamentarioStatusMd.checkOperAllowed(OperInProcessoOrcamentario.altConfigCCs, processoOrcamentario.status);

          const messages: IUploadMessage[] = [];
          let linesError = 0, linesOk = 0;
          const headerCsv = [...uploadData[0]].map((x) => x.trim());

          let lastKey = null;

          const fldsCsvDef = ProcessoOrcamentarioCentroCusto.fldsCsvDefCrud;
          const fldsMissing = fldsCsvDef.filter((x) => !x.suppressColumn && x.mandatoryValue).reduce((prev, curr) => headerCsv.findIndex((x) => x == curr.fldDisp) == -1 ? [...prev, curr] : prev, []);
          const fldsIgnored = headerCsv.reduce((prev, curr) => {
            const fldCsvDef = fldsCsvDef.find((x) => x.fldDisp == curr);
            if (fldCsvDef == null || fldCsvDef.suppressColumn) return [...prev, curr];
            else return prev;
          }, []);

          if (fldsIgnored.length > 0)
            messages.push({ level: MessageLevelUpload.warn, message: `Colunas não previstas ignoradas: ${fldsIgnored.map(x => `"${x}"`).join(', ')} (atenção para maiúsculas e minúsculas)` });

          if (fldsMissing.length > 0)
            messages.push({ level: MessageLevelUpload.error, message: `Colunas obrigatórias não informadas: ${fldsMissing.map(x => `"${x}"`).join(', ')}` });
          else {

            // tratamento das linhas
            const documentsInsert: ProcessoOrcamentarioCentroCusto[] = [];
            const keysDelete: string[] = [];
            for (let index = 1; index < uploadData.length; index++) {
              const uploadColumArray = uploadData[index] as string[];
              const documentCsv: any = {};
              try {
                const allFlds = uploadColumArray.reduce((prev, curr) => prev + curr, '');
                if (allFlds.trim() === '')
                  continue;

                headerCsv.forEach((prop, index) => documentCsv[prop] = uploadColumArray[index]); // monta o objeto com base no header
                const errosThisLine: string[] = [];

                const cmd = documentCsv[configApp.csvColumnCmd] == null ? '' : documentCsv[configApp.csvColumnCmd].trim().toLowerCase();
                if (cmd === '')
                  continue;
                if (cmd != UploadCsvCmd.add && cmd != UploadCsvCmd.upd && cmd != UploadCsvCmd.del)
                  errosThisLine.push(`comando '${cmd}' inválido`);

                // converte tudo já para o formato e nomes corretos do DB
                //const documentCsvDb = ProcessoOrcamentarioCentroCusto.fromCsvCrud(documentCsv);
                //csl(index, configCCUpd.centroCusto);
                const { documentCsvDb, allErrorsMessages } = FromCsvUpload(documentCsv, fldsCsvDef, configApp.csvStrForNull);
                if (allErrorsMessages.length > 0)
                  errosThisLine.push(allErrorsMessages.join(', '));

                if (documentCsvDb.centroCusto != null) {
                  if (lastKey != null &&
                    documentCsvDb.centroCusto <= lastKey)
                    errosThisLine.push('centroCusto fora de ordem');
                  else {
                    lastKey = documentCsvDb.centroCusto;
                    if (BinSearchItem(configCCsDb, documentCsvDb.centroCusto, ProcessoOrcamentarioCentroCusto.F.centroCusto) != null) {
                      if (cmd == UploadCsvCmd.add)
                        errosThisLine.push('centroCusto já configurado para a versão');
                    }
                    else {
                      if (cmd == UploadCsvCmd.upd ||
                        cmd == UploadCsvCmd.del)
                        errosThisLine.push('centroCusto ainda não configurado para a versão');
                    }
                  }
                }

                if (cmd !== UploadCsvCmd.del) {
                  const masterDataChecks = [
                    { fld: 'centroCusto', md: documentsCentroCusto, fldMd: 'cod', msg: 'inexistente' },
                    { fld: 'emailResponsavel', md: documentsUser, fldMd: 'email', msg: 'inexistente' },
                    { fld: 'emailPlanejador', md: documentsUser, fldMd: 'email', msg: 'inexistente' },
                    // emailConsulta ##!!!!!
                    { fld: 'agrupPremissas', md: documentsAgrupPremissas, fldMd: 'cod', msg: 'inexistente' },
                    { fld: 'localidade', md: documentsLocalidade, fldMd: 'cod', msg: 'inexistente' },
                    { fld: 'unidadeNegocio', md: documentsUnidadeNegocio, fldMd: 'cod', msg: 'inexistente' },
                    { fld: 'diretoria', md: documentsDiretoria, fldMd: 'cod', msg: 'inexistente' },
                    { fld: 'gerencia', md: documentsGerencia, fldMd: 'cod', msg: 'inexistente' },
                    //{ fld: 'depto', md: documentsDepto, fldMd: 'cod', msg: 'inexistente' },
                  ];
                  for (let sxMdCheck = 0; sxMdCheck < masterDataChecks.length; sxMdCheck++) {
                    const mdCheck = masterDataChecks[sxMdCheck];
                    if (documentCsvDb[mdCheck.fld] != null &&
                      BinSearchItem(mdCheck.md, documentCsvDb[mdCheck.fld], mdCheck.fldMd) == null)
                      errosThisLine.push(`${mdCheck.fld} (${documentCsvDb[mdCheck.fld]}) ${mdCheck.msg}`);
                  }
                  if (!loggedUserReq.roles.includes(rolesApp.gestorContr) &&
                    documentCsvDb.emailResponsavel !== undefined)
                    errosThisLine.push('emailResponsavel só pode ser alterado pelo Gestor de Controladoria');
                }

                if (errosThisLine.length != 0)
                  throw new Error(errosThisLine.join(', '));

                // let dataUpdate = new ProcessoOrcamentarioCentroCusto();
                // FillClass(dataUpdate, dadosCsvTratados);
                const dataUpdate = _.omit(documentCsvDb, ProcessoOrcamentarioCentroCusto.F.centroCusto) as ProcessoOrcamentarioCentroCusto;

                if (cmd == UploadCsvCmd.add) {
                  const mandatoryFieldsMissing = ProcessoOrcamentarioCentroCusto.mandatoryFieldsInsert.reduce((prev, curr) => dataUpdate[curr] == undefined ? [...prev, curr] : prev, []);
                  if (mandatoryFieldsMissing.length != 0)
                    errosThisLine.push(`campos obrigatórios não informados: ${mandatoryFieldsMissing.join(', ')}`);
                }
                else if (cmd == UploadCsvCmd.upd) {
                  if (Object.keys(dataUpdate).length == 0)
                    errosThisLine.push('nada a atualizar');
                }

                if (errosThisLine.length != 0)
                  throw new Error(errosThisLine.join(', '));

                dataUpdate.lastUpdated = agora;
                try {
                  if (cmd == UploadCsvCmd.add) {
                    const documentInsert = new ProcessoOrcamentarioCentroCusto().Fill({
                      ...dataUpdate,
                      ano,
                      centroCusto: documentCsvDb.centroCusto,
                      created: agora,
                    });
                    documentsInsert.push(documentInsert);
                    messages.push({ level: MessageLevelUpload.ok, message: `Linha ${index + 1} - config ${documentCsvDb.centroCusto} inclusão validada` });
                  }
                  else if (cmd == UploadCsvCmd.upd) {
                    await ProcessoOrcamentarioCentroCustoModel.updateOne({ ano, centroCusto: documentCsvDb.centroCusto } as ProcessoOrcamentarioCentroCusto, dataUpdate);
                    messages.push({ level: MessageLevelUpload.ok, message: `Linha ${index + 1} - config ${documentCsvDb.centroCusto} alterada` });
                  }
                  else if (cmd == UploadCsvCmd.del) {
                    keysDelete.push(documentCsvDb.centroCusto);
                    messages.push({ level: MessageLevelUpload.ok, message: `Linha ${index + 1} - config ${documentCsvDb.centroCusto} exclusão validada` });
                  }
                  linesOk++;
                } catch (error) {
                  dbgError(error.message);
                  throw new Error(`com erro: ${error.message}`);
                }
              } catch (error) {
                messages.push({ level: MessageLevelUpload.error, message: `Linha ${index + 1} com erro - ${error.message}` });
                linesError++;
              }

              await CheckTimeOutAndAbort(ctrlApiExec);
            }
            if (documentsInsert.length > 0) {
              try {
                const result = await ProcessoOrcamentarioCentroCustoModel.insertMany(documentsInsert, { ordered: false });
                if (result.length != documentsInsert.length) {
                  // usar o método de inclusão individual ! mas monitorar o tempo máximo atéo timeout !
                  const keysOk = result.map((x) => x.centroCusto);
                  const keysNotOk = documentsInsert.filter((x) => !keysOk.includes(x.centroCusto));
                  linesOk -= keysNotOk.length;
                  linesError += keysNotOk.length;
                  keysNotOk.forEach((x) => messages.push({ level: MessageLevelUpload.error, message: `Houve erro na efetivação da inclusão para: ${x.centroCusto}` }));
                }
                else
                  messages.push({ level: MessageLevelUpload.ok, message: 'As inclusões pré-validadas foram efetivadas com sucesso' });
              } catch (error) {
                error.writeErrors.forEach((x) => messages.push({ level: MessageLevelUpload.error, message: `Erro ao inserir em lote: ${x.err.errmsg}` }));
              }
            }
            if (keysDelete.length > 0) {
              try {
                const result = await ProcessoOrcamentarioCentroCustoModel.deleteMany({ ano, centroCusto: { $in: keysDelete } });
                messages.push({ level: MessageLevelUpload.ok, message: 'As exclusões pré-validadas ocorreram com sucesso' });
              } catch (error) {
                error.writeErrors.forEach((x) => messages.push({ level: MessageLevelUpload.error, message: `Erro ao excluir em lote: ${x.err.errmsg}` }));
              }
            }
          }

          resumoApi.jsonData({ value: { messages, linesOk, linesError } });
          deleteIfOk = true;
        }
      }

      else
        throw new Error(`Cmd '${parm.cmd}' inválido.`);

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

const PreCalcValores = async (processoOrcamentario: Entity, ctrlApiExec: CtrlApiExec) => {
  const valsPlanejadosCalc = await ValoresPlanejadosCalc(processoOrcamentario, RevisaoValor.atual, [], false, false, ctrlApiExec);
  const filterTarget = { ano: processoOrcamentario.ano, revisao: RevisaoValor.atual };
  await ValoresPlanejadosCalcModel.deleteMany(filterTarget);
  await ValoresPlanejadosCalcModel.insertMany(valsPlanejadosCalc.vals.map((val) => ({
    ...val, ...filterTarget
  })));
};
const EncerraProcessoOrcamentario = async (processoOrcamentario: Entity, ctrlApiExec: CtrlApiExec) => {
  const { vals } = await GetValsPlanejados(processoOrcamentario, RevisaoValor.atual, [], true, false, false, false, ctrlApiExec);
  await ValoresPlanejadosHistoricoModel.insertMany(vals.map((val) => ({ ano: processoOrcamentario.ano, ..._.omit(val, ['idDetalhe', 'descr']) })));
};

const GenerateRevisao = async (processoOrcamentario: Entity, revisaoTargetArray: RevisaoValor[]) => {
  const valoresPremissas = await ValoresPremissaModel.find({ ano: processoOrcamentario.ano, revisao: RevisaoValor.atual }).lean();
  const valoresTransfer = await ValoresTransferModel.find({ ano: processoOrcamentario.ano, revisao: RevisaoValor.atual }).lean();
  const valoresLocalidade = await ValoresLocalidadeModel.find({ ano: processoOrcamentario.ano, revisao: RevisaoValor.atual }).lean();
  const terceiros = await TerceiroModel.find({ ano: processoOrcamentario.ano, revisao: RevisaoValor.atual }).lean();
  //const funcionarios = await FuncionarioModel.find({ ano: processoOrcamentario.ano });
  const viagens = await ViagemModel.find({ ano: processoOrcamentario.ano, revisao: RevisaoValor.atual }).lean();
  const valsImputados = await ValoresImputadosModel.find({ ano: processoOrcamentario.ano, revisao: RevisaoValor.atual }).lean();
  const valsPlanejadosCalc = await ValoresPlanejadosCalcModel.find({ ano: processoOrcamentario.ano, revisao: RevisaoValor.atual }).lean();
  for (const revisao of revisaoTargetArray) {
    const keyTarget = { ano: processoOrcamentario.ano, revisao };
    const propsAdd = { ...keyTarget, _id: null };

    await ValoresPremissaModel.deleteMany(keyTarget); await ValoresPremissaModel.insertMany(valoresPremissas.map((val) => ({ ...val, ...propsAdd })));
    await ValoresTransferModel.deleteMany(keyTarget); await ValoresTransferModel.insertMany(valoresTransfer.map((val) => ({ ...val, ...propsAdd })));
    await ValoresLocalidadeModel.deleteMany(keyTarget); await ValoresLocalidadeModel.insertMany(valoresLocalidade.map((val) => ({ ...val, ...propsAdd })));
    await TerceiroModel.deleteMany(keyTarget); await TerceiroModel.insertMany(terceiros.map((val) => ({ ...val, ...propsAdd })));

    if (revisao === RevisaoValor.anterior) await FuncionarioModel.updateMany({ ano: processoOrcamentario.ano }, [{ $set: { revisaoAnterior: '$revisaoAtual' } }]);
    else if (revisao === RevisaoValor.inicial) await FuncionarioModel.updateMany({ ano: processoOrcamentario.ano }, [{ $set: { revisaoInicial: '$revisaoAtual' } }]);

    await ViagemModel.deleteMany(keyTarget); await ViagemModel.insertMany(viagens.map((val) => ({ ...val, ...propsAdd })));
    await ValoresImputadosModel.deleteMany(keyTarget); await ValoresImputadosModel.insertMany(valsImputados.map((val) => ({ ...val, ...propsAdd })));
    await ValoresPlanejadosCalcModel.deleteMany(keyTarget); await ValoresPlanejadosCalcModel.insertMany(valsPlanejadosCalc.map((val) => ({ ...val, ...propsAdd })));
  }
};