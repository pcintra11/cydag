import { ObjectId } from 'mongodb';
import _ from 'underscore';

import { Env, EnvApiTimeout } from '../libCommon/envs';

import { ApiSyncLog, LoggedUserBase } from '../base/db/types';
import { ApiSyncLogModel } from '../base/db/models';
import { CloseDbASync, ConnectDbASync, UriDb } from '../base/db/functions';

import { HttpStatusCodeNormais } from '../libCommon/util';
import { dbgError } from '../libCommon/dbg';

import { ApiResultProc, CtrlApiExec } from './util';

interface ApiLogProc {
  _id: ObjectId,
  //context: string,
  ctrlApiExec: CtrlApiExec,
}

export async function ApiLogStart(ctrlApiExec: CtrlApiExec, loggedUserReq?: LoggedUserBase) {
  const agora = new Date();
  //dbg(nivelLogOpersDbDetail, 'ApiLogWrite', `create-pre`);

  let dbOpened = false;
  if (UriDb() != null) {
    try {
      await ConnectDbASync({ context: `${ctrlApiExec.context()}-ApiLogStart` });
      ctrlApiExec.checkElapsed('ApiLogStart Connect');
      dbOpened = true;
    } catch (error) {
      dbgError('ApiLogStart ConnectDbASync error', error.message);
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
    const apiLogDb = await ApiSyncLogModel.create({
      appVersion: Env('appVersion'),
      apiHost: ctrlApiExec.apiHost,
      apiPath: ctrlApiExec.apiPath,
      ip: ctrlApiExec.ip,
      originHost: ctrlApiExec.originHost,
      paramsTypeVariant: ctrlApiExec.paramsTypeVariant,
      paramsTypeKey: ctrlApiExec.paramsTypeKey,
      userId: loggedUserReq?.userIdStr != null ? new ObjectId(loggedUserReq.userIdStr) : null,
      userInfo: userInfo,
      started: agora,
      parm: ctrlApiExec.parm,
      sessionIdStr: loggedUserReq?.sessionIdStr,
      referer: ctrlApiExec.referer, // @!!!!!
    } as ApiSyncLog);
    apiLogDb_id = apiLogDb._id;
    ctrlApiExec.checkElapsed('ApiLogStart create');
  }

  if (dbOpened) {
    try {
      await CloseDbASync({ context: `${ctrlApiExec.context()}-ApiLogStart` });
    } catch (error) {
      dbgError('ApiLogStart CloseDbASync error', error.message);
    }
  }

  const apiLogProc: ApiLogProc = {
    _id: apiLogDb_id,
    //context: varsHttp.context(),
    ctrlApiExec,
  };
  return apiLogProc;
}

export async function ApiLogFinish(apiLogProc: ApiLogProc, result: ApiResultProc, deleteIfOk = false, aditionalInfo: string = undefined) {
  const agora = new Date();
  const elapsedMs = apiLogProc.ctrlApiExec.calcExecTime.elapsedMs();

  if (apiLogProc._id == null)
    return;

  if (UriDb() == null)
    return;

  try {
    await ConnectDbASync({ context: `${apiLogProc.ctrlApiExec.context()}-ApiLogFinish` });

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
    await ApiSyncLogModel.updateOne({ _id: apiLogProc._id },
      {
        ended: agora,
        elapsedMs,
        result,
        attention: attentionItens.length > 0 ? attentionItens.join('; ') : undefined,
        shouldDelete,
        aditionalInfo,
      } as ApiSyncLog);

    await CloseDbASync({ context: `${apiLogProc.ctrlApiExec.context()}-ApiLogFinish` });
  } catch (error) {
    dbgError('ApiLogFinish error', error.message);
  }

  return;
}