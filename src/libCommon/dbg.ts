import { globals } from '../libClient/clientGlobals';

import { isAmbDev, isVercelHost } from '../app_base/envs';

import { colorsDbg, colorErr, colorWarn, colorInfo, colorX } from './consoleColor';
import { OnClient, OnServer } from './sideProc';
import { CtrlContext } from './ctrlContext';
import { HoraForLog } from './util';

const colorAllowed = () => OnClient() || !isVercelHost();

export function console_log(...params) {
  // eslint-disable-next-line no-console
  console.log(...params);
}

// https://www.addictivetips.com/android/get-web-console-log-chrome-for-android/  
export function csd(...params) {
  if (dbgShow()) {
    // if (params.length === 1 && typeof params[0] === 'object')
    //   console_log(JSON.stringify(params[0], null, 2), `csdX ${HoraDebug()}`); // @!!!!!!
    // else
    console_log(...params, `csd ${HoraForLog()}`);
  }
}
export function csl(...params) {
  console_log(...params, `csl ${HoraForLog()}`);
}

export function dbgError(point: string, msg1: string, ...params) {
  if (dbgShow())
    console_log(colorErr(`${HoraForLog()} error-${point}`), msg1, ...params);
}
export function dbgWarn(point: string, msg1: string, ...params) {
  if (dbgShow())
    console_log(colorWarn(`${HoraForLog()} warn-${point}`), msg1, ...params);
}
export function dbgInfo(point: string, msg1: string, ...params) {
  if (dbgShow())
    console_log(colorInfo(`${HoraForLog()} info-${point}`), msg1, ...params);
}
export interface IConfigDbg {
  level: number;
  scopeMsg?: ScopeDbg;
  ctrlContext?: CtrlContext;
  point?: string;
  colorMsg?: number;
}

export const colorsMsg = {
  lock: 6,
  elapsedWarn: 1,
  elapsedAlert: 2,
};
// sem destaque
// 'context' tem um tratamento especial, uma largura minima para que fique bem visivel no log
export function dbg(config: IConfigDbg, ...params) {
  dbgProc(config, ...params);
}
export function dbgTest() {
  const obj = { a: 11, b: 'bbbbbb' };
  dbgError('ponto1', 'mensagem erro', obj);
  dbgWarn('ponto2', 'mensagem warn', obj);
  dbgInfo('ponto3', 'mensagem info', obj);
  for (let colorDbg = 0; colorDbg < colorsDbg.length; colorDbg++)
    dbg({ level: 0, colorMsg: colorDbg }, `colorDbg ${colorDbg}`);
}

const dispContextLen = 40;

//const ctrlRecursion = new CtrlRecursion('dbg', 3); // dá pau !!

export function devContextCli() {
  return isAmbDev() || globals?.cookieDevContext === true || globals?.isDevUser === true;
}
function dbgShow() {
  return OnServer() || devContextCli();
}

function dbgProc(config: IConfigDbg, ...params): void {
  //ctrlRecursion.in();
  if (!dbgShow()) return;

  const levelDbg = config.level || 0;
  let levelMinShow = 0;
  let scopesShow = '';

  if (config?.ctrlContext?.ctrlLog != null) {
    const { ctrlLogLevel, ctrlLogScopes } = CtrlContext.ProcCtrlLogStr(config.ctrlContext.ctrlLog);
    levelMinShow = ctrlLogLevel;
    scopesShow = ctrlLogScopes;
  }

  const scopeMsg = config.scopeMsg || ScopeDbg.x;

  const colorContext = colorAllowed() ? (config.ctrlContext?.colorContext || 0) : 0;
  const colorMsg = colorAllowed() ? (config.colorMsg || colorContext) : 0;
  try {
    let prefixDbg = '';
    if (scopeMsg == ScopeDbg.a) prefixDbg = 'dA';
    else if (scopeMsg == ScopeDbg.d) prefixDbg = 'dD';
    else if (scopeMsg == ScopeDbg.e) prefixDbg = 'dE';
    else if (scopeMsg == ScopeDbg.x) prefixDbg = 'dX';
    else prefixDbg = 'dX';
    prefixDbg += `${levelDbg}`;

    if (config.ctrlContext?.context != null) {
      prefixDbg += `:${config.ctrlContext.context}`;
      prefixDbg = (prefixDbg + '===').padEnd(dispContextLen, '=');
    }
    if (config?.point != null)
      prefixDbg += ` >${config?.point}`;

    //if (NivelLog(config.levelScope || ScopeDbg.x) >= level) {
    if (levelDbg === 0 ||
      (levelDbg <= levelMinShow && scopesShow.includes(scopeMsg))) {
      const contextDisp = ''; //config.ctrlContext?.context != null ? ' ' + (config.ctrlContext.context + '===').padEnd(dispContextLen, '=') : '';
      //const paramsDisp = params.filter(x => x != null);
      const colorContextUse = colorContext % colorsDbg.length;
      const colorMsgUse = colorMsg % colorsDbg.length;
      //console_log(colorsDestaq[colorUse](HoraCsl()), `${prefixDbg}${contextDisp}`, ...params);
      if (OnClient())
        console_log(colorX(colorsDbg[colorMsgUse], `${HoraForLog()} ${prefixDbg}${contextDisp}`), ...params);
      else
        console_log(colorX(colorsDbg[colorContextUse], HoraForLog()), colorX(colorsDbg[colorMsgUse], `${prefixDbg}${contextDisp}`), ...params);
    }
  } catch (error) {
    console_log('dbgProc', error.message);
  }
  //ctrlRecursion.out();
}

export enum ScopeDbg {
  a = 'a', // api
  d = 'd', // db
  e = 'e', // email
  x = 'x', // outros
}

// let nivelLogA = null;
// let nivelLogD = null;
// let nivelLogE = null;
// let nivelLogT = null;
// let nivelLogX = null;
// export function NivelLog(scope: ScopeDbg): number {
//   if (scope == ScopeDbg.a) { if (nivelLogA == null) nivelLogA = (EnvNivelLog() || {}).api || 0; return nivelLogA; }
//   else if (scope == ScopeDbg.d) { if (nivelLogD == null) nivelLogD = (EnvNivelLog() || {}).db || 0; return nivelLogD; }
//   else if (scope == ScopeDbg.e) { if (nivelLogE == null) nivelLogE = (EnvNivelLog() || {}).email || 0; return nivelLogE; }
//   else if (scope == ScopeDbg.t) { if (nivelLogT == null) nivelLogT = (EnvNivelLog() || {}).test || 0; return nivelLogT; }
//   else if (scope == ScopeDbg.x) { if (nivelLogX == null) nivelLogX = (EnvNivelLog() || {}).commom || 0; return nivelLogX; }
//   else return 0;
// }
// export function SetNivelLog(nivelLogNew, scope: ScopeDbg): void {
//   if (scope == ScopeDbg.a) { if (nivelLogNew != null && nivelLogNew != nivelLogA) { nivelLogA = nivelLogNew; } }
//   else if (scope == ScopeDbg.d) { if (nivelLogNew != null && nivelLogNew != nivelLogD) { nivelLogD = nivelLogNew; } }
//   else if (scope == ScopeDbg.e) { if (nivelLogNew != null && nivelLogNew != nivelLogE) { nivelLogE = nivelLogNew; } }
//   else if (scope == ScopeDbg.t) { if (nivelLogNew != null && nivelLogNew != nivelLogT) { nivelLogT = nivelLogNew; } }
//   else if (scope == ScopeDbg.x) { if (nivelLogNew != null && nivelLogNew != nivelLogX) { nivelLogX = nivelLogNew; } }
// }
