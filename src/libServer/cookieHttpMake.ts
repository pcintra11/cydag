import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

import { isAmbDev } from '../app_base/envs';

const maxAgeSecondsCookiesBiggest = 400 * 24 * 60 * 60;

export const CookieHttpMake = (cookieName: string, cookieValue: string | null, options: { httpOnly: boolean }) => {
  let valueUse, props: any = {};
  if (cookieValue === null) {
    valueUse = 'deleted';
    props = { maxAge: 0 };
  }
  else {
    valueUse = cookieValue;
    props = { maxAge: maxAgeSecondsCookiesBiggest };
  }
  const responseCookie = {
    name: cookieName,
    value: valueUse,
    //domain: AppEnvDeployConfig().domain,
    httpOnly: options.httpOnly,
    path: '/',
    sameSite: 'lax',
    secure: !isAmbDev(),
    ...props,
  } as ResponseCookie;
  return responseCookie;
}