import { dbgError } from '../libCommon/dbg';
import { ErrorPlus, HttpStatusCode } from '../libCommon/util';
import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';
import { CtrlContext } from '../libCommon/ctrlContext';

import { SystemMsgSvrASync } from './systemMsgSvr';
import { CtrlApiExec } from './util';

export async function ApiStatusDataByErrorASync(error: Error | ErrorPlus, point: string, parm: object, ctrlApiExec: CtrlApiExec, additionalInfo?: any, supressLogError?: boolean) {
  //csl(`ApiStatusDataByErrorASync, api '${ctrlApiExec.apiPath}', error: '${error.message}'`, { pointInApi, parm, additionalInfo });
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
    dbgError('ApiStatusDataByError', 'parâmetro não é do tipo Error:', error);

  const apiInfo = [];
  if (ctrlApiExec.paramsTypeKey != '') apiInfo.push(`key: ${ctrlApiExec.paramsTypeKey}`);
  if (ctrlApiExec.paramsTypeVariant != '') apiInfo.push(`var: ${ctrlApiExec.paramsTypeVariant}`);
  //const point = `${ctrlApiExec.apiPath}(${ctrlApiExec.execId})(${apiInfo.join(',')})=>${pointInApi}`;
  //if (httpStatusCode === HttpStatusCode.unexpectedError)
  if (!managed && !logged) {
    if (!supressLogError) {
      await SystemMsgSvrASync(CategMsgSystem.error, point, error.message, ctrlApiExec.ctrlContext, { apiInfo, data, parm, additionalInfo });
      logged = true;
    }
  }
  const messageUse = managed ? error.message : `${point}: ${error.message}.`;
  const _ErrorPlusObj = new ErrorPlus(messageUse, { data, httpStatusCode, managed, logged });
  return { httpStatusCode, jsonErrorData: { _ErrorPlusObj } };
}

export async function SSGErrorASync(error: Error | ErrorPlus, ctrlContext: CtrlContext, point: string, additionalInfo?: any) {
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
    dbgError('SSGError', 'parâmetro não é do tipo Error:', error);

  //const point = `${ctrlContext.context}=>${point}`;
  if (!managed && !logged) {
    await SystemMsgSvrASync(CategMsgSystem.error, point, error.message, ctrlContext, { data, additionalInfo });
    logged = true;
  }
  const messageUse = managed ? error.message : `${point}: ${error.message}.`;
  const _ErrorPlusObj = new ErrorPlus(messageUse, { data, managed, logged });
  return { jsonErrorData: { _ErrorPlusObj } };
}