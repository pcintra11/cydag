import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';

import { ApiAsyncLogModel, ApiSyncLogModel, SendMailLogModel } from '../../../../app_base/model';
import { ConnectDbASync, CloseDbASync, CheckModelsIndexesASync, EnsureModelsIndexesASync } from '../../../../libServer/dbMongo';
import { collectionsDef as collectionsDefBase } from '../../../../app_base/model';

import { AddToDate, DispAbrev, ErrorPlus } from '../../../../libCommon/util';
import { csd, dbg, ScopeDbg } from '../../../../libCommon/dbg';
import { FldCsvDef, FromCsvUpload, IUploadMessage, MessageLevelUpload } from '../../../../libCommon/uploadCsv';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
import { ResolvePromisesExecUntilResponse } from '../../../../libServer/opersASync';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { isAmbNone } from '../../../../app_base/envs';
import { configApp } from '../../../../app_hub/appConfig';

import {
  collectionsDef as collectionsDefApp, UserModel, CentroCustoModel, EmpresaModel, UnidadeNegocioModel, LocalidadeModel,
  ClasseCustoModel, FatorCustoModel, AgrupPremissasModel, DiretoriaModel, GerenciaModel, ValoresRealizadosModel, PremissaModel,
  ValoresPremissaModel, FuncaoTerceiroModel, ViagemModel, ValoresLocalidadeModel, ValoresTransferModel, TerceiroModel, ValoresImputadosModel,
  ValoresRealizadosInterfaceSapModel, ValoresPlanejadosHistoricoModel, databaseInterfaceSap
} from '../../../../appCydag/models';
import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { apisApp } from '../../../../appCydag/endPoints';
import {
  User, Empresa, Gerencia, Diretoria, AgrupPremissas, CentroCusto, Localidade, UnidadeNegocio, FatorCusto, ClasseCusto, Premissa,
  ValoresPremissa, FuncaoTerceiro, Viagem, ValoresLocalidade, ValoresTransfer, ValoresRealizados, ValoresImputados, ValoresPlanejadosHistorico,
  Terceiro
} from '../../../../appCydag/modelTypes';

import { CmdApi_FuncAdm } from './types';
import { DataTestCydag } from './testData';

