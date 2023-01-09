import { EnvApiTimeout } from '../libCommon/envs';

import { CalcExecTime, ErrorPlusData, ErrorPlusHttpStatusCode, HttpStatusCode, SleepMs } from '../libCommon/util';
import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';
import { IGenericObject } from '../libCommon/types';
import { csd, csl, dbgError, dbgInfo } from '../libCommon/dbg';

import { SystemMsgCli } from '../libClient/systemMsgCli';

import { FetchOptions, CallApiASync } from './fetcher';

export async function CallApiCliASync(apiPath: string, context: string, parm: IGenericObject = null,
  fetchOptions: FetchOptions = {}) {
  //try {

  if (fetchOptions?.fetchAndForget == true) {
    CallApiASync(apiPath, context, null, parm, 'client', '', fetchOptions)
      .catch((error) => dbgError(`CallApiCliASync error: ${error.message}`));
    return;
  }

  const calcExecTimeApiCall = new CalcExecTime();
  const timeOut = fetchOptions.timeOut != null ? fetchOptions.timeOut : EnvApiTimeout().waitCallFromCli;
  try {
    const data = await CallApiASync(apiPath, context, null, parm, 'client', '', { ...fetchOptions, timeOut });
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
    return data;
  }
  catch (error) {
    //csd('CallApiCliASync', { error });
    if (ErrorPlusHttpStatusCode(error) == HttpStatusCode.gatewayTimeout) { // compilação no server muito demorada
      //let erroContornado = false;
      for (let sxTry = 0; sxTry < 2; sxTry++) {
        const waitMs = 10000 + sxTry * 5000;
        csl(`erro 504 (server compilations), aguardando ${waitMs}s`);
        await SleepMs(waitMs);
        csl('tentando novamente');
        try {
          const data = await CallApiASync(apiPath, context, null, parm, 'client', '', { ...fetchOptions, timeOut });
          return data;
          // erroContornado = true;
          // break;
        } catch (errorRetry) {
          if (ErrorPlusHttpStatusCode(errorRetry) != HttpStatusCode.gatewayTimeout)
            break;
        }
      }
      //if (!erroContornado)
      throw error;
    }
    else
      throw error;
  }
}