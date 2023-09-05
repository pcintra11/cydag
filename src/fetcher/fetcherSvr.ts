import { EnvApiTimeout } from '../app_base/envs';
import { NotifyAdmASync } from '../libServer/notifyAdm';

import { ErrorPlusHttpStatusCode, HttpStatusCode } from '../libCommon/util';
import { csd, dbgError } from '../libCommon/dbg';
import { IGenericObject } from '../libCommon/types';
import { CalcExecTime } from '../libCommon/calcExectime';
import { CtrlContext } from '../libCommon/ctrlContext';
import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';

import { SystemMsgSvrASync } from '../libServer/systemMsgSvr';

import { IFetchOptions, CallApiASync } from './fetcher';

let callSeq = 0;
export async function CallApiSvrASync(apiPath: string, ctrlContext: CtrlContext, info: string = null, parm: IGenericObject = null,
  fetchOptions: IFetchOptions = {}) {
  //dbg({ level: 1 }, 'FetchSvr', apiPath);
  //const serverOptions = { protocolHost: ctrlApiExec.apiProtocolAndHost };
  //csd('CallApiSvrASync', apiPath, info);
  // @!!!!!!! NÂO permitir fetchAndForget, pois a API startada é derrubada no servidor quando a conexão é finalidade (final da api chamadora e retorno para o client)
  try {
    const callSeqThis = (ctrlContext.callSeq != null ? `${ctrlContext.callSeq}-` : '') + `s${++callSeq}`;
    // if (fetchOptions?.fetchAndForget == true) {
    //   await CallApiASync(apiPath, ctrlContext, callSeqThis, null, parm, 'server', info, fetchOptions);
    //   return;
    // }
    const calcExecTimeApiCall = new CalcExecTime();
    const timeOut = fetchOptions.timeOut != null ? fetchOptions.timeOut : EnvApiTimeout().waitCallFromSvr;
    //csd('CallApiSvrASync - calling');
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const data = await CallApiASync(apiPath, ctrlContext, callSeqThis, null, timeZone, parm, 'server', info, { ...fetchOptions, timeOut });
    //csd('CallApiSvrASync - result', data);
    const elapsedMs = calcExecTimeApiCall.elapsedMs();
    if (elapsedMs > (EnvApiTimeout().exec * 0.5))
      //await NotifyAdmASync(`${apiPath} variants '${ctrlContext.paramsTypeVariant}' alertCallFromSvr`, `${elapsedMs}ms`, ctrlContext);
      await NotifyAdmASync(`${apiPath} alertCallFromSvr`, `${elapsedMs}ms`, ctrlContext);
    if (fetchOptions?.fetchAndForget === true) return;
    else return data;
  } catch (error) {
    //csd('CallApiSvrASync - error', error.message);
    if (ErrorPlusHttpStatusCode(error) != HttpStatusCode.notFound)
      dbgError('CallApiSvr', `${apiPath} (${info || ''})`, error.message);
    if (fetchOptions?.fetchAndForget === true) {
      await SystemMsgSvrASync(CategMsgSystem.error, 'CallApiSvrASync-fetchAndForget', error.message, ctrlContext, { apiPath, parm, info, fetchOptions });
      //.catch((error) => dbgError('CallApiSvrASync-SystemMsgSvrASync', error.message));
      return;
    }
    else throw error;
  }
}