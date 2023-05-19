import { EnvApiTimeout } from '../app_base/envs';

import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';
import { IGenericObject } from '../libCommon/types';
import { csd, dbgError } from '../libCommon/dbg';
import { CalcExecTime } from '../libCommon/calcExectime';

import { SystemMsgCli } from '../libClient/systemMsgCli';

import { IFetchOptions, CallApiASync } from './fetcher';
import { globals } from '../libClient/clientGlobals';
import { CtrlContext } from '../libCommon/ctrlContext';

let callSeq = 0;
export async function CallApiCliASync<T>(apiPath: string, parm: IGenericObject = null,
  fetchOptions: IFetchOptions = {}) {
  //try {

  //const context = globals.windowId;

  const ctrlContext = new CtrlContext(null, { ctrlLog: globals.ctrlLog });

  const callSeqThis = `c${++callSeq}`;

  // if (fetchOptions?.fetchAndForget == true) {
  //   CallApiASync(apiPath, ctrlContext, callSeqThis, globals.browserId, parm, 'client', '', fetchOptions)
  //     .catch((error) => dbgError('CallApiCli', error.message));
  //   return;
  // }

  const calcExecTimeApiCall = new CalcExecTime();
  const timeOut = fetchOptions.timeOut != null ? fetchOptions.timeOut : EnvApiTimeout().waitCallFromCli;
  try {
    //if (forceError) throw new Error('Error forced');
    const data: T = await CallApiASync(apiPath, ctrlContext, callSeqThis, globals.browserId, parm, 'client', '', { ...fetchOptions, timeOut });
    const elapsedMs = calcExecTimeApiCall.elapsedMs();
    if (elapsedMs >= EnvApiTimeout().alertCallFromCli) {
      const paramsVarianteSel = ['cmd'];
      const paramsVarianteVals = [];
      for (let index = 0; index < paramsVarianteSel.length; index++) {
        if (parm[paramsVarianteSel[index]] != null)
          paramsVarianteVals.push(parm[paramsVarianteSel[index]]);
      }
      const paramsVariante = paramsVarianteVals.join('-');
      let apiPathVariante = `${apiPath}`;
      if (paramsVariante != '')
        apiPathVariante += `:${paramsVariante}`;
      SystemMsgCli(CategMsgSystem.alert, `${apiPathVariante} alertCallFromCli`, `tempo para retorno: ${elapsedMs}ms`, { parm });
    }
    if (fetchOptions?.fetchAndForget === true) return;
    else return data;
  }
  catch (error) {
    //csd('CallApiCliASync', { error });
    // if (ErrorPlusHttpStatusCode(error) == HttpStatusCode.gatewayTimeout) { // compilação no server muito demorada
    //   //let erroContornado = false;
    //   for (let sxTry = 0; sxTry < 1; sxTry++) {
    //     const waitMs = 10000 + (sxTry * 2000);
    //     csl(`erro 504 (server compilations), aguardando ${waitMs}s`);
    //     await SleepMs(waitMs);
    //     csl('tentando novamente');
    //     try {
    //       const data: T = await CallApiASync(apiPath, ctrlContext, callSeqThis, globals.browserId, parm, 'client', '', { ...fetchOptions, timeOut });
    //       return data;
    //       // erroContornado = true;
    //       // break;
    //     } catch (errorRetry) {
    //       if (ErrorPlusHttpStatusCode(errorRetry) != HttpStatusCode.gatewayTimeout)
    //         break;
    //     }
    //   }
    //   //if (!erroContornado)
    //   throw error;
    // }
    // else
    if (fetchOptions?.fetchAndForget === true) {
      SystemMsgCli(CategMsgSystem.error, 'CallApiCliASync-fetchAndForget', error.message, { apiPath, parm, fetchOptions });
      //LogErrorUnmanaged(error, );
      return;
    }
    else throw error;
  }
}