
import { Junk } from '../app_base/modelTypes';

import { CtrlContext } from '../libCommon/ctrlContext';

import { AsyncProcTypes, CallAsyncApi } from '../libServer/asyncProcsCalls';

export enum AsyncProcTypesCustom {
  gravaDbTst = 'gravaDbTst',
  forceHttpStatus = 'forceHttpStatus',
}

export async function GravaDbTestAsyncApi(junkData: Junk, idProcItem: string, ctrlContext: CtrlContext, forceDelay?: number) {
  await CallAsyncApi(AsyncProcTypes.custom, AsyncProcTypesCustom.gravaDbTst, `${idProcItem}-grvDb`, junkData, true, ctrlContext, forceDelay);
}
export async function AsyncProcForceHttpStatus(httpStatus: number, idProc: string, ctrlContext: CtrlContext, forceDelay?: number) {
  await CallAsyncApi(AsyncProcTypes.custom, AsyncProcTypesCustom.forceHttpStatus, `${idProc}-st:${httpStatus}`, { idProc, httpStatus }, true, ctrlContext, forceDelay);
}
