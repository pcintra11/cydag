import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
//import _ from 'underscore';

import { ConnectDbASync, CloseDbASync } from '../../../../base/db/functions';

import { ErrorPlus, SleepMsDevRandom } from '../../../../libCommon/util';
import { isAmbNone } from '../../../../libCommon/isAmb';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ResumoApi, ValidateObjectFirstError, SearchTermsForFindPtBr, ReqNoParm } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
//import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { configApp } from '../../../../appCydag/config';
import { apisApp } from '../../../../appCydag/endPoints';
import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { UserModel } from '../../../../appCydag/models';

import { Entity_Crud, CmdApi_Crud as CmdApi, crudValidations } from './types';
import { GerenciaModel as Model_Crud } from '../../../../appCydag/models';

const apiSelf = apisApp.gerencia;
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
      CheckApiAuthorized(apiSelf, await UserModel.findOne({ email: loggedUserReq?.email }).lean(), loggedUserReq?.email);

      if (parm.cmd == CmdApi.list) {
        const { searchTerms } = parm.filter || {};
        const filterDb: any = {};
        if (searchTerms != null) {
          const regExpr = SearchTermsForFindPtBr(searchTerms);
          filterDb.searchTerms = { $regex: `${regExpr}` };
        }
        const recordsToGet = parm.getAll == true ? 99999 : configApp.maximumSearchResult + 1;
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
          throw new ErrorPlus('Grupo de Departamento já cadastrado.', { data: { fldName: Entity_Crud.F.cod } });
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
          throw new ErrorPlus('Não foi encontrado o Grupo de Departamento.');
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