import type { NextApiRequest, NextApiResponse } from 'next';

import { auth, cookieBetterAuthSession } from './auth';
import cookiesHttp from '../libServer/cookiesHttp';

export const getBetterAuthSession = async (req: NextApiRequest, res: NextApiResponse) => {
  const cookiesAuth = [cookieBetterAuthSession.data, cookieBetterAuthSession.token];
  const cookieString = cookiesAuth
    .map((name) => `${name}=${cookiesHttp.get(req, name)}`) // decodeURI(
    .join("; ");
  const betterAuthSession = await auth.api.getSession({
    headers: new Headers({ cookie: cookieString })
    //headers: new Headers(req.headers as any),  // não funciona !!
  });
  return betterAuthSession;
}