import { EnvApiTimeout } from '../libCommon/envs';
import { ErrorPlus, HttpStatusCode } from '../libCommon/util';

import { LoggedUserBase } from '../base/db/types';
import { NotifyAdmASync } from '../base/notifyAdm';

import { CtrlApiExec } from './util';

export async function AlertTimeExecApiASync(elapsedMs: number, ctrlApiExec: CtrlApiExec, loggedUser?: LoggedUserBase, extraInfo?: string) {
  if (elapsedMs >= (EnvApiTimeout().exec * 0.6)) {
    // @!!! dependendo da sequencia de imports dá pau na compilação,  ReferenceError: Cannot access 'Database' before initialization
    let variableInfo = `${elapsedMs}ms`;
    if (extraInfo != null)
      variableInfo += `; extraInfo '${extraInfo}'`;
    //const loggedUserReq = await LoggedUserReqASync(ctrlApiExec, false);
    const details = loggedUser != null ? { user: loggedUser.email } : null;
    await NotifyAdmASync(`${ctrlApiExec.apiPath} variants '${ctrlApiExec.paramsTypeVariant}' alertExec`, variableInfo, ctrlApiExec, details);
  }
}

export async function CheckTimeOutAndAbort(ctrlApiExec: CtrlApiExec, millisecondsFolga = 1000) {
  const elapsedMs = ctrlApiExec.calcExecTime.elapsedMs();
  if (elapsedMs >= (EnvApiTimeout().exec - millisecondsFolga)) {
    await NotifyAdmASync(`${ctrlApiExec.apiPath} variants '${ctrlApiExec.paramsTypeVariant}' abortedTimeOut`, `${elapsedMs}ms`, ctrlApiExec);
    throw new ErrorPlus(`Tempo de execução parcial (${elapsedMs}ms) próximo do limite permitido pelo servidor (${EnvApiTimeout().exec}). Processo abortado.`, { httpStatusCode: HttpStatusCode.timeOut });
  }
}