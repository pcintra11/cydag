import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
//import _ from 'underscore';

import { ConnectDbASync, CloseDbASync } from '../../../../libServer/dbMongo';

import { BinSearchItem, ErrorPlus, SleepMsDevRandom } from '../../../../libCommon/util';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ReqNoParm, ResumoApi, SearchTermsForFindPtBr, ValidateObjectFirstError } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
//import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { isAmbNone } from '../../../../app_base/envs';
import { configApp } from '../../../../app_hub/appConfig';

import { apisApp } from '../../../../appCydag/endPoints';
import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { UserMd, UserModel } from '../../../../appCydag/models';
import { CentroCustoModel as Model_Crud } from '../../../../appCydag/models';
import { FromCsvUpload, IUploadMessage, MessageLevelUpload } from '../../../../libCommon/uploadCsv';
import { CentroCusto } from '../../../../appCydag/modelTypes';

import { Entity_Crud, CmdApi_Crud as CmdApi, crudValidations } from './types';

const apiSelf = apisApp.centroCusto;
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
      const userDb = await UserModel.findOne({ email: loggedUserReq?.email }).lean() as UserMd;
      CheckApiAuthorized(apiSelf, userDb, loggedUserReq?.email);

      if (parm.cmd == CmdApi.list) {
        const { searchTerms } = parm.filter || {};
        const filterDb: any = {};
        if (searchTerms != null) {
          const regExpr = SearchTermsForFindPtBr(searchTerms);
          filterDb.searchTerms = { $regex: `${regExpr}` };
        }
        const recordsToGet = parm.getAll == true ? 99999 : configApp.maximumSearchResult;
        const documentsDb = await Model_Crud.find(filterDb,
          { cod: 1, descr: 1 })
          .lean().sort({ cod: 1 }).limit(recordsToGet + 1);
        let partialResults = false;
        if (documentsDb.length > recordsToGet) {
          documentsDb.pop();
          partialResults = true;
        }
        resumoApi.jsonData({ value: { documents: documentsDb, partialResults } });
        deleteIfOk = true;
      }

      else if (parm.cmd == CmdApi.insert) {
        const data = parm.data;
        const documentConflict = await Model_Crud.findOne({ cod: data.cod }).lean();
        if (documentConflict != null)
          throw new ErrorPlus('Centro de Custo já cadastrado.', { data: { fldName: Entity_Crud.F.cod } });
        const fldError = ValidateObjectFirstError({ ...data }, crudValidations);
        if (fldError != null)
          throw new ErrorPlus(fldError.msg, { data: { fldName: fldError.fldName } });
        const documentInsert: Entity_Crud = {
          ...data,
          created: agora,
          lastUpdated: agora,
        };
        documentInsert.searchTerms = Entity_Crud.SearchTermsGen(documentInsert);
        const documentDb = await Model_Crud.create(documentInsert);
        resumoApi.jsonData({ value: documentDb });
      }
      else if (parm.cmd == CmdApi.update) {
        const data = parm.data;
        let documentDb = await Model_Crud.findOne({ _id: new ObjectId(parm._id) }).lean();
        if (documentDb == null)
          throw new ErrorPlus('Não foi encontrado o Centro de Custo.');
        const fldError = ValidateObjectFirstError({ ...data }, crudValidations);
        if (fldError != null)
          throw new ErrorPlus(fldError.msg, { data: { fldName: fldError.fldName } });
        const documentUpdate: Entity_Crud = {
          ...data,
          lastUpdated: agora,
        };
        documentUpdate.searchTerms = Entity_Crud.SearchTermsGen(documentUpdate, documentDb);
        documentDb = await Model_Crud.findOneAndUpdate({ _id: new ObjectId(parm._id) }, documentUpdate, { new: true });
        resumoApi.jsonData({ value: documentDb });
      }
      else if (parm.cmd == CmdApi.delete) {
        await Model_Crud.deleteOne({ _id: parm._id });
        resumoApi.jsonData({});
      }

      else if (parm.cmd == CmdApi.upload) {
        const uploadData: string[][] = parm.data;

        const documentsCentroCusto = await Model_Crud.find({}).lean().sort({ cod: 1 });

        const messages: IUploadMessage[] = [];
        let linesError = 0, linesOk = 0;
        const headerCsv = [...uploadData[0]].map((x) => x.trim());

        //let lastKey = null;

        const fldsCsvDef = CentroCusto.fldsCsvDefUploadUser;
        const fldsMissing = fldsCsvDef.filter((x) => !x.suppressColumn && x.mandatoryValue).reduce((prev, curr) => headerCsv.findIndex((x) => x == curr.fldDisp) == -1 ? [...prev, curr] : prev, []);
        const fldsIgnored = headerCsv.reduce((prev, curr) => {
          const fldCsvDef = fldsCsvDef.find((x) => x.fldDisp == curr);
          if (fldCsvDef == null || fldCsvDef.suppressColumn) return [...prev, curr];
          else return prev;
        }, []);

        if (fldsIgnored.length > 0)
          messages.push({ level: MessageLevelUpload.warn, message: `Colunas não previstas ignoradas: ${fldsIgnored.map(x => `"${x}"`).join(', ')} (atenção para maiúsculas e minúsculas)` });

        if (fldsMissing.length > 0)
          messages.push({ level: MessageLevelUpload.error, message: `Colunas obrigatórias não informadas: ${fldsMissing.map(x => `"${x.fldDisp}"`).join(', ')}` });
        else {

          // tratamento das linhas
          const documentsInsert: CentroCusto[] = [];
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

              // if (documentCsvDb.cod != null) {
              //   const key = `${documentCsvDb.cod}`;
              //   if (lastKey != null &&
              //     key <= lastKey)
              //     errosThisLine.push('centroCusto fora de ordem');
              //   else
              //     lastKey = key;
              // }

              if (BinSearchItem(documentsCentroCusto, documentCsvDb.cod, 'cod') != null)
                errosThisLine.push(`centroCusto '${documentCsvDb.cod}' já cadastrado`);

              if (errosThisLine.length != 0)
                throw new Error(errosThisLine.join(', '));

              const documentInsert = CentroCusto.fill({
                ...documentCsvDb,
                created: agora,
                lastUpdated: agora,
                searchTerms: Entity_Crud.SearchTermsGen(documentCsvDb),
              }, true);

              documentsInsert.push(documentInsert);
              messages.push({ level: MessageLevelUpload.ok, message: `Linha ${line} - ${documentCsvDb.cod} inclusão pré-validada` });
              linesOk++;

            } catch (error) {
              messages.push({ level: MessageLevelUpload.error, message: `Linha ${line} com erro - ${error.message}` });
              linesError++;
            }
          }
          if (documentsInsert.length > 0) {
            try {
              const result = await Model_Crud.insertMany(documentsInsert, { ordered: false });
              if (result.length != documentsInsert.length) {
                const keysOk = result.map((x) => `${x.cod}`);
                const keysNotOk = documentsInsert.filter((x) => !keysOk.includes(`${x.cod}`));
                linesOk -= keysNotOk.length;
                linesError += keysNotOk.length;
                keysNotOk.forEach((x) => messages.push({ level: MessageLevelUpload.error, message: `Houve erro na efetivação da inclusão para: ${x.cod}` }));
              }
              else
                messages.push({ level: MessageLevelUpload.ok, message: 'As inclusões pré-validadas foram efetivadas com sucesso' });
            } catch (error) {
              error.writeErrors.forEach((x) => messages.push({ level: MessageLevelUpload.error, message: `Erro ao inserir em lote: ${x.err.errmsg}` }));
            }
          }
          else
            messages.push({ level: MessageLevelUpload.error, message: 'Nada a carregar' });
        }

        resumoApi.jsonData({ value: { messages, linesOk, linesError } });
        deleteIfOk = true;
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