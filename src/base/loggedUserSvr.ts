import { EnvSvrSessionUser } from '../libCommon/envs';

import { HttpCryptoCookieConfig } from '../libServer/httpCryptoCookie';

export const CookieUserConfig = () => {
  const sessionUserConfig = EnvSvrSessionUser();
  return {
    name: 'loggedUser',
    TTLSeconds: sessionUserConfig.ttl_minutes != null ? sessionUserConfig.ttl_minutes * 60 : null,
    psw: sessionUserConfig.psw,
  } as HttpCryptoCookieConfig;
};
