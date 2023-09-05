import { DateDifMinutes, HoraDebug, HoraForLog, SleepMs } from '../libCommon/util';
import { CalcExecTime } from '../libCommon/calcExectime';
import { CtrlContext } from '../libCommon/ctrlContext';
import { CtrlRecursion } from '../libCommon/ctrlRecursion';
import { colorErr } from '../libCommon/consoleColor';
import { csd, dbg, dbgError, ScopeDbg } from '../libCommon/dbg';

import { NotifAdmMessage, NotifyAdmCtrl } from '../app_base/modelTypes';
import { keyNotifyAdmCtrl, NotifyAdmCtrlModel } from '../app_base/model';

import { CloseDbASync, ConnectDbASync, LockStatus, lockWait, UriDb } from './dbMongo';
import { sysEmailSupport } from './sendMail';
import { NotifAdmSendEmailAsyncApi } from './asyncProcsCalls';

const _ctrlRecursion: { func: string, ctrlRecursion: CtrlRecursion }[] = [];
const GetCtrlRecursion = (func: string) => {
  let item = _ctrlRecursion.find((x) => x.func == func);
  if (item == null)
    _ctrlRecursion.push(item = { func, ctrlRecursion: new CtrlRecursion(`notifyAdm->${func}`, 1) });
  return item.ctrlRecursion;
};

function dbgNotifyAdm(...params) {
  //if (dbgShow())
  // eslint-disable-next-line no-console
  console.log(colorErr(HoraForLog() + ' notifyAdm'), ...params);
}

//const lockCtrl = { id: 'notifyAdmCtrl' };

