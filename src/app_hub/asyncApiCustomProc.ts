import { ApiAsyncLogMd } from '../app_base/model';

import { CtrlContext } from '../libCommon/ctrlContext';

import { AsyncProcTypes } from '../libServer/asyncProcsCalls';

export async function AsyncProcCustom(asyncProc: ApiAsyncLogMd, ctrlContext: CtrlContext) {
  if (asyncProc.type != AsyncProcTypes.custom)
    throw new Error(`AsyncProcCustom: chamada indevida para ${asyncProc.type} (${asyncProc.customType})`);
  throw new Error(`AsyncProcCustom: Error customType não previsto ${asyncProc.customType} (${ctrlContext.context}).`);
  return { resultOkCustom: null, shouldDeleteCustom: false };
}