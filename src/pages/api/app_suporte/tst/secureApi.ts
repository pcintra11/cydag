import type { NextApiRequest, NextApiResponse } from 'next';

import { ErrorPlus, HoraDebug } from '../../../../libCommon/util';

import { GetCtrlApiExec } from '../../../../libServer/util';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';

// import { UserModel } from '../../../../appVzn/modelsUser';
// import { CheckApiAuthorized, LoggedUserReqASync } from '../../../../appVzn/loggedUserSvr';
// import { User } from '../../../../appVzn/modelUserTypes';
//import { apisTst } from '../../../../app_suporte/endPoints';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  //SetNivelLog(4);
  //const loggedUserReq = await LoggedUserReqASync(req, res);
  const ctrlApiExec = GetCtrlApiExec(req, res, null);
  //const context = ctrlApiExec.context();
  const parm = ctrlApiExec.parm;
  try {
    // if (loggedUserReq == null) throw new ErrorPlus('Usuário não está logado.');
    // const userDb = await UserModel.findOne(User.fill({ _id: new ObjectId(loggedUserReq.userIdStr) })).lean();
    // CheckApiAuthorized(apisTst.testSecureApi, userDb, loggedUserReq.email);
    res.json({ result: `${HoraDebug()}-${parm.arg}` });
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw', parm, ctrlApiExec);
    res.status(httpStatusCode).json(jsonErrorData);
  }
};