import type { NextApiRequest, NextApiResponse } from 'next';
//import path from 'path';
//import csvdata from 'csvdata';
import mongoose from 'mongoose';

import { ApiAsyncLogModel, ApiSyncLogModel, SendMailLogModel } from '../../../../base/db/models';
import { ConnectDbASync, CloseDbASync, CheckModelsIndexesASync, EnsureModelsIndexesASync } from '../../../../base/db/functions';
import { collectionsDef as collectionsDefBase } from '../../../../base/db/models';

import { AddToDate, compareForBinSearch, CtrlCollect, DispAbrev, ErrorPlus, StrRight } from '../../../../libCommon/util';
import { csd, dbg, ScopeDbg } from '../../../../libCommon/dbg';
import { FldCsvDef, FromCsvUpload, IUploadMessage, MessageLevelUpload } from '../../../../libCommon/uploadCsv';
import { isAmbNone } from '../../../../libCommon/isAmb';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
import { ResolvePromisesExecUntilResponse } from '../../../../libServer/opersASync';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { collectionsDef as collectionsDefApp, UserModel, CentroCustoModel, EmpresaModel, UnidadeNegocioModel, LocalidadeModel, ClasseCustoModel, FatorCustoModel, AgrupPremissasModel, DiretoriaModel, GerenciaModel, ValoresRealizadosModel, PremissaModel, ValoresPremissaModel, FuncaoTerceiroModel, ViagemModel, ValoresLocalidadeModel, ValoresTransferModel, FuncionarioModel, ProcessoOrcamentarioCentroCustoModel, TerceiroModel, ValoresImputadosModel, ValoresRealizadosInterfaceSapModel, ProcessoOrcamentarioModel, ValoresPlanejadosHistoricoModel, databaseInterfaceSap } from '../../../../appCydag/models';
import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { apisApp } from '../../../../appCydag/endPoints';
import { User, Empresa, Gerencia, Diretoria, AgrupPremissas, CentroCusto, Localidade, UnidadeNegocio, FatorCusto, ClasseCusto, Premissa, ValoresPremissa, FuncaoTerceiro, Viagem, ValoresLocalidade, ValoresTransfer, ValoresRealizados, Funcionario, FuncionarioRevisao, empresaCoringa, localidadeCoringa, ValoresImputados, ValoresPlanejadosHistorico, Terceiro } from '../../../../appCydag/modelTypes';
import { configApp } from '../../../../appCydag/config';

import { CmdApi_FuncAdm } from './types';
import { CategRegional, OrigemFunc, ProcessoOrcamentarioStatus, RevisaoValor, TipoColaborador, TipoParticipPerOrcam, TipoPlanejViagem, TipoSegmCentroCusto } from '../../../../appCydag/types';
import { isAmbDevOrQas } from '../../../../libCommon/isAmb';
import { premissaCod } from '../valoresContas/calcsCydag';
import { anoAdd, mesesFld, multiplyValMeses, sumValMeses } from '../../../../appCydag/util';
import { accountDeveloper } from '../user/auth';

