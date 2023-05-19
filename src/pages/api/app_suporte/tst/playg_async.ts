// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

import { configApp } from '../../../../app_hub/appConfig';

import { ConnectDbASync, CloseDbASync } from '../../../../libServer/dbMongo';

import { HoraDebug, SleepMsDev, WaitMs } from '../../../../libCommon/util';
import { csd, dbg, ScopeDbg } from '../../../../libCommon/dbg';
import { CategMsgSystem } from '../../../../libCommon/logSystemMsg_cliSvr';
import { IGenericObject } from '../../../../libCommon/types';
import { CtrlContext } from '../../../../libCommon/ctrlContext';

import { NewPromiseExecUntilCloseDb } from '../../../../libServer/opersASync';
import { GetCtrlApiExec, ResumoApi } from '../../../../libServer/util';
import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { SendMailASync, sysEmailSupport } from '../../../../libServer/sendMail';
import { EnvInfoHost } from '../../../../app_base/envs';
import { JunkModel } from '../../../../app_base/model';

// function SystemError(...parms) {
//   csl(...parms);
// }
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const ctrlApiExec = GetCtrlApiExec(req, res);
  const parm = ctrlApiExec.parm;
  const resumoApi = new ResumoApi(ctrlApiExec);
  //const agora = new Date();
  let close = true;
  if (parm.noClose === true) {
    csd('noClose!');
    close = false;
  }
  //const dbgContext = `${varsReq.api}-${HoraDbg(agora)}`;

  //csl(dbgContext);

  // ===========================
  // em resumo: no netlify qquer await APÒS o res.status ficará para a próxima execução da api
  // ===========================

  if (ctrlApiExec.parm._waitApiMs != null)
    WaitMs(Number(ctrlApiExec.parm._waitApiMs));

  // if (varsHttp.parm._callId != null)
  //   context += `(callId ${varsHttp.parm._callId})`;

  if (parm.variant == 1)
    resumoApi.jsonData({ horaFim: HoraDebug(), parm }).json();  // @@@@@!! usar padrão value

  await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext });

  try {
    Rotina(ctrlApiExec.ctrlContext.context, parm, ctrlApiExec.ctrlContext);
  }
  catch (error) {
    await SystemMsgSvrASync(CategMsgSystem.error, '*', error.message, ctrlApiExec.ctrlContext);
  }

  if (parm.variant == 2)
    resumoApi.jsonData({ horaFim: HoraDebug(), parm }).json();

  if (parm.variant == 3)
    resumoApi.jsonData({ horaFim: HoraDebug(), parm }).json();
  if (close)
    await CloseDbASync({ ctrlContext: ctrlApiExec.ctrlContext });

  if (parm.variant >= 4) // testar
    resumoApi.jsonData({ horaFim: HoraDebug(), parm }).json();
};

async function Rotina(caller: string, parm: IGenericObject, ctrlContext: CtrlContext) {
  const dbgD = (level: number, ...params) => dbg({ level, point: 'Rotina', scopeMsg: ScopeDbg.d, ctrlContext }, ...params);

  if (parm.sleepRotina != 0) {
    await SleepMsDev(parm.sleepRotina, ctrlContext, 'Rotina');
  }
  //try {
  // let common = `v${parm.variant} ${hora} ${ip}`;
  // if (parm.id != null)
  //   common += ` id ${parm.id}`;
  //NewOperAsyncDb(Event.create({ ...logUserFields, obs: `${common}` }), 'create async');

  //NewOperAsyncDb(SystemWarningASync('logTest', HoraDbg()), 'create async');

  const commonData = {
    app: `${configApp.appName} ${configApp.appVersion}`,
    host: EnvInfoHost(), //  ctrlApiExec.apiHost
  };

  const key = 'playg1';

  try {
    const resUpd = await JunkModel.updateOne({ key }, { date: new Date(), msg: `upd sync v${parm.variant} ${caller}`, ...commonData });
    dbgD(3, 'update sync', 'ok', { resUpd });
    if (resUpd.modifiedCount === 0) {
      const resAdd = await JunkModel.create({ key, date: new Date(), textField: `add sync v${parm.variant} ${caller}`, ...commonData });
      dbgD(3, 'create sync', 'ok', { resAdd });
    }
  } catch (error) {
    await SystemMsgSvrASync(CategMsgSystem.error, caller, 'Update sync err:', error.message, ctrlContext);
  }

  NewPromiseExecUntilCloseDb(JunkModel.updateOne({ key }, { obj1: { date: new Date(), msg: `upd sync1 v${parm.variant} ${caller}` } }) //@!! testar novamente, mudei tudo
    .then(resUpd => dbgD(3, 'update async1', { resUpd }))
    .catch(async (error) => await SystemMsgSvrASync(CategMsgSystem.error, caller, 'Update async1', error.message, ctrlContext)),
    `${caller}-async1`);
  NewPromiseExecUntilCloseDb(JunkModel.updateOne({ key }, { obj2: { date: new Date(), msg: `upd sync2 v${parm.variant} ${caller}` } })
    .then(resUpd => dbgD(3, 'update async2', { resUpd }))
    .catch(async (error) => await SystemMsgSvrASync(CategMsgSystem.error, caller, 'Update async2', error.message, ctrlContext)),
    `${caller}-async2`);
  NewPromiseExecUntilCloseDb(SendMailASync({ to: sysEmailSupport, subject: `Rotina playg_async ${HoraDebug()}`, bodyText: 'essa msg foi enviada em texto puro', }, ctrlContext)
    .then((sendMail) => dbgD(3, 'SendMail return(async):', `response: ${sendMail.resultOk}`))
    .catch(async (error) => await SystemMsgSvrASync(CategMsgSystem.error, caller, 'SendMail', error.message, ctrlContext)),
    'sendMail');

  if (parm.errorForced)
    throw new Error(`errorForced: ${parm.errorForced}`);

  csd('Rotina', 'ok');
  return { proc: 'ok', parm };
  // } catch (error) {
  //   //SystemError(dbgContext, 'Rotina', error.message);
  //   throw error;
  // }
}