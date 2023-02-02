import _ from 'underscore';

import { Duration as Duration_dtfns } from 'date-fns';
import format_dtfns from 'date-fns/format';
import formatISO_dtfns from 'date-fns/formatISO';
import parseISO_dtfns from 'date-fns/parseISO';
import compareAsc_dtfns from 'date-fns/compareAsc';

import differenceInDays_dtfns from 'date-fns/differenceInDays';
import differenceInHours_dtfns from 'date-fns/differenceInHours';
import differenceInMinutes_dtfns from 'date-fns/differenceInMinutes';
import differenceInSeconds_dtfns from 'date-fns/differenceInSeconds';
import differenceInMilliseconds_dtfns from 'date-fns/differenceInMilliseconds';

import addSeconds_dtfns from 'date-fns/addSeconds';
import add_dtfns from 'date-fns/add';
//import _ from 'lodash';

import { Env, EnvDeployConfig, EnvSvr } from '../libCommon/envs';

import { isAmbDev } from './isAmb';
import { PageDef } from './endPoints';
import { csd, dbg, dbgError, dbgInfo } from './dbg';
import { IGenericObject } from './types';
import { Portuguese } from './portuguese';

export const dataLimiteTudoLiberado = '20220715'; //@@!!!!!

const utilCtrl = { debug: false };
export const UtilDebug = (debug: boolean) => utilCtrl.debug = debug;

//const CloudinaryInfo = () => '';

//import { ErrorExecApi } from './types-ext';

// export type ResultTy = {
//   error?: string;
//   data?: any;
// }
// export function ResultOk(data: object): ResultTy {
//   return { data };
// }
// export function ResultErr(err: Error | string): ResultTy {
//   //if ( (typeof err) == 'Error') 
//   if (typeof err === 'object')
//     return { error: err.message };
//   else
//     return { error: err };
// }
// export function IsTypeResultApi(obj: any) {
//   if (obj._ctrl_type_ !== _ctrl_type_ResultApiTy)
//     return false;
//   return true;
// }
// export const _ctrl_type_ResultApiTy = '_ctrl_type_ResultApiTy';
// export type ResultApiTy = {
//   _ctrl_type_: '_ctrl_type_ResultApiTy',
//   result: ResultTy,
// }
// export function ResultOkApi(data: object): ResultApiTy {
//   return {
//     _ctrl_type_: _ctrl_type_ResultApiTy,
//     result: ResultOk(data),
//   };
// }
// export function ResultErrApi(error: Error | string): ResultApiTy {
//   return {
//     _ctrl_type_: _ctrl_type_ResultApiTy,
//     result: ResultErr(error),
//   };
// }


export enum HttpStatusCode {
  ok = 200,
  redirect = 300,
  badRequest = 400,
  unAuthorized = 401,
  notFound = 404,
  methodNotAllowed = 405,
  timeOut = 408,
  conflict = 409,
  payloadTooLarge = 413,
  unexpectedError = 500,
  gatewayTimeout = 504,
}

// todos que tem um 'ciclo de vida' que que se resolve no uusário (sem necessidade de atençao do gestor da app)
export const HttpStatusCodeNormais = [HttpStatusCode.ok, HttpStatusCode.redirect, HttpStatusCode.badRequest, HttpStatusCode.notFound];
export class ErrorPlus {
  message: string;  // Friendly sempre pois pode ir para o usuário final !
  _plus: {
    data?: IGenericObject,
    httpStatusCode?: HttpStatusCode,
    managed: boolean,
    logged: boolean,
  };
  constructor(message: string = null, plus: { data?: object, httpStatusCode?: HttpStatusCode, managed?: boolean, logged?: boolean } = {}) {
    message == null && dbgError('ErrorPlus com mensagem nula');
    this.message = message || 'Erro';
    this._plus = { managed: true, logged: false, ...plus };
  }
}
// export function ErrorPlusGet(error: Error | ErrorPlus) {
//   if (error instanceof ErrorPlus)
//     return error._plus;
//   else
//     return null;
// }
export function ErrorPlusData(error: Error | ErrorPlus) {
  if (error instanceof ErrorPlus)
    return error._plus.data || {};
  else
    return {};
}
export function ErrorPlusHttpStatusCode(error: Error | ErrorPlus) {
  if (error instanceof ErrorPlus)
    return error._plus.httpStatusCode || null;
  else
    return null;
}

export function IsErrorManaged(error: Error | ErrorPlus | string) {
  if (typeof error === 'string')
    return true;
  else if (error instanceof ErrorPlus)
    return error._plus.managed;
  else
    return false;
}
export function IsErrorLogged(error: Error | ErrorPlus | string) {
  if (error instanceof ErrorPlus)
    return error._plus.logged;
  else
    return false;
}

export function FriendlyErrorMsgApi(error: Error | ErrorPlus | { message: string }) {
  if (error instanceof ErrorPlus &&
    //error._plus.httpStatusCode != HttpStatusCode.unexpectedError
    error._plus.managed)
    return error.message;
  else
    return Env('friendlyErrorMsg') || error.message;
}

export function WaitMs(miliSeconds: number) { // é blocante, evitar !
  dbgInfo(`wait ${miliSeconds}ms`);
  const fim = Date.now() + (miliSeconds);
  while (Date.now() < fim);
}

export async function SleepMs(milisecs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), milisecs);
  });
}
export async function SleepMsDevRandom(milisecsMax?: number | null, context?: string) {
  await SleepMsDev(RandomNumber(0, milisecsMax || 500), context);
}
export async function SleepMsDev(milisecs: number, context?: string) {
  if (!(isAmbDev() && milisecs != 0))
    return;
  if (context != null)
    dbg({ level: 1, context }, `sleeping ${milisecs}ms .....`);
  await SleepMs(milisecs);
  if (context != null)
    dbg({ level: 2, context }, 'awaked');
}
export const ForceWait = async (elapsedMs: number, forceWaitMinimumMs: number) => {
  (elapsedMs < forceWaitMinimumMs) && await SleepMs(forceWaitMinimumMs - elapsedMs);
};

enum Plataform {
  localhost = 'localhost',
  vercel = 'vercel',
  azure = 'azure',
}
export function isPlataformVercel() {
  return (EnvSvr('plataform') === Plataform.vercel);
}

export function JsonHtml(obj: IGenericObject) { // @!!!!!! obsoleta, inserir a tag '<pre>' no chamador
  return `<pre>${JSON.stringify(obj, null, 4)}</pre>`;
}

const dispAbrevReticencias = '...';
export function DispAbrev(text: string, max: number) { // retorna apenas o início do string
  // tam => tamanho total retornado !
  if (text == null) return '';
  else if (text.length <= max) return text;
  else return text.substring(0, max - dispAbrevReticencias.length) + dispAbrevReticencias;
}
export function StrLeft(text: string, len: number) {
  if (text == null) return '';
  else if (text.length <= len) return text;
  else return text.substring(0, len);
}
export function StrRight(text: string, len: number) { // substringFromEnd substringFromRight
  if (text == null) return '';
  else if (text.length <= len) return text;
  else return text.substring(text.length - len);

}

