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

import { configApp } from '../app_hub/appConfig';
import { EnvDeployConfig, isAmbDev } from '../app_base/envs';

import { PageDef } from './endPoints';
import { csd, dbg, dbgError, dbgInfo } from './dbg';
import { IGenericObject } from './types';
import { Portuguese } from './portuguese';
import { CtrlContext } from './ctrlContext';

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
  forbidden = 403,
  notFound = 404,
  methodNotAllowed = 405,
  timeOut = 408,
  conflict = 409,
  payloadTooLarge = 413,
  unexpectedError = 500,
  gatewayTimeout = 504,
}

// todos que tem um 'ciclo de vida' que que se resolve no usuário (sem necessidade de atenção do gestor da app)
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
    message == null && dbgError('ErrorPlus', 'mensagem nula');
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
  else if (isAmbDev())
    return error.message;
  else
    return configApp.friendlyErrorMessage || error.message;
}

export function WaitMs(miliSeconds: number) { // é blocante, evitar !
  dbgInfo('wait', `${miliSeconds}ms`);
  const fim = Date.now() + (miliSeconds);
  while (Date.now() < fim);
}

export async function SleepMs(miliSeconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), miliSeconds);
  });
}
export async function SleepMsDevRandom(miliSecondsMax: number | null, ctrlContext: CtrlContext, point?: string) {
  await SleepMsDev(RandomNumber(0, miliSecondsMax || 500), ctrlContext, point);
}
export async function SleepMsDev(miliSeconds: number, ctrlContext: CtrlContext, point?: string) {
  if (!(isAmbDev() && miliSeconds != 0)) return;
  if (point != null) dbg({ level: 1, ctrlContext }, point, `sleeping ${miliSeconds}ms .....`);
  await SleepMs(miliSeconds);
  if (point != null) dbg({ level: 1, ctrlContext }, point, 'awaked');
}
export const ForceWait = async (elapsedMs: number, forceWaitMinimumMs: number) => {
  (elapsedMs < forceWaitMinimumMs) && await SleepMs(forceWaitMinimumMs - elapsedMs);
};

export function JsonHtml(obj: IGenericObject) { // @!!!!!! obsoleta, inserir a tag '<pre>' no chamador
  return `<pre>${JSON.stringify(obj, null, 4)}</pre>`;
}

