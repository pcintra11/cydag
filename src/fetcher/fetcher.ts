import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import queryString from 'query-string';

import { EnvDeployConfig } from '../libCommon/envs';

import { csd, dbg, NivelLog, ScopeDbg } from '../libCommon/dbg';
import { IGenericObject } from '../libCommon/types';
import { CalcExecTime, ErrorPlus, HttpStatusCode, OnServer, CtrlRecursion, HoraDebug } from '../libCommon/util';

let seqCtrl = 0;

const _ctrlRecursion: { func: string, ctrlRecursion: CtrlRecursion }[] = [];
const GetCtrlRecursion = (func: string) => {
  let item = _ctrlRecursion.find((x) => x.func == func);
  if (item == null)
    _ctrlRecursion.push(item = { func, ctrlRecursion: new CtrlRecursion(`fetcher->${func}`, 10) });
  //csl(`callApi ctrlRecursion`, _ctrlRecursion.map((x) => `${x.context}: ${x.ctrlRecursion.status()}`));
  return item.ctrlRecursion;
};

export interface FetchOptions {
  method?: 'post' | 'get' | 'getParams';
  timeOut?: number;
  withCredentials?: boolean;
  fetchAndForget?: boolean; // verificar todas as chamadas, incluindo o client (ex: logout)
  debug?: boolean;
  auth?: { username: string, password: string };
}

export async function CallApiASync(apiPath: string, context: string, callId: string = null, parm: IGenericObject = null, // loggedUser: LoggedUser = null,
  origin: 'client' | 'server',
  info = null,
  fetchOptions: FetchOptions = {},
  serverOptions: { protocolHost?: string } = {}) {
  //SetNivelLog(3);

  const ctrlRecursion = GetCtrlRecursion('CallApiASync');
  if (origin == 'client')
    if (ctrlRecursion.inExceeded(apiPath)) return;

  //let seqDbg = 1; , `msg-${seqDbg++}`
  let contextFetch = `${++seqCtrl}`; // , from ${origin}
  if (callId != null)
    contextFetch += `, callId ${callId}`;
  const dbgA = (level: number, ...params) => dbg({ level, levelScope: ScopeDbg.a, context }, `==>Fetch(${contextFetch})`, `${info || ''}(${HoraDebug()})`, ...params);

  try {

    const { internalApi, urlApi } = UrlApi(apiPath);

    dbgA(1, urlApi); // , JSON.stringify(parm)
    dbgA(2, 'parm', parm);
    dbgA(3, 'fetchOptions', fetchOptions);
    dbgA(3, 'serverOptions', serverOptions);

    const method = fetchOptions?.method || 'post';
    const axiosRequestConfig: AxiosRequestConfig = {};

    if (fetchOptions?.fetchAndForget != true)
      if (fetchOptions?.timeOut != null)
        axiosRequestConfig.timeout = fetchOptions?.timeOut;
    // else
    //   config.timeout = NumberOrDef(EnvIApiTimeout().wait);

    if (fetchOptions?.withCredentials != null)
      axiosRequestConfig.withCredentials = fetchOptions?.withCredentials; // CORS e BLOQUEIO DE HTTP COOKIES??

    if (fetchOptions?.auth != null)
      axiosRequestConfig.auth = fetchOptions.auth;

    let response: AxiosResponse = null;

    const _parmPlus: any = { callId }; // { loggedUser };
    if (internalApi) {
      //&& _parmPlus.nivelLog == null)
      _parmPlus.nivelLogA = NivelLog(ScopeDbg.a);
      _parmPlus.nivelLogD = NivelLog(ScopeDbg.d);
      _parmPlus.nivelLogE = NivelLog(ScopeDbg.e);
      _parmPlus.nivelLogT = NivelLog(ScopeDbg.t);
      _parmPlus.nivelLogX = NivelLog(ScopeDbg.x);
    }

    const parmFull = internalApi ? { ...parm, _parmPlus } : parm;

    const calcExecTimeApiCall = new CalcExecTime();
    let axiosCall: () => any = null;

    if (method == 'get') {
      const urlWithParams = queryString.stringifyUrl({ url: urlApi, query: parmFull });
      //csl({fullUrl: urlWithParams});
      axiosCall = () => axios.get(urlWithParams, axiosRequestConfig);
    }
    else if (method == 'getParams') {
      if (!Array.isArray(parm.params))
        throw new Error(`CallApi getParams parm não é { params: array }: ${JSON.stringify(parm)}`);
      const params = parm.params as [];
      const urlWithParams = params.reduce((prev, curr) => prev + '/' + curr, urlApi);
      //csd({ urlWithParams });
      axiosCall = () => axios.get(urlWithParams, axiosRequestConfig);
      //csl(response);
    }
    else
      axiosCall = () => axios.post(urlApi, parmFull, axiosRequestConfig);

    if (fetchOptions?.fetchAndForget == true) {
      // if (agora.getSeconds() < 30)  
      axiosCall()
        .catch((error) => csd(`CallApiASync ${apiPath} error`, error.message)); // para localhost deve ser assim !! e vercel ?? @!!!!!
      // else
      //   axiosCall()
      //     .then((x) => dbgA(1, 'ok %%%%%%%%%%%%%%'))
      //     .catch((error) => dbgA(1, 'error %%%%%%%%%%%%%%', error.message)); // no vercel essa situação produz erro !! (apenas no caso de erro, como timeOut)
      dbgA(3, 'fetchAndForget!');
      return;
    }

    response = await axiosCall();

    // if (options.debug == true)
    //   throw new Error('sssss');
    //await SleepMsDevFetch(`fetch:apiPath`);

    // qquer status fora da faixa do 200 vai cair no catch !
    dbgA(1, 'ok, status', response.status, `${calcExecTimeApiCall.elapsedMs()}ms`); // parm?.id, 
    dbgA(3, 'data', response.data);

    //csl('CallApi data', url, JSON.stringify(parm), JSON.stringify(result.data));
    // if (!IsTypeResultApi(result.data))
    //   throw new Error('resultado da api com tipo inválido')
    //return result.data.result  as ResultTy;

    if (origin == 'client')
      ctrlRecursion.out();

    return response.data; // == '' ? null : result.data;
  } catch (error) {
    //csd({ error });
    //if (clientOptions?.debug)
    //dbgA(3, 'error full', apiPath, error);
    let httpStatusCode = error.response?.status || null;
    let message = error.response?.data?._ErrorPlusObj?.message || error.message;
    const data = error.response?.data?._ErrorPlusObj?._plus?.data || null;
    let managed = error.response?.data?._ErrorPlusObj?._plus?.managed || false;
    const logged = error.response?.data?._ErrorPlusObj?._plus?.logged || false;
    if (typeof error?.response?.data != 'object') {
      if (error.isAxiosError === true &&
        error.code === 'ECONNABORTED') {
        message = error.message;
        httpStatusCode = HttpStatusCode.timeOut;
      }
      else { 
        if (httpStatusCode === HttpStatusCode.payloadTooLarge) {
          message = 'a quantidade de dados enviados ao servidor é demasiadamente grande';
          managed = true;
        }
        else { // qdo a url é inválida o 'data' não é json
          message += ` - api ${apiPath} - statusCode: ${httpStatusCode}, response: not JSON (invalid url?)`;
          if (error.isAxiosError === true &&
            error.code != null)
            message += ` (axiosError ${error.code}`;
          httpStatusCode = httpStatusCode || HttpStatusCode.unexpectedError;
        }
      }
      // managed = false;
      // logged = false;
    }
    dbgA(1, 'error', { message, status: httpStatusCode, data });
    // if (httpStatusCode == HttpStatusCode.unexpectedError ||
    //   error.response?.data?._ErrorPlusObj == null) { // erro inesperado / não previsto
    //   // if (OnClient()) {
    //   //   const SystemErrorCli = (await import('../libClient/systemMsgCli')).SystemErrorCli;
    //   //   SystemErrorCli('Api erro inesperado:', message, { apiPath, parm }, false);
    //   // }
    //   // if (OnServer())
    //   //   csl('Api erro inesperado:', message, { apiPath, parm }); // usar SystemError
    //   //const msgUnexpectedErrorShow = isAmbDevOrtst() ? message : (Env('friendlyErrorMsg') || message);
    //   const msgUnexpectedErrorShow = Env('friendlyErrorMsg') || message;
    //   throw new ErrorPlus(msgUnexpectedErrorShow, { data, httpStatusCode, logged });
    // }
    // else

    if (origin == 'client')
      ctrlRecursion.out();
    throw new ErrorPlus(message, { data, httpStatusCode, managed, logged });
  }

  function UrlApi(apiPath: string) {
    let urlResult = null;
    if (apiPath.startsWith('http')) // apis externas de outros sites
      urlResult = { internalApi: false, urlApi: apiPath };
    else if (OnServer()) {
      //const varsReq = (await import('../libServer/util')).varsReq;
      if (serverOptions?.protocolHost == null)
        throw new Error('CallApi onServer sem passar serverOptions.protocolHost');
      urlResult = { internalApi: true, urlApi: `${serverOptions.protocolHost}/api/${apiPath}` };
    }
    else // if (Env('apiUrl') != null)
      urlResult = { internalApi: true, urlApi: `${EnvDeployConfig().api_url}/${apiPath}` };
    // else
    //   return { internalApi: true, urlApi: `/api/${apiPath}` };
    return urlResult;
  }
}

