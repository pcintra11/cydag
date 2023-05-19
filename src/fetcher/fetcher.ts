import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import queryString from 'query-string';

import { EnvDeployConfig } from '../app_base/envs';

import { csd, dbg, dbgError, ScopeDbg } from '../libCommon/dbg';
import { IGenericObject } from '../libCommon/types';
import { ErrorPlus, HttpStatusCode } from '../libCommon/util';
import { OnServer } from '../libCommon/sideProc';
import { CalcExecTime } from '../libCommon/calcExectime';
import { CtrlContext } from '../libCommon/ctrlContext';
import { CtrlRecursion } from '../libCommon/ctrlRecursion';

//let seqCtrl = 0;

const _ctrlRecursion: { func: string, ctrlRecursion: CtrlRecursion }[] = [];
const GetCtrlRecursion = (func: string) => {
  let item = _ctrlRecursion.find((x) => x.func == func);
  if (item == null)
    _ctrlRecursion.push(item = { func, ctrlRecursion: new CtrlRecursion(`fetcher->${func}`, 10) });
  return item.ctrlRecursion;
};

export interface IFetchOptions {
  method?: 'post' | 'get' | 'getParams';
  timeOut?: number;
  withCredentials?: boolean;
  fetchAndForget?: boolean; // todo o tratamento para erro será feito nas funções centrais e não no chamador
  debug?: boolean;
  auth?: { username: string, password: string };
  forceError?: string;
}

export async function CallApiASync(apiPath: string, ctrlContext: CtrlContext, callSeq: string, browserId: string = null, parm: IGenericObject = null, // loggedUser: LoggedUser = null,
  sideCall: 'client' | 'server',
  info = null,
  fetchOptions: IFetchOptions = {}) {
  //serverOptions: { protocolHost?: string } = {}
  //SetNivelLog(3);

  const ctrlRecursion = GetCtrlRecursion('CallApiASync');
  let thisCallCtrl = null;
  if (sideCall == 'client')
    //if (ctrlRecursion.inExceeded(apiPath)) return;
    if ((thisCallCtrl = ctrlRecursion.in(apiPath)) == null) return;

  //let seqDbg = 1; , `msg-${seqDbg++}`
  //let contextFetch = `${++seqCtrl}`; // , from ${origin}
  // if (callId != null)
  //   contextFetch += `, callId ${callId}`;
  const dbgA = (level: number, point: string, ...params) => dbg({ level, scopeMsg: ScopeDbg.a, ctrlContext, point: `==>Fetch(${callSeq})-${point}` }, ...params);

  try {

    const { internalApi, urlApi } = UrlApi(apiPath);

    const method = fetchOptions?.method || 'post';

    dbgA(1, 'api', urlApi, method, info); // , JSON.stringify(parm)
    dbgA(3, 'parm', parm);
    dbgA(4, 'fetchOptions', fetchOptions);

    const axiosRequestConfig: AxiosRequestConfig = {};

    //if (fetchOptions?.fetchAndForget != true)
    if (fetchOptions?.timeOut != null)
      axiosRequestConfig.timeout = fetchOptions?.timeOut;
    // else
    //   config.timeout = NumberOrDef(EnvIApiTimeout().wait);

    if (fetchOptions?.withCredentials != null)
      axiosRequestConfig.withCredentials = fetchOptions?.withCredentials; // CORS e BLOQUEIO DE HTTP COOKIES??

    if (fetchOptions?.auth != null)
      axiosRequestConfig.auth = fetchOptions.auth;

    let response: AxiosResponse = null;

    const _parmPlus: any = { sideCall, callSeq, browserId, ctrlLog: ctrlContext.ctrlLog }; // { loggedUser };
    //dbgA(5, '_parmPlus', _parmPlus);

    const parmFull = internalApi ? { ...parm, _parmPlus } : parm;
    dbgA(5, 'parmFull', parmFull);
    dbgA(5, 'axiosRequestConfig', axiosRequestConfig);

    const calcExecTimeApiCall = new CalcExecTime();
    let axiosCall: () => any = null;

    if (method == 'get') {
      const urlWithParams = queryString.stringifyUrl({ url: urlApi, query: parmFull });
      //csl({fullUrl: urlWithParams});
      axiosCall = () => axios.get(urlWithParams, axiosRequestConfig);
    }
    else if (method == 'getParams') {
      if (!Array.isArray(parm.params)) throw new Error(`CallApi getParams parm não é { params: array }: ${JSON.stringify(parm)}`);
      const params = parm.params as [];
      const urlWithParams = params.reduce((prev, curr) => prev + '/' + curr, urlApi);
      //csd({ urlWithParams });
      axiosCall = () => axios.get(urlWithParams, axiosRequestConfig);
      //csl(response);
    }
    else
      axiosCall = () => axios.post(urlApi, parmFull, axiosRequestConfig);

    // if (fetchOptions?.fetchAndForget == true) {
    //   // if (agora.getSeconds() < 30)  
    //   axiosCall()
    //     .catch((error) => csd(`CallApiASync ${apiPath} error`, error.message)); // para localhost deve ser assim !! e vercel ?? @!!!!!
    //   // else
    //   //   axiosCall()
    //   //     .then((x) => dbgA(1, 'ok %%%%%%%%%%%%%%'))
    //   //     .catch((error) => dbgA(1, 'error %%%%%%%%%%%%%%', error.message)); // no vercel essa situação produz erro !! (apenas no caso de erro, como timeOut)
    //   dbgA(3, 'fetchAndForget!');
    //   if (sideCall == 'client') ctrlRecursion.out();
    //   return;
    // }

    if (fetchOptions.forceError === 'errorCall') throw new Error('errorCall em CallApiASync'); //@!!!!!!!!

    response = await axiosCall();

    dbgA(2, 'fetchCompleted', `status ${response.status}, ${calcExecTimeApiCall.elapsedMs()}ms`);

    // if (options.debug == true)
    //   throw new Error('sssss');
    //await SleepMsDevFetch(`fetch:apiPath`);

    // qquer status fora da faixa do 200 vai cair no catch !
    dbgA(3, 'dataReturned', response.data);

    //csl('CallApi data', url, JSON.stringify(parm), JSON.stringify(result.data));
    // if (!IsTypeResultApi(result.data))
    //   throw new Error('resultado da api com tipo inválido')
    //return result.data.result  as ResultTy;

    if (sideCall == 'client') ctrlRecursion.out(thisCallCtrl);

    return response.data; // == '' ? null : result.data;
  } catch (error) {
    //dbgA(0, 'fetch error', error.message);

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

    if (sideCall == 'client')
      ctrlRecursion.out(thisCallCtrl);
    throw new ErrorPlus(message, { data, httpStatusCode, managed, logged });
  }

  function UrlApi(apiPath: string) {
    let urlResult = null;
    if (apiPath.startsWith('http')) // apis externas de outros sites
      urlResult = { internalApi: false, urlApi: apiPath };
    else if (OnServer()) {
      //const varsReq = (await import('../libServer/util')).varsReq;
      //if (serverOptions?.protocolHost == null) throw new Error('CallApi onServer sem passar serverOptions.protocolHost');
      //urlResult = { internalApi: true, urlApi: `${serverOptions.protocolHost}/api/${apiPath}` };
      urlResult = { internalApi: true, urlApi: `${EnvDeployConfig().api_url}/${apiPath}` };
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

export async function getRedirectedUrl(url: string) {
  try {
    const response = await axios({
      method: 'GET', url, params: {}
    });
    return response.request._redirectable._options.href;
  }
  catch (error) {
    dbgError('getRedirectedUrl', error.message);
    return null;
  }
}