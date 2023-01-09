import { EnvNivelLog } from '../libCommon/envs';

import { globals } from '../libClient/clientGlobals';

import { isAmbDev } from './isAmb';
import { colorsDestaq, colorErr, colorWarn, colorInfo, colorX } from './consoleColor';
import { CalcExecTime, HoraDebug, isPlataformVercel, OnClient, OnServer } from './util';

const colorAllowed = () => OnClient() || !isPlataformVercel();

function HoraLog() {
  return HoraDebug();
}

export function dbgNotifyAdm(...params) {
  if (dbgShow())
    console.log(colorErr(HoraLog() + ' notifyAdm'), ...params);
}

// let calcExecTime: CalcExecTime = null, lastElapsed = 0;
// export function cst(point?: string, showAlways = false) {
//   if (point == null ||
//     calcExecTime == null) {
//     calcExecTime = new CalcExecTime();
//     lastElapsed = 0;
//     console.log('cst timer started ***********');
//   }
//   if (point != null && dbgShow()) {
//     const elapsed = calcExecTime.elapsedMs();
//     const gap = elapsed - lastElapsed;
//     if (showAlways || gap > 1000)
//       console.log(point, `cst tot ${elapsed}ms, gap ${gap}ms ${gap > 1000 ? '- !!!' : ''}`);
//     lastElapsed = elapsed;
//   }
// }

// @!!!!!!! opção para gravar em arquivo, se for server
export function csd(...params) { // console.log (debug, apenas para o contexto onde pode ser visto a informação)
  if (dbgShow()) {
    // if (params.length === 1 && typeof params[0] === 'object')
    //   console.log(JSON.stringify(params[0], null, 2), `csdX ${HoraDebug()}`); // @!!!!!!
    // else
    console.log(...params, `csd ${HoraDebug()}`);
  }
}
export function csl(...params) { // console.log (tudo)
  console.log(...params, `csl ${HoraDebug()}`);
}

export function dbgError(...params) {
  if (dbgShow())
    console.log(colorErr(HoraLog() + ' dbgError'), ...params);
}
export function dbgWarn(...params) {
  if (dbgShow())
    console.log(colorWarn(HoraLog() + ' dbgWarn'), ...params);
}
export function dbgInfo(...params) {
  if (dbgShow())
    console.log(colorInfo(HoraLog() + ' dbgInfo'), ...params);
}
export interface ConfigDbg { level?: number; levelScope?: ScopeDbg; context?: string; color?: number }

// sem destaque
// 'context' tem um tratamento especial, uma largura minima para que fique bem visivel no log
export function dbg(config: ConfigDbg, ...params) {
  dbgProc(config, ...params);
}
export function dbgTest() {
  const obj = { a: 11, b: 'bbbbbb' };
  dbgError('ponto1', 'mensagem erro', obj);
  dbgWarn('ponto2', 'mensagem warn', obj);
  dbgInfo('ponto3', 'mensagem info', obj);
  for (let color = 0; color < colorsDestaq.length + 1; color++)
    dbg({ color }, `color destaq ${color}`);
}

const dispContextLen = 30;

//const ctrlRecursion = new CtrlRecursion('dbg', 3); // dá pau !!

/**
 * Ativa o modo de prototipação (escolha de temas, fontes, etc)
 * @returns apenas se definido or ambiente ou para o device ou para o usuario
 */
export function userIsDev() {
  return isAmbDev() || globals?.loggedUserIsDev === true;
}

export function dbgShowCli() {
  return isAmbDev() || globals?.loggedUserIsDev === true || globals?.cookieDbgShow === true;
}
function dbgShow() {
  return OnServer() || dbgShowCli();
}

function dbgProc(config: ConfigDbg, ...params): void {
  //ctrlRecursion.in();
  if (!dbgShow())
    return;

  const level = config.level || 0;
  const color = colorAllowed() ? (config.color || 0) : 0;
  try {
    let prefixDbg = '';
    if (config.levelScope == ScopeDbg.a) prefixDbg = 'dA';
    else if (config.levelScope == ScopeDbg.d) prefixDbg = 'dD';
    else if (config.levelScope == ScopeDbg.e) prefixDbg = 'dE';
    else if (config.levelScope == ScopeDbg.t) prefixDbg = 'dT';
    else if (config.levelScope == ScopeDbg.x) prefixDbg = 'dX';
    else prefixDbg = 'dX';
    prefixDbg += `${level}`;

    if (NivelLog(config.levelScope || ScopeDbg.x) >= level) {
      const contextDisp = config.context != null ? ' ' + (config.context + '===').padEnd(dispContextLen, '=') : '';
      //const paramsDisp = params.filter(x => x != null);
      if (color === 0)
        console.log(HoraLog(), `${prefixDbg}${contextDisp}`, ...params);
      else {
        const colorUse = (color - 1) % colorsDestaq.length;
        //console.log(colorsDestaq[colorUse](HoraLog()), `${prefixDbg}${contextDisp}`, ...params);
        console.log(colorX(colorsDestaq[colorUse], HoraLog()), `${prefixDbg}${contextDisp}`, ...params);
      }
    }
  } catch (error) {
    console.log('dbgProc', error.message);
  }
  //ctrlRecursion.out();
}

export enum ScopeDbg {
  a = 'api',
  d = 'db',
  e = 'email',
  t = 'temp', // apenas durante o desenvolvimento e teste de alguma lógica, polui muito, evitar !
  x = 'geral',
}

let nivelLogA = null;
let nivelLogD = null;
let nivelLogE = null;
let nivelLogT = null;
let nivelLogX = null;
export function NivelLog(scope: ScopeDbg): number {
  if (scope == ScopeDbg.a) { if (nivelLogA == null) nivelLogA = (EnvNivelLog() || {}).api || 0; return nivelLogA; }
  else if (scope == ScopeDbg.d) { if (nivelLogD == null) nivelLogD = (EnvNivelLog() || {}).db || 0; return nivelLogD; }
  else if (scope == ScopeDbg.e) { if (nivelLogE == null) nivelLogE = (EnvNivelLog() || {}).email || 0; return nivelLogE; }
  else if (scope == ScopeDbg.t) { if (nivelLogT == null) nivelLogT = (EnvNivelLog() || {}).test || 0; return nivelLogT; }
  else if (scope == ScopeDbg.x) { if (nivelLogX == null) nivelLogX = (EnvNivelLog() || {}).commom || 0; return nivelLogX; }
  else return 0;
}
export function SetNivelLog(nivelLogNew, scope: ScopeDbg): void {
  if (scope == ScopeDbg.a) { if (nivelLogNew != null && nivelLogNew != nivelLogA) { nivelLogA = nivelLogNew; } }
  else if (scope == ScopeDbg.d) { if (nivelLogNew != null && nivelLogNew != nivelLogD) { nivelLogD = nivelLogNew; } }
  else if (scope == ScopeDbg.e) { if (nivelLogNew != null && nivelLogNew != nivelLogE) { nivelLogE = nivelLogNew; } }
  else if (scope == ScopeDbg.t) { if (nivelLogNew != null && nivelLogNew != nivelLogT) { nivelLogT = nivelLogNew; } }
  else if (scope == ScopeDbg.x) { if (nivelLogNew != null && nivelLogNew != nivelLogX) { nivelLogX = nivelLogNew; } }
}