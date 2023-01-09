import { EnvApiTimeout } from '../libCommon/envs';
import { NotifyAdmASync } from '../base/notifyAdm';

import { CalcExecTime, ErrorPlusHttpStatusCode, HttpStatusCode } from '../libCommon/util';
import { dbgError } from '../libCommon/dbg';
import { IGenericObject } from '../libCommon/types';

import { CtrlApiExec } from '../libServer/util';

import { FetchOptions, CallApiASync } from './fetcher';

let seqCall = 0;
export async function CallApiSvrASync(apiPath: string, ctrlApiExec: CtrlApiExec, info: string = null, parm: IGenericObject = null,
  fetchOptions: FetchOptions = {}) {
  //dbg({ level: 1 }, 'FetchSvr', apiPath);
  const serverOptions = { protocolHost: ctrlApiExec.apiProtocolAndHost };
  try {
    const callId = `${ctrlApiExec.execId}-${++seqCall}`;
    if (fetchOptions?.fetchAndForget == true) {
      CallApiASync(apiPath, ctrlApiExec.context(), callId, parm, 'server', info, fetchOptions, serverOptions);
      return;
    }
    const calcExecTimeApiCall = new CalcExecTime();
    const timeOut = fetchOptions.timeOut != null ? fetchOptions.timeOut : EnvApiTimeout().waitCallFromSvr;
    const data = await CallApiASync(apiPath, ctrlApiExec.context(), callId, parm, 'server', info, { ...fetchOptions, timeOut }, serverOptions);
    const elapsedMs = calcExecTimeApiCall.elapsedMs();
    if (elapsedMs > (EnvApiTimeout().exec * 0.5))
      await NotifyAdmASync(`${apiPath} variants '${ctrlApiExec.paramsTypeVariant}' alertCallFromSvr`, `${elapsedMs}ms`, ctrlApiExec);
    return data;
  } catch (error) {
    if (ErrorPlusHttpStatusCode(error) != HttpStatusCode.notFound)
      dbgError(`CallApiSvrASync ${apiPath} (${info || ''}) error:`, error.message);
    throw error;
  }
}