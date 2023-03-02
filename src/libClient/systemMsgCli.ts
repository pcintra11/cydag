import { apisBase } from '../base/endPoints';

import { AssertIsClient, CtrlRecursion } from '../libCommon/util';
import { colorAlert, colorErr, colorWarn } from '../libCommon/consoleColor';
import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';
import { csd, dbgError, dbgShowCli } from '../libCommon/dbg';

import { CallApiCliASync } from '../fetcher/fetcherCli';

import { globals } from './clientGlobals';

const _ctrlRecursion: { func: string, ctrlRecursion: CtrlRecursion }[] = [];
const GetCtrlRecursion = (func: string) => {
  let item = _ctrlRecursion.find((x) => x.func == func);
  if (item == null)
    _ctrlRecursion.push(item = { func, ctrlRecursion: new CtrlRecursion(`SystemMsgCli->${func}`, 10) });  // pode haver muitos disparos assincronos (sem await)
  return item.ctrlRecursion;
};

export async function SystemMsgCli(categMsgSystem: CategMsgSystem, point: string, msg: string, details: object = null) {
  //csl('SystemMsgCli', msg);
  const ctrlRecursion = GetCtrlRecursion('SystemMsgCli');
  if (ctrlRecursion.inExceeded(msg)) return;
  const showInClientUse = dbgShowCli();
  AssertIsClient('SystemMsgCli', { categMsgSystem, point, msg, details });
  if (typeof msg != 'string')
    csd(colorErr(`**************** typeof msg ${typeof msg}`));
  if (details != null &&
    typeof details != 'object')
    csd(colorErr(`**************** typeof details ${typeof details}`));
  if (showInClientUse) {
    const txt = `*** sys-${categMsgSystem} - ${point} - ${msg}`;
    if (categMsgSystem == CategMsgSystem.error)
      csd(colorErr(txt));
    else if (categMsgSystem == CategMsgSystem.alert)
      csd(colorAlert(txt));
    else
      csd(colorWarn(txt));
  }
  const send = {
    //horaClient: new Date(),
    categ: categMsgSystem,
    point,
    msg,
    details,
  };
  try {
    CallApiCliASync(apisBase.logSystemMsgClient.apiPath, globals.windowId, send, { fetchAndForget: true });
    //dbg({ level: 1 }, 'logSystemMsgClient executada com sucesso');
  } catch (error) {
    dbgError(`SystemMsgCli error: ${error.message}`);
  }
  ctrlRecursion.out();
}