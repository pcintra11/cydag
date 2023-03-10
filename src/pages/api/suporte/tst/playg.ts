import type { NextApiRequest, NextApiResponse } from 'next';
import { v1 as uuidv1 } from 'uuid';

import { SentMessageLogASync } from '../../../../base/SentMessageLog';
import { DbTest } from '../../../../base/db/types';
import { DbTestModelX } from '../../../../base/db/models';
import { AsyncProcForceHttpStatusNew, GravaDbTestAsyncApiNew } from '../../../../base/asyncApiCustomCall';
import { ConnectDbASync, CloseDbASync, UriDb, JunkModel, SwitchForceCloseDb, Junk } from '../../../../base/db/functions';
import { NotifyAdmASync } from '../../../../base/notifyAdm';

import { EnvDeployConfig } from '../../../../libCommon/envs';
import { CalcExecTime, DateDisp, ErrorPlus, HoraDebug, HttpStatusCode, NumberOrDef, RandomNumber, SleepMsDev, WaitMs } from '../../../../libCommon/util';
import { IGenericObject } from '../../../../libCommon/types';
import { csd, dbg, ScopeDbg } from '../../../../libCommon/dbg';
import { CategMsgSystem } from '../../../../libCommon/logSystemMsg_cliSvr';

import { CorsWhitelist } from '../../../../libServer/corsWhiteList';
import { ResumoApi, GetCtrlApiExec } from '../../../../libServer/util';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import cookieHttp from '../../../../libServer/cookiesHttp';
import { SendEmailParams, SendMailASync, SendMailOptionsASync, sysEmailSupport } from '../../../../libServer/sendMail';
import { CorsMiddlewareAsync } from '../../../../libServer/cors';
import { HttpCriptoCookieCmdASync, HttpCryptoCookieConfig } from '../../../../libServer/httpCryptoCookie';
import { NewPromiseExecUntilCloseDb, NewPromiseExecUntilResponse, promiseCtrl } from '../../../../libServer/opersASync';
import { SendEmailAsyncApiNew } from '../../../../libServer/asyncProcsCalls';
import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';

import { apisTst } from '../../../../suporte/endPoints';

import { CmdApi_Playg } from './playg_types';

