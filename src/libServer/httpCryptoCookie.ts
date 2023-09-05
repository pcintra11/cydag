import type { NextApiRequest, NextApiResponse } from 'next';
import type { CookieSerializeOptions } from 'cookie';
import { Session, applySession, SessionOptions } from 'next-iron-session';

import { CutUndef, FillClassProps } from '../libCommon/util';

import { isAmbDev } from '../app_base/envs';
import { csd } from '../libCommon/dbg';

interface INextApiRequestSession extends NextApiRequest {
  session: Session;
}
// type NextApiResponseSession = NextApiResponse & {
//   session: Session
// };

export const CookieSession_fldFixed = 'value';

export class HttpCryptoCookieConfig {
  name?: string;
  TTLSeconds?: number;
  psw?: string;
  static new() { return new HttpCryptoCookieConfig(); }
  static fill(values: HttpCryptoCookieConfig) { return CutUndef(FillClassProps(HttpCryptoCookieConfig.new(), values)); }
}

export async function HttpCriptoCookieCmdASync(req: NextApiRequest, res: NextApiResponse, point: string,
  cookieSessionConfig: HttpCryptoCookieConfig, cmd: 'set' | 'get', options: { extendExpiration?: boolean, domain?: string }, value?: any) {
  const cookieOptions: CookieSerializeOptions = {
    // the next line allows to use the session in non-https environments like
    // Next.js dev mode (http://localhost:xxx)
    secure: isAmbDev() ? false : true,
    //secure: process.env.NODE_ENV === 'production' ? true : false,
    domain: options.domain,
    sameSite: isAmbDev() ? 'lax' : 'none', //; testar em todos os navegadores (localhost/dev e web/tst) @@!!!!!!
  };

  // if (cmd == 'set' &&
  //   value == null) //@@@!!! em algum momento está 'matando' o loggedUser
  //   dbgWarn('HttpCriptoCookieCmd', { caller: context, cmd, cookie: cookieSessionConfig.name, value: value == null ? null : 'notNull' });

  const reqSession = req as INextApiRequestSession;

  //try {
  await applySession(req, res, { //@!!!!!!!!!!! atualizar e usar o novo método Next.js middlewares
    password: cookieSessionConfig.psw,
    cookieName: cookieSessionConfig.name,
    cookieOptions,
    ttl: (cookieSessionConfig.TTLSeconds != null ? cookieSessionConfig.TTLSeconds + 60 : 0), // parece que ele 'come' 60 segs !!
  } as SessionOptions);

  if (cmd == 'set') {
    //csl({ api: `${ctrlApiExec.apiPath}(point ${point}):${JSON.stringify(ctrlApiExec.parm)}`, cmd, cookieSessionConfig, options, cookieOptions, valueSet: value });
    if (value != null) {
      reqSession.session.set(CookieSession_fldFixed, value);
      const result = await reqSession.session.save();
      // csd('CookieSessionCmd ******************* set', JSON.stringify(value));
      //csd('HttpCriptoCookieCmdASync - set', result);
    }
    else {
      reqSession.session.destroy();
      //csd('HttpCriptoCookieCmdASync - set - destroy');
    }
    return null;
  }
  else if (cmd == 'get') {
    let value = reqSession.session.get(CookieSession_fldFixed);
    if (value != null) {
      if (options.extendExpiration == true)
        await reqSession.session.save();
    }
    else
      value = null;
    //csd('HttpCriptoCookieCmdASync - get', CookieSession_fldFixed, value);
    return value;
  }
  // else if (cmd == GlobalStateCmd.renew) { // apenas extender o tempo de vida do cookie
  //   let value = reqSession.session.get(CookieSession_fldFixed);
  //   if (value)
  //     await reqSession.session.save();
  //   //csl('CookieSessionCmd renew');
  //   return null;
  // }
  else
    throw new Error(`cmd ${cmd} inválido`);
  // } catch (error) {
  //   //csl('CookieSessionCmd', error);
  //   throw error;
  // }
}