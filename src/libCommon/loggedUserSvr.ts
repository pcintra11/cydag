import { EnvSvrSessionUser } from '../app_base/envs';

import { IHttpCryptoCookieConfig } from '../libServer/httpCryptoCookie';

export const CookieUserConfig = () => {
  const sessionUserConfig = EnvSvrSessionUser();
  return {
    name: 'loggedUser',
    TTLSeconds: sessionUserConfig.ttl_minutes != null ? sessionUserConfig.ttl_minutes * 60 : null,
    psw: sessionUserConfig.psw,
  } as IHttpCryptoCookieConfig; //@!!!!!!!!!!!!!!!!! usar fill
};
