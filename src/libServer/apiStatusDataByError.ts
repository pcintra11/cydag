import { dbgError } from '../libCommon/dbg';
import { ErrorPlus, HttpStatusCode } from '../libCommon/util';
import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';

import { SystemMsgSvrASync } from './systemMsgSvr';
import { CtrlApiExec } from './util';

export async function ApiStatusDataByErrorASync(error: Error | ErrorPlus, pointInApi: string, parm: object, ctrlApiExec: CtrlApiExec, aditionalInfo?: any) {
  let httpStatusCode = HttpStatusCode.unexpectedError;
  let data = {};
  let managed = false;
  let logged = false;
  if (error instanceof ErrorPlus) {
    httpStatusCode = error._plus.httpStatusCode || HttpStatusCode.badRequest;
    data = error._plus.data;
    managed = error._plus.managed || managed;
    logged = error._plus.logged || logged;
  }
  else if (error instanceof Error) { }
  else
    dbgError('ApiStatusDataByError: parâmetro não é do tipo Error:', error);

  const apiInfo = [];
  if (ctrlApiExec.paramsTypeKey != '') apiInfo.push(`key: ${ctrlApiExec.paramsTypeKey}`);
  if (ctrlApiExec.paramsTypeVariant != '') apiInfo.push(`var: ${ctrlApiExec.paramsTypeVariant}`);
  const point = `${ctrlApiExec.apiPath}(${ctrlApiExec.execId})(${apiInfo.join(',')})=>${pointInApi}`;
  //if (httpStatusCode === HttpStatusCode.unexpectedError)
  if (!managed && !logged) {
    await SystemMsgSvrASync(CategMsgSystem.error, point, error.message, ctrlApiExec, { data, parm, aditionalInfo });
    logged = true;
  }
  const messageUse = managed ? error.message : `${point}: ${error.message}.`;
  const _ErrorPlusObj = new ErrorPlus(messageUse, { data, httpStatusCode, managed, logged });
  return { httpStatusCode, jsonErrorData: { _ErrorPlusObj } };
}

export async function SSGErrorASync(error: Error | ErrorPlus, pointInApi: string, ctrlApiExec: CtrlApiExec, aditionalInfo?: any) {
  let data = {};
  let managed = false;
  let logged = false;
  if (error instanceof ErrorPlus) {
    data = error._plus.data;
    managed = error._plus.managed || managed;
    logged = error._plus.logged || logged;
  }
  else if (error instanceof Error) { }
  else
    dbgError('SSGError: parâmetro não é do tipo Error:', error);

  const point = `${ctrlApiExec.apiPath}=>${pointInApi}`;
  if (!managed && !logged) {
    await SystemMsgSvrASync(CategMsgSystem.error, point, error.message, ctrlApiExec, { data, aditionalInfo });
    logged = true;
  }
  const messageUse = managed ? error.message : `${point}: ${error.message}.`;
  const _ErrorPlusObj = new ErrorPlus(messageUse, { data, managed, logged });
  return { jsonErrorData: { _ErrorPlusObj } };
}