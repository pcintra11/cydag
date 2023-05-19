import { ObjectId } from 'mongodb';
import _ from 'underscore';

import { configApp } from '../app_hub/appConfig';

import { ApiSyncLog, LoggedUserBase } from '../app_base/modelTypes';
import { ApiSyncLogModel } from '../app_base/model';
import { CloseDbASync, ConnectDbASync, UriDb } from './dbMongo';

import { EnvApiTimeout, EnvInfoHost } from '../app_base/envs';
import { HttpStatusCodeNormais } from '../libCommon/util';
import { dbgError } from '../libCommon/dbg';
import { CtrlContext } from '../libCommon/ctrlContext';

import { IApiResultProc, CtrlApiExec } from './util';

interface IApiLogProc {
  _id: ObjectId,
  //context: string,
  ctrlContext: CtrlContext,
}

export async function ApiLogStart(ctrlApiExec: CtrlApiExec, loggedUserReq?: LoggedUserBase) {
  const agora = new Date();
  //dbg(nivelLogOpersDbDetail, 'ApiLogWrite', `create-pre`);

  let dbOpened = false;
  if (UriDb() != null) {
    try {
      await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
      ctrlApiExec.ctrlContext.checkElapsed('ApiLogStart Connect');
      dbOpened = true;
    } catch (error) {
      dbgError('ApiLogStart', 'ConnectDb', error.message);
    }
  }

  let apiLogDb_id = null;
  let userInfo = null;
  if (loggedUserReq != null) {
    userInfo = loggedUserReq.email;
    if (loggedUserReq.emailSigned != loggedUserReq.email)
      userInfo += ` (simulado por ${loggedUserReq.emailSigned})`;
  }

  if (dbOpened) {
    const apiLogDb = (await ApiSyncLogModel.create(
      ApiSyncLog.fill({
        appVersion: configApp.appVersion,
        apiHost: EnvInfoHost(), // ctrlApiExec.apiHost,
        apiPath: ctrlApiExec.apiPath,
        ip: ctrlApiExec.ip,
        //originHost: ctrlApiExec.originHost,
        paramsTypeVariant: ctrlApiExec.paramsTypeVariant,
        paramsTypeKey: ctrlApiExec.paramsTypeKey,
        userId: loggedUserReq?.userIdStr != null ? new ObjectId(loggedUserReq.userIdStr) : null,
        userInfo: userInfo,
        started: agora,
        parm: ctrlApiExec.parm,
        sessionIdStr: loggedUserReq?.sessionIdStr,
        referer: ctrlApiExec.referer, // @!!!!!
      }, true)
    ) as any)._doc as ApiSyncLog;
    apiLogDb_id = apiLogDb._id;
    ctrlApiExec.ctrlContext.checkElapsed('ApiLogStart create');
  }

  if (dbOpened) {
    try {
      await CloseDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
    } catch (error) {
      dbgError('ApiLogStart', 'CloseDb', error.message);
    }
  }

  const apiLogProc: IApiLogProc = {
    _id: apiLogDb_id,
    //context: varsHttp.context(),
    ctrlContext: ctrlApiExec.ctrlContext,
  };
  return apiLogProc;
}

export async function ApiLogFinish(apiLogProc: IApiLogProc, result: IApiResultProc, deleteIfOk = false, additionalInfo: string = undefined) {
  const agora = new Date();
  const elapsedMs = apiLogProc.ctrlContext.calcExecTime.elapsedMs();

  if (apiLogProc._id == null)
    return;

  if (UriDb() == null)
    return;

  try {
    await ConnectDbASync({ ctrlContext: apiLogProc.ctrlContext });

    //dbg({ level: 1, context: apiLogProc.context, levelScope: ScopeDbg.api }, `api finalizada: ${elapsedMs}ms`);
    const attentionItens = [];
    if (_.indexOf(HttpStatusCodeNormais, result.statusCode) == -1) {
      attentionItens.push(`statusCode ${result.statusCode}`);
      if (result.data?._ErrorPlusObj?.message != null)
        attentionItens.push(`msg '${result.data?._ErrorPlusObj?.message}'`);
    }
    if (elapsedMs > EnvApiTimeout().exec * 0.5)
      attentionItens.push('timeExec');

    const shouldDelete = (deleteIfOk && _.indexOf(HttpStatusCodeNormais, result.statusCode) != -1) && (elapsedMs < EnvApiTimeout().exec * 0.5);

    // if (shouldDelete)
    //   await ApiSyncLogModel.deleteOne({ _id: apiLogProc._id });
    // else
    await ApiSyncLogModel.updateOne(
      ApiSyncLog.fill({ _id: apiLogProc._id }),
      ApiSyncLog.fill({
        ended: agora,
        elapsedMs,
        result,
        attention: attentionItens.length > 0 ? attentionItens.join('; ') : undefined,
        shouldDelete,
        additionalInfo: additionalInfo,
      }));
    await CloseDbASync({ ctrlContext: apiLogProc.ctrlContext });
  } catch (error) {
    dbgError('ApiLogFinish', error.message);
  }

  return;
}