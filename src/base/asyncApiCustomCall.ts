import { Junk } from '../base/db/functions';

import { CtrlApiExec } from '../libServer/util';
import { AsyncProcTypes, CallAsyncApi } from '../libServer/asyncProcsCalls';

export enum AsyncProcTypesCustom {
  gravaDbTst = 'gravaDbTst',
  forceHttpStatus = 'forceHttpStatus',
}

export async function GravaDbTestAsyncApiNew(junkData: Junk, idProcItem: string, ctrlApiExec: CtrlApiExec, forceDelay?: number) {
  await CallAsyncApi(AsyncProcTypes.custom, AsyncProcTypesCustom.gravaDbTst, `${idProcItem}-grvDb`, junkData, true, ctrlApiExec, forceDelay);
}
export async function AsyncProcForceHttpStatusNew(httpStatus: number, idProc: string, ctrlApiExec: CtrlApiExec, forceDelay?: number) {
  await CallAsyncApi(AsyncProcTypes.custom, AsyncProcTypesCustom.forceHttpStatus, `${idProc}-st:${httpStatus}`, { idProc, httpStatus }, true, ctrlApiExec, forceDelay);
}
