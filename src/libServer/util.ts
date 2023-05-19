import type { NextApiRequest, NextApiResponse } from 'next';
import RequestIp from 'request-ip';
import { ipVersion } from 'is-ip';
import URLParse from 'url-parse';
import * as yup from 'yup';
import jwtThen from 'jwt-then';
import { v1 as uuidv1 } from 'uuid';

import { EnvDeployConfig, EnvSvrCtrlLog } from '../app_base/envs';
import { AddToDate, CompareDates, DateFromStrISO, DateToStrISO, ErrorPlus, FilterRelevantWordsForSearch, LanguageSearch, SleepMs, StrLeft } from '../libCommon/util';
import { colorsMsg, csd, dbg, dbgError, dbgWarn, ScopeDbg } from '../libCommon/dbg';
import { HttpStatusCode, IdByTime, DispAbrev } from '../libCommon/util';
import { IGenericObject } from '../libCommon/types';
import { CalcExecTime } from '../libCommon/calcExectime';
import { CtrlContext } from '../libCommon/ctrlContext';

export type LogSentMessagesFn = (resultOk: string, resultError: string) => Promise<void>;

//let _protocolHost: string = null;
// export const GetProtocolHost = () => {  // até achar a forma mais adequada, pois sempre fica a ultima informação! @@@!!
//   if (_protocolHost == null)
//     throw new Error('_protocolHost não setado');
//   return _protocolHost;
// }

let colorDestaqSeq = 1;  // entre uma chamada HTTP e outra essa variável global vai manter o valor e somar ?
export class CtrlApiExec {
  req: NextApiRequest;
  res: NextApiResponse;
  url: string;
  referer: string;
  //originHost: string;
  horaStartHttp?: Date;
  //apiHost: string; // com a porta
  //apiHostname: string; // sem a porta
  //apiHostnameAbrev?: string;
  //apiProtocol?: string;
  //apiProtocolAndHost?: string;
  ip?: string;
  ipVersion?: number;
  parm?: IGenericObject;
  //page: null,
  //seq: 0,
  apiPath?: string;
  sideCall?: string;  // de onde foi chamado: client ou server
  callSeq?: string;  // seq no chamador da API
  browserId?: string;  // para diferenciar vários navegadores no mesmo dispositivo
  ctrlLogCaller?: string;
  execId?: string;  // identificação única para a chamada (gerada sequencialmente em cada chamada, pelo chamado)
  paramsTypeVariant?: string; // principais parâmetros para identificar a chamada, como o 'cmd', type, etc, tudo que identifica o tipo de processamento
  paramsTypeKey?: string; // identificadores para o processamento específico, como chaves, etc
  // parmPlus: {
  //   loggedUser?: LoggedUser;
  //   nivelLog?: string;
  // }
  ctrlContext: CtrlContext;
  // checkElapsed(point: string, showAlways = false) {
  //   const elapsedTot = this.calcExecTime.elapsedMs();
  //   const gap = elapsedTot - this.lastElapsed;
  //   if (showAlways || gap > 1000)
  //     csl(this.apiPath, point, `elapsed tot ${elapsedTot}ms, gap ${gap}ms ${gap > 1000 ? '- **********' : ''}`);
  //   this.lastElapsed = elapsedTot;
  // }
}

let seqApi = 0;

const ReqParm = (req: NextApiRequest) => {
  return (req.method === 'GET') ? req.query : req.body;
};
export const ReqNoParm = (req: NextApiRequest) => {
  const parm = ReqParm(req);
  if (Object.keys(parm).length == 0) return true;
  else return false;
};

