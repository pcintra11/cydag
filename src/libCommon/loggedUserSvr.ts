import { EnvSvrSessionUser } from '../app_base/envs';

import { HttpCryptoCookieConfig } from '../libServer/httpCryptoCookie';

export const CookieUserConfig = () => {
  const sessionUserConfig = EnvSvrSessionUser();
  return HttpCryptoCookieConfig.fill({
    name: 'loggedUser',
    TTLSeconds: sessionUserConfig.ttl_minutes != null ? sessionUserConfig.ttl_minutes * 60 : null,
    psw: sessionUserConfig.psw,
  });
};
