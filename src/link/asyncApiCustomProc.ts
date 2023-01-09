import { ApiAsyncLogMd } from '../base/db/models';

import { CtrlApiExec } from '../libServer/util';
import { AsyncProcTypes } from '../libServer/asyncProcsCalls';

export async function AsyncProcCustom(asyncProc: ApiAsyncLogMd, ctrlApiExec: CtrlApiExec) {
  if (asyncProc.type != AsyncProcTypes.custom)
    throw new Error(`AsyncProcCustom: chamada indevida para ${asyncProc.type} (${asyncProc.customType})`);
  throw new Error(`AsyncProcCustom: Error customType não previsto ${asyncProc.customType} (${ctrlApiExec.context()}).`);
  return { resultOkCustom: null, shouldDeleteCustom: false };
}