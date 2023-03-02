import { NotifyAdmASync } from '../base/notifyAdm';
import { SystemLog } from '../base/db/types';
import { CloseDbASync, ConnectDbASync, UriDb } from '../base/db/functions';
import { SystemLogModel } from '../base/db/models';

import { Env } from '../libCommon/envs';
import { dbgError, ScopeDbg, NivelLog, csd } from '../libCommon/dbg';
import { colorAlert, colorErr } from '../libCommon/consoleColor';
import { CtrlRecursion } from '../libCommon/util';
import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';

import { CtrlApiExec } from './util';

const scopeServer = 'svr';
const scopeClient = 'cli';

const _ctrlRecursion: { func: string, ctrlRecursion: CtrlRecursion }[] = [];
const GetCtrlRecursion = (func: string) => {
  let item = _ctrlRecursion.find((x) => x.func == func);
  if (item == null)
    _ctrlRecursion.push(item = { func, ctrlRecursion: new CtrlRecursion(`systemMsgSvr->${func}`, 10) });
  return item.ctrlRecursion;
};

// interface CtrlMsgs {
//   categ: CategMsgSystem;
//   points: object;
//   excluded: number;
// }
// const ctrlLogs = {
//   ctrlErrors: <CtrlMsgs>{ categ: CategMsgSystem.error, points: {}, excluded: 0 },
//   ctrlWarnings: <CtrlMsgs>{ categ: CategMsgSystem.warn, points: {}, excluded: 0 },
// };

// const countCicloNotify = 5;
// const nrBlocksMax = 10;

export async function SystemMsgSvrASync(categMsgSystem: CategMsgSystem, point: string, msg: string, ctrlApiExec: CtrlApiExec, details: object = undefined) { // vercel precisa sempre de await !
  //await NewOperASync(_systemMsg(scopeServer, point, msg, details, ctrlLogs.ctrlErrors), 'SystemError');
  await _systemMsg(categMsgSystem, scopeServer, point, msg, ctrlApiExec, details);
}

export async function _SystemMsgSvrFromClientASync(categMsgSystem: CategMsgSystem, point: string, msg: string, ctrlApiExec: CtrlApiExec, details: object) {
  await _systemMsg(categMsgSystem, scopeClient, point, msg, ctrlApiExec, details);
}

const prefixMsgAll = 'sys';

