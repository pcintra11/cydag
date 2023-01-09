import type { NextApiRequest, NextApiResponse } from 'next';

import { ErrorPlus, HttpStatusCode } from '../../../../libCommon/util';
import { csd } from '../../../../libCommon/dbg';

import { GetCtrlApiExec, ResumoApi } from '../../../../libServer/util';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const ctrlApiExec = GetCtrlApiExec(req, res);
  const parm = ctrlApiExec.parm;
  const resumoApi = new ResumoApi(ctrlApiExec);

  //await SleepMs(4000);
  csd('api teste', { parm });

  try {
    if (parm.statusCode == HttpStatusCode.notFound)
      throw new ErrorPlus('não achou', { data: { msg: 'algo não encontrado' }, httpStatusCode: parm.statusCode });
    if (parm.statusCode != HttpStatusCode.ok)
      throw new ErrorPlus('erro grave', { data: { msg: 'algo não previsto' }, httpStatusCode: parm.statusCode });
    csd('api teste ok');
    resumoApi.jsonData({ value: `valor retornado sem erro para ${parm.arg1}` });
  } catch (error) {
    csd('api teste', { error });
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }
  resumoApi.json();
};