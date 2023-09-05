import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';

import { SleepMsDev } from '../../../libCommon/util';
import { csd, dbg, dbgError, ScopeDbg } from '../../../libCommon/dbg';
import { CategMsgSystem } from '../../../libCommon/logSystemMsg_cliSvr';
import { CalcExecTime } from '../../../libCommon/calcExectime';

import { ConnectDbASync, CloseDbASync } from '../../../libServer/dbMongo';
import { GetCtrlApiExec, ReqNoParm, ResumoApi } from '../../../libServer/util';
import { ApiStatusDataByErrorASync } from '../../../libServer/apiStatusDataByError';
//import { CorsMiddlewareAsync } from '../../../libServer/cors';
import { SendMailASync } from '../../../libServer/sendMail';
import { AlertTimeExecApiASync } from '../../../libServer/alertTimeExecApi';
import { SystemMsgSvrASync } from '../../../libServer/systemMsgSvr';
import { AsyncProcTypes } from '../../../libServer/asyncProcsCalls';

import { AsyncProcCustom } from '../../../app_hub/asyncApiCustomProc';
import { SentMessageLogASync } from '../../../app_base/SentMessageLog';
import { ApiAsyncLogModel } from '../../../app_base/model';
import { ApiAsyncLog } from '../../../app_base/modelTypes';
import { apisBase } from '../../../app_base/endPoints';
import { EnvApiTimeout, isAmbNone } from '../../../app_base/envs';

