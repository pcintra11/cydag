import type { NextApiRequest, NextApiResponse } from 'next';

import { getBetterAuthSession } from '../lib/betterAuthSesion';

//import { CookieUserConfig } from '../libCommon/loggedUserSvr';

//import { EnvDeployConfig } from '../app_base/envs';
import { ConcatArrays, ErrorPlus, HttpStatusCode } from '../libCommon/util';
import { ApiDef, CheckRoleAllowed } from '../libCommon/endPoints';
import { cookiesSys } from '../libCommon/cookies_sys';

import cookiesHttp from '../libServer/cookiesHttp';

import { UserMd } from './models';
import { LoggedUser } from './loggedUser';
import { User } from './modelTypes';

export const LoggedUserReqASync = async (req: NextApiRequest, res: NextApiResponse, extendCookieExpiration = false) => {
  //const cookieUserConfig = CookieUserConfig();
  // const loggedUserStringfy = await HttpCriptoCookieCmdASync(req, res, 'LoggedUserReqASync', cookieUserConfig, 'get', { domain: EnvDeployConfig().domain, extendExpiration: extendCookieExpiration });
  const loggedUserStringfyJson = cookiesHttp.get(req, cookiesSys.loggedUser);
  const loggedUserStringfy = loggedUserStringfyJson != '' && loggedUserStringfyJson != null ? JSON.parse(loggedUserStringfyJson) : null;
  let loggedUser = loggedUserStringfy != null ? LoggedUser.deserialize(loggedUserStringfy) : null;
  const betterAuthSession = await getBetterAuthSession(req, res);
  //console.log('LoggedUserReqASync', { betterAuthSession, loggedUser });
  //if (acceptConflict) return { loggedUser, betterAuthSession };
  if (betterAuthSession == null) return null;
  if (betterAuthSession != null && loggedUser != null) {
    if (loggedUser.emailSigned != betterAuthSession.user.email)
      console.log('betterAuthSession.user.email', betterAuthSession.user.email, 'loggedUser.accountSigned', loggedUser.emailSigned);
      loggedUser = null;
  }
  return loggedUser;
};

export const CheckApiAuthorized = (apiDef: ApiDef, userDb: UserMd, email: string) => {
  //console.log({ apiDef, loggedUserReq });
  if (apiDef == null)
    throw new Error('Sem apiDef.');
  // if (!(apiDef.options?.onlyAuthenticated == true || onlyAuthenticatedForced))
  //   return;
  CheckUserAllowed(userDb, email);
  //const loggedUser = await LoggedUserReq(req, res);
  CheckRoleAllowed(apiDef.roles, ConcatArrays(userDb.roles, userDb.rolesControlled));
};

export const CheckUserAllowed = (userDb: UserMd, email: string) => {
  if (userDb == null)
    throw new ErrorPlus(`Conta ${email} não encontrada.`, { data: { fldName: User.F.email }, httpStatusCode: HttpStatusCode.notFound });
  if (!userDb.ativo)
    throw new ErrorPlus(`Conta ${email} não está ativa.`, { httpStatusCode: HttpStatusCode.unAuthorized });
  // if (userDb.blockedReason != null)
  //   throw new ErrorPlus('Conta bloqueada.');
};