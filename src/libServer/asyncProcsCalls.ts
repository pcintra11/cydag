import { Env, EnvApiTimeout } from '../libCommon/envs';

import { ApiAsyncLogModel, SendMailLogModel } from '../base/db/models';
import { ApiAsyncLog, SendMailLog } from '../base/db/types';
import { apisBase } from '../base/endPoints';
import { CloseDbASync, ConnectDbASync, UriDb } from '../base/db/functions';

import { AddSeconds, CalcExecTime } from '../libCommon/util';
import { dbg, dbgError, ScopeDbg } from '../libCommon/dbg';
import { IGenericObject } from '../libCommon/types';

import { CallApiSvrASync } from '../fetcher/fetcherSvr';

import { SendEmailParams, SendMailASync } from './sendMail';
import { CtrlApiExec, LogSentMessagesFn } from './util';

export enum AsyncProcTypes {
  sendMail = 'sendMail',
  notifAdmMail = 'notifAdmMail',
  custom = 'custom',
}

const apiToCall = apisBase.asyncProc.apiPath;
async function CheckLastExecsASync(type: AsyncProcTypes, customType: string) {
  const agora = new Date();
  // const apiExecuting = varsHttp?.apiPath;
  // if (apiExecuting == apiToCall) // qdo o tempo exceder em uma chamada api assincrona vai tentar emitir o NotifyAdm, que chama essa mesma api!
  //   throw new Error(`SendEmailApiAsync chamada recursiva não permitida (${type}-${info})`);
  const lastMinuteStart = AddSeconds(agora, -60);
  const callsLastMinute = await ApiAsyncLogModel.find({ type, customType, register: { $gt: lastMinuteStart }, ended: null }).lean();
  //console.log({ callsLastMinute });
  if (callsLastMinute.length >= 20)
    throw new Error(`AsyncProc type '${type}' abortado - chamadas não finalizadas nos últimos 60 segundos: ${callsLastMinute.length}.`);
}
export async function SendEmailAsyncApiNew(sendEmailParams: SendEmailParams, ctrlApiExec: CtrlApiExec, forceDelay?: number) {
  await CallAsyncApi(AsyncProcTypes.sendMail, null, sendEmailParams.subject, sendEmailParams, true, ctrlApiExec, forceDelay);
}
export async function NotifAdmSendEmailAsyncApiNew(sendEmailParams: SendEmailParams, ctrlApiExec: CtrlApiExec, forceDelay?: number) {
  await CallAsyncApi(AsyncProcTypes.notifAdmMail, null, sendEmailParams.subject, sendEmailParams, true, ctrlApiExec, forceDelay);
}

export async function CallAsyncApi(type: AsyncProcTypes, customType: string, info: string, params: IGenericObject, deleteIfOk: boolean, ctrlApiExec: CtrlApiExec, forceDelay?: number) {
  const agora = new Date();
  const dbgT = (level: number, ...params) => dbg({ level, levelScope: ScopeDbg.t, context: ctrlApiExec.context(), color: ctrlApiExec?.colorDestaq }, `==>CallAsyncApi:${type}`, ...params);
  try {
    await CheckLastExecsASync(type, customType);
    const asyncProc = await ApiAsyncLogModel.create({
      appVersion: Env('appVersion'),
      apiHost: ctrlApiExec.apiHost,
      type,
      customType,
      info,
      register: agora,
      params,
    } as ApiAsyncLog);
    CallApiSvrASync(apiToCall, ctrlApiExec, info, { idStr: asyncProc._id.toString(), type, info, forceDelay, deleteIfOk }, { fetchAndForget: true })
      .then(() => dbgT(1, '************* ok'))
      .catch((error) => dbgT(0, '************* error(1)', error.message));
  } catch (error) {
    //SystemMsgSvrASync(CategMsgSystem.error, 'CallAsyncApi throw', error.message, ctrlApiExec);
    dbgError('CallAsyncApi error', error.message);
  }
}

export async function SendMailASyncManaged(sendEmailParams: SendEmailParams, context: string, timeOut?: number, logFn?: LogSentMessagesFn) {
  let dbOpened = false;
  if (UriDb() != null) {
    try {
      await ConnectDbASync({ context });
      dbOpened = true;
    } catch (error) {
      dbgError('SendMailASyncManaged ConnectDbASync error', error.message);
    }
  }

  let sendMailLogId = null;
  if (dbOpened) {
    try {
      const log = await SendMailLogModel.create({
        sendEmailParams,
        started: new Date(),
      } as SendMailLog);
      sendMailLogId = log._id;
    } catch (error) {
      dbgError('SendMailASyncManaged create error', error.message);
    }
  }

  let resultOk: string = null;
  let resultError: string = null;
  let elapsedMs: number = null;
  try {
    const calcExecTime = new CalcExecTime();
    const result = await SendMailASync(sendEmailParams, context, timeOut, logFn);
    resultOk = result.resultOk;
    elapsedMs = calcExecTime.elapsedMs();
  } catch (error) {
    resultError = error.message;
  }

  if (dbOpened) {
    const attentionItens = [];
    if (resultError != null)
      attentionItens.push('error');
    if (elapsedMs > EnvApiTimeout().exec * 0.3)
      attentionItens.push('timeExec');
    const attention = attentionItens.length > 0 ? attentionItens.join('; ') : undefined;
    const shouldDelete = resultError == null && elapsedMs < EnvApiTimeout().exec * 0.5;
    try {
      await SendMailLogModel.updateOne({ _id: sendMailLogId }, {
        ended: new Date(),
        elapsedMs,
        resultOk,
        resultError,
        attention,
        shouldDelete,
      } as SendMailLog);
    } catch (error) {
      dbgError('SendMailASyncManaged update error', error.message);
    }

    try {
      await CloseDbASync({ context });
    } catch (error) {
      dbgError('SendMailASyncManaged CloseDbASync error', error.message);
    }
  }

  return { resultOk, resultError };
}