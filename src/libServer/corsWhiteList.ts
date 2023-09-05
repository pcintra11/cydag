import { csd } from '../libCommon/dbg';

import { EnvCors, EnvDeployConfig, isLocalHost } from '../app_base/envs';

export function CorsWhitelist(): string[] {
  // se o domain da api for 'backendXXX.abc*' - aceita 'XXX.abc*'   (ex: backendAPP.vercel.app -> aceita APP.vercel.app)
  // se o domain da api for 'backend.abc*' - aceita 'abc*'   (ex: backend.APP.com.br => aceita APP.com.br)
  const appUrl = EnvDeployConfig().app_url;

  const corsWhitelist = EnvCors();
  appUrl != '' && corsWhitelist.push(appUrl);
  if (!isLocalHost()) {
    const compsUrl = appUrl.split('//');
    if (compsUrl.length == 2 &&
      !compsUrl[1].startsWith('www'))
      corsWhitelist.push(`${compsUrl[0]}//www.${compsUrl[1]}`);
  }
  //csl('corsWhitelist', corsWhitelist.join(', '));

  // const appName = configApp.appName.toLowerCase();
  // if (isAmbDev())
  //   result = [
  //     'http://localhost:3001',
  //     'http://localhost:3002',
  //     'http://localhost:3003',
  //     'http://localhost:3004',
  //     'http://localhost:3005',
  //   ];
  // else if (isAmbDevCompiled())
  //   result = [
  //     'http://localhost:3101',
  //     'http://localhost:3102',
  //     'http://localhost:3103',
  //     'http://localhost:3104',
  //     'http://localhost:3105',
  //   ];
  // else if (isAmbQas() || isAmbPrd()) {
  //   const knowSubDomains = [appName];
  //   if (isAmbQas())
  //     result = [
  //       //...knowSubDomains.map(x => `https://${x}-git-test-pcintra11.vercel.app`),
  //       ...knowSubDomains.map(x => `https://${x}-tst.vercel.app`),
  //       //...knowSubDomains.map(x => `https://${x}-tst.netlify.app`),
  //       `https://tst.${appName}.com.br`,
  //     ];
  //   else if (isAmbPrd())
  //     result = [
  //       ...knowSubDomains.map(x => `https://${x}.vercel.app`),
  //       //...knowSubDomains.map(x => `https://${x}.netlify.app`),
  //       `https://${appName}.com.br`,
  //       // 'https://moradores.site', @@@
  //     ];
  // }

  return corsWhitelist;
}