import { CalcExecTime, CtrlRecursion, DateDifMinutes, HoraDebug, SleepMs } from '../libCommon/util';
import { NotifyAdmCtrl } from './db/types';
import { dbg, dbgError, dbgNotifyAdm, ScopeDbg } from '../libCommon/dbg';

import { CloseDbASync, ConnectDbASync, LockStatus, lockWait, UriDb } from './db/functions';
import { keyNotifyAdmCtrl, NotifyAdmCtrlMd, NotifyAdmCtrlModel } from './db/models';
import { CtrlApiExec } from '../libServer/util';
import { sysEmailSupport } from '../libServer/sendMail';
import { NotifAdmSendEmailAsyncApiNew } from '../libServer/asyncProcsCalls';

const _ctrlRecursion: { func: string, ctrlRecursion: CtrlRecursion }[] = [];
const GetCtrlRecursion = (func: string) => {
  let item = _ctrlRecursion.find((x) => x.func == func);
  if (item == null)
    _ctrlRecursion.push(item = { func, ctrlRecursion: new CtrlRecursion(`notifyAdm->${func}`, 10) });
  return item.ctrlRecursion;
};

//const lockCtrl = { id: 'notifyAdmCtrl' };

export async function NotifyAdmASync(mainMsg: string, variableInfo: string, ctrlApiExec: CtrlApiExec, details?: object) {
  //console.log({ mainMsg, variableInfo });
  dbgNotifyAdm(mainMsg, `(${variableInfo})`);
  const ctrlRecursion = GetCtrlRecursion('NotifyAdmASync');
  if (ctrlRecursion.inExceeded(`${mainMsg} (${variableInfo})`)) return;

  const dbgT = (level: number, ...params) => dbg({ level, levelScope: ScopeDbg.t, context: ctrlApiExec.context(), color: ctrlApiExec?.colorDestaq }, ...params);

  let dbOpened = false;
  if (UriDb() != null) {
    try {
      await ConnectDbASync({ context: `${ctrlApiExec.context()}-NotifyAdm` });
      dbOpened = true;
    } catch (error) {
      dbgError('_NotifyAdmASync ConnectDbASync error', error.message);
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
        //console.log(mainMsg, HoraDbg(agora));

        //await NotifyAdmCtrlModel.findOneAndUpdate({ key }, {}, { upsert: true, new: true }); // apenas garante a inclusão do registro, se não houver
        const findAndLock = async (lockedStr: string) => {
          const calcExecTimeLockTry = new CalcExecTime();
          let result: { doc: NotifyAdmCtrlMd, lockStatus: LockStatus } = null;
          while (result == null) {
            let docDb = await NotifyAdmCtrlModel.findOneAndUpdate({ key: keyNotifyAdmCtrl, lockedStr: null } as NotifyAdmCtrl, { lockedStr } as NotifyAdmCtrl, { new: true });
            if (docDb != null)
              result = { doc: docDb, lockStatus: LockStatus.normal };
            else {
              //dbgT(1, mainMsg, `lock não concedido para '${lockedStr}'`);
              if (calcExecTimeLockTry.elapsedMs() > lockWait.max) {
                docDb = await NotifyAdmCtrlModel.findOneAndUpdate({ key: keyNotifyAdmCtrl } as NotifyAdmCtrl, { lockedStr } as NotifyAdmCtrl, { new: true });
                if (docDb != null)
                  result = { doc: docDb, lockStatus: LockStatus.forced };
                else {
                  docDb = await NotifyAdmCtrlModel.create({ key: keyNotifyAdmCtrl, lockedStr });
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
        // findAndLock(lockedStr + '_0').then((x) => console.log(x.doc.lockedStr, x.lockStatus));
        dbgT(1, 'lock concedido: ', sysCtrl.lockedStr, lockStatus);

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
            {
              mainMsg,
              variableInfos: [variableInfo],
              first: agora,
              last: agora,
              notifLastProc: `email: ${notifEmailReason} ; sms: ${notifSMSReason}`,
              total: 1,
            }];
        }
        else {
          if (DateDifMinutes(agora, sysCtrl.last) > delayNextNotifMinutes)
            notifEmailReason = `mais de ${delayNextNotifMinutes} minutos do último envio`;
          sysCtrl.messages[notifAdmMessageJaIndex].variableInfos = [variableInfo, ...sysCtrl.messages[notifAdmMessageJaIndex].variableInfos.slice(0, 9)]; // sempre fica as últimas!
          sysCtrl.messages[notifAdmMessageJaIndex].last = agora;
          sysCtrl.messages[notifAdmMessageJaIndex].notifLastProc = `email: ${notifEmailReason} ; sms: ${notifSMSReason}`;
          sysCtrl.messages[notifAdmMessageJaIndex].total++;
        }

        //console.log({ notifAdmMessageJaIndex, notifEmailReason, notifSMSReason });

        if (notifEmailReason != null || notifSMSReason != null)
          sysCtrl.last = agora;

        await NotifyAdmCtrlModel.updateOne({ key: keyNotifyAdmCtrl, lockedStr } as NotifyAdmCtrl, {
          ...propsInicializ,
          lockedStr: null,
          last: sysCtrl.last,
          messages: sysCtrl.messages,
        } as NotifyAdmCtrl);

        dbgT(1, `lock liberado: ${lockedStr}`);

        //.catch(error => dbgError('AppCtrlModel.update', error.message)); // @@@@!!!
      }
      // if (openTemp)
      //   await CloseDb('NotifyAdm');
    } catch (error) {
      dbgError('Erro em NotifyAdm->SysCtrl', error.message);
    }
    //UnLockObj(lockCtrl, mainMsg, true);

    return { notifEmailReason, notifSMSReason };
  };

  const { notifEmailReason, notifSMSReason } = await SysCtrl(mainMsg, variableInfo);
  //console.log('notifEmail', { notifEmail, notifSMS });

  // push notif no celular @@@!

  dbgT(1, `msg: ${mainMsg} ; email: ${notifEmailReason} ; sms: ${notifSMSReason}`);

  if (notifEmailReason != null) {
    const subject = `${mainMsg} (${variableInfo})`;
    let bodyObj: any = {};
    if (details != null)
      bodyObj = { ...details };
    bodyObj = { ...details, subject };
    //await SendEmailApiAsync({ subject: `NotifAdm - ${mainMsg} - ${variableInfo} (${ctrlApiExec.apiCmdCallIdStatic(ctrlApiExec)})` }, ctrlApiExec);
    await NotifAdmSendEmailAsyncApiNew({ to: sysEmailSupport, subject: `NotifAdm: ${subject})`, bodyText: JSON.stringify(bodyObj, null, 2) }, ctrlApiExec);
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
      await CloseDbASync({ context: `${ctrlApiExec.context()}-NotifyAdm` });
    } catch (error) {
      dbgError('_NotifyAdmASync CloseDbASync error', error.message);
    }
  }

  ctrlRecursion.out();

  return `NotifyAdm '${mainMsg}' executada com sucesso`;
}