//let ctrlApiExecGlobal: CtrlApiExec = null;
export function GetCtrlApiExec(req: NextApiRequest, res: NextApiResponse, paramsTypeVariantSel: string[] = ['cmd'], paramsTypeKeySel: string[] = []) {
  if (EnvDeployConfig().back_end == false)
    throw new Error('Não está habilitado o back-end');
  try {
    const ctrlApiExec = new CtrlApiExec();

    ctrlApiExec.req = req;
    ctrlApiExec.res = res;
    ctrlApiExec.callSeq = null;
    ctrlApiExec.execId = `${++seqApi}${IdByTime()}`;

    ctrlApiExec.horaStartHttp = new Date();

    ctrlApiExec.url = req.url;

    ctrlApiExec.referer = req.headers.referer; // new Referer(req.headers.referer, req.url); // @!!!!!
    // if (ctrlApiExec.apiPath != apisApp.adm.apiPath &&
    //   ctrlApiExec.apiPath != apisApp.notLoggedApis.apiPath)
    //   delete ctrlApiExec.referer.referers;
    //csl('referer' , ctrlApiExec.referer);

    // ctrlApiExec.originHost = null;
    // if (req.headers?.origin != null) {
    //   const urlOriginParsed = URLParse(req.headers?.origin);
    //   ctrlApiExec.originHost = urlOriginParsed.host;
    // }

    //ctrlApiExec.apiHost = req.headers?.host; // with port !
    // usar URL do node https://nodejs.org/api/url.html#constructing-a-url-from-component-parts-and-getting-the-constructed-string @@@!!!!!    
    const urlApiParsed = URLParse(ctrlApiExec.url); // url só tem a parte apos a porta !!!! 
    ///ctrlApiExec.apiHostname = req.headers?.host != null ? req.headers.host.split(':')[0] : ''; // despreza a porta (não dá problema se não tiver a porta)

    //const protocol = 'http'; // urlApiParsed.protocol != '' ? urlApiParsed.protocol : 'http'; // @@!!!!! usar apenas no local da necessidade!
    //ctrlApiExec.apiProtocolAndHost = `${protocol}://${ctrlApiExec.apiHost}`; // mesmo se o acesso original for https não dá problema (chamada server x server)

    // let apiHostnameAbrev = ctrlApiExec.apiHostname; 
    // apiHostnameAbrev = apiHostnameAbrev.replace(/-test.netlify.app/, '-nlfT'); //@@@ testar netlify
    // apiHostnameAbrev = apiHostnameAbrev.replace(/.netlify.app/, '-nlfP');
    // apiHostnameAbrev = apiHostnameAbrev.replace(/-git-test-pcintra11.vercel.app/, '-vclT');
    // apiHostnameAbrev = apiHostnameAbrev.replace(/.vercel.app/, '-vclP');
    // apiHostnameAbrev = apiHostnameAbrev.replace(/localhost/, 'locH');
    // apiHostnameAbrev = apiHostnameAbrev.replace(/127.0.0.1/, 'locH');
    // ctrlApiExec.apiHostnameAbrev = apiHostnameAbrev;
    //ctrlApiExec.apiHostnameAbrev = `${Env('plataform')}-${Env('amb')}`;

    ctrlApiExec.ip = RequestIp.getClientIp(req);
    ctrlApiExec.ipVersion = ipVersion(ctrlApiExec.ip);
    ctrlApiExec.apiPath = urlApiParsed.pathname.replace(/^\/api\//, '');
    //ctrlApiExec.page = urlParsed.pathname.substring(1); // em SSR URL não é estável !

    //_protocolHost = ctrlApiExec.protocolHost;

    ctrlApiExec.parm = ReqParm(req);
    //csl('parm em varsHttp', varsHttp.parm);

    const paramsTypeVariantVals = [];
    for (let index = 0; index < paramsTypeVariantSel.length; index++) {
      if (ctrlApiExec.parm[paramsTypeVariantSel[index]] != null)
        paramsTypeVariantVals.push(ctrlApiExec.parm[paramsTypeVariantSel[index]]);
    }
    if (paramsTypeVariantVals.length > 0)
      ctrlApiExec.paramsTypeVariant = paramsTypeVariantVals.join('; '); // aqui todo parametro que 'qualifica o tipo do processamento', mas não os dados váriáveis como chaves
    else
      ctrlApiExec.paramsTypeVariant = '';

    const paramsTypeKeyVals = [];
    for (let index = 0; index < paramsTypeKeySel.length; index++) {
      if (ctrlApiExec.parm[paramsTypeKeySel[index]] != null)
        paramsTypeKeyVals.push(ctrlApiExec.parm[paramsTypeKeySel[index]]);
    }
    if (paramsTypeKeyVals.length > 0)
      ctrlApiExec.paramsTypeKey = paramsTypeKeyVals.join('; ');
    else
      ctrlApiExec.paramsTypeKey = '';

    const dispApiComps = [];
    //dispApiComps.push(varsHttp.apiPath);
    //dispApiComps.push(`s:${varsHttp.seq}`);

    //dispApiComps.push(`(${varsHttp.execId}) *start*`);
    //dispApiComps.push('===start===');
    if (ctrlApiExec.paramsTypeVariant != '')
      dispApiComps.push(`variante '${ctrlApiExec.paramsTypeVariant}'`);
    if (ctrlApiExec.paramsTypeKey != '')
      dispApiComps.push(`keys '${ctrlApiExec.paramsTypeKey}'`);

    let parmPlus: IGenericObject = {};
    //csl('parm', varsHttp.parm);

    //csl('_parmPlus', varsHttp.apiPath, varsHttp.parm._parmPlus);

    if (ctrlApiExec.parm._parmPlus != null) {
      //parmPlus.loggedUser = varsHttp.parm._parmPlus.loggedUser != null ? LoggedUser.deserialize(varsHttp.parm._parmPlus.loggedUser) : null;
      ctrlApiExec.sideCall = ctrlApiExec.parm._parmPlus.sideCall;
      ctrlApiExec.callSeq = ctrlApiExec.parm._parmPlus.callSeq;
      ctrlApiExec.browserId = ctrlApiExec.parm._parmPlus.browserId;
      ctrlApiExec.ctrlLogCaller = ctrlApiExec.parm._parmPlus.ctrlLog;
      parmPlus = ctrlApiExec.parm._parmPlus;
      //csd({ parmPlus });
      delete ctrlApiExec.parm._parmPlus;
    }

    // // @@@!!!
    //SetNivelLog(1, ScopeDbg.db);
    //SetNivelLog(1, ScopeDbg.email);

    //dispApiComps.push(JSON.stringify(varsHttp.parm));

    //dispApiComps.push(FormatDate(varsHttp.horaStartHttp, 'yyyy-MM-dd - HH:mm:ss'));

    // if (isPlatformNetlify())
    //   dispApiComps.push('netlify');
    // if (isPlatformVercel())
    //   dispApiComps.push('vercel');
    dispApiComps.push('===============================');

    const dispApi = dispApiComps.join('; ');

    const context = (() => {
      const prefix = ctrlApiExec.callSeq != null ? `(${ctrlApiExec.callSeq})->` : '';
      const sufix = ctrlApiExec.execId != null ? `(${ctrlApiExec.execId})` : '';
      return `${prefix}${ctrlApiExec.apiPath}${sufix}`;
    })();

    // busca o maior nivel log em todas as origens possíveis 
    // mescla todos os scopes
    let levelMinShow = 0;
    let scopesShow = '';
    if (EnvSvrCtrlLog() != '') {
      const { ctrlLogLevel, ctrlLogScopes } = CtrlContext.ProcCtrlLogStr(EnvSvrCtrlLog());
      levelMinShow = Math.max(levelMinShow, ctrlLogLevel);
      scopesShow = CtrlContext.CtrlLogJoinScopes(scopesShow, ctrlLogScopes);
    }
    if (ctrlApiExec.ctrlLogCaller != null) {
      const { ctrlLogLevel, ctrlLogScopes } = CtrlContext.ProcCtrlLogStr(ctrlApiExec.ctrlLogCaller);
      levelMinShow = Math.max(levelMinShow, ctrlLogLevel);
      scopesShow = CtrlContext.CtrlLogJoinScopes(scopesShow, ctrlLogScopes);
    }
    ctrlApiExec.ctrlContext = new CtrlContext(context, { ctrlLog: `${levelMinShow} ${scopesShow}`, colorContext: colorDestaqSeq++, callSeq: ctrlApiExec.callSeq });

    const dbgA = (level: number, point: string, ...params) => dbg({ level, scopeMsg: ScopeDbg.a, ctrlContext: ctrlApiExec.ctrlContext, point }, ...params);

    dbgA(1, 'start', dispApi);
    dbgA(3, 'parm', JSON.stringify(ctrlApiExec.parm));
    dbgA(4, 'parmPlus', JSON.stringify(parmPlus));

    // if (ctrlApiExecGlobal == null)
    //   ctrlApiExecGlobal = ctrlApiExec;
    // // else // no vercel tb reaproveita a compilação e a variável fica com o valor da ultima execução
    // //   dbgWarn(`vars varsHttpGlobal já estava setada! (esse: ${VarsHttp.apiCmdCallIdStatic(varsHttp)}) (setada: ${VarsHttp.apiCmdCallIdStatic(varsHttpGlobal)})`);
    return ctrlApiExec;
  }
  catch (error) {
    csd('error em GetCtrlApiExec', error.message);
    return null;
  }
}

/**
 * Retorna a expressão regular
 * Normaliza todos os textos para minusculo
 * Para textos tb retira tudo que não é relevante para a lingua
 * @returns regExpr para uso no find ao db com 'like'
 */
export const SearchTermsForFindPtBr = (textSearch?: string, codesSearch?: string) => {
  const language: LanguageSearch = 'br';
  const strSearch = [];
  const wordsNormalized = textSearch.toLowerCase().split(' ');

  const relevantWords = FilterRelevantWordsForSearch(language, wordsNormalized);
  if (relevantWords.length > 0)
    strSearch.push(relevantWords.join(' '));
  if (codesSearch != null &&
    codesSearch.trim() != '')
    strSearch.push(codesSearch.trim());
  return RegExprTextSearchMongo(strSearch.join(' ').toLowerCase());
};

// function ServerVarEnv(env: string): string {
//   if (!OnServer())
//     throw new Error('VarEnv only works on server');
//   if (env == null)
//     throw new Error('VarEnv env null');
//   for (const key in process.env) {
//     if (key === env)
//       return process.env[key];
//   }
//   return null;
// }
// export function ServerEnvNumberOrDef(env: string, def: number = null) { // default if not convertible to number
//   return NumberOrDef(ServerVarEnv(env), def);
// }

export interface IApiResultProc {
  statusCode: HttpStatusCode;
  data: IGenericObject;
}

export class ResumoApi { // @@@@!!!! nome!
  //#_res: NextApiResponse;
  #_statusCode: HttpStatusCode;
  #_data: IGenericObject;
  #_redirectUrl: string;
  #_ctrlApiExec: CtrlApiExec;
  constructor(ctrlApiExec: CtrlApiExec) {
    this.#_statusCode = HttpStatusCode.ok;
    this.#_data = null;
    this.#_ctrlApiExec = ctrlApiExec;
  }
  status(httpStatusCode: HttpStatusCode) {
    this.#_statusCode = httpStatusCode;
    return this;
  }
  jsonData(data: IGenericObject) {
    this.#_data = data;
    return this;
  }
  redirectUrl(url: string) {
    this.#_redirectUrl = url;
    return this;
  }
  static jsonAmbNone(res: NextApiResponse) {
    res.status(HttpStatusCode.badRequest).json({ _ErrorPlusObj: new ErrorPlus('Ambiente não configurado') });
  }
  static jsonNoParm(res: NextApiResponse) {
    res.status(HttpStatusCode.badRequest).json({ _ErrorPlusObj: new ErrorPlus('Nenhum parâmetro informado') });
  }
  json() {
    let elapsedMs = null;
    const dbgA = (level: number, ...params) => dbg({ level, scopeMsg: ScopeDbg.a, ctrlContext: this.#_ctrlApiExec.ctrlContext, point: 'json' }, ...params);

    const statusCodeUse = this.#_statusCode || HttpStatusCode.ok;
    if (this.#_data == null)
      throw new Error('ResumoApi.send without data.');
    //csl('jason data', this.#_data);
    //this.#_data = { aa: new Date(), bb: true, cc: 123, dd: 'abcd', ee: { e1: 12, e2: 'abcd' } };
    // if (!isSerializable(this.#_data))
    //   csl('json data not serializable', this.#_data);
    this.#_ctrlApiExec.res.status(statusCodeUse).json(this.#_data);
    elapsedMs = this.#_ctrlApiExec.ctrlContext.calcExecTime?.elapsedMs();
    dbgA(2, '==> json', `${elapsedMs}ms`, `status(${statusCodeUse}).json(${DispAbrev(JSON.stringify(this.#_data), 500)})`);
    // if (this.#_ctrlApiExec.calcExecTime != null) {
    //   dbgA(3, '==> json', `tempo total api: ${elapsedMs}ms`);
    // }
    return elapsedMs;
  }
  redirect() {
    const dbgA = (level: number, ...params) => dbg({ level, scopeMsg: ScopeDbg.a, ctrlContext: this.#_ctrlApiExec.ctrlContext, point: 'json' }, ...params);
    //csl('redirecionando para', this.#_redirectUrl);
    if (this.#_statusCode != null)
      throw new Error('ResumoApi.redirect with statusCode.');
    if (this.#_redirectUrl == null)
      throw new Error('ResumoApi.redirect without redirectUrl.');
    this.#_ctrlApiExec.res.status(HttpStatusCode.redirect).redirect(this.#_redirectUrl);
    dbgA(2, 'res.redirect');
  }
  resultProc() {
    return {
      statusCode: this.#_statusCode,
      data: this.#_data,
    } as IApiResultProc;
  }
}

interface IFldError {
  fldName: string;
  msg?: string;
  msgs?: string[];
}
// export function ValidateObjectAll(data: IGenericObject, schema: yup.ObjectSchema<any>) { // todos os erros
//   try {
//     schema.validateSync(data, { abortEarly: false });
//     return null;
//   } catch (error) {
//     const fldErrors: FldError[] = [];
//     error.inner.forEach(e => {
//       const fldError = fldErrors.find((x) => x.fldName == e.path);
//       if (fldError == null)
//         fldErrors.push({
//           fldName: e.path,
//           msg: e.message,
//           msgs: [e.message],
//         });
//       else
//         fldError.msgs.push(e.message);
//     });
//     return fldErrors;
//   }
// }
export function ValidateObjectFirstError(data: IGenericObject, schema: yup.ObjectSchema<any>) { // apenas o primeiro erro
  try {
    schema.validateSync(data, { abortEarly: true });
    return null;
  } catch (error) {
    //csl(error);
    return {
      fldName: error.path,
      msg: error.message,
    } as IFldError;
  }
}

/**
 * Para cada palavras (separada por espaço) do string busca uma correspondente no db. Match apenas se todas encontradas
 * @param text 
 */
export function RegExprTextSearchMongo(text: string) {
  if (text == null)
    return '';
  const comps = text.trim().split(' ');

  // escapes como \b não funcionam !
  // const wordBoundaries = false;
  // if (wordBoundaries)
  //   return `(.*(${comps.map((str) => `( ${str} )`).join('|')}).*){${comps.length}}`; // vide abaixo erro com quantificadores
  // else
  // return `(.*(${comps.map((str) => `(${str})`).join('|')}).*){${comps.length}}`; {x} quantificadores dá erro, pois se for exigido 3 ocorrências e tiver só 2 ele dá match!
  return `${comps.map((str) => `.*(${str}).*`).join('')}`; // nesse código é exigido a mesma posição dos strings
}

const locks: { point: string, obj: IGenericObject }[] = [];
//const locksCtrl = HoraDebug();
export async function LockObjASync(obj: { id: string }, ctrlContext: CtrlContext, point2: string, debug = false) { // nem sempre as execuçãoes de APIs compartilham a mesma área global!!
  let count = 0;
  //dbg(5, 'LockObj pre', point, locks);
  const dbgX = (level: number, ...params) => { if (debug) dbg({ level, point: 'LockObj', scopeMsg: ScopeDbg.x, ctrlContext, colorMsg: colorsMsg.lock }, obj?.id, `point ${point2}`, ...params); };
  const calcExecTime = new CalcExecTime();
  dbgX(3, '(attempt)');
  //dbgX(3, 'compilação', locksCtrl);
  let lock: IGenericObject = {};
  while (lock != null) {
    lock = locks.find((x) => x.obj == obj);
    if (lock == null) {
      dbgX(2, '(locked successfully)');
      locks.push({ obj, point: point2 });
    }
    else {
      dbgX(1, `(is locked by ${lock.point}) (try ${++count}, elapsed ${calcExecTime.elapsedMs()}ms)`);
      if (calcExecTime.elapsedMs() > 2000) {
        const msg = `LockObj '${obj.id}' excedeu o tempo limite de espera após ${count} tentativas`;
        dbgError('LockObjASync', msg);
        //if (count >= 1000)
        //break;
        // SystemMsg(CategMsgSystem.alert, point, msg); //@@@@!!!
        // throw deixa rolar ...
        lock = null;
      }
      else
        await SleepMs(200);
    }
  }
  //dbg(5, 'LockObj pos', point, locks);
}
export function UnLockObj(obj: { id: string }, ctrlContext: CtrlContext, point2: string, debug = false) {
  const dbgX = (level: number, ...params) => { if (debug) dbg({ level, point: 'UnLockObj', scopeMsg: ScopeDbg.x, ctrlContext, colorMsg: colorsMsg.lock }, obj?.id, `point ${point2}`, ...params); };
  const lockIndex = locks.findIndex((x) => x.obj == obj);
  if (lockIndex == -1)
    dbgWarn('UnLockObj', `'${obj.id}' not locked!`);
  else {
    dbgX(2, '(unlocked)');
    locks.splice(lockIndex, 1);
  }
}

//#region tokens
const tokenLinksKey = 'jflksfgsdfsdfg-0';

function RandomKeyToken(length: number = null): string {
  const result = uuidv1();
  if (length != null) return StrLeft(result, length);
  else return result;
}

export async function TokenEncodeASync(tokenType: string, data: IGenericObject, expirationMinutes: number) {
  try {
    const agora = new Date();
    const expireIn = AddToDate(agora, { minutes: expirationMinutes });
    const payLoadCtrl = { data, ctrl: { generateIn: DateToStrISO(agora), expireIn: DateToStrISO(expireIn), type: tokenType, key: RandomKeyToken(8) } };
    //csd({ payLoadCtrl });
    const token = await jwtThen.sign(payLoadCtrl, tokenLinksKey) as string;
    return { token, expireIn };
  } catch (error) {
    return null;
  }
}
export async function TokenDecodeASync(tokenType: string, token: string) {
  //try {
  const agora = new Date();
  const payLoad: any = await jwtThen.verify(token, tokenLinksKey);
  if (payLoad?.ctrl?.type != tokenType)
    throw new Error('type');
  //const horaExpiration = AddToDate(DateFromStrISO(payLoad.ctrl.hora), { seconds: payLoad.ctrl.expirationSecs });
  // if (compareAsc(agora, horaExpiration) > 0)
  //   throw new Error('Expirado');
  const expired = payLoad.ctrl.expireIn != null && CompareDates(agora, DateFromStrISO(payLoad.ctrl.expireIn)) > 0 ? true : false;
  //if (expired) // @!!!!!
  //csl('token gerado em:', payLoad.ctrl.generateIn, '; expira em:', payLoad.ctrl.expireIn, expired ? ' **** EXPIRADO ****' : '');
  return { payLoad: payLoad.data, expired, expireIn: DateFromStrISO(payLoad.ctrl.expireIn) };
  // } catch (error) {
  //   throw error;
  // }
}
//#endregion