export async function NotifyAdmASync(mainMsg: string, variableInfo: string, ctrlContext: CtrlContext, details?: object) {
  //csl({ mainMsg, variableInfo });
  dbgNotifyAdm(mainMsg, `(${variableInfo})`);
  const ctrlRecursion = GetCtrlRecursion('NotifyAdmASync');
  let thisCallCtrl = null;
  if ((thisCallCtrl = ctrlRecursion.in(`${mainMsg} (${variableInfo})`)) == null) return;

  const dbgX = (level: number, ...params) => dbg({ level, point: 'NotifyAdmASync', scopeMsg: ScopeDbg.x, ctrlContext }, ...params);

  let dbOpened = false;
  if (UriDb() != null) {
    try {
      await ConnectDbASync({ ctrlContext });
      dbOpened = true;
    } catch (error) {
      dbgError('NotifyAdm', 'ConnectDbASync error', error.message);
    }
  }

  const maximumDifferentMessages = 100;
  const delayNextNotifMinutes = 120;

  //const bodyHtml = details != null ? `<pre>${JSON.stringify(details, null, 4)}</pre>` : 'sem detalhes';

  // checa se a msg deve ser enviada e atualiza os controles para evitar um número excessivo de notificações para cada canal
  const SysCtrl = async (mainMsg: string, variableInfo: string) => {
    let notifEmailReason = null;
    let notifSMSReason = null;

    //await LockObj(lockCtrl, mainMsg, true); // no vercel não é garantido, pois as variáveis globais nem sempre são compartilhadas entre dois processos simultâneos
    try {
      if (dbOpened) {

        //await SleepMsDevRandom(1000, mainMsg + ' 1');

        const agora = new Date();
        //csl(mainMsg, HoraDbg(agora));

        //await NotifyAdmCtrlModel.findOneAndUpdate({ key }, {}, { upsert: true, new: true }); // apenas garante a inclusão do registro, se não houver
        const findAndLock = async (lockedStr: string) => {
          const calcExecTimeLockTry = new CalcExecTime();
          let result: { doc: NotifyAdmCtrl, lockStatus: LockStatus } = null;
          while (result == null) {
            let docDb = await NotifyAdmCtrlModel.findOneAndUpdate(
              NotifyAdmCtrl.fill({
                key: keyNotifyAdmCtrl,
                lockedStr: null
              }),
              NotifyAdmCtrl.fill({
                lockedStr
              }),
              { new: true }).lean() as NotifyAdmCtrl;
            if (docDb != null)
              result = { doc: docDb, lockStatus: LockStatus.normal };
            else {
              //dbgT(1, mainMsg, `lock não concedido para '${lockedStr}'`);
              if (calcExecTimeLockTry.elapsedMs() > lockWait.max) {
                docDb = await NotifyAdmCtrlModel.findOneAndUpdate(
                  NotifyAdmCtrl.fill({
                    key: keyNotifyAdmCtrl
                  }),
                  NotifyAdmCtrl.fill({
                    lockedStr
                  }),
                  { new: true }).lean();
                if (docDb != null)
                  result = { doc: docDb, lockStatus: LockStatus.forced };
                else {
                  docDb = (await NotifyAdmCtrlModel.create(
                    NotifyAdmCtrl.fill({
                      key: keyNotifyAdmCtrl,
                      lockedStr
                    })) as any)._doc as NotifyAdmCtrl;
                  //dbgT(1, mainMsg, 'created');
                  result = { doc: docDb, lockStatus: LockStatus.normal };
                }
              }
              await SleepMs(lockWait.nextTry);
            }
          }
          return result;
        };
        const lockedStr = `${HoraDebug(agora)}`; //  (${mainMsg})
        const { doc: sysCtrl, lockStatus } = await findAndLock(lockedStr);
        // findAndLock(lockedStr + '_0').then((x) => csl(x.doc.lockedStr, x.lockStatus));
        dbgX(1, 'lock concedido: ', sysCtrl.lockedStr, lockStatus);

        const propsInicializ: NotifyAdmCtrl = {};
        if (sysCtrl.start == null)
          propsInicializ.start = agora;

        const notifAdmMessageJaIndex = sysCtrl.messages.findIndex((x) => x.mainMsg == mainMsg);

        if (notifAdmMessageJaIndex == -1) {
          //if (sysCtrl.notifAdmMessages.length < maximumDifferentMessages) {
          notifEmailReason = 'primeiro evento';
          if (sysCtrl.messages.length < 3)
            notifSMSReason = notifEmailReason;
          if (sysCtrl.messages.length < maximumDifferentMessages)
            sysCtrl.messages = [...sysCtrl.messages,
            NotifAdmMessage.fill({
              mainMsg,
              variableInfos: [variableInfo],
              first: agora,
              last: agora,
              notifLastProc: `email: ${notifEmailReason} ; sms: ${notifSMSReason}`,
              total: 1,
            })];
        }
        else {
          if (DateDifMinutes(agora, sysCtrl.last) > delayNextNotifMinutes)
            notifEmailReason = `mais de ${delayNextNotifMinutes} minutos do último envio`;
          sysCtrl.messages[notifAdmMessageJaIndex].variableInfos = [variableInfo, ...sysCtrl.messages[notifAdmMessageJaIndex].variableInfos.slice(0, 99)]; // sempre fica as últimas!
          sysCtrl.messages[notifAdmMessageJaIndex].last = agora;
          sysCtrl.messages[notifAdmMessageJaIndex].notifLastProc = `email: ${notifEmailReason} ; sms: ${notifSMSReason}`;
          sysCtrl.messages[notifAdmMessageJaIndex].total++;
        }

        //csl({ notifAdmMessageJaIndex, notifEmailReason, notifSMSReason });

        if (notifEmailReason != null || notifSMSReason != null)
          sysCtrl.last = agora;

        await NotifyAdmCtrlModel.updateOne(
          NotifyAdmCtrl.fill({
            key: keyNotifyAdmCtrl,
            lockedStr,
          }),
          NotifyAdmCtrl.fill({
            ...propsInicializ,
            lockedStr: null,
            last: sysCtrl.last,
            messages: sysCtrl.messages,
          }));

        dbgX(1, `lock liberado: ${lockedStr}`);

        //.catch(error => dbgError('AppCtrlModel.update', error.message)); // @@@@!!!
      }
      // if (openTemp)
      //   await CloseDb('NotifyAdm');
    } catch (error) {
      dbgError('NotifyAdm', 'SysCtrl', error.message);
    }
    //UnLockObj(lockCtrl, mainMsg, true);

    return { notifEmailReason, notifSMSReason };
  };

  const { notifEmailReason, notifSMSReason } = await SysCtrl(mainMsg, variableInfo);
  //csl('notifEmail', { notifEmail, notifSMS });

  // push notif no celular @@@!

  dbgX(1, `msg: ${mainMsg} ; email: ${notifEmailReason} ; sms: ${notifSMSReason}`);

  if (notifEmailReason != null) {
    const subject = `${mainMsg} (${variableInfo})`;
    let bodyObj: any = {};
    if (details != null)
      bodyObj = { ...details };
    bodyObj = { ...details, subject };
    //await SendEmailApiAsync({ subject: `NotifAdm - ${mainMsg} - ${variableInfo} (${ctrlApiExec.apiCmdCallIdStatic(ctrlApiExec)})` }, ctrlApiExec);
    await NotifAdmSendEmailAsyncApi({ to: sysEmailSupport, subject: `NotifAdm: ${subject})`, bodyText: JSON.stringify(bodyObj, null, 2) }, ctrlContext);
  }

  // if (notifSMS) { // @@@!
  //   try {
  //     await SendSMSSys(`NotifAdm - ${msg}`);
  //   } catch (error) {
  //     dbgError('NotifyAdm-sendSMS error', `${error.message}`);
  //   }
  // }

  if (dbOpened) {
    try {
      await CloseDbASync({ ctrlContext });
    } catch (error) {
      dbgError('NotifyAdm', 'CloseDbASync', error.message);
    }
  }

  ctrlRecursion.out(thisCallCtrl);

  return `NotifyAdm '${mainMsg}' executada com sucesso`;
}