import { configApp } from '../app_hub/appConfig';

import { ApiAsyncLogModel, SendMailLogModel } from '../app_base/model';
import { ApiAsyncLog, SendMailLog } from '../app_base/modelTypes';
import { apisBase } from '../app_base/endPoints';
import { CloseDbASync, ConnectDbASync, UriDb } from './dbMongo';

import { EnvApiTimeout, EnvInfoHost } from '../app_base/envs';
import { csd, dbgError } from '../libCommon/dbg';
import { IGenericObject } from '../libCommon/types';
import { CalcExecTime } from '../libCommon/calcExectime';
import { CtrlContext } from '../libCommon/ctrlContext';

import { CallApiSvrASync } from '../fetcher/fetcherSvr';

import { ISendEmailParams, SendMailASync } from './sendMail';
import { LogSentMessagesFn } from './util';

export enum AsyncProcTypes {
  sendMail = 'sendMail',
  notifAdmMail = 'notifAdmMail',
  custom = 'custom',
}

const apiToCall = apisBase.asyncProc.apiPath;
// async function CheckLastExecsASync(type: AsyncProcTypes, customType: string) {
//   const agora = new Date();
//   // const apiExecuting = varsHttp?.apiPath;
//   // if (apiExecuting == apiToCall) // qdo o tempo exceder em uma chamada api assincrona vai tentar emitir o NotifyAdm, que chama essa mesma api!
//   //   throw new Error(`SendEmailApiAsync chamada recursiva não permitida (${type}-${info})`);
//   const lastMinuteStart = AddSeconds(agora, -60);
//   const callsLastMinute = await ApiAsyncLogModel.find({ type, customType, register: { $gt: lastMinuteStart }, ended: null }).lean();
//   //csl({ callsLastMinute });
//   if (callsLastMinute.length >= 20)
//     throw new Error(`AsyncProc type '${type}' abortado - chamadas não finalizadas nos últimos 60 segundos: ${callsLastMinute.length}.`);
// }
export async function SendEmailAsyncApi(sendEmailParams: ISendEmailParams, ctrlContext: CtrlContext, forceDelay?: number) {
  await CallAsyncApi(AsyncProcTypes.sendMail, null, sendEmailParams.subject, sendEmailParams, true, ctrlContext, forceDelay);
}
export async function NotifAdmSendEmailAsyncApi(sendEmailParams: ISendEmailParams, ctrlContext: CtrlContext, forceDelay?: number) {
  await CallAsyncApi(AsyncProcTypes.notifAdmMail, null, sendEmailParams.subject, sendEmailParams, true, ctrlContext, forceDelay);
}

export async function CallAsyncApi(type: AsyncProcTypes, customType: string, info: string, params: IGenericObject, deleteIfOk: boolean,
  ctrlContext: CtrlContext, forceDelay?: number) {
  const agora = new Date();
  //const dbgA = (level: number, ...params) => dbg({ level, point: 'CallAsyncApi', scopeMsg: ScopeDbg.a, ctrlContext }, type, ...params);
  try {
    //await CheckLastExecsASync(type, customType);
    const asyncProc = (await ApiAsyncLogModel.create(
      ApiAsyncLog.fill({
        appVersion: configApp.appVersion,
        apiHost: EnvInfoHost(), // ctrlApiExec.apiHost,
        type,
        customType,
        info,
        register: agora,
        params,
      }, true)) as any)._doc as ApiAsyncLog;
    CallApiSvrASync(apiToCall, ctrlContext, info, { idStr: asyncProc._id.toString(), type, info, forceDelay, deleteIfOk }, { fetchAndForget: true });
    // .then(() => dbgA(1, '************* ok'))
    // .catch((error) => dbgError('CallAsyncApi', type, error.message));
  } catch (error) {
    //await SystemMsgSvrASync(CategMsgSystem.error, 'CallAsyncApi throw', error.message, ctrlApiExec);
    dbgError('CallAsyncApi', error.message);
  }
}

export async function SendMailASyncManaged(sendEmailParams: ISendEmailParams, ctrlContext: CtrlContext, timeOut?: number, logFn?: LogSentMessagesFn) {
  let dbOpened = false;
  if (UriDb() != null) {
    try {
      await ConnectDbASync({ ctrlContext });
      dbOpened = true;
    } catch (error) {
      dbgError('SendMailASyncManaged', 'ConnectDbASync', error.message);
    }
  }

  let sendMailLogId = null;
  if (dbOpened) {
    try {
      const log = (await SendMailLogModel.create(
        SendMailLog.fill({
          sendEmailParams,
          started: new Date(),
        }, true)) as any)._doc as SendMailLog;
      sendMailLogId = log._id;
    } catch (error) {
      dbgError('SendMailASyncManaged', 'create', error.message);
    }
  }

  let resultOk: string = null;
  let resultError: string = null;
  let elapsedMs: number = null;
  try {
    const calcExecTime = new CalcExecTime();
    const result = await SendMailASync(sendEmailParams, ctrlContext, timeOut, logFn);
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
      await SendMailLogModel.updateOne(
        SendMailLog.fill({ _id: sendMailLogId }),
        SendMailLog.fill({
          ended: new Date(),
          elapsedMs,
          resultOk,
          resultError,
          attention,
          shouldDelete,
        }));
    } catch (error) {
      dbgError('SendMailASyncManaged', 'update', error.message);
    }

    try {
      await CloseDbASync({ ctrlContext });
    } catch (error) {
      dbgError('SendMailASyncManaged', 'CloseDbASync', error.message);
    }
  }

  return { resultOk, resultError };
}