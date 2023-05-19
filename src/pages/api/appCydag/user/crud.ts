import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
//import _ from 'underscore';

import { ConnectDbASync, CloseDbASync } from '../../../../libServer/dbMongo';

import { ErrorPlus, SleepMsDevRandom } from '../../../../libCommon/util';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { GetCtrlApiExec, ResumoApi, ValidateObjectFirstError, SearchTermsForFindPtBr, ReqNoParm } from '../../../../libServer/util';
import { CheckBlockAsync } from '../../../../libServer/checkBlockAsync';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { AlertTimeExecApiASync } from '../../../../libServer/alertTimeExecApi';
//import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { ApiLogFinish, ApiLogStart } from '../../../../libServer/apiLog';

import { isAmbNone } from '../../../../app_base/envs';
import { configApp } from '../../../../app_hub/appConfig';

import { apisApp, rolesApp, rolesAppOnlyGestorContr } from '../../../../appCydag/endPoints';
import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appCydag/loggedUserSvr';
import { UserModel } from '../../../../appCydag/models';
import { User } from '../../../../appCydag/modelTypes';

import { CmdApi_UserCrud as CmdApi, crudValidations } from './types';

const apiSelf = apisApp.user;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  const ctrlApiExec = GetCtrlApiExec(req, res, ['cmd'], ['_id']);
  const loggedUserReq = await LoggedUserReqASync(ctrlApiExec);
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
      const userDbSigned = await UserModel.findOne({ email: loggedUserReq.emailSigned }).lean();
      CheckApiAuthorized(apiSelf, userDbSigned, loggedUserReq.emailSigned);

      if (parm.cmd == CmdApi.list) {
        const { searchTerms } = parm.filter || {};
        const filterDb: any = {};
        if (searchTerms != null) {
          const regExpr = SearchTermsForFindPtBr(searchTerms);
          filterDb.searchTerms = { $regex: `${regExpr}` };
        }
        const recordsToGet = parm.getAll == true ? 99999 : configApp.maximumSearchResult;
        const documentsDb = await UserModel.find(filterDb,
          {
            email: 1,
            nome: 1,
            ativo: 1,
            roles: 1
          })
          .lean().sort({ email: 1 }).limit(recordsToGet + 1);
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
        const documentConflict = await UserModel.findOne({ email: data.email } as User).lean();
        if (documentConflict != null) // @!!!!!! padrão para nome
          throw new ErrorPlus('Email já cadastrado.', { data: { fldName: User.F.email } });
        const fldError = ValidateObjectFirstError({ ...data }, crudValidations);
        if (fldError != null)
          throw new ErrorPlus(fldError.msg, { data: { fldName: fldError.fldName } });
        if (!loggedUserReq.roles.includes(rolesApp.gestorContr) &&
          (data.roles as string[]).reduce((acum, curr) => rolesAppOnlyGestorContr.includes(curr) ? true : acum, false))
          throw new ErrorPlus('Operação permitida apenas para Gestor de Controladoria.');
        const documentInsert: User = {
          ...data,
          //email_superior: null,
          created: agora,
          lastUpdated: agora,
        };
        documentInsert.searchTerms = User.SearchTermsGen(documentInsert);
        const documentDb = await UserModel.create(documentInsert);
        resumoApi.jsonData({ value: documentDb });
      }
      else if (parm.cmd == CmdApi.update) {
        const data = parm.data;
        let documentDb = await UserModel.findOne({ _id: new ObjectId(parm._id) }).lean();
        if (documentDb == null)
          throw new ErrorPlus('Não foi encontrado o Usuário.');
        const fldError = ValidateObjectFirstError({ ...data }, crudValidations);
        if (fldError != null)
          throw new ErrorPlus(fldError.msg, { data: { fldName: fldError.fldName } });
        if (!loggedUserReq.roles.includes(rolesApp.gestorContr) &&
          ((data.roles as string[]).reduce((acum, curr) => rolesAppOnlyGestorContr.includes(curr) ? true : acum, false) ||
            documentDb.roles.reduce((acum, curr) => rolesAppOnlyGestorContr.includes(curr) ? true : acum, false)))
          throw new ErrorPlus('Operação permitida apenas para Gestor de Controladoria.');
        const documentUpdate: User = {
          ...data,
          lastUpdated: agora,
        };
        documentUpdate.searchTerms = User.SearchTermsGen(documentUpdate, documentDb);
        documentDb = await UserModel.findOneAndUpdate({ _id: new ObjectId(parm._id) }, documentUpdate, { new: true });
        resumoApi.jsonData({ value: documentDb });
      }
      else if (parm.cmd == CmdApi.delete) {
        const documentDb = await UserModel.findOne({ _id: new ObjectId(parm._id) }).lean();
        if (parm._id == loggedUserReq.userIdStr)
          throw new ErrorPlus('Você não pode excluir a sí mesmo.');
        if (!loggedUserReq.roles.includes(rolesApp.gestorContr) &&
          documentDb.roles.reduce((acum, curr) => rolesAppOnlyGestorContr.includes(curr) ? true : acum, false))
          throw new ErrorPlus('Operação permitida apenas para Gestor de Controladoria.');
        await UserModel.deleteOne({ _id: parm._id });
        resumoApi.jsonData({});
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