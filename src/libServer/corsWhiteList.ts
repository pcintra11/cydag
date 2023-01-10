import { Env } from '../libCommon/envs';

import { isAmbDev, isAmbDevCompiled, isAmbQas, isAmbPrd } from '../libCommon/isAmb';

export function CorsWhitelist(): string[] {
  let result = [];
  // se o domain da api for 'backendXXX.abc*' - aceita 'XXX.abc*'   (ex: backendAPP.vercel.app -> aceita APP.vercel.app)
  // se o domain da api for 'backend.abc*' - aceita 'abc*'   (ex: backend.APP.com.br => aceita APP.com.br)

  const appName = Env('appName').toLowerCase();

  if (isAmbDev())
    result = [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
    ];
  else if (isAmbDevCompiled())
    result = [
      'http://localhost:3101',
      'http://localhost:3102',
      'http://localhost:3103',
      'http://localhost:3104',
      'http://localhost:3105',
    ];
  else if (isAmbQas() || isAmbPrd()) {
    const knowSubDomains = [appName];
    if (isAmbQas())
      result = [
        //...knowSubDomains.map(x => `https://${x}-git-test-pcintra11.vercel.app`),
        ...knowSubDomains.map(x => `https://${x}-tst.vercel.app`),
        //...knowSubDomains.map(x => `https://${x}-tst.netlify.app`),
        `https://tst.${appName}.com.br`,
      ];
    else if (isAmbPrd())
      result = [
        ...knowSubDomains.map(x => `https://${x}.vercel.app`),
        //...knowSubDomains.map(x => `https://${x}.netlify.app`),
        `https://${appName}.com.br`,
        // 'https://moradores.site', @@@
      ];
  }
  // @!!!!!! testar no vercel vz e outros

  //result.push('http://localhost:3002');
  return result;
}