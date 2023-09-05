import type { NextApiRequest, NextApiResponse } from 'next';

import { ErrorPlus, SleepMs, SleepMsDevRandom } from '../../../../libCommon/util';
import { csd } from '../../../../libCommon/dbg';

import { GetCtrlApiExec, ResumoApi } from '../../../../libServer/util';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';

import { apisTst } from '../../../../app_suporte/endPoints';

const apiSelf = apisTst.testApiASyncSvr;
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const ctrlApiExec = GetCtrlApiExec(req, res, null, ['cmd', 'attrSector'], ['email']);
  const parm = ctrlApiExec.parm;
  await SleepMsDevRandom(null, ctrlApiExec.ctrlContext, 'main');

  const resumoApi = new ResumoApi(ctrlApiExec);
  const agora = new Date();

  try {
    try {
      if (parm.forceError === 'error') throw new Error('Error forçado em CallApiASync');
      if (parm.forceError === 'timeout') await SleepMs(1 * 60 * 1000);
      resumoApi.jsonData({ value: { msg: parm.forceError } });
    } catch (error) {
      const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 1', parm, ctrlApiExec);
      resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
    }
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 2', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }
  resumoApi.json();
};