const apiSelf = apisTst.playg;
export default async function (req: NextApiRequest, res: NextApiResponse) {
  await CorsMiddlewareAsync(req, res, CorsWhitelist(), { credentials: true });
  const ctrlApiExec = GetCtrlApiExec(req, res);
  //let apiCmdCallId = varsHttp.apiPathCallIdMainParams();
  const parm = ctrlApiExec.parm;
  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();

  const dbgX = (level: number, ...params) => dbg({ level, levelScope: ScopeDbg.x, context: ctrlApiExec.context(), color: ctrlApiExec?.colorDestaq }, ...params);

  if (parm._waitApiMs != null)
    WaitMs(Number(parm._waitApiMs));

  // if (parm._callId != null)
  //   apiCmdCallId += `(callIdCli ${parm._callId})`;

  //SetNivelLog(2);

  if (UriDb()) await ConnectDbASync({ ctrlApiExec });
  if (UriDb('other')) await ConnectDbASync({ ctrlApiExec, database: 'other' });

  try {
    // csl(req.method, parm);
    // const parm = req.body || {
    //   emailFrom: 'getmeetingapp@gmail.com',
    //   psw: 'getmeetingapppsw',
    //   emailTo: 'pcintraxxxx1x@gmail.com',
    // };

    if (parm.cmd == CmdApi_Playg.mail) {
      const subject = parm.subject != null ? parm.subject : `${ctrlApiExec.apiHostnameAbrev} TestMail ${req.url}`;
      let emailConfig = null;
      if (parm.emailConfig != null) {
        try {
          emailConfig = JSON.parse(parm.emailConfig);
        } catch (error) {
          throw new Error(`emailConfig n??o ?? string valido JSON: ${error.message}`);
        }
      }
      let toEmailAddr = null;
      if (parm.toEmail != null) {
        toEmailAddr = { address: parm.toEmail };
        if (parm.toName != null)
          toEmailAddr.name = parm.toName;
      }
      let replyToEmailAddr = null;
      if (parm.replyToEmail != null) {
        replyToEmailAddr = { address: parm.replyToEmail };
        if (parm.replyToName != null)
          replyToEmailAddr.name = parm.replyToName;
      }

      let result = null;
      try {
        result = await SendMailOptionsASync({
          to: sysEmailSupport,
          subject,
          replyTo: replyToEmailAddr,
        }, ctrlApiExec.context(), emailConfig);
      } catch (error) {
        result = { errorMessage2: error.message };
      }

      //.then((x) => dbg(3, dbgContext, `ok ao enviar email`, x))
      resumoApi.jsonData({ horaFim: HoraDebug(), parm, emailConfig, value: result });  // @@@@@!! usar padr??o value
    }
    else if (parm.cmd == CmdApi_Playg.testDbWrite) {
      const calcExecTime = new CalcExecTime();
      const qtd = NumberOrDef(parm.qtd, 0);
      const contentSize = NumberOrDef(parm.contentSize, 0);
      const contentSizeVariable = parm.contentSizeVariable;
      const collection = parm.collection;
      const insertInGroup = parm.insertInGroup;
      const uniqKeys = parm.uniqKeys;
      const otherDatabase = parm.otherDatabase;
      if (otherDatabase && UriDb('other') == null)
        throw new Error('database "other" n??o configurado');

      //const dbTestModel = otherDatabase ? DbTestModelOther : DbTestModel;
      const dbTestModel = DbTestModelX(collection, otherDatabase ? 'other' : undefined);

      const recsToInsertInGroup: any[] = [];
      const msgsResult: string[] = [];

      for (let item = 1; item <= qtd; item++) {
        const key = uniqKeys ? uuidv1() : RandomNumber(1, qtd * 2).toString();
        const contentSizeUse = contentSizeVariable ? RandomNumber(0, contentSize) : contentSize;
        let fld = `${DateDisp(agora, 'dmyhm')} `;
        if (fld.length < contentSizeUse) fld = fld.padEnd(contentSizeUse, '*');
        else if (fld.length > contentSizeUse) fld = fld.substring(0, contentSizeUse);
        const dbTest: DbTest = { key: key.padEnd(100, '*'), fld };
        if (insertInGroup)
          recsToInsertInGroup.push(dbTest);
        else {
          try {
            await dbTestModel.create(dbTest);
          } catch (error) {
            msgsResult.push(`erro no registro ${item}, key ${key}: ${error.message}`);
          }
        }
      }

      if (insertInGroup) {
        try {
          //csl({ recsToInsertInGroup });
          const result = await dbTestModel.insertMany(recsToInsertInGroup, { ordered: false });
          //csl({ result });
        } catch (error) {
          msgsResult.push(`erro no insertMany: ${error.message}`);
          error.writeErrors.forEach((x) => msgsResult.push(`- registro ${x.err.index}, key ${x.err.op.key}: ${x.err.errmsg}`));
          //error.writeErrors.forEach((x) => csl({x}));
          //csl('error', JSON.stringify(error, null, 2));
        }
      }

      msgsResult.length == 0 && msgsResult.push('tudo ocorreu sem erros');
      msgsResult.push(`tempo para as opera????es no db: ${calcExecTime.elapsedMs()}ms`);
      resumoApi.jsonData({ value: msgsResult });
    }
    else if (parm.cmd == CmdApi_Playg.testDbRead) {
      const calcExecTime = new CalcExecTime();
      const collection = parm.collection;
      const otherDatabase = parm.otherDatabase;
      if (otherDatabase && UriDb('other') == null)
        throw new Error('database "other" n??o configurado');

      const dbTestModel = DbTestModelX(collection, otherDatabase ? 'other' : undefined);
      const msgsResult: string[] = [];

      await dbTestModel.findOne({});

      msgsResult.length == 0 && msgsResult.push('tudo ocorreu sem erros');
      msgsResult.push(`tempo para as opera????es no db: ${calcExecTime.elapsedMs()}ms`);
      resumoApi.jsonData({ value: msgsResult });
    }

    else if (parm.cmd == CmdApi_Playg.testDbReset) {
      const collection = parm.collection;
      const otherDatabase = parm.otherDatabase;
      if (otherDatabase && UriDb('other') == null)
        throw new Error('database "other" n??o configurado');
      const dbTestModel = DbTestModelX(collection, otherDatabase ? 'other' : undefined);
      const msgsResult: string[] = [];
      try {
        await dbTestModel.collection.drop();
        msgsResult.push('ok');
      } catch (error) {
        msgsResult.push(`erro em ${parm.cmd}: ${error.message}`);
      }
      resumoApi.jsonData({ value: msgsResult });
    }

    else if (parm.cmd == CmdApi_Playg.testApiCalls) {
      const calcExecTime = new CalcExecTime();
      const idProc = parm.idProc;
      const tipoExec = parm.tipoExec.toUpperCase();
      const toDo = parm.toDo.toUpperCase();
      const sleepMs = NumberOrDef(parm.sleepMs, 0);
      const qtd = NumberOrDef(parm.qtd, 0);
      const forceErrPswMail = NumberOrDef(parm.forceErrPswMail, 0);
      const forceErrToutMail = NumberOrDef(parm.forceErrToutMail, 0);
      const dontWaitPromise = NumberOrDef(parm.dontWaitPromise, 0);
      const serverMsg = parm.serverMsg;
      if (serverMsg) {
        const agora = new Date();
        await SystemMsgSvrASync(CategMsgSystem.error, 'testeSvr1', `erro svr ${HoraDebug(agora)}`, ctrlApiExec);
        await SystemMsgSvrASync(CategMsgSystem.alert, 'testeSvr2', `alerta svr ${HoraDebug(agora)}`, ctrlApiExec);
        await SystemMsgSvrASync(CategMsgSystem.warn, 'testeSvr3', `warn svr ${HoraDebug(agora)}`, ctrlApiExec);
      }
      dbgX(3, 'params:', JSON.stringify(parm));
      const forceErrorsMail = (index: number) => ({
        forceErrPsw: index == forceErrPswMail,
        forceErrTO: index == forceErrToutMail,
      });
      const info = `proc: ${idProc}, tipoExec: ${tipoExec}, toDo: ${toDo}, sleepMs: ${sleepMs}`;
      dbgX(1, `${info} --------- `);

      for (let item = 1; item <= qtd; item++) {
        const textItem = `${info} - nr ${item}`;
        let procIndex = `${idProc}-${item}`;
        const junkData: Junk = { key: `${idProc}-${item}`, date: agora, textField: textItem };
        const dontWaitPromiseNow = item == dontWaitPromise;
        dbgX(1, `${procIndex} - item startado`);
        const sendEmailParams = { to: sysEmailSupport, subject: textItem, ...forceErrorsMail(item) } as SendEmailParams;
        const logFnMail = async (resultOk, resultError) => await SentMessageLogASync({ userId: null, type: 'email', target: sysEmailSupport, message: sendEmailParams.subject }, resultOk, resultError, ctrlApiExec);
        if (tipoExec == 'N') {
          if (toDo == 'M' || toDo == 'MD') {
            const calcExecTimeItem = new CalcExecTime();
            await SleepMsDev(sleepMs, ctrlApiExec.context());
            try {
              const sendMail = await SendMailASync(sendEmailParams, ctrlApiExec.context(), null, logFnMail);
              dbgX(1, `mail ${procIndex} - ok ${calcExecTimeItem.elapsedMs()}ms: ${sendMail.resultOk}`);
            } catch (error) {
              dbgX(1, `mail ${procIndex} - erro ${calcExecTimeItem.elapsedMs()}ms: `, error.message);
            }
          }
          if (toDo == 'D' || toDo == 'MD') {
            const calcExecTimeItem = new CalcExecTime();
            await SleepMsDev(sleepMs, ctrlApiExec.context());
            try {
              await JunkModel.create(junkData);
              dbgX(1, `db ${procIndex} - ok ${calcExecTimeItem.elapsedMs()}ms`);
            } catch (error) {
              dbgX(1, `db ${procIndex} - erro ${calcExecTimeItem.elapsedMs()}ms: `, error.message);
            }
          }
        }
        else if (tipoExec == 'P') {
          if (dontWaitPromiseNow)
            procIndex += 'dw';
          const forceSleep = async (proc: () => any) => {
            await SleepMsDev(sleepMs, ctrlApiExec.context());
            return await proc();
          };
          if (toDo == 'M' || toDo == 'MD') {
            const calcExecTimeItem = new CalcExecTime();
            const promise = forceSleep(() => SendMailASync(sendEmailParams, ctrlApiExec.context(), null, logFnMail))
              .then((sendMail) => { dbgX(1, `mail ${procIndex} - ok ${calcExecTimeItem.elapsedMs()}ms: ${sendMail.resultOk}`); return 'ok'; })
              .catch((error) => { dbgX(1, `mail ${procIndex} - erro ${calcExecTimeItem.elapsedMs()}ms: `, error.message); return 'error'; });
            if (!dontWaitPromiseNow)
              NewPromiseExecUntilResponse(promise, procIndex);
          }
          if (toDo == 'D' || toDo == 'MD') {
            const calcExecTimeItem = new CalcExecTime();
            const promise = forceSleep(() => JunkModel.create(junkData))
              .then(() => { dbgX(1, `db ${procIndex} - ok ${calcExecTimeItem.elapsedMs()}ms`); return 'ok'; })
              .catch((error) => { dbgX(1, `db ${procIndex} - erro ${calcExecTimeItem.elapsedMs()}ms: `, error.message); return 'error'; });
            if (!dontWaitPromiseNow)
              NewPromiseExecUntilCloseDb(promise, procIndex);
          }
        }
        else if (tipoExec == 'A') {
          if (toDo == 'M' || toDo == 'MD') {
            const calcExecTimeItem = new CalcExecTime();
            try {
              await SendEmailAsyncApiNew(sendEmailParams, ctrlApiExec, sleepMs);
              dbgX(1, `mail ${procIndex} - ok ${calcExecTimeItem.elapsedMs()}ms`);
            } catch (error) {
              dbgX(1, `mail ${procIndex} - erro ${calcExecTimeItem.elapsedMs()}ms: `, error.message);
            }
          }
          if (toDo == 'D' || toDo == 'MD') {
            const calcExecTimeItem = new CalcExecTime();
            try {
              await GravaDbTestAsyncApiNew(junkData, `${idProc}-${item}`, ctrlApiExec, sleepMs);
              dbgX(1, `db ${procIndex} - ok ${calcExecTimeItem.elapsedMs()}ms`);
            } catch (error) {
              dbgX(1, `db ${procIndex} - erro ${calcExecTimeItem.elapsedMs()}ms: `, error.message);
            }
          }
        }
        else
          dbgX(2, `tipoExec ${tipoExec} n??o previsto`);

        if (!(toDo == 'M' || toDo == 'D' || toDo == 'MD'))
          dbgX(2, `toDo ${toDo} n??o previsto`);

        dbgX(2, `${procIndex} - tempo parcial ${calcExecTime.elapsedMs()}ms `);
      }

      const elapsed = calcExecTime.elapsedMs();
      dbgX(1, `${idProc} finalizado: (${elapsed}ms) ******** `);
      resumoApi.jsonData({ value: `${idProc} - api exec ${elapsed} ms` });
    }

    else if (parm.cmd == CmdApi_Playg.wait) {
      resumoApi.jsonData({ horaFim: HoraDebug(), parm });
    }
    else if (parm.cmd == CmdApi_Playg.cookieHttpNormal) {
      // cookieName: cookieHttpName, cookieValue: cookieHttpValue      
      const result: IGenericObject = {};
      if (parm.cmdCookie == 'set')
        cookieHttp.set(res, parm.name, parm.value, { sameSite: 'none', secure: true });
      else if (parm.cmdCookie == 'remove')
        cookieHttp.remove(res, parm.name, { sameSite: 'none', secure: true });
      else if (parm.cmdCookie == 'get')
        result.value = cookieHttp.get(req, parm.name);
      else if (parm.cmdCookie == 'getall')
        result.allCookies = cookieHttp.getAll(req);
      resumoApi.jsonData({ horaFim: HoraDebug(), parm, value: result });
    }
    else if (parm.cmd == CmdApi_Playg.cookieHttpCrypto) {
      const httpCryptoCookieConfig: HttpCryptoCookieConfig = {
        name: parm.name,
        TTLSeconds: 30 * 24 * 60 * 60,
        psw: parm.psw == '' ? '123456789012345678901234567890ab' : parm.psw, // minimo de 32
      };
      const result: IGenericObject = {};
      if (parm.cmdCookie == 'set')
        await HttpCriptoCookieCmdASync(ctrlApiExec, parm.cmdCookie, httpCryptoCookieConfig, 'set', { domain: EnvDeployConfig().domain }, parm.value);
      else if (parm.cmdCookie == 'remove')
        await HttpCriptoCookieCmdASync(ctrlApiExec, parm.cmdCookie, httpCryptoCookieConfig, 'set', { domain: EnvDeployConfig().domain }, null);
      else if (parm.cmdCookie == 'get')
        result.value = await HttpCriptoCookieCmdASync(ctrlApiExec, parm.cmdCookie, httpCryptoCookieConfig, 'get', { domain: EnvDeployConfig().domain });
      resumoApi.jsonData({ horaFim: HoraDebug(), parm, value: result });
    }
    else if (parm.cmd == CmdApi_Playg.envs) {
      const result = {
        app: {},
        others: {},
        npm: {},
        aws: {},
        vercel: {},
        netlify: {},
      };
      for (const key in process.env) {
        const keyUpper = key.toUpperCase();
        if (keyUpper.startsWith('NPM_'))
          result.npm[key] = process.env[key];
        else if (keyUpper.startsWith('AWS_'))
          result.aws[key] = process.env[key];
        else if (keyUpper.startsWith('VERCEL_'))
          result.vercel[key] = process.env[key];
        else if (keyUpper.startsWith('NETLIFY_'))
          result.netlify[key] = process.env[key];
        else if (keyUpper.startsWith('SITE_') ||
          keyUpper.startsWith('NEXT_PUBLIC_') ||
          keyUpper == 'NODE_ENV')
          result.app[key] = process.env[key];
        else
          result.others[key] = process.env[key];
      }
      resumoApi.jsonData({ horaFim: HoraDebug(), parm, value: result });
    }

    else if (parm.cmd == CmdApi_Playg.forceHttpStatus) {
      const idProc = parm.idProc;
      const httpStatus = parm.httpStatus;
      const isAsync = parm.isAsync;
      if (isAsync) {
        await AsyncProcForceHttpStatusNew(httpStatus, idProc, ctrlApiExec);
        resumoApi.jsonData({ value: 'startado' });
      }
      else {
        if (httpStatus == HttpStatusCode.ok)
          resumoApi.jsonData({ value: 'valor ok' });
        else if (httpStatus == HttpStatusCode.unexpectedError)
          throw new Error(`Error ${httpStatus}.`);
        else
          throw new ErrorPlus(`ErrorPlus ${httpStatus}.`, { httpStatusCode: httpStatus });
      }
    }

    else if (parm.cmd == CmdApi_Playg.switchForceCloseDb) {
      const result = SwitchForceCloseDb();
      resumoApi.jsonData({ value: `force close ${result}` });
    }

    else if (parm.cmd == CmdApi_Playg.parallelNotify) {
      const calcExecTime = new CalcExecTime();
      const idProc = parm.idProc;

      let seq = 0;
      const promiseTst: promiseCtrl[] = [];
      promiseTst.push({ point: `mensagem ${idProc}-${++seq}`, promise: NotifyAdmASync(`mensagem ${idProc}-${seq}`, HoraDebug(), ctrlApiExec) });
      promiseTst.push({ point: `mensagem ${idProc}-${++seq}`, promise: NotifyAdmASync(`mensagem ${idProc}-${seq}`, HoraDebug(), ctrlApiExec) });
      promiseTst.push({ point: `mensagem ${idProc}-${++seq}`, promise: NotifyAdmASync(`mensagem ${idProc}-${seq}`, HoraDebug(), ctrlApiExec) });
      promiseTst.push({ point: `mensagem ${idProc}-${++seq}`, promise: NotifyAdmASync(`mensagem ${idProc}-${seq}`, HoraDebug(), ctrlApiExec) });
      promiseTst.push({ point: `mensagem ${idProc}-${++seq}`, promise: NotifyAdmASync(`mensagem ${idProc}-${seq}`, HoraDebug(), ctrlApiExec) });

      await Promise.all(promiseTst.map(x => x.promise
        .then(data => dbgX(2, `'${x.point}' ok:`, data))
        .catch(error => dbgX(2, `'${x.point}' err:`, error.message))));

      csd('fim *********');

      const elapsed = calcExecTime.elapsedMs();
      dbgX(1, `${idProc} finalizado: (${elapsed}ms) ********************************* `);
      resumoApi.jsonData({ value: `${idProc} - tempo total ${elapsed} ms` });
    }


    else
      throw new Error(`cmd '${parm.cmd}' n??o previsto`);
  }
  catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }

  //if (req.query.noclose !== 's')
  if (UriDb()) await CloseDbASync({ ctrlApiExec });
  if (UriDb('other')) await CloseDbASync({ ctrlApiExec, database: 'other' });
  resumoApi.json();
}