// let testGlob1 = 0;
// let hora1 = HoraDebug();
const apiSelf = apisBase.asyncProc;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (isAmbNone()) return ResumoApi.jsonAmbNone(res);
  if (ReqNoParm(req)) return ResumoApi.jsonNoParm(res);
  // await CorsMiddlewareAsync(req, res, null, { credentials: true }); //@!!!!!!! aqui usar 'jobs background' (ou algo assim), não fazer qbg API
  const ctrlApiExec = GetCtrlApiExec(req, res, null, ['type'], ['info']);
  const parm = ctrlApiExec.parm;
  const resumoApi = new ResumoApi(ctrlApiExec);
  //const agora = new Date();
  let extraInfoParams = null;

  // const envsMain = {};
  // const envsOthers = {};
  // for (const key in process.env) { // @!!!!
  //   if (key.startsWith('npm_'))
  //     continue;
  //   if (key.startsWith('NEXT_PUBLIC_')) { }
  //   else if (key.startsWith('SITE_') ||
  //     key == 'CLOUDINARY_URL' ||
  //     key == 'NODE_ENV')
  //     envsMain[key] = process.env[key];
  //   else
  //     envsOthers[key] = process.env[key];
  // }
  // csl('asyncProc envsMain', envsMain);
  // csl('asyncProc envsOthers', envsOthers);

  const dbgX = (level: number, ...params) => dbg({ level, scopeMsg: ScopeDbg.x, ctrlContext: ctrlApiExec.ctrlContext }, `(${parm.info})`, ...params);
  //dbgX(1, 'asyncProc parm', parm);

  try {
    await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext });

    // testGlob1++;
    // hora1 += 'a';
    //dbgX(2, { testGlob1, hora1 }); // @!!! bizarro! o conceudo de testGlob1 permanece inter sessões (chamadas API), para 'hora' o valor original MUDA, mas a concatenação é acumulativa!!

    try {
      //csl('apiAsyncProc parm', parm);

      const asyncProc = await ApiAsyncLogModel.findOne({ _id: new ObjectId(parm.idStr) }).lean();
      if (asyncProc == null)
        throw new Error(`id '${parm.idStr}' não encontrado (${parm.info}).`);
      if (asyncProc.type != parm.type)
        throw new Error(`id '${parm.idStr}' type ApiLogAsyncDb '${asyncProc.type}' diferente de parm '${parm.type}'.`);
      //csl('apiAsyncProc asyncProc', asyncProc);
      dbgX(1, 'ini');
      const calcExecTime = new CalcExecTime();
      if (parm.forceDelay != null)
        await SleepMsDev(Number(parm.forceDelay), ctrlApiExec.ctrlContext, 'main');

      let resultError: string = null;
      let resultOk: string = null;
      const started = new Date();
      await ApiAsyncLogModel.updateOne(
        ApiAsyncLog.fill({ _id: asyncProc._id }),
        ApiAsyncLog.fill({ started }));

      let shouldDelete = false;

      if (asyncProc.type == AsyncProcTypes.custom) {
        try {
          extraInfoParams = asyncProc.info;
          const { resultOkCustom, shouldDeleteCustom } = await AsyncProcCustom(asyncProc, ctrlApiExec.ctrlContext);
          resultOk = resultOkCustom;
          shouldDelete = shouldDeleteCustom;
          dbgX(1, 'ok', resultOk);
        } catch (error) {
          //dbgError('error', error.message);
          await SystemMsgSvrASync(CategMsgSystem.error, `${asyncProc.type}-${asyncProc.customType}`, error.message, ctrlApiExec.ctrlContext, parm);
          resultError = error.message;
        }
      }

      else if (asyncProc.type == AsyncProcTypes.sendMail) {
        try {
          extraInfoParams = `subject '${asyncProc.params.subject}'`;
          const logFn = async (resultOk, resultError) => await SentMessageLogASync({ userId: null, type: 'email', target: asyncProc.params.to, message: asyncProc.params.subject }, resultOk, resultError, ctrlApiExec.ctrlContext);
          const sendMail = await SendMailASync(asyncProc.params, ctrlApiExec.ctrlContext, null, logFn);
          resultOk = sendMail.resultOk;
          shouldDelete = true;
          dbgX(1, 'ok', resultOk);
        } catch (error) {
          await SystemMsgSvrASync(CategMsgSystem.error, asyncProc.type, error.message, ctrlApiExec.ctrlContext, parm);
          resultError = error.message;
        }
      }
      else if (asyncProc.type == AsyncProcTypes.notifAdmMail) {
        try {
          extraInfoParams = `subject '${asyncProc.params.subject}'`;
          const logFn = async (resultOk, resultError) => await SentMessageLogASync({ userId: null, type: 'email', target: asyncProc.params.to, message: asyncProc.params.subject }, resultOk, resultError, ctrlApiExec.ctrlContext);
          const sendMail = await SendMailASync(asyncProc.params, ctrlApiExec.ctrlContext, null, logFn);
          resultOk = sendMail.resultOk;
          shouldDelete = true;
          dbgX(1, 'ok', resultOk);
        } catch (error) {
          dbgError(apiSelf.apiPath, error.message);
          resultError = error.message;
        }
      }

      else
        throw new Error(`Type '${asyncProc.type}' inválido.`);

      dbgX(1, `finalizado - ${calcExecTime.elapsedMs()}ms`);

      const ended = new Date();
      const elapsedMs = calcExecTime.elapsedMs();

      shouldDelete = shouldDelete && (elapsedMs < EnvApiTimeout().exec * 0.5);

      const attentionItens = [];
      if (resultError != null)
        attentionItens.push('error');
      if (elapsedMs > EnvApiTimeout().exec * 0.5)
        attentionItens.push('timeExec');
      const attention = attentionItens.length > 0 ? attentionItens.join('; ') : undefined;

      await ApiAsyncLogModel.updateOne(
        ApiAsyncLog.fill({ _id: asyncProc._id }),
        ApiAsyncLog.fill({
          ended,
          elapsedMs,
          resultOk,
          resultError,
          attention,
          shouldDelete
        }));

      if (resultError != null)
        throw new Error(resultError);

      resumoApi.jsonData({ value: { message: 'ok' } });

    } catch (error) {
      const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 1', parm, ctrlApiExec, null, true);
      resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
    }

    await CloseDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 2', parm, ctrlApiExec, null, true);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }

  //csl('asyncProc finalizada');
  //resumoApi.jsonData({}); // nunca deve retornar nada pois ninguém chama de forma síncrona !

  const elapsedMsApi = resumoApi.json();
  await AlertTimeExecApiASync(elapsedMsApi, ctrlApiExec, null, extraInfoParams);
};