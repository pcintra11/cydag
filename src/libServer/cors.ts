import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import URLParse from 'url-parse';
import psl from 'psl';

import { csd, csl, dbg, dbgError, dbgInfo, ScopeDbg } from '../libCommon/dbg';
import { HttpStatusCode } from '../libCommon/util';
import { CtrlContext } from '../libCommon/ctrlContext';
import { EnvSvrCtrlLog } from '../app_base/envs';
//import { isAmbDev } from '../libCommon/envs';

// Essa função deve ser chamada ANTES de qualquer uso de parm via 'body/json', pois será processada pelo método 'OPTIONS' (não GET ou POST)
// Se o fetch for por post/json será feito um 'prefetch' para checagem de permissão (sem o body disponível). 
// Essa função provoca o retorno do prefetch, habilitando a chamada definitiva na sequencia.
export async function CorsMiddlewareAsync(req: NextApiRequest, res: NextApiResponse, whiteList: string[] | null, options: { credentials?: boolean } = {}) {
  //const varsReq = GetVarsReq(req);
  // credentials: Configures the Access-Control-Allow-Credentials CORS header. Set to true to pass the header, otherwise it is omitted. (BLOQUEIA HTTP COOKIES??)
  const urlParsed = URLParse(req.url); // rever se deve ser usado req.url!! @!!!!!
  const apiPath = urlParsed.pathname.replace(/^\/api\//, '');
  const dbgX = (level: number, ...params) => dbg({ level, point: 'CorsMiddleware', scopeMsg: ScopeDbg.x, ctrlContext: new CtrlContext(apiPath, { ctrlLog: EnvSvrCtrlLog() }) }, ...params);

  const corsOptions: Cors.CorsOptions = {
    //methods: ['GETx', 'HEADx'],
    //'methods': 'GETx,HEAD,PUT,PATCH,POSTx,DELETE',
    origin: function (origin: string, callback) {
      const memoryProc = [];
      const info = `apiPath: ${apiPath}; url: ${req.url}; origin: ${origin}`;
      memoryProc.push('================================');
      memoryProc.push(info);

      // origin 
      // - vem com o protocolo. Ex: 'https://APPpages.vercel.app'
      // - na chamada direta da API pelo browser vem como nulo
      // - na chamada server => server vem como nulo

      // req.headers?.host não vem com o protocolo. Ex: 'backendAPPpages.vercel.app'
      // req.url só vem a parte do caminho do endpoint. Ex: '/api/sys/logSystemMsgClient'

      let originAllowedByDomain = false;
      //let originAllowedByHostnamePrefix = false;
      if (origin != null &&
        req.headers?.host != null) {

        const originHostname = URLParse(origin).hostname;
        const apiHostname = req.headers.host.split(':')[0]; // despreza a porta (não dá problema se não tiver a porta)

        memoryProc.push(`originHostname: ${originHostname}, apiHostname: ${apiHostname}`);
        const originDomain = psl.get(originHostname);
        const apiDomain = psl.get(apiHostname);
        memoryProc.push(`originDomain: ${originDomain}, apiDomain: ${apiDomain}`);
        if (originDomain == apiDomain) // @!!!!! testar com sub domains
          originAllowedByDomain = true;

        // if (apiHostname.startsWith('backend')) { // aceita tb 'backend.'
        //   const originHostnameAllowedByApiHostnamePrefix = apiHostname.substring(apiHostname.startsWith('backend.') ? 8 : 7);
        //   //const urlOriginParsed = URLParse('https://APPpages.vercel.app:8080/page1');
        //   if (originHostname.startsWith(originHostnameAllowedByApiHostnamePrefix))
        //     originAllowedByHostnamePrefix = true;
        // }
      }
      //csl({ origin });
      let allowed = null;
      // if (origin === undefined) 
      //   allowed = 'serverCall'; // na chamada pelo server esse campo está undefined pelo browser tb
      // else if (isAmbDev())
      //   allowed = 'ambDev';
      // else 
      // else if (originAllowedByHostnamePrefix)
      //   allowed = 'originAllowedByHostnamePrefix';
      if (whiteList != null &&
        whiteList.indexOf(origin) !== -1)
        allowed = 'originAllowedByWhiteList';
      else if (originAllowedByDomain)
        allowed = 'originAllowedByDomain';

      if (allowed == null) {
        dbgError('CorsMiddleware', `CORS origin not allowed: ${info}`);
        if (whiteList != null)
          dbgInfo('CorsMiddleware', `whiteList: ${whiteList.join(', ')}`);
        const error = new Error(`Host '${origin}' not allowed by CORS`);
        memoryProc.forEach((x) => csl(x));
        callback(error);
      }
      else {
        dbgX(1, `CORS allowed: ${allowed} (${info})`);
        callback(null, true);
      }
    },
    ...options,
  };

  const corsFn = Cors(corsOptions);
  return new Promise((resolve, reject) => {
    corsFn(req, res, (error) => {
      if (error instanceof Error) {
        res.status(HttpStatusCode.forbidden).json({ value: { msg: error.message } });
        return reject(error);
      }
      return resolve(null);
    });
  });
}