export function StrNormalize(text: string) {
  // trim + retorna null se for ''
  let result: string;
  if (text == null)
    result = text;
  else {
    result = text.trim();
    // if (text === '')
    //   result = null;
  }
  return result;
}

export function DispFirstNameAbrev(text: string, max = 10) {
  let result: string;
  if (text == null)
    result = null;
  else {
    const comps = text.split(' ');
    if (comps.length == 0)
      result = null;
    else
      result = DispAbrev(comps[0], max);
  }
  return result;
}

// export function FunctInCallStack(functCheck) {
//   const functExecuting = FunctInCallStack.caller;
//   console.log(`functExecuting ${functExecuting.name}`);
//   let functStack = functExecuting.caller;
//   while (functStack != null) {
//     console.log(`caller ${functStack.name}`);
//     if (functStack == functCheck)
//       return true;
//   }
//   return false;
// }

export function RandomItem<Type>(values: Type[]) {
  const index = RandomNumber(0, values.length - 1, 0);
  return values[index];
}
export function RandomNumber(min: number, max: number, decimals = 0) {
  const result = Math.floor(Math.random() * ((max - min) + 1)) + min;
  return RoundDecs(result, decimals);
}

export function RoundDecs(number: number, decimals: number) {
  const fatorMult = Math.pow(10, decimals);
  const result = Math.round(number * fatorMult) / fatorMult;
  if (Object.is(result, -0)) return 0;
  else return result;
}

// date-fnd -----------------------------------------
// @@!!!!!! criar uma lib apenas com data/hora
export function AddSeconds(date: Date, seconds: number) {
  return addSeconds_dtfns(date, seconds);
}
export function DateDifMs(date1: Date, date2: Date) { // date1 - date2 in milisecs
  return differenceInMilliseconds_dtfns(date1, date2);
  // e if (DateDifMs(date1, date2) < (24 * 60 * 60 * 1000))
}

/**
 * * date1 - date2
 * @param date1 
 * @param date2 
 * @returns seconds
 */
export function DateDifSeconds(date1: Date, date2: Date) {
  return differenceInSeconds_dtfns(date1, date2);
}
export function DateDifMinutes(date1: Date, date2: Date) {
  return differenceInMinutes_dtfns(date1, date2);
}
export function DateDifHours(date1: Date, date2: Date) {
  return differenceInHours_dtfns(date1, date2);
}
export function DateDifDays(date1: Date, date2: Date) {
  return differenceInDays_dtfns(date1, date2);
}
export function CompareDates(date1: Date, date2: Date) { // >0 => data1 > data2
  return compareAsc_dtfns(date1, date2);
}
export function AddToDate(date: Date, duration: Duration_dtfns) {
  // AddToDate(DateFromStrISO(payLoad.ctrl.hora), { seconds: payLoad.ctrl.expirationSecs });
  return add_dtfns(date, duration);
}

// esse é o padrão para download / upload
export function DateToStrISO(date: Date) {
  if (date == null) return '';
  return formatISO_dtfns(date);
}
export function DateFromStrISO(dateIso: string) {
  if (dateIso == null)
    return null;
  const result = parseISO_dtfns(dateIso);
  if (result instanceof Date && !isNaN(result.getTime()))
    return result;
  throw new Error('invalid date');
}

export function FormatDate(date: Date, format: string) {
  return format_dtfns(date, format);
}
export function DateDisp(date: Date, components: 'dmy' | 'dmyhm' | 'dmyhms') {
  if (date == null)
    return '';
  let format = '';
  if (components == 'dmy')
    format = 'dd/MM/yyyy';
  else if (components == 'dmyhm')
    format = 'dd/MM/yyyy HH:mm';
  else if (components == 'dmyhms')
    format = 'dd/MM/yyyy HH:mm:ss';
  return FormatDate(date, format);
}

// const horaStrFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSX";
// export function HoraToStr(date?: Date) {
//   const dataUse = date || new Date();
//   return FormatDate(dataUse, horaStrFormat);
// }
// export function HoraFromStr(dateStr: string) {
//   const result = parse_dtfns(dateStr, horaStrFormat, new Date());
//   return result;
// }

export function HoraDebug(data?: Date, format = 'HH:mm:ss:SSS') {
  const dataUse = data || new Date();
  // `${(dataUse.getFullYear()+'').padStart(2,'0')}-${(dataUse.getMonth()+1+'').padStart(2,'0')}-${(dataUse.getDate()+'').padStart(2,'0')}`;
  // `${(dataUse.getHours()+'').padStart(2,'0')}-${(dataUse.getMinutes()+'').padStart(2,'0')}-${(dataUse.getSeconds()+'').padStart(2,'0')}-${(dataUse.getMilliseconds()+'').padStart(2,'0')}`;
  return FormatDate(dataUse, format);
}
// function NumberPaddingZeros(num: number, size) { // PadZerosLeft / usar padStart 
//   return (num + '').padStart(size);
// }

// export function HoraDebugSeg(data?: Date) {
//   const dataUse = data || new Date();
//   return FormatDate(dataUse, 'ss:SSS');
// }
/**
 * Gera um código randômico de 3 posições
 */
export function IdByTime(data?: Date) {
  // gera um id com 3 caracteres considerando as variações de hora / minuto e milisegundos
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const dataUse = data || new Date();
  const comps = [
    letters[(dataUse.getHours() * 60 + dataUse.getMinutes()) % letters.length],
    letters[dataUse.getSeconds() % letters.length],
    letters[dataUse.getMilliseconds() % letters.length],
  ];
  return comps.join('');
}

export function IsMobile(userAgent: string) {
  const isMobile = userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i) != null;
  return isMobile;
}

export function OnClient() {
  if (typeof window !== 'undefined')
    return true;
  else
    return false;
}
export function OnServer() {
  return !OnClient();
}

export function RunningOn() {
  if (OnServer())
    return '(server)';
  else
    return '(client)';
}
export function AssertIsServer(caller: string = null, data?: any) {
  if (!OnServer())
    dbgError(`${caller} in client!`, data);
}
export function AssertIsClient(caller: string = null, data?: any) {
  if (!OnClient())
    dbgError(`${caller} in server!`, data);
}

// export function StatusErrorServer(error) {
// if (error instanceof ErrorExecApi)
//   return error.status;
// else 
//   return 500;
// }

export function GetUrlParmString(query: object, field: string) {
  if (typeof (query?.[field]) === 'string')
    return query[field] as string;
  else
    return null;
}

export function PathWithParams(path?: string, query?: IGenericObject) {
  // path deve via com a primeira barra, apenas !
  try {
    let result = path || '';
    if (query != null) {
      const params = [];
      for (const prop in query)
        params.push(`${encodeURIComponent(prop)}=${encodeURIComponent(query[prop])}`);
      if (params.length > 0)
        result += `?${params.join('&')}`;
    }
    return result;
  } catch (error) {
    dbgError('PathWithParams', error.message, { pathname: path, query });
    throw error;
  }
}
export function UrlAppWithParams(path?: string, query?: IGenericObject) {
  try {
    return EnvDeployConfig().app_url + PathWithParams(path, query);
  } catch (error) {
    dbgError('UrlAppWithParams', error.message, { pathname: path, query });
    throw error;
  }
}

