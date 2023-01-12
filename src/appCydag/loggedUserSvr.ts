import { CookieUserConfig } from '../base/loggedUserSvr';

import { EnvDeployConfig } from '../libCommon/envs';
import { ErrorPlus, HttpStatusCode } from '../libCommon/util';
import { ApiDef, CheckRoleAllowed } from '../libCommon/endPoints';

import { HttpCriptoCookieCmdASync } from '../libServer/httpCryptoCookie';
import { CtrlApiExec } from '../libServer/util';

import { UserMd } from './models';
import { LoggedUser } from './loggedUser';
import { User } from './modelTypes';

export const LoggedUserReqASync = async (ctrlApiExec: CtrlApiExec, extendCookieExpiration = false) => {
  const cookieUserConfig = CookieUserConfig();
  const loggedUserStringfy = await HttpCriptoCookieCmdASync(ctrlApiExec, 'LoggedUserReqASync', cookieUserConfig, 'get', { domain: EnvDeployConfig().domain, extendExpiration: extendCookieExpiration });
  const loggedUserReq = loggedUserStringfy != null ? LoggedUser.deserialize(loggedUserStringfy) : null;
  //console.log({ loggedUserReq });
  return loggedUserReq;
};

export const CheckApiAuthorized = (apiDef: ApiDef, userDb: UserMd, email: string) => {
  //console.log({ apiDef, loggedUserReq });
  if (apiDef == null)
    throw new Error('Sem apiDef.');
  // if (!(apiDef.options?.onlyAuthenticated == true || onlyAuthenticatedForced))
  //   return;
  CheckUserAllowed(userDb, email);
  //const loggedUser = await LoggedUserReq(req, res);
  CheckRoleAllowed(apiDef.roles, [...userDb.roles, ...userDb.rolesControlled]);
};

export const CheckUserAllowed = (userDb: UserMd, email: string) => {
  if (userDb == null)
    throw new ErrorPlus(`Conta ${email} não encontrada.`, { data: { fldName: User.F.email }, httpStatusCode: HttpStatusCode.notFound });
  if (!userDb.ativo)
    throw new ErrorPlus(`Conta ${email} não está ativa.`, { httpStatusCode: HttpStatusCode.unAuthorized });
  // if (userDb.ctrl.blockedReason != null)
  //   throw new ErrorPlus('Conta bloqueada.');
};