const apiSelf = apisApp.funcsAdm;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  const ctrlApiExec = GetCtrlApiExec(req, res, ['cmd'], ['idProc']);
  const loggedUserReq = await LoggedUserReqASync(ctrlApiExec);
  const parm = ctrlApiExec.parm;
  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();
  let deleteIfOk = false;

  const dbgX = (level: number, ...params) => dbg({ level, levelScope: ScopeDbg.x, context: ctrlApiExec.context(), color: ctrlApiExec?.colorDestaq }, ...params);
  //const dbgT = (level: number, ...params) => dbg({ level, levelScope: ScopeDbg.t, context, color: ctrlApiExec?.colorDestaq }, ...params);

  try {
    await ConnectDbASync({ ctrlApiExec });
    await ConnectDbASync({ ctrlApiExec, database: databaseInterfaceSap });
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
      if (loggedUserReq == null)
        throw new ErrorPlus('Usuário não está logado.');
      await CheckBlockAsync(loggedUserReq);
      const userDb = await UserModel.findOne({ email: loggedUserReq.email }).lean();
      await CheckApiAuthorized(apiSelf, userDb, loggedUserReq.email);

      if (parm.cmd == CmdApi_FuncAdm.ensureIndexes) {
        const messagesIndexesApp = await EnsureModelsIndexesASync('main', collectionsDefApp);
        const messagesIndexesBase = await EnsureModelsIndexesASync('base', collectionsDefBase);
        resumoApi.jsonData({ value: [...messagesIndexesApp.map((x) => `main: ${x}`), ...messagesIndexesBase.map((x) => `base: ${x}`)] });
      }

      else if (parm.cmd == CmdApi_FuncAdm.checkIndexes) {
        const messagesIndexesApp = await CheckModelsIndexesASync('app', collectionsDefApp);
        const messagesIndexesBase = await CheckModelsIndexesASync('base', collectionsDefBase);
        resumoApi.jsonData({ value: [...messagesIndexesApp.map((x) => `main: ${x}`), ...messagesIndexesBase.map((x) => `base: ${x}`)] });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi_FuncAdm.clearLogsToDelete) {
        const horaRetainLogs = AddToDate(agora, { seconds: -(60) });
        const apiSync = await ApiSyncLogModel.deleteMany({ shouldDelete: true, ended: { $ne: null, $lt: horaRetainLogs } });
        const apiAsync = await ApiAsyncLogModel.deleteMany({ shouldDelete: true, ended: { $ne: null, $lt: horaRetainLogs } });
        const sendMail = await SendMailLogModel.deleteMany({ shouldDelete: true, ended: { $ne: null, $lt: horaRetainLogs } });
        resumoApi.jsonData({ value: [`deletados - apiSync: ${apiSync.deletedCount}, apiAsync: ${apiAsync.deletedCount}, sendMail: ${sendMail.deletedCount}`] });
      }

      else if (parm.cmd == CmdApi_FuncAdm.clearOldLogs) {
        const horaRetainLogs = AddToDate(agora, { minutes: -(60) });
        const apiSync = await ApiSyncLogModel.deleteMany({ ended: { $ne: null, $lt: horaRetainLogs } });
        const apiAsync = await ApiAsyncLogModel.deleteMany({ ended: { $ne: null, $lt: horaRetainLogs } });
        const sendMail = await SendMailLogModel.deleteMany({ ended: { $ne: null, $lt: horaRetainLogs } });
        resumoApi.jsonData({ value: [`deletados - apiSync: ${apiSync.deletedCount}, apiAsync: ${apiAsync.deletedCount}, sendMail: ${sendMail.deletedCount}`] });
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

        //#region dados teste
        const ano = '2001';
        const mesesLen = mesesFld.length;

        const testUn1p = { unidadeNegocio: '_UN1P', descr: 'Unidade de Negócio 1 (teste - regionais principais)', categRegional: CategRegional.principais };
        const testUn2o = { unidadeNegocio: '_UN2O', descr: 'Unidade de Negócio 2 (teste - regional outras)', categRegional: CategRegional.outras };
        const testUn3 = { unidadeNegocio: '_UN3', descr: 'Unidade de Negócio 3 (teste - sem regional)', categRegional: null };
        const unArray = [testUn1p, testUn2o, testUn3];

        const dir1 = { diretoria: '_DIR1', descr: 'Diretoria 1 (teste)' };
        const dir2 = { diretoria: '_DIR2', descr: 'Diretoria 2 (teste)' };
        const dir3 = { diretoria: '_DIR3', descr: 'Diretoria 3 (teste)' };
        const dirArray = [dir1, dir2, dir3];

        const ger1 = { gerencia: '_GER1', descr: 'Gerencia 1 (teste)' };
        const ger2 = { gerencia: '_GER2', descr: 'Gerencia 2 (teste)' };
        const gerArray = [ger1, ger2];

        const empr1 = { empresa: '_TST1', descr: 'Empresa 1 (teste)' };
        const empr2 = { empresa: '_TST2', descr: 'Empresa 2 (teste)' };
        const emprsTeste = [empr1, empr2];

        const agrup1 = { agrupPremissas: '_AGRUP1', descr: 'Agrupamento 1 (teste - sudeste)' };
        const agrup2 = { agrupPremissas: '_AGRUP2', descr: 'Agrupamento 2 (teste - sul)' };
        const agrupArray = [agrup1, agrup2];

        const localidade1 = { localidade: 'L1', descr: 'Localidade 1 (teste)' };
        const localidade2 = { localidade: 'L2', descr: 'Localidade 2 (teste)' };
        const localidade3 = { localidade: 'L3', descr: 'Localidade 3 (teste)' };
        const localidadeArray = [localidade1, localidade2, localidade3];

        // cc10 cc11 são idênticos, mudam apenas as premissas localidade e UN
        // cc10 cc12 são idênticos, mudam apenas as premissas por agrup premissas
        // final cc10 são idênticos, mudam apenas as premissas por empresa
        const empr1_cc10 = { centroCusto: `${empr1.empresa}_CC10`, agrupPremissas: agrup1.agrupPremissas, localidade: localidade1.localidade, unidadeNegocio: testUn1p.unidadeNegocio, diretoria: dir1.diretoria, gerencia: ger1.gerencia };
        const empr1_cc11 = { centroCusto: `${empr1.empresa}_CC11`, agrupPremissas: agrup1.agrupPremissas, localidade: localidade2.localidade, unidadeNegocio: testUn2o.unidadeNegocio, diretoria: dir2.diretoria, gerencia: ger2.gerencia };
        const empr1_cc12 = { centroCusto: `${empr1.empresa}_CC12`, agrupPremissas: agrup2.agrupPremissas, localidade: localidade1.localidade, unidadeNegocio: testUn1p.unidadeNegocio, diretoria: dir1.diretoria };
        const empr2_cc10 = { centroCusto: `${empr2.empresa}_CC10`, agrupPremissas: agrup1.agrupPremissas, localidade: localidade1.localidade, unidadeNegocio: testUn1p.unidadeNegocio, diretoria: dir2.diretoria };
        const empr1_cc20 = { centroCusto: `${empr1.empresa}_CC20`, agrupPremissas: null, localidade: localidade1.localidade, unidadeNegocio: testUn3.unidadeNegocio };
        const empr1_cc30 = { centroCusto: `${empr1.empresa}_CC30`, agrupPremissas: agrup2.agrupPremissas, localidade: localidade2.localidade, diretoria: dir2.diretoria };
        const empr1_cc40 = { centroCusto: `${empr1.empresa}_CC40`, agrupPremissas: agrup1.agrupPremissas, localidade: localidade1.localidade, unidadeNegocio: testUn1p.unidadeNegocio };
        const empr1_cc50 = { centroCusto: `${empr1.empresa}_CC50`, agrupPremissas: agrup1.agrupPremissas, localidade: localidade1.localidade };
        const ccArray: any[] = [empr1_cc10, empr1_cc11, empr1_cc12, empr1_cc20, empr1_cc30, empr1_cc40, empr1_cc50, empr2_cc10];
        ccArray.forEach((x) => x.descr = `${x.centroCusto}, agrup ${x.agrupPremissas || '(sem)'} un ${x.unidadeNegocio || '(sem)'}, dir: ${x.diretoria || '(sem)'}, ger: ${x.gerencia || '(sem)'} (teste)`);

        const clCustoImputNorm1 = '5200208012';
        const clCustoImputNorm2 = '5200207001';
        const clCustoImputNorm3 = '5200504021';
        const clCustoImputNorm4 = '5200505002';
        const clCustoImputDet1 = '5200503005';
        const clCustoImputDet2 = '5200504002';
        const clCustoCalcNorm1 = '5200201001'; // salarios
        const clCustoCalcNorm2 = '5200205001'; // inss

        //#endregion

        if (parm.cmd == CmdApi_FuncAdm.setTesteDataPlan) {
          if (!isAmbDevOrQas())
            throw new Error('Apenas em dev e tst é possível criar dados de teste');
          const promoAndDespRecorr = false; // isAmbDev(); 

          const msgs = [];

          const anoAnt = anoAdd(ano, -1);

          msgs.push(`ano ${ano}, empresa ${empr1.empresa}, agrups: ${agrupArray.map(x => x.agrupPremissas).join(',')}, localids: ${localidadeArray.map(x => x.localidade).join(',')}`);
          msgs.push(`UNs: ${unArray.map(x => x.unidadeNegocio).join(',')}, Dirs: ${dirArray.map(x => x.diretoria).join(',')}`);
          msgs.push(`Gers: ${gerArray.map(x => x.gerencia).join(',')}, CCs: ${ccArray.map(x => x.centroCusto).join(',')}`);

          //#region dados mestre gerais
          for (const item of unArray) {
            await UnidadeNegocioModel.updateOne({ cod: item.unidadeNegocio }, {
              descr: item.descr,
              categRegional: item.categRegional,
              created: agora,
              lastUpdated: agora,
            }, { upsert: true });
          }

          for (const item of dirArray) {
            await DiretoriaModel.updateOne({ cod: item.diretoria }, {
              descr: item.descr,
              created: agora,
              lastUpdated: agora,
            }, { upsert: true });
          }

          for (const item of gerArray) {
            await GerenciaModel.updateOne({ cod: item.gerencia }, {
              descr: item.descr,
              created: agora,
              lastUpdated: agora,
            }, { upsert: true });
          }

          for (const item of emprsTeste) {
            await EmpresaModel.updateOne({ cod: item.empresa }, {
              descr: item.descr,
              created: agora,
              lastUpdated: agora,
            }, { upsert: true });
          }

          for (const item of agrupArray) {
            await AgrupPremissasModel.updateOne({ cod: item.agrupPremissas }, {
              descr: item.descr,
              created: agora,
              lastUpdated: agora,
            }, { upsert: true });
          }

          for (const item of localidadeArray) {
            await LocalidadeModel.updateOne({ cod: item.localidade }, {
              descr: item.descr,
              created: agora,
              lastUpdated: agora,
            }, { upsert: true });
          }
          //#endregion


          //#region premissas gerais
          {
            if (promoAndDespRecorr) {
              const premissasDespRecorr = [
                { cod: premissaCod.telRamal1, classeCusto: '5200502003', descr: 'Tel - Ramal 1', descrDespRecorrFunc: 'Tel. Ramal', tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false },
                { cod: premissaCod.tiSap1, classeCusto: '5200504020', descr: 'TI - SAP 1', descrDespRecorrFunc: 'Sap 1', tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false },
                { cod: premissaCod.tiSap2, classeCusto: '5200504020', descr: 'TI - SAP 2', descrDespRecorrFunc: 'Sap 2', tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true },
              ];
              for (const premissa of premissasDespRecorr) {
                await PremissaModel.updateOne({ cod: premissa.cod }, {
                  ...premissa, despRecorrFunc: true, obsValor: 'R$/func.', decimais: 2, seqApresent: 1, anoIni: anoAnt, anoFim: ano
                }, { upsert: true });
              }
            }

            await ValoresPremissaModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , premissa: { $in: [premissaCod.telRamal1, premissaCod.tiSap1, premissaCod.tiSap2] }
            // const resultDelPremaDespcorr = await ValoresPremissaModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , premissa: { $in: [premissaCod.telRamal1, premissaCod.tiSap1, premissaCod.tiSap2] }
            // //msgs.push(`valoresPremissa despCorr - excluídos ${resultDelPremaDespcorr.deletedCount}`);
            // const resultDelPremAgrup = await ValoresPremissaModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, agrupPremissas: { $in: [agrupPremissasCoringa.cod, ...agrupsTeste.map((x) => x.agrupPremissas)] }
            // //msgs.push(`valoresPremissa agrup - excluídos ${resultDelPremAgrup.deletedCount}`);
            // const resultDelPremEmpr = await ValoresPremissaModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, empresa: { $in: [empresaCoringa.cod, ...emprsTeste.map((x) => x.empresa)] }
            // //msgs.push(`valoresPremissa empr - excluídos ${resultDelPremEmpr.deletedCount}`);

            const valPremissasAdd = [
              { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(100) },
              { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup2.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(110) },

              { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(200) },
              { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.estag, valMeses: new Array(mesesLen).fill(300) },
              { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.gestorpj, valMeses: new Array(mesesLen).fill(400) },
              { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.dir, valMeses: new Array(mesesLen).fill(500) },
              { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.dir_clt, valMeses: new Array(mesesLen).fill(600) },
              { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.dir_pj, valMeses: new Array(mesesLen).fill(700) },
              { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.terc, valMeses: new Array(mesesLen).fill(800) },

              { premissa: premissaCod.dissidio, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false, agrupPremissas: agrup1.agrupPremissas, valMeses: [...new Array(7).fill(undefined), 10, ...new Array(4).fill(undefined)] },
              { premissa: premissaCod.dissidio, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false, agrupPremissas: agrup2.agrupPremissas, valMeses: [...new Array(7).fill(undefined), 20, ...new Array(4).fill(undefined)] },

              { premissa: premissaCod.fgts, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(10) },
              { premissa: premissaCod.fgts, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(20) },
              { premissa: premissaCod.prov13, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(1) },
              { premissa: premissaCod.prov13, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(2) },
              { premissa: premissaCod.provFerias, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(3) },
              { premissa: premissaCod.provFerias, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(4) },

              { premissa: premissaCod.segVida, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false, agrupPremissas: agrup1.agrupPremissas, valMeses: new Array(mesesLen).fill(2) },

              { premissa: premissaCod.vr, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(500) },

              { premissa: premissaCod.encProv13Empr, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(1) },
              { premissa: premissaCod.encProv13Empr, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(2) },
              { premissa: premissaCod.encProvFeriasEmpr, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(3) },
              { premissa: premissaCod.encProvFeriasEmpr, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(4) },

              { premissa: premissaCod.inss, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(10) },
              { premissa: premissaCod.inss, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr2.empresa, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(20) },

              { premissa: premissaCod.inss, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(11) },
              { premissa: premissaCod.inss, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empresaCoringa.cod, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(20) },

              { premissa: premissaCod.inss, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.dir, valMeses: new Array(mesesLen).fill(12) },
              { premissa: premissaCod.inss, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.dir_clt, valMeses: new Array(mesesLen).fill(13) },
            ];
            if (promoAndDespRecorr) {
              valPremissasAdd.push({ premissa: premissaCod.telRamal1, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false, agrupPremissas: agrup1.agrupPremissas, valMeses: new Array(mesesLen).fill(10) });
              valPremissasAdd.push({ premissa: premissaCod.tiSap1, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false, agrupPremissas: agrup1.agrupPremissas, valMeses: new Array(mesesLen).fill(20) });
              valPremissasAdd.push({ premissa: premissaCod.tiSap2, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(30) });
              valPremissasAdd.push({ premissa: premissaCod.tiSap2, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(40) });
            }
            try {
              const resultIncls1 = await ValoresPremissaModel.insertMany(valPremissasAdd.map((x) => ({
                ...x, ano, revisao: RevisaoValor.atual, ativa: true, lastUpdated: agora,
              })), { ordered: false });
              const resultIncls2 = await ValoresPremissaModel.insertMany(valPremissasAdd.map((x) => ({
                ...x, ano: anoAnt, revisao: RevisaoValor.atual, ativa: true, lastUpdated: agora,
              })), { ordered: false });
              //msgs.push(`incluídos ${resultIncls1.length + resultIncls2.length} valoresPremissa`);
            }
            catch (error) {
              msgs.push(`Erro em ValoresPremissa.insertMany: ${error.message}`);
            }
          }
          //#endregion

          //#region ValoresLocalidad
          {
            const resultDelValoresLocalid = await ValoresLocalidadeModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , localidade: { $in: [localidadeCoringa.cod, ...localidadesTeste.map((x) => x.localidade)] }
            //msgs.push(`ValoresLocalidad - excluídos ${resultDelValoresLocalid.deletedCount}`);
            const valoresLocalidadAdd = [
              { localidade: localidadeCoringa.cod, valMeses: new Array(mesesLen).fill(400) },
              { localidade: localidade1.localidade, valMeses: new Array(mesesLen).fill(100) },
              { localidade: localidade2.localidade, valMeses: new Array(mesesLen).fill(200) },
            ];
            try {
              const resultIncls1 = await ValoresLocalidadeModel.insertMany(valoresLocalidadAdd.map((x) => ({
                ...x, ano, revisao: RevisaoValor.atual, lastUpdated: agora,
              })), { ordered: false });
              const resultIncls2 = await ValoresLocalidadeModel.insertMany(valoresLocalidadAdd.map((x) => ({
                ...x, ano: anoAnt, revisao: RevisaoValor.atual, lastUpdated: agora,
              })), { ordered: false });
              //msgs.push(`incluídos ${resultIncls1.length + resultIncls2.length} ValoresLocalidade`);
            }
            catch (error) {
              msgs.push(`Erro em ValoresLocalidade.insertMany: ${error.message}`);
            }
          }
          //#endregion

          //#region ValoresTranfer
          {
            const resultDelValoresTranfer = await ValoresTransferModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , localidadeOrigem: { $in: localidadesTeste.map((x) => x.localidade) }
            //msgs.push(`ValoresTranfer - excluídos ${resultDelValoresTranfer.deletedCount}`);
            const valoresTransferAdd = [
              { localidadeOrigem: localidade1.localidade, localidadeDestino: localidade2.localidade, valMeses: new Array(mesesLen).fill(100) },
              { localidadeOrigem: localidade1.localidade, localidadeDestino: localidade3.localidade, valMeses: new Array(mesesLen).fill(200) },
            ];
            try {
              const resultIncls1 = await ValoresTransferModel.insertMany(valoresTransferAdd.map((x) => ({
                ...x, ano, revisao: RevisaoValor.atual, lastUpdated: agora,
              })), { ordered: false });
              const resultIncls2 = await ValoresTransferModel.insertMany(valoresTransferAdd.map((x) => ({
                ...x, ano: anoAnt, revisao: RevisaoValor.atual, lastUpdated: agora,
              })), { ordered: false });
              //msgs.push(`incluídos ${resultIncls1.length + resultIncls2.length} ValoresTransfer`);
            }
            catch (error) {
              msgs.push(`Erro em ValoresTransfer.insertMany: ${error.message}`);
            }
          }
          //#endregion

          //#region Centros Custo (master data, config, limpesas pré carga, etc)
          {
            await ProcessoOrcamentarioModel.deleteMany({ ano: { $in: [ano, anoAnt] } });
            await ProcessoOrcamentarioCentroCustoModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , centroCusto: { $in: ccsTeste.map((x) => x.centroCusto) }

            //const regexp = new RegExp('^' + empresaTest);
            const resultDelTerc = await TerceiroModel.deleteMany({ ano: { $in: [ano, anoAnt] } });
            //msgs.push(`excluídos ${resultDelTerc.deletedCount} terceiros`);

            const resultDelFunc = await FuncionarioModel.deleteMany({ ano: { $in: [ano, anoAnt] } });
            //msgs.push(`excluídos ${resultDelFunc.deletedCount} funcionários`);

            const resultDelViagem = await ViagemModel.deleteMany({ ano: { $in: [ano, anoAnt] } });
            //msgs.push(`excluídos ${resultDelViagem.deletedCount} viagem`);

            const resultDelImput = await ValoresImputadosModel.deleteMany({ ano: { $in: [ano, anoAnt] } });
            //msgs.push(`excluídos ${resultDelImput.deletedCount} imputados`);

            const resultDelReais = await ValoresRealizadosModel.deleteMany({ ano: { $in: [ano, anoAnt] } });
            //msgs.push(`excluídos ${resultDelReais.deletedCount} reais`);

            await ProcessoOrcamentarioModel.updateOne({ ano }, {
              status: ProcessoOrcamentarioStatus.inputPlanej,
              horaLoadFuncFull: agora,
              horaLoadValoresRealizados: agora,
              created: agora,
              lastUpdated: agora,
            }, { upsert: true });
            await ProcessoOrcamentarioModel.updateOne({ ano: anoAnt }, {
              status: ProcessoOrcamentarioStatus.bloqueado,
              horaLoadFuncFull: agora,
              horaLoadValoresRealizados: agora,
              created: agora,
              lastUpdated: agora,
            }, { upsert: true });

            for (const item of ccArray) {
              await CentroCustoModel.updateOne({ cod: item.centroCusto }, {
                descr: item.descr,
                created: agora,
                lastUpdated: agora,
              }, { upsert: true });
              await ProcessoOrcamentarioCentroCustoModel.updateOne({ ano, centroCusto: item.centroCusto, }, {
                ...item,
                emailResponsavel: accountDeveloper,
                planejamentoEmAberto: true,
                permiteNovosClb: true,
                created: agora,
                lastUpdated: agora,
              }, { upsert: true });
              await ProcessoOrcamentarioCentroCustoModel.updateOne({ ano: anoAnt, centroCusto: item.centroCusto, }, {
                ...item,
                emailResponsavel: accountDeveloper,
                planejamentoEmAberto: true,
                permiteNovosClb: true,
                created: agora,
                lastUpdated: agora,
              }, { upsert: true });
            }
          }
          //#endregion

          //#region Terceiro
          {
            const terceiros_empr1_cc10 = [
              { centroCusto: empr1_cc10.centroCusto, refer: 'terc_01', nome: 'Pedro arq', fornecedor: 'Arte 1', funcaoTerceiros: 'ADM', valMeses: new Array(mesesLen).fill(1000) },
              { centroCusto: empr1_cc10.centroCusto, refer: 'terc_02', nome: 'Zaidan eng', fornecedor: 'ele proprio', funcaoTerceiros: 'ADM', valMeses: new Array(mesesLen).fill(2000) },
            ];
            const terceirosAdd = [
              ...terceiros_empr1_cc10,
              ...terceiros_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc11.centroCusto })),
              ...terceiros_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc12.centroCusto })),
              ...terceiros_empr1_cc10.map((x) => ({ ...x, centroCusto: empr2_cc10.centroCusto })),

              ...terceiros_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc40.centroCusto })),
              ...terceiros_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc50.centroCusto })),
              { centroCusto: empr1_cc20.centroCusto, refer: 'terc_01', nome: 'Pedro 2 arq', fornecedor: 'Arte 1', funcaoTerceiros: 'ADM', valMeses: new Array(mesesLen).fill(1000) },
              { centroCusto: empr1_cc20.centroCusto, refer: 'terc_02', nome: 'Zaidan 2 eng', fornecedor: 'ele proprio', funcaoTerceiros: 'ADM', valMeses: new Array(mesesLen).fill(2000) },
              { centroCusto: empr1_cc20.centroCusto, refer: 'terc_03', nome: 'RP 2 cons', fornecedor: 'ele proprio', funcaoTerceiros: 'ADM', valMeses: new Array(mesesLen).fill(3000) },
            ];
            //terceirosAdd.length = 0;
            try {
              const resultIncls1 = await TerceiroModel.insertMany(terceirosAdd.map((x) => ({
                ...x, ano, revisao: RevisaoValor.atual, created: agora, lastUpdated: agora,
              })), { ordered: false });
              const resultIncls2 = await TerceiroModel.insertMany(terceirosAdd.map((x) => ({
                ...x, ano: anoAnt, revisao: RevisaoValor.atual, created: agora, lastUpdated: agora,
              })), { ordered: false });
              //msgs.push(`incluídos ${resultIncls1.length + resultIncls2.length} terceiros`);
            }
            catch (error) {
              msgs.push(`Erro em Terceiro.insertMany: ${error.message}`);
            }
          }
          //#endregion

          //#region Funcionario
          {
            const valsPromoAndDespRecorrReset = { despsRecorr: null, mesPromo: null, tipoColaboradorPromo: null, salarioPromo: null };
            const valsPromoAndDespRecorrTest = promoAndDespRecorr ? { despsRecorr: [premissaCod.telRamal1, premissaCod.tiSap1, premissaCod.tiSap2], mesPromo: 6, tipoColaboradorPromo: TipoColaborador.dir, salarioPromo: 2000 } : {};
            let cpfSeq = 0;
            const funcionarios_empr1_cc10 = [
              //if (promoAndDespRecorr) {
              { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'Mônica clt', tipoColaborador: TipoColaborador.clt, funcao: 'psicóloga', salarioBase: 1000.23, dependentes: 1, valeTransp: 1000, idVaga: 'v1', idCentroCustoRh: 'rh1', tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, ...valsPromoAndDespRecorrTest },
              { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'Carlos aprendiz', tipoColaborador: TipoColaborador.aprendiz, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: 'v2', idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
              { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'jorge estag', tipoColaborador: TipoColaborador.estag, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: 'rh3', tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
              { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'jose gestor pj', tipoColaborador: TipoColaborador.gestorpj, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
              { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'mario diretor', tipoColaborador: TipoColaborador.dir, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
              { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'caetano dir clt', tipoColaborador: TipoColaborador.dir_clt, funcao: 'diretor', salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
              { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'flavio dir pj', tipoColaborador: TipoColaborador.dir_pj, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
              { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'cris pr.srv terc', tipoColaborador: TipoColaborador.terc, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
              { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.local, refer: `CPF:${++cpfSeq}`, nome: 'vilhena clt temp', tipoColaborador: TipoColaborador.clt, funcao: 'gerente', salarioBase: 1000, dependentes: 2, valeTransp: 2000, idVaga: null, idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.adm, mesIni: 4, tipoFim: TipoParticipPerOrcam.desl, mesFim: 10, despsRecorr: null },
            ];
            const funcionariosAdd: any[] = [
              ...funcionarios_empr1_cc10,
              ...funcionarios_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc11.centroCusto, ...valsPromoAndDespRecorrReset })),
              ...funcionarios_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc12.centroCusto, ...valsPromoAndDespRecorrReset })),
              ...funcionarios_empr1_cc10.map((x) => ({ ...x, centroCusto: empr2_cc10.centroCusto, ...valsPromoAndDespRecorrReset })),

              ...funcionarios_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc40.centroCusto, ...valsPromoAndDespRecorrReset })),
              ...funcionarios_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc50.centroCusto, ...valsPromoAndDespRecorrReset })),
              { centroCusto: empr1_cc20.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'Mônica 2 clt', tipoColaborador: TipoColaborador.clt, funcao: 'psicóloga', salarioBase: 1000, dependentes: 1, valeTransp: 1000, idVaga: 'v1', idCentroCustoRh: 'rh1', tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, ...valsPromoAndDespRecorrTest },
              { centroCusto: empr1_cc20.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'Carlos 2 aprendiz', tipoColaborador: TipoColaborador.aprendiz, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: 'v2', idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
              { centroCusto: empr1_cc20.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'jorge 2 estag', tipoColaborador: TipoColaborador.estag, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: 'rh3', tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
              { centroCusto: empr1_cc30.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'Mônica 3 clt', tipoColaborador: TipoColaborador.clt, funcao: 'psicóloga', salarioBase: 1000, dependentes: 1, valeTransp: 1000, idVaga: 'v1', idCentroCustoRh: 'rh1', tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, ...valsPromoAndDespRecorrTest },
              { centroCusto: empr1_cc30.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'Carlos 3 aprendiz', tipoColaborador: TipoColaborador.aprendiz, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: 'v2', idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
            ];
            //funcionariosAdd.length = 0;

            const funcDataIncl = funcionariosAdd.map((x) => {
              const item = new Funcionario().Fill({
                ...x, created: agora, lastUpdated: agora,
                salario_messy: Funcionario.scrambleSalario(x.salarioBase, x.centroCusto, x.refer),
                revisaoAtual: new FuncionarioRevisao().Fill({
                  ...x, ativo: true,
                  salario_messy: Funcionario.scrambleSalario(x.salarioBase, x.centroCusto, x.refer),
                  salarioPromo_messy: x.salarioPromo == null ? null : Funcionario.scrambleSalario(x.salarioPromo, x.centroCusto, x.refer),
                }),
              });
              return item;
            });

            try {
              const resultIncls1 = await FuncionarioModel.insertMany(funcDataIncl.map((x) => ({ ...x, ano })), { ordered: false });
              const resultIncls2 = await FuncionarioModel.insertMany(funcDataIncl.map((x) => ({ ...x, ano: anoAnt })), { ordered: false });
              //msgs.push(`incluídos ${resultIncls1.length + resultIncls2.length} funcionários`);
            }
            catch (error) {
              msgs.push(`Erro em Funcionario.insertMany: ${error.message}`);
            }
          }
          //#endregion

          //#region Viagem
          {
            const viagemAdd = [
              { centroCusto: empr1_cc10.centroCusto, tipoPlanejViagem: TipoPlanejViagem.porPremissa, localidadeDestino: localidade2.localidade, qtdViagens: 12, mediaPernoites: 2 },
              { centroCusto: empr1_cc10.centroCusto, tipoPlanejViagem: TipoPlanejViagem.porPremissa, localidadeDestino: localidade3.localidade, qtdViagens: 12, mediaPernoites: 2 },
              { centroCusto: empr1_cc10.centroCusto, tipoPlanejViagem: TipoPlanejViagem.porPremissa, localidadeDestino: localidade3.localidade, qtdViagens: 24, mediaPernoites: 1 },
              { centroCusto: empr1_cc10.centroCusto, tipoPlanejViagem: TipoPlanejViagem.porValor, obs: 'obs 1', valor: 1200 },
              { centroCusto: empr1_cc10.centroCusto, tipoPlanejViagem: TipoPlanejViagem.porValor, obs: 'obs 2', valor: 2400 },
            ];
            try {
              const resultIncls1 = await ViagemModel.insertMany(viagemAdd.map((x) => ({
                ...x, ano, revisao: RevisaoValor.atual, created: agora, lastUpdated: agora,
              })), { ordered: false });
              const resultIncls2 = await ViagemModel.insertMany(viagemAdd.map((x) => ({
                ...x, ano: anoAnt, revisao: RevisaoValor.atual, created: agora, lastUpdated: agora,
              })), { ordered: false });
              //msgs.push(`incluídos ${resultIncls1.length + resultIncls2.length} Viagem`);
            }
            catch (error) {
              msgs.push(`Erro em Viagem.insertMany: ${error.message}`);
            }
          }
          //#endregion

          const valoresImputados_empr1_cc10 = [
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm1, idDetalhe: null, descr: null, valMeses: new Array(mesesLen).fill(100) },
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm2, idDetalhe: null, descr: null, valMeses: new Array(mesesLen).fill(200) },
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm3, idDetalhe: null, descr: null, valMeses: new Array(mesesLen).fill(300) },
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm4, idDetalhe: null, descr: null, valMeses: new Array(mesesLen).fill(300) },
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputDet1, idDetalhe: '24112022-1459325', descr: 'aaaaa', valMeses: new Array(mesesLen).fill(300) },
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputDet1, idDetalhe: '24112022-1459336', descr: 'bbbbb', valMeses: new Array(mesesLen).fill(400) },
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputDet2, idDetalhe: '24112022-1500424', descr: 'ccccc', valMeses: new Array(mesesLen).fill(500) },
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputDet2, idDetalhe: '24112022-1500446', descr: 'ddddd', valMeses: new Array(mesesLen).fill(600) },
          ];
          const valoresImputadosAdd = [
            ...valoresImputados_empr1_cc10,
            ...valoresImputados_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc11.centroCusto })),
            ...valoresImputados_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc12.centroCusto })),
            ...valoresImputados_empr1_cc10.map((x) => ({ ...x, centroCusto: empr2_cc10.centroCusto })),

            ...valoresImputados_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc40.centroCusto })),
            ...valoresImputados_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc50.centroCusto })),
            { centroCusto: empr1_cc20.centroCusto, classeCusto: clCustoImputNorm1, idDetalhe: null, descr: null, valMeses: new Array(mesesLen).fill(100) },
            { centroCusto: empr1_cc20.centroCusto, classeCusto: clCustoImputNorm2, idDetalhe: null, descr: null, valMeses: new Array(mesesLen).fill(200) },
            { centroCusto: empr1_cc20.centroCusto, classeCusto: clCustoImputDet1, idDetalhe: '24112022-1459325', descr: 'aaaaa', valMeses: new Array(mesesLen).fill(300) },
          ];
          valoresImputadosAdd.sort((a, b) => compareForBinSearch(`${a.centroCusto}-${a.classeCusto}`, `${b.centroCusto}-${b.classeCusto}`));
          //#region ValoresImputados
          {
            try {
              const resultIncls1 = await ValoresImputadosModel.insertMany(valoresImputadosAdd.map((x) => ({
                ...x, ano, revisao: RevisaoValor.atual, lastUpdated: agora,
              })), { ordered: false });
              //msgs.push(`incluídos ${resultIncls1.length} imputados (ano)`);
              const resultIncls2 = await ValoresImputadosModel.insertMany(valoresImputadosAdd.map((x) => ({
                ...x, ano: anoAnt, revisao: RevisaoValor.atual, lastUpdated: agora, valMeses: sumValMeses([...x.valMeses], new Array(mesesLen).fill(10))
              })), { ordered: false });
              //msgs.push(`incluídos ${resultIncls2.length} imputados (ano)`);
            }
            catch (error) {
              msgs.push(`Erro em ValoresImputados.insertMany: ${error.message}`);
            }
          }
          //#endregion

          //#region ValoresRealizados
          {
            try {
              const valsForReal = (new CtrlCollect<ValoresImputados>(['centroCusto', 'classeCusto'], { fldsSum: [{ fld: 'valMeses', arrayLen: mesesLen }] }, valoresImputadosAdd)).getArray();
              //csd('valoresImputadosAdd', JSON.stringify(valoresImputadosAdd, null, 2));
              //csd('valsForReal', JSON.stringify(valsForReal, null, 2));
              const valsRealAnt = valsForReal.map((val) => {
                const last4 = StrRight(val.classeCusto, 4);
                // const mult = (100 + (Number(last4) > 5000 ? 30 : -20)) / 100;
                // const valMeses = multiplyValMeses([...val.valMeses], new Array(mesesLen).fill(mult));
                const ajusteAbs = Number(last4) > 5000 ? 500 : -200;
                const valMeses = sumValMeses([...val.valMeses], new Array(mesesLen).fill(ajusteAbs));
                return {
                  ...val, valMeses
                };
              });
              valsRealAnt.push({ centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoCalcNorm1, valMeses: new Array(mesesLen).fill(200) });
              valsRealAnt.push({ centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoCalcNorm2, valMeses: new Array(mesesLen).fill(100) });
              const resultInclAnt = await ValoresRealizadosModel.insertMany(valsRealAnt.map((valReal) => { return { ...valReal, ano: anoAnt }; }), { ordered: false });

              const mesUltRealizado = 10;
              const valsRealAtu = valsRealAnt.map((val) => {
                const valMeses = multiplyValMeses([...val.valMeses], [...new Array(mesUltRealizado).fill(1), ...new Array(mesesLen - mesUltRealizado).fill(0)]);
                return {
                  ...val, valMeses
                };
              });
              const resultInclAtu = await ValoresRealizadosModel.insertMany(valsRealAtu.map((valReal) => { return { ...valReal, ano }; }), { ordered: false });
              //msgs.push(`incluídos ${resultInclAtu.length + resultInclAnt.length} reais`);
            }
            catch (error) {
              msgs.push(`Erro em ValoresRealizados.insertMany: ${error.message}`);
            }
          }
          //#endregion

          resumoApi.jsonData({ value: msgs });
        }

        else if (parm.cmd == CmdApi_FuncAdm.setTesteDataInterfaceSap) {
          if (!isAmbDevOrQas())
            throw new Error('Apenas em dev e tst é possível criar dados de teste');
          const msgs = [];

          //#region ValoresImputados
          let valMes = 100;
          const valsCC1 = [
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm1, m01: ++valMes, m02: ++valMes, m03: ++valMes, m04: ++valMes, m05: ++valMes, m06: ++valMes, m07: ++valMes, m08: ++valMes, m09: ++valMes, m10: ++valMes, m11: 0, m12: 0 },
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm2, m01: ++valMes, m02: ++valMes, m03: ++valMes, m04: ++valMes, m05: ++valMes, m06: ++valMes, m07: ++valMes, m08: ++valMes, m09: ++valMes, m10: ++valMes, m11: 0, m12: 0 },
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm3, m01: ++valMes, m02: ++valMes, m03: ++valMes, m04: ++valMes, m05: ++valMes, m06: ++valMes, m07: ++valMes, m08: ++valMes, m09: ++valMes, m10: ++valMes, m11: 0, m12: 0 },
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm4, m01: ++valMes, m02: ++valMes, m03: ++valMes, m04: ++valMes, m05: ++valMes, m06: ++valMes, m07: ++valMes, m08: ++valMes, m09: ++valMes, m10: ++valMes, m11: 0, m12: 0 },
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputDet1, m01: ++valMes, m02: ++valMes, m03: ++valMes, m04: ++valMes, m05: ++valMes, m06: ++valMes, m07: ++valMes, m08: ++valMes, m09: ++valMes, m10: ++valMes, m11: 0, m12: 0 },
            { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputDet2, m01: ++valMes, m02: ++valMes, m03: ++valMes, m04: ++valMes, m05: ++valMes, m06: ++valMes, m07: ++valMes, m08: ++valMes, m09: ++valMes, m10: ++valMes, m11: 0, m12: 0 },
          ];
          const vals = [
            ...valsCC1,
            ...valsCC1.map((x) => ({ ...x, centroCusto: empr1_cc11.centroCusto })),
            ...valsCC1.map((x) => ({ ...x, centroCusto: empr1_cc12.centroCusto })),
          ];

          vals.sort((a, b) => compareForBinSearch(`${a.centroCusto}-${a.classeCusto}`, `${b.centroCusto}-${b.classeCusto}`));
          try {
            const resultIncls1 = await ValoresRealizadosInterfaceSapModel.insertMany(vals.map((x) => ({
              ...x, ano
            })), { ordered: false });
            msgs.push(`incluídos ${resultIncls1.length} interface sap`);
          }
          catch (error) {
            msgs.push(`Erro em ValoresImputados.insertMany: ${error.message}`);
          }
          //#endregion
          resumoApi.jsonData({ value: msgs });
        }
      }

      else if (parm.cmd == CmdApi_FuncAdm.getMainAmbs) {
        const msgs = [];
        msgs.push(`NEXT_PUBLIC_AMB: ${process.env.NEXT_PUBLIC_AMB}`);
        msgs.push(`SITE_DATABASE_APP: ${DispAbrev(process.env.SITE_DATABASE_APP, 30)}`);
        msgs.push(`NEXT_PUBLIC_DEPLOY_CONFIG: ${process.env.NEXT_PUBLIC_DEPLOY_CONFIG}`);
        msgs.push(`NEXT_PUBLIC_API_TIMEOUT: ${process.env.NEXT_PUBLIC_API_TIMEOUT}`);
        resumoApi.jsonData({ value: msgs });
      }

      else if (parm.cmd == CmdApi_FuncAdm.testeCodeServer) {
        const msgs = [];
        const resultIncl = await ValoresRealizadosInterfaceSapModel.create({
          ano: '2000',
          centroCusto: 'cc1',
          classeCusto: 'cl1',
          m01: 123,
        });
        msgs.push('ok incluído em ValoresRealizadosInterfaceSap');
        resumoApi.jsonData({ value: msgs });
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
        let entity: any = null;
        let fldsCsvDefUpload: FldCsvDef[] = [];

        if (collection == 'AgrupPremissas') { model = AgrupPremissasModel; entity = AgrupPremissas; fldsCsvDefUpload = AgrupPremissas.fldsCsvDefUpload; }
        else if (collection == 'CentroCusto') { model = CentroCustoModel; entity = CentroCusto; fldsCsvDefUpload = CentroCusto.fldsCsvDefUpload; }
        else if (collection == 'Diretoria') { model = DiretoriaModel; entity = Diretoria; fldsCsvDefUpload = Diretoria.fldsCsvDefUpload; }
        else if (collection == 'Empresa') { model = EmpresaModel; entity = Empresa; fldsCsvDefUpload = Empresa.fldsCsvDefUpload; }
        else if (collection == 'Gerencia') { model = GerenciaModel; entity = Gerencia; fldsCsvDefUpload = Gerencia.fldsCsvDefUpload; }
        else if (collection == 'Localidade') { model = LocalidadeModel; entity = Localidade; fldsCsvDefUpload = Localidade.fldsCsvDefUpload; }
        else if (collection == 'UnidadeNegocio') { model = UnidadeNegocioModel; entity = UnidadeNegocio; fldsCsvDefUpload = UnidadeNegocio.fldsCsvDefUpload; }

        else if (collection == 'FatorCusto') { model = FatorCustoModel; entity = FatorCusto; fldsCsvDefUpload = FatorCusto.fldsCsvDefUpload; }
        else if (collection == 'ClasseCusto') { model = ClasseCustoModel; entity = ClasseCusto; fldsCsvDefUpload = ClasseCusto.fldsCsvDefUpload; }
        else if (collection == 'Premissa') { model = PremissaModel; entity = Premissa; fldsCsvDefUpload = Premissa.fldsCsvDefUpload; }
        else if (collection == 'FuncaoTerceiro') { model = FuncaoTerceiroModel; entity = FuncaoTerceiro; fldsCsvDefUpload = FuncaoTerceiro.fldsCsvDefUpload; }

        else if (collection == 'User') { model = UserModel; entity = User; fldsCsvDefUpload = User.fldsCsvDefUpload; }

        else if (collection == 'ValoresRealizados') { model = ValoresRealizadosModel; entity = ValoresRealizados; fldsCsvDefUpload = ValoresRealizados.fldsCsvDefUpload; }
        else if (collection == 'ValoresImputados') { model = ValoresImputadosModel; entity = ValoresImputados; fldsCsvDefUpload = ValoresImputados.fldsCsvDefUpload; }
        else if (collection == 'valoresPlanejadosHistorico') { model = ValoresPlanejadosHistoricoModel; entity = ValoresPlanejadosHistorico; fldsCsvDefUpload = ValoresPlanejadosHistorico.fldsCsvDefUpload; }

        else if (collection == 'ValoresPremissa') { model = ValoresPremissaModel; entity = ValoresPremissa; fldsCsvDefUpload = ValoresPremissa.fldsCsvDefUpload; }
        else if (collection == 'ValoresLocalid') { model = ValoresLocalidadeModel; entity = ValoresLocalidade; fldsCsvDefUpload = ValoresLocalidade.fldsCsvDefUpload; }
        else if (collection == 'ValoresTransfer') { model = ValoresTransferModel; entity = ValoresTransfer; fldsCsvDefUpload = ValoresTransfer.fldsCsvDefUpload; }

        else if (collection == 'Terceiro') { model = TerceiroModel; entity = Terceiro; fldsCsvDefUpload = Terceiro.fldsCsvDefUpload; }
        else if (collection == 'Viagem') { model = ViagemModel; entity = Viagem; fldsCsvDefUpload = Viagem.fldsCsvDefUpload; }

        else
          throw new Error(`coleção ${collection} não prevista`);

        if (parm.cmd == CmdApi_FuncAdm.collectionDownload) {
          const documents = await model.find();
          resumoApi.jsonData({ value: { documents } });
        }
        else if (parm.cmd == CmdApi_FuncAdm.collectionUpload) {
          const uploadData = parm.data;

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

              const documentInsert = new entity().Fill(documentCsvDb);

              documentsInsert.push(documentInsert);
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
    await CloseDbASync({ ctrlApiExec, database: databaseInterfaceSap });
    await CloseDbASync({ ctrlApiExec });
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 2', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }

  await ResolvePromisesExecUntilResponse(ctrlApiExec.context());
  dbgX(1, 'response');

  const elapsedMsApi = resumoApi.json();
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, loggedUserReq);
};