const dispAbrevReticencias = '...';
export function DispAbrev(text: string, max: number) { // retorna apenas o início do string
  // tam => tamanho total retornado !
  if (text == null) return '';
  else if (text.length <= (max + dispAbrevReticencias.length)) return text;
  else return text.substring(0, max) + dispAbrevReticencias;
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
//   csl(`functExecuting ${functExecuting.name}`);
//   let functStack = functExecuting.caller;
//   while (functStack != null) {
//     csl(`caller ${functStack.name}`);
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
/**
 * Arredonda para múltiplo de algum valor
 * @param base Múltiplo de referência
 * * RoundMult(13, 10) => 10
 * * RoundMult(17, 10) => 20
 */
export function RoundMult(number: number, base: number) {
  return RoundDecs((number / base), 0) * base;
}

// date-fnd -----------------------------------------
// @@!!!!!! criar uma lib apenas com data/hora
export function AddSeconds(date: Date, seconds: number) {
  return addSeconds_dtfns(date, seconds);
}
export function DateDifMs(date1: Date, date2: Date) { // date1 - date2 in miliSeconds
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
/**
 * date1 - date2
 * @returns delta em minutos
 */
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
export function DateDisp(date: Date, components: 'dmy' | 'dmyhm' | 'dmyhms' | 'hmsSSSS') {
  if (date == null)
    return '';
  let format = '';
  if (components == 'dmy')
    format = 'dd/MM/yyyy';
  else if (components == 'dmyhm')
    format = 'dd/MM/yyyy HH:mm';
  else if (components == 'dmyhms')
    format = 'dd/MM/yyyy HH:mm:ss';
  else if (components == 'hmsSSSS')
    format = 'HH:mm:ss:SSSS';
  return FormatDate(date, format);
}

export function ElapsedDisp(elapsedMs: number) {
  const elapsedSecs = elapsedMs / 1000;
  if (elapsedSecs < 0) return 'elapsed negativo';
  const seconds = Math.floor(elapsedSecs % 60);
  const minutes = Math.floor((elapsedSecs / (60)) % 60);
  const hours = Math.floor((elapsedSecs / (60 * 60)) % 24);
  const days = Math.floor((elapsedSecs / (24 * 60 * 60)));
  const comps: string[] = [];
  if (days != 0) comps.push(NumberStrMinLen(days, 2));
  if (days != 0 || hours != 0) comps.push(NumberStrMinLen(hours, 2));
  if (days != 0 || hours != 0 || minutes != 0) comps.push(NumberStrMinLen(minutes, 2));
  comps.push(NumberStrMinLen(seconds, 2));
  return comps.join(':');
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
  return FormatDate(dataUse, format);
}

// export function HoraDebugSeg(data?: Date) {
//   const dataUse = data || new Date();
//   return FormatDate(dataUse, 'ss:SSS');
// }
/**
 * Gera um código randômico de 3 posições
 */
export function IdByTime(data?: Date) {
  // gera um id com 3 caracteres considerando as variações de hora / minuto e mili segundos
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

export function PagePathForUrl(pagePath?: string, query?: IGenericObject) {
  // path deve via com a primeira barra, apenas !
  try {
    let result = pagePath || '';
    if (query != null) {
      const params = [];
      for (const prop in query)
        params.push(`${encodeURIComponent(prop)}=${encodeURIComponent(query[prop])}`);
      if (params.length > 0)
        result += `?${params.join('&')}`;
    }
    return result;
  } catch (error) {
    dbgError('PathWithParams', error.message, { pathname: pagePath, query });
    throw error;
  }
}
export function UrlForPage(pagePath?: string, query?: IGenericObject) {
  try {
    return EnvDeployConfig().app_url + PagePathForUrl(pagePath, query);
  } catch (error) {
    dbgError('UrlForPage', error.message, { pathname: pagePath, query });
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

/**
 * Mostra apenas partes do email
 * @param email 
 */
export const ObscureEmail = (email: string) => {
  const [name, domain] = email.split('@');
  // const nameLetters = [];
  // for (let index = 0; index < name.length; index++) {
  //   const divisor = index <= 4 ? 4 : 2;
  //   nameLetters.push((index % divisor) == 0 ? name[index] : '+');
  // }
  // return `${nameLetters.join('')}@${DispAbrev(domain,3)}`;
  return `${DispAbrev(name, 3)}@${DispAbrev(domain, 3)}`;
};
export const ObscurePhone = (phoneNumber: string) => {
  return '...' + phoneNumber.substring(phoneNumber.length - 4);
};

// export class CalcExecTime {
//   // const calcExecTime = new CalcExecTime();
//   // const elapsed = `${calcExecTime.elapsedMs()}ms`;
//   #timeIni: number;
//   #lastLap: number;
//   constructor() {
//     this.#timeIni = Date.now();
//     this.#lastLap = this.#timeIni;
//   }
//   elapsedMs() {
//     return Date.now() - this.#timeIni;
//   }
//   lapMs() {
//     const agora = Date.now();
//     const lap = agora - this.#lastLap;
//     this.#lastLap = agora;
//     return lap;
//   }
// }

export function IpV6GetPrefix(ip: string, parts: number) {
  if (ip == null)
    return null;
  const comps = ip.split(':');
  const result = comps.slice(0, parts).join(':');
  return result;
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
function CrcSeqCalc(seq: string) { // apenas números
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
  // obs: se o string tiver 'zeros' a esquerda então preserva. Se for necessário aumenta o string com mais dígitos a esquerda
  if (currentNumber == null)
    return digitsBaseSystem.charAt(0);
  let nextNumber;
  let lastDigits = '';
  let posDigit;
  for (posDigit = currentNumber.length - 1; posDigit >= 0; posDigit--) {
    const digit = currentNumber.charAt(posDigit);
    const indexDigit = digitsBaseSystem.indexOf(digit);
    //csl({ digit, indexDigit });
    if (indexDigit < (digitsBaseSystem.length - 1)) { // apenas soma nessa posição, sem impacto nos dígitos a esquerda
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
      if (typeof array[index] != 'object') dbgError('BinSearchIndex', `ocorrência ${index} não é objeto`);
      else valueAtIndex = valueProp(array[index]);
    }
    if (valueAtIndex == null) dbgError('BinSearchIndex', `ocorrência ${index} é nulo`);
    //utilCtrl.debug && csd('array', array);
    // utilCtrl.debug && csd('oc.0', array[0]);
    // utilCtrl.debug && csd('searchProp', searchProp, array[0][searchProp as string]);
    if (typeof valueAtIndex == 'object') dbgError('BinSearchIndex', `valor na ocorrência ${index} é objeto`);
    //utilCtrl.debug && csd({ index, valueAtIndex });
    return valueAtIndex;
  };
  if (array.length > 0 &&
    ValueAtIndex(0) == null) {
    dbgError('BinSearchIndex', `searchProp "${typeof searchProp === 'string' ? searchProp : 'func()'}" nulo para o primeiro item do array (campo/expr. errado?)`);
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
        dbgError('BinSearchIndex', `array fora de sequencia: array[${index}] '${valueAtIndex}' <= array[${index - 1}] '${ValueAtIndex(index - 1)}'`);
      if (index < (array.length - 1) &&
        compareForBinSearch(valueAtIndex, ValueAtIndex(index + 1)) != -1)
        dbgError('BinSearchIndex', `array fora de sequencia: array[${index}] '${valueAtIndex}' >= array[${index + 1}] '${ValueAtIndex(index + 1)}'`);
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

//#region objetos e arrays
export const ObjHasProp = (obj: object, prop: string) => {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

export const NavigateToProperty = (obj: IGenericObject, prop: string) => {
  // explora o objeto passado até chegar na propriedade
  // csl( NavigateToProperty( 'a.b' , { a: { b: 'bbbb' } } ) ) => 'bbbb'
  const propsComps = prop.split('.');
  const value = (propsComps.length == 1) ? obj[prop] : propsComps.reduce((prev, curr) => prev != null ? prev[curr] : prev, obj);
  return value;
};

/**
 * Crie um outro objeto mas com as propriedades prefixadas: ObjPrefix({ aa: '11' }, 'xx' ) => { 'xx.aa': '11' }
 */
export const ObjPrefix = (objSrc: object, ...prefix) => {
  const prefixCompound = prefix.join('.');
  const result = {};
  for (const key in objSrc)
    result[`${prefixCompound}.${key}`] = objSrc[key];
  return result;
};

/**
 * ! inverteu a ordem na versão v03i2
 * * Verifica todas as propriedades do obj 1 que não tem correspondente no obj 2 com exatamente o mesmo valor
 * * Prevê objetos com sub objetos e testa as propriedades no último nível
 * ! Precisa revisar 
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
          //csl('alguma prop dif', Object.keys(propObjDiffValue));
          propIsDiff = true;
          propDiffValue = propObjDiffValue;
        }
        else if (obj1[curr].toString() != obj2[curr].toString()) {
          //csl('prop dif', prop,objNew[prop].toString(), objOrigin[prop].toString());
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
  // retorna todas propriedades do objOrigin que foram alteradas no objNew (apenas props no primeiro nível, mas testa em profundidade se for objeto)
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

// /**
//  * atualiza todas as propriedades de um objeto (apenas as existentes) com base num objeto de valores
//  * @param objClass 
//  * @param values 
//  * @param propsAlsoAccept 
//  */
// export const FillClass = (objClass: object, values: object, propsAlsoAccept = []) => {
//   ObjUpdAllProps(objClass, values, { onlyPropsInTarget: true, propsAlsoAccept });
//   return objClass;
// };

export const CutUndef = <T>(obj: T) => {
  return _.pick(obj, function (value) { return value !== undefined; }) as T;
};

interface IObjUpdAllPropsConfig { onlyPropsInTarget?: boolean, propsAlsoAccept: string[] }
export const ObjUpdAllProps = <T>(objTarget: T, objSource: object, config?: IObjUpdAllPropsConfig) => { // #!!!!!!!!!!!! sai config, retorno o objeto na própria classe!
  // atualiza todas as propriedades de um object com base em outro object (crud update)
  const propsError = [];
  Object.keys(objSource).forEach((prop) => {
    if (Object.keys(objTarget).includes(prop))
      objTarget[prop] = objSource[prop];
    else if (config?.onlyPropsInTarget != true)
      objTarget[prop] = objSource[prop];
    else if (config?.propsAlsoAccept != null &&
      config.propsAlsoAccept.includes(prop))
      objTarget[prop] = objSource[prop];
    else
      propsError.push(prop);
  });
  if (propsError.length > 0) {
    dbgError('ObjUpdAllProps', 'prop(s) inexistentes na estrutura do objeto:', propsError.join('; '), { objTarget, objSource });
    //throw new Error(`ObjUpdAllProps-error, props: ${propsError.join('; ')}`);
  }
};

/**
 * atualiza todas as propriedades de uma classe e reclama se for passado propriedade que não pertence a classe
 * @param objTarget 
 * @param objSource 
 * @returns 
 */
export const FillClassProps = <T>(objTarget: T, objSource: object) => {
  const propsError = [];
  Object.keys(objSource).forEach((prop) => {
    if (Object.keys(objTarget).includes(prop))
      objTarget[prop] = objSource[prop];
    else
      propsError.push(prop);
  });
  if (propsError.length > 0)
    dbgError('FillClassProps', 'prop(s) inexistentes na estrutura do objeto:', propsError.join('; '), { objTarget, objSource });
  return objTarget;
};

/**
 * Retorna objeto com apenas as propriedades da classe de referência
 * @param values 
 * @param refClass 
 */
export const OnlyPropsInClass = (values: IGenericObject, refClass: IGenericObject) => {
  const result: any = {};
  Object.keys(refClass).forEach((prop) => {
    if (Object.keys(values).includes(prop))
      result[prop] = values[prop];
  });
  return result;
};

/**
 * Concatena todos os arrays não nulos
 * @param params arrays a concatenar
 * @returns 
 */
export const ConcatArrays = (...params) => {
  let result = [];
  params.forEach(item => {
    if (item != null)
      //item.forEach((x) => result.push(x));
      result = [...result, ...item];
  });
  return result;
};
//#endregion 

export function PhoneFormat(phone: string) {
  return `(${phone.substring(0, 2)}) ${phone.substring(2, 7)}.${phone.substring(7, 11)}`;
}

export function RandomWord(length: number) {
  const lettersLowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const lettersAll = lettersLowerCase + lettersLowerCase.toUpperCase();
  const lenCharAll = lettersAll.length;
  const chars = new Array(length).fill(undefined).map(() => lettersAll.charAt(RandomNumber(0, lenCharAll - 1)));
  return chars.join('');
}

//#region scramble
export interface IScrambleConfigProps { key?: string, withCrc?: boolean, prefixRandomLen?: number }
export function Scramble(normalText: string, scrambleConfig: IScrambleConfigProps = {}) {
  return ScrambleX('do', normalText, scrambleConfig);
}
// export function Scramble(normalText: string, key: string = undefined, withCrc = false) {
//   const scrambleConfig = { key, withCrc } as IScrambleConfigProps;
//   return ScrambleX('do', normalText, scrambleConfig);
// }

export function Unscramble(scrambledText: string, scrambleConfig: IScrambleConfigProps = {}) {
  return ScrambleX('undo', scrambledText, scrambleConfig);
}
// export function Unscramble(scrambledText: string, key: string = undefined, withCrc = false) {
//   const scrambleConfig = { key, withCrc } as IScrambleConfigProps;
//   return ScrambleX('undo', scrambledText, scrambleConfig);
// }
function ScrambleX(cmd: 'do' | 'undo', inputText: string, { key, withCrc, prefixRandomLen }: IScrambleConfigProps) {
  const method: 'standard' = 'standard';
  const lettersLowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const lettersUpperCase = lettersLowerCase.toUpperCase();
  const numbers = '0123456789';
  const specials = '@#$%&*-_+=(){}[]<>,.:;?/|';

  const prefixRandomLenUse = prefixRandomLen != null ? prefixRandomLen : 0;

  if (inputText == null)
    return null;

  let result = null;

  if (method === 'standard') {
    const calcCrc = (valueUnscramble: string, charsForScramble: string, maxLen: number) => {
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

    const randomWord = (cmd === 'do') ? RandomWord(prefixRandomLenUse) : inputText.substring(0, prefixRandomLenUse);

    let keyForShift = '';
    if (key != null) keyForShift += key;
    keyForShift += randomWord;
    let keyForShiftSum = 0;
    for (let index = 0; index < keyForShift.length; index++)
      keyForShiftSum += keyForShift.charCodeAt(index);

    //#region calcula um fator de variação (shift) com base na chave de criptografia composta
    const shift = (cadeiaCharsLength: number) => {
      let result = keyForShiftSum % (cadeiaCharsLength);
      if (result < 2 && cadeiaCharsLength >= 2)
        result = 2;
      return result;
    };

    // o carácter na posição do shift não será alterado (excluído da conversão)
    // embaralha a ordem das sequencias lógicas pra dificultar a detecção 
    const charsForScrambleCalc = () => {
      const shiftLettersLowerCase = shift(lettersLowerCase.length);
      const shiftLettersUpperCase = shift(lettersUpperCase.length);
      const shiftNumbers = shift(numbers.length);
      const shiftSpecials = shift(specials.length);

      return lettersLowerCase.substring(0, shiftLettersLowerCase) +
        specials.substring(0, shiftSpecials) +
        lettersUpperCase.substring(0, shiftLettersUpperCase) +
        numbers.substring(0, shiftNumbers) +
        //lettersLowerCase.substring(shiftLettersLowerCase + 1) +  // pula um (esse que pulou não será convertido)
        lettersLowerCase.substring(shiftLettersLowerCase) +
        numbers.substring(shiftNumbers) +
        lettersUpperCase.substring(shiftLettersUpperCase) +
        specials.substring(shiftSpecials);
    };
    const charsForScramble = charsForScrambleCalc();

    const shiftAll = shift(charsForScramble.length);
    //csd({ keyForShiftSum, charsForScramble, shiftAll });

    const crcMaxLen = 3;

    let textIn = inputText;
    if (cmd === 'do') {
      if (withCrc === true) {
        const crcCalc = calcCrc(inputText, charsForScramble, crcMaxLen);
        textIn = crcCalc + inputText;
      }
    }
    else
      textIn = textIn.substring(prefixRandomLenUse);

    // no texto embaralhado tem apenas o CRC
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
            indexOutput -= charsForScramble.length; // cíclico
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

    result = textOut;
    if (cmd === 'do')
      result = randomWord + result;
    else {
      if (withCrc === true) {
        const crcInScramble = result.substring(0, crcMaxLen);
        const crcCalc = calcCrc(result.substring(crcMaxLen), charsForScramble, crcMaxLen);
        if (crcInScramble != crcCalc)
          result = null;
        else
          result = result.substring(crcMaxLen);
      }
    }
  }
  //csl({ cmd, shift, inputText, outputText, outputTextUse });
  return result;
}
//#endregion

// export function isSerializable(obj: any) { // considera meus objetos com não serializáveis, mesmo tendo apenas propriedades básicas
//   function isPlain(val) {
//     return (typeof val === 'undefined' || typeof val === 'string' || typeof val === 'boolean' || typeof val === 'number' || Array.isArray(val) || _.isPlainObject(val));
//   }
//   if (!isPlain(obj)) {
//     csl(obj);
//     return false;
//   }
//   for (var property in obj) {
//     if (ObjHasProp(obj,property)) {
//       if (!isPlain(obj[property])) {
//         csl(obj);
//         return false;
//       }
//       if (typeof obj[property] == 'object') {
//         if (!isSerializable(obj[property])) {
//           csl(obj);
//           return false;
//         }
//       }
//     }
//   }
//   return true;
// }

//#region formatações / conversões
const formatterPtBr = (decimals = 0) => (new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: decimals, maximumFractionDigits: decimals })).format;
export const AmountPtBrFormat = (value?: number, decimals?: number) => {
  const decimalsUse = decimals || 0;
  if (value == null) return '';
  const formatted = formatterPtBr(decimalsUse)(value);
  //csl('amountFormatter', { value, formatted });
  return formatted;
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

// numberFormat formatNumber
export function NumberStrMinLen(val: number, minLen: number) { // numero em string com mínimo de tamanho (zeros a esquerda)
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
//#endregion 

// https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
export const mimeTypes = {
  csv: { dropZoneType: 'text/csv', type: 'text/csv;charset=utf-8', ext: { csv: 'csv' } },
  msExcel: { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8', ext: { xls: 'xls', xlsx: 'xlsx' } },
};

//#region search
export type LanguageSearch = 'br';

/**
 * * Para os vários parâmetros passados retorna um string apenas com as palavras relevantes para pesquisas
 * * Remove: palavras duplicadas, acentos, pontuação, preposições, parâmetros com valor nulo
 * @param texts Textos normais )remove palavras não relevantes, como preposições)
 * @param codes Códigos (considera todas as palavras)
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
  //csl('OnlyLetterOrNumber', { text, result });
  return result;
}

/**
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
//#endregion