const apiSelf = apisApp.funcsAdm;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  const ctrlApiExec = GetCtrlApiExec(req, res, ['cmd'], ['idProc']);
  const loggedUserReq = await LoggedUserReqASync(ctrlApiExec);
  const parm = ctrlApiExec.parm;
  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();
  let deleteIfOk = false;

  const dbgX = (level: number, ...params) => dbg({ level, scopeMsg: ScopeDbg.x, ctrlContext: ctrlApiExec.ctrlContext }, ...params);
  //const dbgT = (level: number, ...params) => dbg({ level, levelScope: ScopeDbg.t, context }, ...params);

  try {
    await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
    await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext, database: databaseInterfaceSap });
    const apiLogProc = await ApiLogStart(ctrlApiExec, loggedUserReq);

    //const qtdLoadDefault = 100000;
    // const FullPath = (file: string) => {
    //   let fullPath: string;
    //   if (isPlataformVercel())
    //     fullPath = path.join(process.cwd(), 'data', file);
    //   else
    //     fullPath = 'data' + '/' + file;
    //   //csl({ fullPath });
    //   return fullPath;
    // };

    // comum a todos uploads
    // const bloco = parm.bloco != null ? Number(parm.bloco) : 1;
    // const qtd = parm.qtd != null ? Number(parm.qtd) : qtdLoadDefault;
    //csl({ bloco, qtd });


    try {
      if (loggedUserReq == null) throw new ErrorPlus('Usuário não está logado.');
      await CheckBlockAsync(loggedUserReq);
      const userDb = await UserModel.findOne({ email: loggedUserReq.email }).lean();
      CheckApiAuthorized(apiSelf, userDb, loggedUserReq.email);

      if (parm.cmd == CmdApi_FuncAdm.ensureIndexes) {
        const messagesIndexesApp = await EnsureModelsIndexesASync('main', collectionsDefApp);
        const messagesIndexesBase = await EnsureModelsIndexesASync('base', collectionsDefBase);
        resumoApi.jsonData({ value: { msgsProc: [...messagesIndexesApp.map((x) => `main: ${x}`), ...messagesIndexesBase.map((x) => `base: ${x}`)] } });
      }

      else if (parm.cmd == CmdApi_FuncAdm.checkIndexes) {
        const messagesIndexesApp = await CheckModelsIndexesASync('app', collectionsDefApp);
        const messagesIndexesBase = await CheckModelsIndexesASync('base', collectionsDefBase);
        resumoApi.jsonData({ value: { msgsProc: [...messagesIndexesApp.map((x) => `main: ${x}`), ...messagesIndexesBase.map((x) => `base: ${x}`)] } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi_FuncAdm.clearLogsToDelete) {
        const horaRetainLogs = AddToDate(agora, { seconds: -(60) });
        const apiSync = await ApiSyncLogModel.deleteMany({ shouldDelete: true, ended: { $ne: null, $lt: horaRetainLogs } });
        const apiAsync = await ApiAsyncLogModel.deleteMany({ shouldDelete: true, ended: { $ne: null, $lt: horaRetainLogs } });
        const sendMail = await SendMailLogModel.deleteMany({ shouldDelete: true, ended: { $ne: null, $lt: horaRetainLogs } });
        resumoApi.jsonData({ value: { msgsProc: [`deletados - apiSync: ${apiSync.deletedCount}, apiAsync: ${apiAsync.deletedCount}, sendMail: ${sendMail.deletedCount}`] } });
      }

      else if (parm.cmd == CmdApi_FuncAdm.clearOldLogs) {
        const horaRetainLogs = AddToDate(agora, { minutes: -(60) });
        const apiSync = await ApiSyncLogModel.deleteMany({ ended: { $ne: null, $lt: horaRetainLogs } });
        const apiAsync = await ApiAsyncLogModel.deleteMany({ ended: { $ne: null, $lt: horaRetainLogs } });
        const sendMail = await SendMailLogModel.deleteMany({ ended: { $ne: null, $lt: horaRetainLogs } });
        resumoApi.jsonData({ value: { msgsProc: [`deletados - apiSync: ${apiSync.deletedCount}, apiAsync: ${apiAsync.deletedCount}, sendMail: ${sendMail.deletedCount}`] } });
      }

      // else if (parm.cmd == CmdApi_FuncAdm.loadUser) {

      //   class Entity extends User { }
      //   const EntityModel = UserModel;
      //   const fullPath = FullPath('user.csv');

      //   vai dar pau qdo executar o build compilado, pois é serverless !!! E o erro não dá pra saber que é por isso !!
      //   const data = await csvdata.load(fullPath, { delimiter: ';', encoding: 'latin1' }); // ansi?

      //   const bulkImport: Entity[] = [];
      //   data.forEach((reg: any, index: number) => {
      //     //csl(index, reg);
      //     if (index >= ((bloco - 1) * qtd) &&
      //       index < ((bloco) * qtd)) {
      //       const documentInsert: Entity = {
      //         ativo: true,
      //         email: reg.email.trim().toLowerCase(),
      //         //email_superior: reg.email_superior.trim() != '' ? reg.email_superior.trim().toLowerCase() : null,
      //         roles: reg.roles.trim() != '' ? reg.roles.trim().toLowerCase().split(',') : [],
      //         rolesControlled: [],
      //         nome: reg.nome.trim(),
      //         created: agora,
      //         lastUpdated: agora,
      //       };
      //       documentInsert.searchTerms = Entity.SearchTermsGen(documentInsert);
      //       bulkImport.push(documentInsert);
      //     }
      //   });
      //   //csl(JSON.stringify(bulkImport, null, 2));
      //   const msgs = [];
      //   try {
      //     await EntityModel.insertMany(bulkImport, { ordered: false });
      //     msgs.push(`${bulkImport.length} registros incluídos`);
      //   }
      //   catch (error) {
      //     if (error.code == DbErrors.duplicateKey.code) {
      //       msgs.push(`${error.insertedDocs.length} ok, ${error.writeErrors.length} errors`);
      //       error.writeErrors.forEach((x) => msgs.push(`error ${x.errmsg} - email: ${x.err?.op?.email}`));
      //     }
      //     else
      //       msgs.push(`Erro em ${parm.cmd}: ${error.message}`);
      //   }
      //   resumoApi.jsonData({ value: msgs });
      // }

      else if (parm.cmd == CmdApi_FuncAdm.setTesteDataPlan ||
        parm.cmd == CmdApi_FuncAdm.setTesteDataInterfaceSap) {
        const msgsProc = await DataTestCydag(parm.cmd); // #!!!!!!!!!!
        resumoApi.jsonData({ value: { msgsProc } });
      }

      else if (parm.cmd == CmdApi_FuncAdm.getMainAmbs) {
        const msgs = [];
        msgs.push(`NEXT_PUBLIC_AMB: ${process.env.NEXT_PUBLIC_AMB}`);
        msgs.push(`SITE_DATABASE_APP: ${DispAbrev(process.env.SITE_DATABASE_APP, 30)}`);
        msgs.push(`NEXT_PUBLIC_DEPLOY_CONFIG: ${process.env.NEXT_PUBLIC_DEPLOY_CONFIG}`);
        msgs.push(`NEXT_PUBLIC_API_TIMEOUT: ${process.env.NEXT_PUBLIC_API_TIMEOUT}`);
        resumoApi.jsonData({ value: { msgsProc: msgs } });
      }

      else if (parm.cmd == CmdApi_FuncAdm.testeCodeServer) {
        const msgs = [];
        const resultIncl = await ValoresRealizadosInterfaceSapModel.create({
          ano: '2000',
          centroCusto: 'cc1',
          classeCusto: 'cl1',
          m01: 123,
        });
        msgs.push('ok incluído em ValoresRealizadosInterfaceSap ano 2000');
        resumoApi.jsonData({ value: { msgsProc: msgs } });
      }

      //#region lixo
      // else if (parm.cmd == CmdApi_FuncAdm.loadCentroCusto) {
      //   class Entity extends CentroCusto { }
      //   const EntityModel = CentroCustoModel;
      //   const fullPath = FullPath('centroCusto.csv');

      //   const data = await csvdata.load(fullPath, { delimiter: ';', encoding: 'latin1' });
      //   const bulkImport: Entity[] = [];
      //   data.forEach((reg: any, index: number) => {
      //     //csl(index, reg);
      //     if (index >= ((bloco - 1) * qtd) &&
      //       index < ((bloco) * qtd)) {
      //       const documentInsert: Entity = {
      //         cod: reg.cod.trim().toUpperCase(),
      //         descr: reg.descr.trim(),
      //         //ativo: reg.ativoSN.trim() != 's',
      //         //sap: reg.sapSN.trim() != 's',
      //         created: agora,
      //         lastUpdated: agora,
      //       };
      //       documentInsert.searchTerms = Entity.SearchTermsGen(documentInsert);
      //       bulkImport.push(documentInsert);
      //     }
      //   });
      //   //csl(JSON.stringify(bulkImport, null, 2));
      //   const msgs = [];
      //   try {
      //     await EntityModel.insertMany(bulkImport, { ordered: false });
      //     msgs.push(`${bulkImport.length} registros incluídos`);
      //   }
      //   catch (error) {
      //     if (error.code == DbErrors.duplicateKey.code) {
      //       msgs.push(`${error.insertedDocs.length} ok, ${error.writeErrors.length} errors`);
      //       error.writeErrors.forEach((x) => msgs.push(`error ${x.errmsg} - key: ${x.err?.op?.cod}`));
      //     }
      //     else
      //       msgs.push(`Erro em ${parm.cmd}: ${error.message}`);
      //   }
      //   resumoApi.jsonData({ value: msgs });
      // }
      //#endregion lixo

      else if (parm.cmd == CmdApi_FuncAdm.collectionDownload ||
        parm.cmd == CmdApi_FuncAdm.collectionUpload ||
        parm.cmd == CmdApi_FuncAdm.collectionReset) {
        const collection = parm.collection;
        let model: mongoose.Model<any> = null;
        let fldsCsvDefUpload: FldCsvDef[] = [];
        let fill: (values: any, init?: boolean) => any = null;

        //#region coleções
        if (collection == 'AgrupPremissas') { model = AgrupPremissasModel; fldsCsvDefUpload = AgrupPremissas.fldsCsvDefUpload; fill = AgrupPremissas.fill; }
        else if (collection == 'CentroCusto') { model = CentroCustoModel; fldsCsvDefUpload = CentroCusto.fldsCsvDefUpload; fill = CentroCusto.fill; }
        else if (collection == 'Diretoria') { model = DiretoriaModel; fldsCsvDefUpload = Diretoria.fldsCsvDefUpload; fill = Diretoria.fill; }
        else if (collection == 'Empresa') { model = EmpresaModel; fldsCsvDefUpload = Empresa.fldsCsvDefUpload; fill = Empresa.fill; }
        else if (collection == 'Gerencia') { model = GerenciaModel; fldsCsvDefUpload = Gerencia.fldsCsvDefUpload; fill = Gerencia.fill; }
        else if (collection == 'Localidade') { model = LocalidadeModel; fldsCsvDefUpload = Localidade.fldsCsvDefUpload; fill = Localidade.fill; }
        else if (collection == 'UnidadeNegocio') { model = UnidadeNegocioModel; fldsCsvDefUpload = UnidadeNegocio.fldsCsvDefUpload; fill = UnidadeNegocio.fill; }

        else if (collection == 'FatorCusto') { model = FatorCustoModel; fldsCsvDefUpload = FatorCusto.fldsCsvDefUpload; fill = FatorCusto.fill; }
        else if (collection == 'ClasseCusto') { model = ClasseCustoModel; fldsCsvDefUpload = ClasseCusto.fldsCsvDefUpload; fill = ClasseCusto.fill; }
        else if (collection == 'Premissa') { model = PremissaModel; fldsCsvDefUpload = Premissa.fldsCsvDefUpload; fill = Premissa.fill; }
        else if (collection == 'FuncaoTerceiro') { model = FuncaoTerceiroModel; fldsCsvDefUpload = FuncaoTerceiro.fldsCsvDefUpload; fill = FuncaoTerceiro.fill; }

        else if (collection == 'User') { model = UserModel; fldsCsvDefUpload = User.fldsCsvDefUpload; fill = User.fill; }

        else if (collection == 'ValoresRealizados') { model = ValoresRealizadosModel; fldsCsvDefUpload = ValoresRealizados.fldsCsvDefUpload; fill = ValoresRealizados.fill; }
        else if (collection == 'ValoresImputados') { model = ValoresImputadosModel; fldsCsvDefUpload = ValoresImputados.fldsCsvDefUpload; fill = ValoresImputados.fill; }
        else if (collection == 'valoresPlanejadosHistorico') { model = ValoresPlanejadosHistoricoModel; fldsCsvDefUpload = ValoresPlanejadosHistorico.fldsCsvDefUpload; fill = ValoresPlanejadosHistorico.fill; }

        else if (collection == 'ValoresPremissa') { model = ValoresPremissaModel; fldsCsvDefUpload = ValoresPremissa.fldsCsvDefUpload; fill = ValoresPremissa.fill; }
        else if (collection == 'ValoresLocalid') { model = ValoresLocalidadeModel; fldsCsvDefUpload = ValoresLocalidade.fldsCsvDefUpload; fill = ValoresLocalidade.fill; }
        else if (collection == 'ValoresTransfer') { model = ValoresTransferModel; fldsCsvDefUpload = ValoresTransfer.fldsCsvDefUpload; fill = ValoresTransfer.fill; }

        else if (collection == 'Terceiro') { model = TerceiroModel; fldsCsvDefUpload = Terceiro.fldsCsvDefUpload; fill = Terceiro.fill; }
        else if (collection == 'Viagem') { model = ViagemModel; fldsCsvDefUpload = Viagem.fldsCsvDefUpload; fill = Viagem.fill; }

        else
          throw new Error(`coleção ${collection} não prevista`);
        //#endregion

        if (parm.cmd == CmdApi_FuncAdm.collectionDownload) {
          const downloadAmostra = parm.downloadAmostra;
          const limit = (downloadAmostra === true) ? 10 : null;
          const documentArray = await model.find().limit(limit);
          resumoApi.jsonData({ value: { documentArray } });
        }
        else if (parm.cmd == CmdApi_FuncAdm.collectionUpload) {
          const uploadData = parm.data;
          const uploadEach = parm.uploadEach;

          const messages: IUploadMessage[] = [];
          let linesError = 0, linesOk = 0, linesErrorNotIdenf = 0;
          const headerCsv = [...uploadData[0]].map((x) => x.trim());

          const fldsCsvDef = fldsCsvDefUpload;
          const fldsMissing = fldsCsvDef.filter((x) => !x.suppressColumn && x.mandatoryValue).reduce((prev, curr) => headerCsv.findIndex((x) => x == curr.fldDisp) == -1 ? [...prev, curr] : prev, []);
          const fldsIgnored = headerCsv.reduce((prev, curr) => {
            const fldCsvDef = fldsCsvDef.find((x) => x.fldDisp == curr);
            if (fldCsvDef == null || fldCsvDef.suppressColumn) return [...prev, curr];
            else return prev;
          }, []);
          if (fldsIgnored.length > 0)
            messages.push({ level: MessageLevelUpload.warn, message: `Colunas não previstas e ignoradas: ${fldsIgnored.map(x => `'${x}"`).join(', ')} (atenção para maiúsculas e minúsculas)` });
          if (fldsMissing.length > 0)
            messages.push({ level: MessageLevelUpload.warn, message: `Colunas obrigatórias não informadas: ${fldsMissing.map(x => `"${x}"`).join(', ')}` });

          //const documentsInsert: { line: number, documentDb: any }[] = [];
          const documentsInsert: any[] = [];
          let linesProc = 0;
          for (let line = 1; line < uploadData.length; line++) {
            const uploadColumArray = uploadData[line] as string[];
            const documentCsv: any = {};

            try {
              const allFlds = uploadColumArray.reduce((prev, curr) => prev + curr, '');
              if (allFlds.trim() === '')
                continue;

              headerCsv.forEach((prop, index) => documentCsv[prop] = uploadColumArray[index]); // monta o objeto com base no header
              const errosThisLine: string[] = [];

              linesProc++;

              const { documentCsvDb, allErrorsMessages } = FromCsvUpload(documentCsv, fldsCsvDef, configApp.csvStrForNull);
              if (allErrorsMessages.length > 0)
                errosThisLine.push(allErrorsMessages.join(', '));
              //csl({ documentCsv, documentCsvDb });

              if (errosThisLine.length != 0)
                throw new Error(errosThisLine.join(', '));

              const documentInsert = fill(documentCsvDb);
              if (uploadEach === true) await model.create(documentInsert);
              else documentsInsert.push(documentInsert);
              linesOk++;

            } catch (error) {
              messages.push({ level: MessageLevelUpload.error, message: `Linha ${line} com erro - ${error.message}` });
              linesError++;
            }
          }

          if (documentsInsert.length > 0) {
            //cst('start', 'iniciando inclusão');
            try {
              const result = await model.insertMany(documentsInsert, { ordered: false });
              if (result.length != documentsInsert.length) {
                messages.push({ level: MessageLevelUpload.error, message: `Total de linhas incluídas (${result.length}) diferente do arquivo (${documentsInsert.length})` });
                linesErrorNotIdenf = (documentsInsert.length - result.length);
                linesOk -= linesErrorNotIdenf;
              }
            } catch (error) {
              messages.push({ level: MessageLevelUpload.error, message: error.message });
              linesErrorNotIdenf = (documentsInsert.length - error.result.nInserted);
              linesOk -= linesErrorNotIdenf;
              //error.writeErrors.forEach((x) => messages.push({ level: MessageLevel.error, message: `linha ${documentsInsert[x.err.index].line}: ${x.err.errmsg}` }));
              error.writeErrors.forEach((x) => messages.push({ level: MessageLevelUpload.error, message: `erro: ${x.err.errmsg}` }));
            }
            //cst('fim da inclusão em massa');
          }
          resumoApi.jsonData({ value: { messages, linesProc, linesOk, linesError, linesErrorNotIdenf } });
        }
        else if (parm.cmd == CmdApi_FuncAdm.collectionReset) {
          await model.collection.drop();
          const result = await model.ensureIndexes();
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
    await CloseDbASync({ ctrlContext: ctrlApiExec.ctrlContext, database: databaseInterfaceSap });
    await CloseDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 2', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }

  await ResolvePromisesExecUntilResponse(ctrlApiExec.ctrlContext);
  //dbgX(1, 'response');

  const elapsedMsApi = resumoApi.json();
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, loggedUserReq);
};