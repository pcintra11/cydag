import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import URLParse from 'url-parse';
import psl from 'psl';

import { dbg, dbgError, dbgInfo, ScopeDbg } from '../libCommon/dbg';
import { isAmbDev } from '../libCommon/isAmb';

// Essa funcção deve ser chamada ANTES de qquer uso de parm via 'body/json'.
// Se o fetch for por post/json será feito um 'prefetch' para checagem de permissão (sem o body disponivel). 
// Essa função provoca o retorno do prefetch, habilitando a chamada definitiva na sequencia.
export async function CorsMiddlewareAsync(req: NextApiRequest, res: NextApiResponse, whiteList: string[] | null, options: { credentials?: boolean } = {}) {
  //const varsReq = GetVarsReq(req);
  // credentials: Configures the Access-Control-Allow-Credentials CORS header. Set to true to pass the header, otherwise it is omitted. (BLOQUEIA HTTP COOKIES??)
  const urlParsed = URLParse(req.url); // rever se deve ser usado req.url!! @!!!!!
  const apiPath = urlParsed.pathname.replace(/^\/api\//, '');
  const dbgT = (level: number, ...params) => dbg({ level, levelScope: ScopeDbg.t, context: apiPath }, '==> CorsMiddleware', ...params);
  const info = `host: ${req.headers?.host}; url: ${req.url}`;

  const corsOptions: Cors.CorsOptions = {
    //methods: ['GETx', 'HEADx'],
    //'methods': 'GETx,HEAD,PUT,PATCH,POSTx,DELETE',
    origin: function (origin: string, callback) {
      //dbgA(0, `origin ${origin}`);

      // origin vem com o protocolo. Ex: 'https://APPpages.vercel.app'
      // req.headers?.host não vem com o protocolo. Ex: 'backendAPPpages.vercel.app'
      // req.url só vem a parte do caminho do endpoint. Ex: '/api/sys/logSystemMsgClient'

      let originAllowedByDomain = false;
      let originAllowedByHostnamePrefix = false;
      if (origin != null &&
        req.headers?.host != null) {

        const originHostname = URLParse(origin).hostname;
        const apiHostname = req.headers.host.split(':')[0]; // despreza a porta (não dá problema se não tiver a porta)

        const originDomain = psl.get(originHostname);
        const apiDomain = psl.get(apiHostname);
        if (originDomain == apiDomain)
          originAllowedByDomain = true;

        if (apiHostname.startsWith('backend')) { // aceita tb 'backend.'
          const originHostnameAllowedByApiHostnamePrefix = apiHostname.substring(apiHostname.startsWith('backend.') ? 8 : 7);
          //const urlOriginParsed = URLParse('https://APPpages.vercel.app:8080/page1');
          if (originHostname.startsWith(originHostnameAllowedByApiHostnamePrefix))
            originAllowedByHostnamePrefix = true;
        }
      }
      //console.log({ origin });
      let allowed = null;
      if (origin == null)
        allowed = 'serverCall'; // na chamada pelo server esse campo está undefined
      else if (isAmbDev())
        allowed = 'ambDev';
      else if (originAllowedByDomain)
        allowed = 'originAllowedByDomain';
      else if (originAllowedByHostnamePrefix)
        allowed = 'originAllowedByHostnamePrefix';
      else if (whiteList != null &&
        whiteList.indexOf(origin) !== -1)
        allowed = `origin ${origin}`;
      if (allowed == null) {
        dbgError(`CORS origin not allowed - api: ${apiPath} ; origin: ${origin} (${info})`);
        if (whiteList != null)
          dbgInfo(`whiteList: ${whiteList}`);
        const error = new Error(`Host '${origin}' not allowed by CORS (${info}).`);
        //const error = new ErrorPlus(`Host ${origin} not allowed by CORS (${info})`, { httpStatusCode: HttpStatusCode.unAuthorized, managed: false });
        callback(error);
      }
      else {
        dbgT(1, `allowed: ${allowed}`);
        callback(null, true);
      }
    },
    ...options,
  };

  const corsFn = Cors(corsOptions);
  return new Promise((resolve, reject) => {
    corsFn(req, res, (error) => {
      if (error instanceof Error)
        return reject(error);
      return resolve(null);
    });
  });
}