// async function FetcherPost(uri: string, dados: object) {
//   try {
//     // csl('start fetcher', uri);
//     const result = await fetch(uri, {
//       method: 'post',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(dados),
//     })
//       .then(x => x.json());
//     //csl('res fetcher', result);
//     if (!IsTypeResultApi(result))
//       throw new Error('resultado da api com tipo inválido')
//     return result.result as Result;
//   } catch (error) {
//     return ResultErr(error);
//   }
// }
//}
// async function Get(uri: string) {
//   try {
//     const result = await fetch(uri, {
//       method: 'get',
//       headers: { 'Content-Type': 'application/json' },
//     })
//       .then(x => x.json());
//     if (!IsTypeResultApi(result))
//       throw new Error('resultado da api com tipo inválido')
//     return result.result as ResultTy;
//   } catch (error) {
//     return ResultErr(error);
//   }
// }
// async function FetcherGetTmp(uri:string) {
//   try {
//     const res = await fetch(uri, {
//       method: 'get',
//       headers: { 'Content-Type': 'application/json' },
//     })
//       .then(x => x.json() );
//     return ResultOk(res);
//   } catch (error) {
//     return ResultErr(error);
//   }
// }
// async function GetTmp(uri: string) {
//   try {
//     const result = await axios.get(uri);
//     //.catch(x => ResultErr(x));
//     //csl('res fetcher get axios', result);
//     return ResultOk(result.data);
//   } catch (error) {
//     csl('errou axios get', error);
//     return ResultErr(error);
//   }
// }