let seqMsgCtr = 0;
async function _systemMsg(categMsgSystem: CategMsgSystem, scope: string, point: string, msg: string, ctrlApiExec: CtrlApiExec, details: object) { // object??
  const ctrlRecursion = GetCtrlRecursion('_systemMsg');
  if (ctrlRecursion.inExceeded(msg)) return;

  const context = ctrlApiExec.context() + `-sysMsg(${++seqMsgCtr})`;

  let dbOpened = false;
  if (UriDb() != null) {
    try {
      await ConnectDbASync({ context });
      dbOpened = true;
    } catch (error) {
      dbgError('_systemMsg ConnectDbASync error', error.message);
    }
  }

  if (typeof msg != 'string')
    csd(colorErr(`**************** typeof msg ${typeof msg}`));
  if (details != null &&
    typeof details != 'object')
    csd(colorErr(`**************** typeof details ${typeof details}`));

  const mainMsg = `${prefixMsgAll}-${categMsgSystem}(${scope}) - ${ctrlApiExec.apiPath} - ${point}`;
  const consolePrint = `${mainMsg} - ${msg}`;

  //if (scope === scopeServer) {
  //const componentsLog = [];
  if (categMsgSystem === CategMsgSystem.error)
    csd(colorErr(consolePrint));
  else if (categMsgSystem === CategMsgSystem.alert)
    csd(colorAlert(consolePrint));
  // else //if (ctrlMsgs.categ === categWarning)
  //   csl(colorWarn(txt));
  if (NivelLog(ScopeDbg.x) >= 3 &&
    details != null)
    csd('details', details);
  //}

  //dbg(3, dbgContext, `ini (${point} / ${msg})`);
  // if (_systemMsg.in == null)
  //   _systemMsg.in = 0;
  // if (_systemMsg.in > 0) {
  //   csl(`_systemMsg recursiva ${_systemMsg.in} ${point} / ${msg}`);
  //   return;
  // }
  // _systemMsg.in++;
  // csl(`_systemMsg ini ${_systemMsg.in} ${point} / ${msg}`);
  try {

    // // evita que um email de um mesmo motivo seja enviado várias vezes
    // let ctrlPoints = ctrlMsgs.points[point];
    // if (!ctrlPoints)
    //   ctrlPoints = ctrlMsgs.points[point] = { arMsg: [], excluded: 0 };

    // ctrlPoints.arMsg.push(msg);

    // mudar o metodo para o controle por tempo, uma tabela apenas com uma ocorrencia por 'ponto', verificar qual o ultimo evento
    if (categMsgSystem === CategMsgSystem.error ||
      categMsgSystem === CategMsgSystem.alert) {
      //csl('error - pre notifyAdm async'); 
      //NotifyAdm(`${Env('amb')} (${scope}) - ${point} - Error`, msg);
      await NotifyAdmASync(mainMsg, msg, ctrlApiExec, details);

      //csl('error - pos notifyAdm async');
      //   // if (ctrlPoints.arMsg.length == 1)
      //   //   NotifyAdm(scope, point, ctrlMsgs, msg, details);
      //   // else {
      //   //   if ((ctrlPoints.arMsg.length % countCicloNotify) == 0)
      //   //     NotifyAdm(scope, point, ctrlMsgs, `${ctrlPoints.arMsg.length + ctrlPoints.excluded} msgs`);
      //   //   else
      //   //     csl(`NotifyAdm não executado, msgsAcum ${ctrlPoints.arMsg.length}`);
      //   //   if (ctrlPoints.arMsg.length >= (countCicloNotify * (nrBlocksMax + 1))) {
      //   //     const nrMsgsExcluidas = ctrlPoints.arMsg.length - (countCicloNotify * nrBlocksMax);
      //   //     ctrlPoints.arMsg.splice(0, nrMsgsExcluidas);
      //   //     ctrlPoints.excluded += nrMsgsExcluidas;
      //   //     NotifyAdm(scope, point, ctrlMsgs, `remoção de ${nrMsgsExcluidas} itens (${ctrlPoints.excluded} no total). Agora com ${ctrlPoints.arMsg.length}`);
      //   //   }
      //   // }
    }

    //dbg(3, dbgContext, `pos Notify`);

    const fields: SystemLog = {
      //app: Env('appName'),
      appVersion: Env('appVersion'),
      //appDomain: Env('appUrl_hostDomain'),
      date: new Date(),
      scope,
      categ: categMsgSystem,
      point,
      msg,
      details,
    };

    // aqui, se for chamado no 'connection' e antes de estabilizar pode dar erro
    //csl('inserindo logSystem - ini');
    //dbg(nivelLogOpersDbDetail, dbgContext, `LogSystemModel.create - pre`);
    // NewOperAsyncDb(LogSystemModel.create(fields)
    //   .then((x) => dbg(nivelLogOpersDbDetail, dbgContext, `logSystem inserido: (${point} / ${msg})`))
    //   .catch((x) => dbg(0, dbgContext, `logSystem erro ao inserir (${point} / ${msg}): `, x.message)),
    //   'LogSystemModel.create');

    if (dbOpened) {
      //await NewOperASync(LogSystemModel.create(fields), `_systemMsg:${ctrlMsgs.categ}`);
      //dbg({ level: 3, levelScope: ScopeDbg.d, context: 'systemMsg' }, `create-pre`);
      await SystemLogModel.create(fields);
      //dbg({ level: 3, levelScope: ScopeDbg.d, context: 'systemMsg' }, `create-pos`);
      // await NewOperAsyncDb(
      //   (async () => {
      //     dbg(nivelLogOpersDbDetail, dbgContext, `teste 1 - pre`);
      //     await SleepMs(2000);
      //     dbg(nivelLogOpersDbDetail, dbgContext, `teste 1 - pos wait`);
      //     const result = await LogSystemModel.create('fields');
      //     dbg(nivelLogOpersDbDetail, dbgContext, `teste 1 - pos db`);
      //     return result;
      //   })(), 'teste 1');
    }
    // else {
    //   if (UriDb() != null) {
    //     await ConnectDb(dbgContext);
    //     await SystemLogModel.create(fields);
    //     await CloseDb(dbgContext);
    //   }
    // }

    //dbg(nivelLogOpersDbSuccess, dbgContext, `LogSystemModel.create - ok`);
  } catch (error) {
    dbgError(context, `erro em _systemMsg (${point} / ${msg}): `, error.message);
    //csl('dados', JSON.stringify({ point, msg, details, categ: ctrlMsgs.categ, email }, null, 4));
    // throw error;
  }

  // _systemMsg.in--;
  // csl(`_systemMsg fim ${_systemMsg.in} ${point} / ${msg}`);

  if (dbOpened) {
    try {
      await CloseDbASync({ context });
    } catch (error) {
      dbgError('_systemMsg CloseDbASync error', error.message);
    }
  }

  ctrlRecursion.out();
  //dbg(nivelLogOpersDbMedium, 'systemMsg', `endOfFunction`);
}