// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

import { JunkModel, ConnectDbASync, CloseDbASync } from '../../../../base/db/functions';

import { Env } from '../../../../libCommon/envs';
import { HoraDebug, SleepMsDev, WaitMs } from '../../../../libCommon/util';
import { dbg, ScopeDbg } from '../../../../libCommon/dbg';
import { CategMsgSystem } from '../../../../libCommon/logSystemMsg_cliSvr';
import { IGenericObject } from '../../../../libCommon/types';

import { NewPromiseExecUntilCloseDb } from '../../../../libServer/opersASync';
import { GetCtrlApiExec, ResumoApi, CtrlApiExec } from '../../../../libServer/util';
import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { SendMailASync, sysEmailSupport } from '../../../../libServer/sendMail';

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
    dbg({}, 'noClose!');
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

  await ConnectDbASync({ ctrlApiExec });

  try {
    Rotina(ctrlApiExec.context(), parm, ctrlApiExec);
  }
  catch (error) {
    await SystemMsgSvrASync(CategMsgSystem.error, ctrlApiExec.context(), error.message, ctrlApiExec);
  }

  if (parm.variant == 2)
    resumoApi.jsonData({ horaFim: HoraDebug(), parm }).json();

  if (parm.variant == 3)
    resumoApi.jsonData({ horaFim: HoraDebug(), parm }).json();
  if (close)
    await CloseDbASync({ ctrlApiExec });

  if (parm.variant >= 4) // testar
    resumoApi.jsonData({ horaFim: HoraDebug(), parm }).json();
};

async function Rotina(caller: string, parm: IGenericObject, ctrlApiExec: CtrlApiExec) {
  const dbgD = (level: number, ...params) => dbg({ level, levelScope: ScopeDbg.d, context: caller, color: ctrlApiExec?.colorDestaq }, ...params);

  if (parm.sleepRotina != 0) {
    await SleepMsDev(parm.sleepRotina, 'Rotina');
  }
  //try {
  // let common = `v${parm.variant} ${hora} ${ip}`;
  // if (parm.id != null)
  //   common += ` id ${parm.id}`;
  //NewOperAsyncDb(Event.create({ ...logUserFields, obs: `${common}` }), 'create async');

  //NewOperAsyncDb(SystemWarningASync('logTest', HoraDbg()), 'create async');

  const commonData = {
    app: `${Env('appName')} ${Env('appVersion')}`,
    host: ctrlApiExec.apiHost,
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
    await SystemMsgSvrASync(CategMsgSystem.error, caller, 'Update sync err:', error.message, ctrlApiExec);
  }

  NewPromiseExecUntilCloseDb(JunkModel.updateOne({ key }, { obj1: { date: new Date(), msg: `upd sync1 v${parm.variant} ${caller}` } }) //@!! testar novamente, mudei tudo
    .then(resUpd => dbgD(3, 'update async1', { resUpd }))
    .catch(async (error) => await SystemMsgSvrASync(CategMsgSystem.error, caller, 'Update async1', error.message, ctrlApiExec)),
    `${caller}-async1`);
  NewPromiseExecUntilCloseDb(JunkModel.updateOne({ key }, { obj2: { date: new Date(), msg: `upd sync2 v${parm.variant} ${caller}` } })
    .then(resUpd => dbgD(3, 'update async2', { resUpd }))
    .catch(async (error) => await SystemMsgSvrASync(CategMsgSystem.error, caller, 'Update async2', error.message, ctrlApiExec)),
    `${caller}-async2`);
  NewPromiseExecUntilCloseDb(SendMailASync({ to: sysEmailSupport, subject: `Rotina playg_async ${HoraDebug()}`, bodyText: 'essa msg foi enviada em texto puro', }, ctrlApiExec.context())
    .then((sendMail) => dbgD(3, 'SendMail return(async):', `response: ${sendMail.resultOk}`))
    .catch(async (error) => await SystemMsgSvrASync(CategMsgSystem.error, caller, 'SendMail', error.message, ctrlApiExec)),
    'sendMail');

  if (parm.errorForced)
    throw new Error(`errorForced: ${parm.errorForced}`);

  dbg({}, 'Rotina', 'ok');
  return { proc: 'ok', parm };
  // } catch (error) {
  //   //SystemError(dbgContext, 'Rotina', error.message);
  //   throw error;
  // }
}