export function AnchorHrefMailTo(email: string, subject?: string, body?: any) {
  const parms = [];
  if (subject != null)
    parms.push(`subject=${encodeURIComponent(subject)}`);
  if (body != null)
    parms.push(`body=${encodeURIComponent(body)}`);
  if (parms.length == 0)
    return `mailto:${email}`;
  else
    return `mailto:${email}?${parms.join('&')}`;
}


export class CtrlRecursion {
  #moduleFunc: string;
  #maxPendings: number;
  #pendingCalls: number;
  #ciclos: number;
  constructor(moduleFunc: string, maxPendings = 5) {
    //console.log('******** CtrlRecursion constructor', context);
    this.#maxPendings = maxPendings;
    this.#moduleFunc = moduleFunc;
    this.#pendingCalls = 0;
    this.#ciclos = 0;
  }
  inExceeded(info?: string) {
    //console.log('CtrlRecursion', this.#context, 'pendding calls', this.#pendingCalls);
    this.#pendingCalls++;
    if (this.#pendingCalls > this.#maxPendings) {
      console.warn(`CtrlRecursion '${this.#moduleFunc}' - max pending calls allowed: ${this.#maxPendings} ; this call: ${this.#pendingCalls} (${info})`);
      if (this.#pendingCalls > (this.#maxPendings * 2)) {
        dbgError(`CtrlRecursion '${this.#moduleFunc}': aborted`);
        return true;
      }
    }
    return false;
  }
  out() {
    this.#pendingCalls--;
    if (this.#pendingCalls < 0)
      dbgError(`CtrlRecursion '${this.#moduleFunc}': #out exceeded #in`);
    else {
      this.#ciclos++;
      //console.log(`CtrlRecursion ${this.#context}: completou o ciclo ${this.#ciclos}`);
    }
  }
  status() {
    return `pending: ${this.#pendingCalls}; ciclos completos: ${this.#ciclos}`;
  }
}

export class CalcExecTime {
  // const calcExecTime = new CalcExecTime();
  // const elapsed = `${calcExecTime.elapsedMs()}ms`;
  #timeIni: number;
  #lastLap: number;
  constructor() {
    this.#timeIni = Date.now();
    this.#lastLap = this.#timeIni;
  }
  elapsedMs() {
    return Date.now() - this.#timeIni;
  }
  lapMs() {
    const agora = Date.now();
    const lap = agora - this.#lastLap;
    this.#lastLap = agora;
    return lap;
  }
}

export function IpV6GetPrefix(ip: string, parts: number) {
  if (ip == null)
    return null;
  const comps = ip.split(':');
  const result = comps.slice(0, parts).join(':');
  return result;
}

export enum PrimitivesType {
  undefined = 'undefined',
  boolean = 'boolean',
  number = 'number',
  string = 'string',
  bigint = 'bigint',
  symbol = 'symbol',
  object = 'object',
}
interface PropPrimType {
  name: string;
  type: PrimitivesType;
  propsInObj?: PropPrimType[];
  optional?: boolean;
}
export function CheckProps(obj: object, propsType: PropPrimType[]) {
  for (let index = 0; index < propsType.length; index++) {
    const prop = propsType[index];
    if (prop.optional &&
      obj[prop.name] == null)
      continue;
    if (obj[prop.name] == null)
      return `${prop.name} missing`;
    if (typeof (obj[prop.name]) !== prop.type)
      return `${prop.name} type mismatch`;
    else if (typeof (obj[prop.name]) === PrimitivesType.object &&
      prop.propsInObj != null) {
      const result = CheckProps(obj[prop.name], prop.propsInObj);
      if (result != null)
        return `${prop.name}.${result}`;
    }
  }
  return null;
}

const letrasCrcSeq = 'egioqvraxbsychlkfmtjpwnuzd';
export function CrcSeqCheck(seqWithCrc: string) {
  let crcError = null;
  let seqClean = null;
  try {
    seqClean = seqWithCrc.substring(0, seqWithCrc.length - 1);
    const seqCrc = seqWithCrc.substring(seqWithCrc.length - 1, seqWithCrc.length);
    if (letrasCrcSeq.indexOf(seqCrc) == -1)
      throw new Error('falta letra crc no final');
    const seqCrcCalc = CrcSeqCalc(seqClean);
    if (seqCrc != seqCrcCalc)
      throw new Error(`crc(${seqCrc}) diferente do calculado (${seqCrcCalc})`);
  } catch (error) {
    crcError = error.message;
  }
  return { seqClean, crcError };
}
function CrcSeqCalc(seq: string) { // apenas numeros
  for (let index = 0; index < seq.length - 1; index++) {
    if (!seq.charAt(index).match(/^\d+$/))
      throw new Error('seq deve ter apenas números');
  }
  const crcTot = Number(seq);
  const crcCalc = letrasCrcSeq.charAt(crcTot % letrasCrcSeq.length);
  return crcCalc;
}

export const NextNumberSpecialBaseSystem = (currentNumber?: string) => {
  const digitsBaseSystem = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  // null -> '0'
  // '000z' -> '0010'
  // 'zz' -> '100'
  // '0000', '0001', ... '0009', '000A', '000B' ....
  // obs: se o string tiver 'zeros' a esquerda então preserva. Se for necessário aumenta o string commais digitos a esquerda
  if (currentNumber == null)
    return digitsBaseSystem.charAt(0);
  let nextNumber;
  let lastDigits = '';
  let posDigit;
  for (posDigit = currentNumber.length - 1; posDigit >= 0; posDigit--) {
    const digit = currentNumber.charAt(posDigit);
    const indexDigit = digitsBaseSystem.indexOf(digit);
    //console.log({ digit, indexDigit });
    if (indexDigit < (digitsBaseSystem.length - 1)) { // apenas soma nessa posição, sem impacto nos digitos a esquerda
      nextNumber = `${currentNumber.substring(0, posDigit)}${digitsBaseSystem.charAt(indexDigit + 1)}${lastDigits}`; // '0Ay' -> '0Az'
      break;
    }
    lastDigits = digitsBaseSystem.charAt(0) + lastDigits; // '0Az' -> '0B0'
  }
  if (posDigit < 0)
    nextNumber = digitsBaseSystem.charAt(1) + lastDigits; // considera com o digito faltante (antes do string) era o 'zero'
  return nextNumber;
};

// export function ApiExternal(externalApiPath: string, api: string) {
//   if (externalApiPath == null)
//     throw new Error('host/pathApi para api externa nula');
//   return new ApiDef(`${externalApiPath}/${api}`);
// }

export function GetPageByPath(pages: PageDef[], pagePath: string) {
  const pageDef = pages.find((item) => item.pagePath === pagePath);
  return pageDef;
}

//#region arrays



type SearchValue = string | number;
export const compareForBinSearch = (value1: SearchValue, value2: SearchValue) => {
  let result = 0;
  if (typeof value1 === 'string' && typeof value2 === 'string')
    //return value1.localeCompare(value2);
    result = value1 > value2 ? +1 : value1 === value2 ? 0 : -1;
  else if (typeof value1 === 'number' && typeof value2 === 'number')
    result = value1 > value2 ? +1 : value1 === value2 ? 0 : -1;
  else
    throw new Error(`compareForSort: tipos diferentes (${value1}) (${value2})`);
  //debug && csd(`val1 '${value1}', val2 '${value2}', comp ${result}`);
  return result;
};
export const compareForBinSearchArray = (value1: SearchValue[], value2: SearchValue[]) => {
  let result = 0;
  if (value1.length != value2.length)
    throw new Error(`compareForBinSearchArray deve ter ambos argumentos com o mesmo número de item a comparar (arg 1: ${value1.length}, arg 2: ${value2.length})`);
  let index;
  for (index = 0; index < value1.length; index++) {
    const val1 = value1[index];
    const val2 = value2[index];
    if (val1 == null && val2 == null) continue;
    if (typeof val1 === 'string' && typeof val2 === 'string')
      //return value1.localeCompare(value2);
      result = val1 > val2 ? +1 : val1 === val2 ? 0 : -1;
    else if (typeof val1 === 'number' && typeof val2 === 'number')
      result = val1 > val2 ? +1 : val1 === val2 ? 0 : -1;
    else
      throw new Error(`compareForSort: tipos diferentes (${val1}) (${val2})`);
    if (result != 0) break;
  }
  //debug && csd({ value1, value2, result, index });
  return result;
};

//interface IBinSearch { binSearch: string }
/**
 * Num array de objetos classificados faz uma busca binaria para o valor informado
 * @param array array de objetos, com a prop 'binSearch' (deve existir como string e estar classificado por ela!)
 * @param searchValue valor a buscar
 * @returns { found: true, index: encontrado } | { found: false, index: ocorrência imediatamente maior (local correto para inserção e continuar em ordem } 
 */
export function BinSearchIndex<T>(array: T[], searchValue: SearchValue, searchProp?: string | ((x: any) => string), mustFound = false) {
  if (searchValue == null)
    return { found: false, index: -1 };
  const ValueAtIndex = (index) => {
    const valueProp = (item) => searchProp == null ? item : typeof searchProp === 'string' ? item[searchProp] : searchProp(item);
    let valueAtIndex: any = '';
    if (searchProp == null)
      valueAtIndex = array[index];
    else {
      if (typeof array[index] != 'object') dbgError(`ocorrência ${index} não é objeto`);
      else valueAtIndex = valueProp(array[index]);
    }
    if (valueAtIndex == null) dbgError(`ocorrência ${index} é nulo`);
    //utilCtrl.debug && csd('array', array);
    // utilCtrl.debug && csd('oc.0', array[0]);
    // utilCtrl.debug && csd('searchProp', searchProp, array[0][searchProp as string]);
    if (typeof valueAtIndex == 'object') dbgError(`valor na ocorrência ${index} é objeto`);
    //utilCtrl.debug && csd({ index, valueAtIndex });
    return valueAtIndex;
  };
  if (array.length > 0 &&
    ValueAtIndex(0) == null) {
    dbgError(`searchProp "${typeof searchProp === 'string' ? searchProp : 'func()'}" nulo para o primeiro item do array (campo/expr. errado?)`);
    return { found: false, index: -1 };
  }

  let found = false;
  let index: number;
  let low = 0, high = array.length - 1;

  index = Math.ceil((low + high) / 2);
  while (low <= high) {
    const valueAtIndex = ValueAtIndex(index);
    if (isAmbDev()) {
      if (index > 0 &&
        compareForBinSearch(valueAtIndex, ValueAtIndex(index - 1)) != +1)
        dbgError(`array fora de sequencia: array[${index}] '${valueAtIndex}' <= array[${index - 1}] '${ValueAtIndex(index - 1)}'`);
      if (index < (array.length - 1) &&
        compareForBinSearch(valueAtIndex, ValueAtIndex(index + 1)) != -1)
        dbgError(`array fora de sequencia: array[${index}] '${valueAtIndex}' >= array[${index + 1}] '${ValueAtIndex(index + 1)}'`);
    }
    if (searchValue == valueAtIndex) { found = true; break; }
    else if (compareForBinSearch(searchValue, valueAtIndex) > 0) low = index + 1;
    else high = index - 1;
    index = Math.ceil((low + high) / 2);
  }
  if (Object.is(index, -0))
    index = 0;
  if (mustFound == true && !found)
    throw new ErrorPlus(`SearchValue ${searchValue} não encontrada no array (searchProp: ${searchProp || 'none'})`);
  return { found, index };
}
export function BinSearchItem<T>(array: T[], searchValue: SearchValue, searchProp?: string | ((x: any) => string), mustFound = false) {
  const { found, index } = BinSearchIndex(array, searchValue, searchProp, mustFound);
  if (!found)
    return undefined;
  else
    return array[index];
}
export function BinSearchProp(array: any[], searchValue: SearchValue, propGet: string, searchProp?: string | ((x: any) => string), mustFound = false) {
  const { found, index } = BinSearchIndex(array, searchValue, searchProp, mustFound);
  if (!found)
    return undefined;
  else
    return array[index][propGet];
}

type fldAggregate = string | { fld: string, calc?: (item: any) => any, arrayLen?: number };
type fldKeyDef = string | { fld: string, toStr: (item: any) => string }; // definição para o campo chave: para criar a chave sequencial e tb montar o item do array com a chave (no seu formato original)
/**
 * Busca (de forma binaria) o item no array pela chave. 
 * Se encontrar soma os campos informados. Caso contrário inclui uma copia do item, sempre na sequência da chave
 */
export class CtrlCollect<T = any> {
  //   const ctrlCollect = new CtrlCollect(['turma', { fld: 'cpf', toStr: (item) => item.cpf.toString() }],
  //   {
  //     fldsSum: [
  //       'entradas', 
  //       'saidas', 
  //       { fld: 'saldo', calc: (item) => item.entradas - item.saidas },
  //       { fld: 'valMeses', arrayLen: 2 },
  //     ],
  //   });
  // ctrlCollect.newItem({ turma: 't1', cpf:1, entradas: 20, saidas: 2, valMeses: [1,2] });
  // ctrlCollect.newItem({ turma: 't1', cpf:1, entradas: 20, saidas: 2, valMeses: [1,2] });
  // ctrlCollect.newItem({ turma: 't2', cpf:1, entradas: 20, saidas: 2, valMeses: [1,2] });
  // ctrlCollect.newItem({ turma: 't2', cpf:2, entradas: 20, saidas: 2, valMeses: [1,2] });  
  #array: { key: string, item: T }[];
  #genKeyStr: (item: any) => string;
  #fldsKey: string[];
  #aggregate: { fldsSum: fldAggregate[] };
  /**
   * @param fldKeyDef relação de campos chave
   * @param aggregate campos que serão 'agregados' (soma, media, primeiro, maior, menor, etc)
   * @param aggregate.fldsSum campos que serão somados: se o campo tiver alguma definição especial deverá ser calc OU arrayLen
   * @param arraySrc array para processamento inicial (ou o processamento completo)
   */
  constructor(fldKeyDef: fldKeyDef[], aggregate: { fldsSum: fldAggregate[] }, arraySrc?: any[]) {
    this.#array = [];
    const funcsEachKey = fldKeyDef.map((x) => typeof (x) === 'string' ? (item) => item[x] : (item) => x.toStr(item));
    this.#genKeyStr = (item) => {
      const keysStr = funcsEachKey.map((func) => func(item));
      return keysStr.join('-');
    };
    this.#fldsKey = fldKeyDef.map((x) => typeof (x) === 'string' ? x : x.fld);
    if (aggregate.fldsSum != null) {
      for (let index = 0; index < aggregate.fldsSum.length; index++) {
        const fldSum = aggregate.fldsSum[index];
        if (typeof fldSum === 'object') {
          if (fldSum.fld == null) throw new Error(`CtrlCollect - aggregate.fldsSum[${index}] - fld null`);
          if (fldSum.calc != null && fldSum.arrayLen != null) throw new Error(`CtrlCollect - aggregate.fldsSum[${index}] - calc e arrayLen informados`);
        }
      }
    }
    this.#aggregate = aggregate;
    if (arraySrc != null) arraySrc.forEach(x => this.newItem(x));
  }
  newItem(item: any) {
    const key = this.#genKeyStr(item);
    const itemSearch = BinSearchIndex(this.#array, key, 'key', false);
    if (itemSearch.found) {
      if (this.#aggregate.fldsSum != null)
        this.#aggregate.fldsSum.forEach(fldSum => {
          if (typeof fldSum === 'string') {
            const fld = fldSum;
            const valueCell = item[fld];
            if (valueCell != null) this.#array[itemSearch.index].item[fld] += valueCell;
          }
          else {
            const fld = fldSum.fld;
            if (fldSum.calc != null) {
              const valueCell = fldSum.calc(item);
              if (valueCell != null) this.#array[itemSearch.index].item[fld] += valueCell;
            }
            else if (fldSum.arrayLen != null) {
              if (item[fld] != null)
                for (let index = 0; index < fldSum.arrayLen; index++) {
                  const valueCell = item[fld][index];
                  if (valueCell != null) this.#array[itemSearch.index].item[fld][index] += valueCell;
                }
            }
          }
        });
    }
    else {
      const newItem: any = _.pick(item, [...this.#fldsKey]);
      if (this.#aggregate.fldsSum != null)
        this.#aggregate.fldsSum.forEach(x => {
          if (typeof x === 'string') {
            const fld = x;
            const valueCell = item[fld];
            newItem[fld] = valueCell || 0;
          }
          else {
            const fld = x.fld;
            if (x.calc != null) {
              const valueCell = x.calc(item); // @!!!!!!! aqui pode dar algum erro no 'calc' então assumir 0 (ex: o campo não existir no source e o calc dar pau)
              newItem[fld] += valueCell || 0;
            }
            else if (x.arrayLen != null) {
              newItem[fld] = new Array(x.arrayLen).fill(0);
              if (item[fld] != null) {
                for (let index = 0; index < x.arrayLen; index++) {
                  const valueCell = item[fld][index];
                  newItem[fld][index] += valueCell || 0;
                }
              }
            }
          }
        });
      this.#array.splice(itemSearch.index, 0, { key, item: newItem });
    }
  }
  getArray() {
    return this.#array.map((x) => x.item);
  }
}

// export const Collect = (array: any[], newItem: any, funcKey: (item: any) => string, fldsKey: string[],
//   // fldsSum: [
//   //   { fld: 'totPlan', calc: (item: ValoresPlanejadosDetalhes) => item.valMeses.reduce((prev, curr) => prev + (curr || 0), 0) },
//   //   { fld: 'totReal', calc: () => 0 },
//   // ]
//   aggregate: { fldsSum?: fldAggregate[], fldsArraySum?: { len: number, fld: string }[] }) => {
//   const itemSearch = BinSearchIndex(array, funcKey(newItem), funcKey, false);
//   if (itemSearch.found) {
//     if (aggregate.fldsSum != null)
//       aggregate.fldsSum.forEach(x => {
//         if (typeof x === 'string') array[itemSearch.index][x] += newItem[x];
//         else array[itemSearch.index][x.fld] += x.calc(newItem);
//       });
//     if (aggregate.fldsArraySum != null)
//       aggregate.fldsArraySum.forEach(x => {
//         for (let index = 0; index < x.len; index++)
//           array[itemSearch.index][x.fld][index] += newItem[x.fld][index];
//       });
//   }
//   else {
//     const newItemAggr: any = _.pick(newItem, [...fldsKey]);
//     if (aggregate.fldsSum != null)
//       aggregate.fldsSum.forEach(x => {
//         if (typeof x === 'string') newItemAggr[x] = newItem[x];
//         else newItemAggr[x.fld] = x.calc(newItem);
//       });
//     if (aggregate.fldsArraySum != null)
//       //fldsVals = [...fldsVals, ...aggregate.fldsArraySum.map(x => x.fld)];
//       aggregate.fldsArraySum.forEach(x => {
//         newItemAggr[x.fld] = new Array(x.len).fill(0);
//         for (let index = 0; index < x.len; index++)
//           newItemAggr[x.fld][index] = newItem[x.fld].length > index ? newItem[x.fld][index] || 0 : 0;
//         //utilCtrl.debug && csd('filled', { newItemAggr });
//       });
//     //utilCtrl.debug && csd({ aggregate, fldsVals, fldsKey });
//     array.splice(itemSearch.index, 0, newItemAggr);
//     //utilCtrl.debug && csd({ newItem, newItemUse: _.pick(newItem, [...fldsKey, ...fldsVals]) });
//   }
// };

//#endregion

// export function PageDefAndType(router: NextRouter, pageTypes: { type: string, pagesDef: PageDef[] }[]) {
//   let pageType = null;
//   let pageDef: PageDef = null;
//   for (let index = 0; index < pageTypes.length; index++) {
//     //const pageDefAux = pageTypes[index].pagesDef.find((item) => item.pagePath === router.pathname);
//     const pageDefAux = PageByVariant(pageTypes[index].pagesDef, router, false);   
//     if (pageDefAux != null) {
//       pageType = pageTypes[index].type;
//       pageDef = pageDefAux;
//       break;
//     }
//   }
//   return { pageType, pageDef };
// }

// function ApisAll() {
//   const apis: ApiDef[] = [];
//   for (const key in apisTTT) {
//     if (Object.prototype.hasOwnProperty.call(apisTTT, key))
//       apis.push({ ...apisTTT[key] });
//   }
//   for (const key in apisApp) {
//     if (Object.prototype.hasOwnProperty.call(apisApp, key))
//       apis.push({ ...apisApp[key] });
//   }
//   return apis;
// }
// export function GetApiAppDefByPath(apiPath: string) {
//   const apis: ApiDef[] = [];
//   for (const key in apisApp) {
//     if (Object.prototype.hasOwnProperty.call(apisApp, key))
//       apis.push({ ...apisApp[key] });
//   }
//   const apiDef = apis.find((item) => item.apiPath === apiPath);
//   return apiDef;
// }

//#region objetos

export const ObjHasProp = (obj: object, prop: string) => {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

export const NavigateToProperty = (obj: IGenericObject, prop: string) => {
  // explora o objeto passado até chegar na propriedade
  // console.log( NavigateToProperty( 'a.b' , { a: { b: 'bbbb' } } ) ) => 'bbbb'
  const propsComps = prop.split('.');
  const value = (propsComps.length == 1) ? obj[prop] : propsComps.reduce((prev, curr) => prev != null ? prev[curr] : prev, obj);
  return value;
};

export const ObjPrefix = (objSrc: object, ...prefix) => {
  const prefixCompound = prefix.join('.');
  // crie um outro objeto mas com as propriedades prefixadas: ObjPrefix({ aa: '11' }, 'xx' ) => { 'xx.aa': '11' }
  const result = {};
  for (const key in objSrc)
    result[`${prefixCompound}.${key}`] = objSrc[key];
  return result;
};

/**
 * ! inverteu a ordem na versão v03i2
 * * Verifica todas as propeiedades do obj 1 que não tem correspondete no obj 2 com exatamente o mesmo valor
 * * Preve objetos com sub objetos e testa as proprietades no último nível
 * ? Precisa revisar 
 * todo: @!!!!!
 * @param obj1
 * @param obj2 
 * @returns Obj com as proprs diferentes
 */
export const ObjDiff = (obj1: object, obj2: object) => {
  if (typeof obj2 !== 'object' ||
    obj2 == null)
    return obj1;

  const diff = Object.keys(obj1).reduce((prev, curr) => {
    let propIsDiff = false;
    let propDiffValue;
    if (typeof obj1[curr] === 'object' &&
      obj1[curr] !== null) {
      if (typeof obj2[curr] === 'object' &&
        obj2[curr] !== null) {
        const propObjDiffValue = ObjDiff(obj1[curr], obj2[curr]);
        if (propObjDiffValue != null) {
          //if (Object.keys(propObjDiffValue).length > 0) {
          //console.log('alguma prop dif', Object.keys(propObjDiffValue));
          propIsDiff = true;
          propDiffValue = propObjDiffValue;
        }
        else if (obj1[curr].toString() != obj2[curr].toString()) {
          //console.log('prop dif', prop,objNew[prop].toString(), objOrigin[prop].toString());
          propIsDiff = true;
          propDiffValue = obj2[curr];
        }
      }
      else {
        propIsDiff = true;
        propDiffValue = obj1[curr];
      }
    }
    else {
      if (obj1[curr] !== obj2[curr]) {
        propIsDiff = true;
        propDiffValue = obj1[curr];
      }
    }
    if (!propIsDiff) return prev;
    return {
      ...prev,
      [curr]: propDiffValue,
    };
  }, {});
  if (Object.keys(diff).length == 0)
    return null;
  else
    return diff;
};

export const ObjOriginChangedProps = (objOrigin: object, objNew: object) => { // , prefix?: string)
  // retorna todas propriedades do objOrigin que foram alteradas no objNew (apenas props no primeiro nivel, mas testa em profundidade se for objeto)
  const propsDiff = Object.keys(objOrigin).reduce((propsDiffAcum, prop) => {
    let propIsDiff = false;
    if (typeof objOrigin[prop] === 'object' &&
      objOrigin[prop] !== null) {
      if (typeof objNew[prop] === 'object' &&
        objNew[prop] !== null) {
        const propsDiff = ObjOriginChangedProps(objOrigin[prop], objNew[prop]); // , prefix == null ? `${prop}.` : `prefix${prop}.`
        if (propsDiff.length > 0)
          propIsDiff = true;
        else if (objOrigin[prop].toString() != objNew[prop].toString())
          propIsDiff = true;
      }
      else
        propIsDiff = true;
    }
    else {
      if (objNew[prop] !== objOrigin[prop])
        propIsDiff = true;
    }
    if (!propIsDiff) return propsDiffAcum;
    return [
      ...propsDiffAcum,
      prop,
    ];
  }, []);
  return propsDiff;
};

/**
 * atualiza todas as propriedades de um objeto (apenas as existentes) com base num objeto de valores
 * @param objClass 
 * @param values 
 * @param showPropsNotInTarget 
 */
export const FillClass = (objClass: object, values: object, showPropsNotInTarget = false) => {
  ObjUpdAllProps(objClass, values, { onlyPropsInTarget: true, showPropsNotInTarget });
};

interface ObjUpdAllPropsConfig { onlyPropsInTarget?: boolean, showPropsNotInTarget?: boolean }
export const ObjUpdAllProps = <T>(objTarget: T, objSource: object, config?: ObjUpdAllPropsConfig) => {
  // atualiza todas as propriedades de um object com base em outro object (crud update)
  Object.keys(objSource).forEach((prop) => {
    // if (config?.propsExclude == null ||
    //   config.propsExclude.find((x) => x == prop) == null) {
    if (Object.keys(objTarget).includes(prop) ||
      config?.onlyPropsInTarget != true)
      objTarget[prop] = objSource[prop];
    //}
    if (config?.showPropsNotInTarget &&
      !Object.keys(objTarget).includes(prop))
      csd(`prop ${prop} não existe na estrutura do objeto`);
  });
};

//#endregion objetos

export function PhoneFormat(phone: string) {
  return `(${phone.substring(0, 2)}) ${phone.substring(2, 7)}.${phone.substring(7, 11)}`;
}

//#region scramble
function ScrambleKeySum(key?: string) {
  // deve ter variação minima de 'um' shift e fator de variancia (pela cheve) minima de 1 também (delta)
  // cada 'key' vai resultar em um 'ritmo' diferente de varação (shift)
  // if (min < 1) throw new Error(`ScrambleShift - min: ${min}`);
  // if (min >= max) throw new Error(`ScrambleShift - min: ${min} ; max: ${max}`);
  let keySum = 0;
  if (key != null)
    for (let index = 0; index < key.length; index++)
      keySum += key.charCodeAt(index);
  return keySum;
}

// export function Scramble(normalText: string, key: string = null, withCrc = false) { //@!!!!! eliminar !
//   return ScrambleX('do', normalText, withCrc, key);
// }
// export function Unscramble(scrambledText: string, key: string = null, withCrc = false) {
//   return ScrambleX('undo', scrambledText, withCrc, key);
// }
// /**
//  * Para uma string troca os caracteres dentro de uma sequencia controlada (letras, numeros e especiais)
//  * O resultado terá apenas os caracteres dessa sequência controlada
//  * @param cmd do | undo
//  * @param inputText 
//  * @param withCrc inclui controle de CRC?
//  * @param key chave para diferenciar o resultado
//  * @returns 
//  */
// function ScrambleX(cmd: 'do' | 'undo', inputText: string, withCrc: boolean, key: string = null) {
//   const lettersMin = 'abcdefghijklmnopqrstuvwxyz';
//   const lettersMai = lettersMin.toUpperCase();
//   const numbers = '0123456789';
//   const specials = '@#$%&*-_+=(){}[]<>,.:;?/|';

//   const minShift = 2;
//   const maxShift = 6; // não pode exceder o tamanho dos componentes que serão segmentados abaixo (substring)
//   const keySum = ScrambleKeySum(key);
//   const shift = minShift + (keySum % ((maxShift - minShift) + 1));

//   const crcMaxLen = 3;

//   if (inputText == null)
//     return null;

//   const calcCrc = (value: string, maxLen: number) => {
//     let crcSum = 0;
//     for (let indexChar = 0; indexChar < value.length; indexChar++) {
//       const inputChar = value[indexChar];
//       const indexInput = charsForScramble.indexOf(inputChar);
//       crcSum += ((indexInput + 1) * 3) + ((indexChar + 1) * 7);
//     }
//     let crcStr = crcSum.toString().padStart(maxLen, '0');
//     crcStr = crcStr.substring(crcStr.length - maxLen, crcStr.length);
//     return crcStr;
//   };


//   // o caracter na posição do shift não será alterado (excluido da conversão)
//   // embaralha a ordem das sequencias lógicas pra dificultar a detecção 
//   const charsForScramble =
//     lettersMin.substring(0, shift) +
//     specials.substring(0, shift) +
//     lettersMai.substring(0, shift) +
//     numbers.substring(0, shift) +
//     lettersMin.substring(shift + 1) +  // pula um
//     numbers.substring(shift + 1) +     // pula um
//     lettersMai.substring(shift + 2) +  // pula dois
//     specials.substring(shift);

//   let textIn;
//   if (withCrc && cmd === 'do') {
//     const crcCalc = calcCrc(inputText, crcMaxLen);
//     textIn = crcCalc + inputText;
//   }
//   else
//     textIn = inputText;

//   // scramble / unscramble textIn -> textOut
//   let textOut = '';
//   for (let indexChar = 0; indexChar < textIn.length; indexChar++) {
//     const inputChar = textIn[indexChar];
//     const indexInput = charsForScramble.indexOf(inputChar);
//     if (indexInput == -1)
//       textOut += inputChar;
//     else {
//       let indexOutput = indexInput;
//       if (cmd == 'do') {
//         indexOutput += (shift + indexChar);
//         if (indexOutput >= charsForScramble.length)
//           indexOutput -= charsForScramble.length; // ciclico
//       }
//       else {
//         indexOutput -= (shift + indexChar);
//         if (indexOutput < 0)
//           indexOutput += charsForScramble.length;
//       }
//       const outputChar = charsForScramble[indexOutput];
//       textOut += outputChar;
//     }
//   }

//   let result;
//   if (withCrc && cmd === 'undo') {
//     if (textOut.length <= crcMaxLen)
//       result = null;
//     else {
//       const crcCalc = calcCrc(textOut.substring(crcMaxLen), crcMaxLen);
//       const crcInScramble = textOut.substring(0, crcMaxLen);
//       if (crcInScramble != crcCalc)
//         result = null;
//       else
//         result = textOut.substring(crcMaxLen);
//     }
//   }
//   else
//     result = textOut;

//   //console.log({ cmd, shift, inputText, outputText, outputTextUse });
//   return result;
// }


export function Scramble(normalText: string, key: string = null, withCrc = false) {
  return ScrambleXNew('do', normalText, withCrc, key);
}
export function Unscramble(scrambledText: string, key: string = null, withCrc = false) {
  return ScrambleXNew('undo', scrambledText, withCrc, key);
}
function ScrambleXNew(cmd: 'do' | 'undo', inputText: string, withCrc: boolean, key?: string) {
  const lettersLowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const lettersUpperCase = lettersLowerCase.toUpperCase();
  const numbers = '0123456789';
  const specials = '@#$%&*-_+=(){}[]<>,.:;?/|';

  //const minShift = 2;
  //const maxShift = 6; // não pode exceder o tamanho dos componentes que serão segmentados abaixo (substring)
  const keySum = ScrambleKeySum(key);
  //const shift = minShift + (keySum % ((maxShift - minShift) + 1));

  const crcMaxLen = 3;

  if (inputText == null)
    return null;

  const calcCrc = (valueUnscramble: string, maxLen: number) => {
    let crcSum = 0;
    for (let indexChar = 0; indexChar < valueUnscramble.length; indexChar++) {
      const inputChar = valueUnscramble[indexChar];
      const indexInput = charsForScramble.indexOf(inputChar);
      crcSum += ((indexInput + 1) * 3) + ((indexChar + 1) * 7);
    }
    let crcStr = crcSum.toString().padStart(maxLen, '0');
    crcStr = crcStr.substring(crcStr.length - maxLen, crcStr.length);
    return crcStr;
  };

  const shift = (cadeiaCharsLength: number) => {
    let result = keySum % (cadeiaCharsLength);
    if (result < 2 && cadeiaCharsLength >= 2)
      result = 2;
    return result;
  };
  const shiftLettersLowerCase = shift(lettersLowerCase.length);
  const shiftLettersUpperCase = shift(lettersUpperCase.length);
  const shiftNumbers = shift(numbers.length);
  const shiftSpecials = shift(specials.length);

  // o caracter na posição do shift não será alterado (excluido da conversão)
  // embaralha a ordem das sequencias lógicas pra dificultar a detecção 
  const charsForScramble =
    lettersLowerCase.substring(0, shiftLettersLowerCase) +
    specials.substring(0, shiftSpecials) +
    lettersUpperCase.substring(0, shiftLettersUpperCase) +
    numbers.substring(0, shiftNumbers) +
    //lettersLowerCase.substring(shiftLettersLowerCase + 1) +  // pula um (esse que pulou não será convertido)
    lettersLowerCase.substring(shiftLettersLowerCase) +
    numbers.substring(shiftNumbers) +
    lettersUpperCase.substring(shiftLettersUpperCase) +
    specials.substring(shiftSpecials);

  const shiftAll = shift(charsForScramble.length);

  let textIn;
  if (withCrc && cmd === 'do') {
    const crcCalc = calcCrc(inputText, crcMaxLen);
    textIn = crcCalc + inputText;
  }
  else
    textIn = inputText;

  let textOut = '';
  for (let indexChar = 0; indexChar < textIn.length; indexChar++) {
    const inputChar = textIn[indexChar];
    const indexInput = charsForScramble.indexOf(inputChar);
    if (indexInput == -1)
      textOut += inputChar;
    else {
      let indexOutput = indexInput;
      let fatorShift = (shiftAll + indexChar) ** 2;
      fatorShift = fatorShift % charsForScramble.length;
      if (cmd == 'do') {
        indexOutput += fatorShift;
        if (indexOutput >= charsForScramble.length)
          indexOutput -= charsForScramble.length; // ciclico
      }
      else {
        indexOutput -= fatorShift;
        if (indexOutput < 0)
          indexOutput += charsForScramble.length;
      }
      const outputChar = charsForScramble[indexOutput];
      textOut += outputChar;
    }
  }

  let result;
  if (withCrc && cmd === 'undo') {
    if (textOut.length <= crcMaxLen)
      result = null;
    else {
      const crcCalc = calcCrc(textOut.substring(crcMaxLen), crcMaxLen);
      const crcInScramble = textOut.substring(0, crcMaxLen);
      if (crcInScramble != crcCalc)
        result = null;
      else
        result = textOut.substring(crcMaxLen);
    }
  }
  else
    result = textOut;

  //console.log({ cmd, shift, inputText, outputText, outputTextUse });
  return result;
}

//#endregion

// export function isSerializable(obj: any) { // considera meus objetos com não serializaveis, mesmo tendo apenas propriedades basicas
//   function isPlain(val) {
//     return (typeof val === 'undefined' || typeof val === 'string' || typeof val === 'boolean' || typeof val === 'number' || Array.isArray(val) || _.isPlainObject(val));
//   }
//   if (!isPlain(obj)) {
//     console.log(obj);
//     return false;
//   }
//   for (var property in obj) {
//     if (ObjHasProp(obj,property)) {
//       if (!isPlain(obj[property])) {
//         console.log(obj);
//         return false;
//       }
//       if (typeof obj[property] == 'object') {
//         if (!isSerializable(obj[property])) {
//           console.log(obj);
//           return false;
//         }
//       }
//     }
//   }
//   return true;
// }

const formatterPtBr = (decimals = 0) => (new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: decimals, maximumFractionDigits: decimals })).format;
export const AmountPtBrFormat = (value?: number, decimals?: number) => {
  const decimalsUse = decimals || 0;
  if (value == null) return '';
  const formated = formatterPtBr(decimalsUse)(value);
  //console.log('amountFormatter', { value, formated });
  return formated;
};
export const AmountPtBrParse = (value: string, decimals: number, allowNegative = false, nullForZero = false) => {
  if (value == null) return null;
  let valueAux = value.trim();
  if (valueAux == '') return null;
  let multInvSinal = 1;
  if (allowNegative &&
    valueAux.startsWith('-')) {
    multInvSinal = -1;
    valueAux = valueAux.substring(1);
  }
  valueAux = valueAux.replace(/\./g, '');
  if (decimals > 0)
    valueAux = valueAux.replace(/,/g, '.');
  else {
    if (valueAux.match(/,/))
      throw new Error('não é permitido decimais');
  }
  if (!valueAux.match(/^\d*(\.\d*)?$/))
    //return NaN;
    throw new Error('caractere inválido');
  let result = parseFloat(valueAux) * multInvSinal;
  if (isNaN(result))
    throw new Error('montante inválido');
  if (nullForZero && result == 0)
    return null;
  if (decimals > 0)
    result = RoundDecs(result, decimals);
  return result;
};

export function NumberStrMinLen(val: number, minLen: number) { // numero em string com minimo de tamanho (zeros a esquerda)
  return String(val).padStart(minLen, '0'); // @!!!!!!!! checar todos padStart
}

export function NumberOrDef(value: string, def: number = null) { // default if not convertible to number
  if (value != null) {
    const resultNumber = Number(value);
    if (isNaN(resultNumber) == false)
      return resultNumber;
  }
  return def;
}

export const BooleanToSN = (value: boolean) => value == true ? 's' : (value == false ? 'n' : '');
export const SNToBoolean = (value: string) => {
  if (value === 's')
    return true;
  else if (value === 'n')
    return false;
  else
    throw new Error('Valor inválido');
};

export const StrToNumber = (str: string, decimals = 0) => {
  const strUse = decimals == 0 ? str : str.replace(/,/, '');
  let value = Number(strUse);
  if (isNaN(value)) throw new Error('Valor não é numérico');
  if (decimals != 0)
    value = RoundDecs(value, decimals);
  return value;
};


// https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
export const mimeTypes = {
  csv: { dropZoneType: 'text/csv', type: 'text/csv;charset=utf-8', ext: { csv: 'csv' } },
  msExcel: { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8', ext: { xls: 'xls', xlsx: 'xlsx' } },
};

export type LanguageSearch = 'br';

/**
 * * Para os vários parametros passados retorna um string apenas com as palavras relevantes para pesquisas
 * * Remove: palavras duplicadas, acentos, pontuação, preposições, parametros com valor nulo
 * @param params 
 * @returns 
 */
export const SearchTermsForDbSavePtBr = (texts?: string[], codes?: string[]) => {
  const language: LanguageSearch = 'br';
  let strSearch = [];
  if (texts?.length > 0) {
    // .reduce((prev, curr) => `${prev}${curr} `, ' ')
    const wordsNotNullNormalized = texts.filter((x) => x != null).map((x) => x.toLowerCase());
    strSearch = [...strSearch, ...FilterRelevantWordsForSearch(language, wordsNotNullNormalized)];
  }
  if (codes?.length > 0) {
    const codesNotNullNormalized = codes.filter((x) => x != null).map((x) => x.trim().toLowerCase());
    strSearch = [...strSearch, ...codesNotNullNormalized];
  }
  if (strSearch.length > 0)
    return ' ' + strSearch.join(' ') + ' '; // para melhora de performance considera todas as palavras, inclusive primeira e ultima, delimitadas por espaço
  else
    return null;
};

/**
 * @param text Remove todos caracteres especiais (sem ser letra ou número ou espaço)
 */
function OnlyLetterOrNumber(text: string) {
  // remove pontuação por tabela
  let result = text;
  result = result.replace(new RegExp('([^((A-Z)|(a-z)|(0-9)| )])', 'g'), ' ').trim();
  //console.log('OnlyLetterOrNumber', { text, result });
  return result;
}

/**
 * 
 * @param text remove todos os textos não significativos para a lingua: preposições, acentos, pontuação, palavras duplicadas, espaços adicionais, etc
 * @param text Deve já estar convertido para minusculas (se desejado) e sem nulos 
 * @param language 
 * @returns array classificado apenas com as palavras relevantes 
 */
export function FilterRelevantWordsForSearch(language: LanguageSearch, texts: string[]) {
  let words = texts.join(' ').split(' ').filter((str) => str != ''); // remove espaços extras, 
  if (language == 'br')
    words = words.map((word) => Portuguese.RemoveAccentuation(word));

  // remove os caracteres especiais, como o '.' => poderá haver quebra de mais words
  words = words.map((word) => OnlyLetterOrNumber(word)).join(' ').split(' ').filter((str) => str != ''); 

  //const allTextsInWords = allWords.reduce((prev, curr) => [...prev, ...curr.split(' ')], []);
  words = [...new Set(words)]; // exclui palavras duplicadas

  //const wordsUnique = [...new Set(textClear.split(' '))]; // exclui palavras duplicadas e espaços adicionais
  if (language == 'br')
    words = words.filter((word) => Portuguese.WordIsRelevant(word)); // exclui o ' ' e palavras não relevantes
  //wordsRelevant = wordsRelevant.map((str) => OnlyLetterOrNumber(str));

  //let result = compsUnique.filter((str) => !(str == '' || Portuguese.WordIsNotRelevant(str))).join(' ');
  //result = ` ${result} `;
  //wordsAux;
  return words;
}