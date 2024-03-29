import WhichBrowser from 'which-browser';

//import { cookiesSys } from '../libCommon/cookies_sys';

//import { IClientInfo, IClientInfoVip } from './types';

// import { CtrlApiExec } from '../libServer/util';
// import cookiesHttp from '../libServer/cookiesHttp';

//import dns from 'dns';

// function reverseDns(ip) {
//   const promise = new Promise((resolve, reject) => {
//     dns.reverse(ip, (err, domains) => {
//       if (err) {
//         // const xx = ResultErr(err);
//         // csl('err', xx);
//         reject(err);
//       }
//       else
//         resolve(domains);
//     });
//   });
//   return promise;
// }

// export function GetClientInfo(ctrlApiExec: CtrlApiExec) { // , ipsFromClient: { ipv4: string, ipv6: string } = null
//   //ctrlApiExec.ip, ctrlApiExec.ipVersion
//   //let userAgentFull: WhichBrowser = null, // userAgentVip: UserAgentVip = null,
//   //errorProc = null;
//   //const dbgContext = `getCl ${HoraDbg(null)}`;

//   //try {
//   //execTime.start('main');

//   // em chamadas apenas por api (e: imagem em email) vem apenas o IP do request, pois o client não executa a busca do IP

//   //const isMobile = IsMobile(ctrlApiExec.req.headers['user-agent']);

//   // userAgentFull = new UAParser(req.headers['user-agent']).getResult(); // primeiro que usei, não detect outlook
//   // tb bom ua-parser2 (detect outlook)
//   const whichBrowser = new WhichBrowser(ctrlApiExec.req.headers);

//   // userAgentVip = {
//   //   browser: UserAgent_browserDisp(userAgentFull),
//   //   os: UserAgent_osDisp(userAgentFull),
//   //   device: UserAgent_deviceDisp(userAgentFull),
//   //   isMobile: userAgentFull.isMobile(),
//   //   model: userAgentFull.device?.model,
//   // };

//   //dbg(3, dbgContext, execTime.disp('main'));

//   const result: IClientInfo = {
//     browserId: cookiesHttp.get(ctrlApiExec.req, cookiesSys.browserId),
//     // ipv4: ipv4Client,
//     // ipv6: ipv6Client,
//     // //ipv6Prefix,
//     // //ipInfo,
//     // ipObs,
//     //userAgentVip,
//     userAgentFull: whichBrowser,
//   };
//   return result;
//   // } catch (error) {
//   //   //await SystemMsgSvrASync(CategMsgSystem.error, 'GetClientInfo(throw)', error.message, ctrlApiExec);
//   //   errorProc = error.message;
//   // }
//   // if (errorProc != null)
//   //   result.error = errorProc;
//   // return result;
// }

// export function GetIPInfoX(ctrlApiExec: CtrlApiExec, ipsFromClient: { ipv4: string, ipv6: string } = null) {
//   let ipObs = undefined; // , ipv6Prefix = null
//   let ipv4Client = ipsFromClient?.ipv4;
//   let ipv6Client = ipsFromClient?.ipv6;

//   if (ctrlApiExec.ipVersion === 4 &&
//     ipv4Client != null &&
//     ctrlApiExec.ip !== ipv4Client)
//     ipObs = `ip v4 req ${ctrlApiExec.ip} dif client ${ipv4Client}`;
//   if (ctrlApiExec.ipVersion === 6 &&
//     ipv6Client != null &&
//     ctrlApiExec.ip !== ipv6Client)
//     ipObs = `ip v6 req ${ctrlApiExec.ip} dif client ${ipv4Client}`;

//   if (ipv4Client == null &&
//     ctrlApiExec.ipVersion === 4)
//     ipv4Client = ctrlApiExec.ip;
//   if (ipv6Client == null &&
//     ctrlApiExec.ipVersion === 6)
//     ipv6Client = ctrlApiExec.ip;

//   return {
//     ipv4: ipv4Client,
//     ipv6: ipv6Client,
//     ipObs,
//    };
// }

// export function GetClientInfoVip(clientInfoFull: IClientInfo) {
//   //const ipInfoUse = clientInfoFull.ipInfo;
//   let isMobile = false;
//   try {
//     isMobile = clientInfoFull.userAgentFull.isMobile();
//   } catch (error) {
//   }
//   const result: IClientInfoVip = {
//     browserId: clientInfoFull.browserId,
//     // ipv4: clientInfoFull.ipv4,
//     // ipv6: clientInfoFull.ipv6,
//     // ipObs: clientInfoFull.ipObs,
//     // ipInfo_org: ClientInfo_orgDisp(ipInfoUse),
//     // ipInfo_hostname: ipInfoUse?.hostname,
//     browser: UserAgent_browserDisp(clientInfoFull.userAgentFull),
//     os: UserAgent_osDisp(clientInfoFull.userAgentFull),
//     device: UserAgent_deviceDisp(clientInfoFull.userAgentFull),
//     model: clientInfoFull.userAgentFull.device?.model,
//     isMobile,
//   };
//   return result;
// }

export interface BrowserInfoVip {
  browser: string;
  os: string;
  device: string;
  model: string;
  isMobile: boolean;
}
export function GetWhichBrowserInfo(whichBrowser: WhichBrowser) {
  let isMobile = false;
  try {
    isMobile = whichBrowser.isMobile();
  } catch (error) {
  }
  return {
    browser: UserAgent_browserDisp(whichBrowser),
    os: UserAgent_osDisp(whichBrowser),
    device: UserAgent_deviceDisp(whichBrowser),
    model: whichBrowser.device?.model,
    isMobile,
  } as BrowserInfoVip;
}

const UserAgent_osDisp = (whichBrowser: WhichBrowser) => {
  const osComps = [];
  if (whichBrowser.os?.name != null)
    osComps.push(whichBrowser.os?.name);
  if (whichBrowser.os?.version?.value != null)
    osComps.push(`v${whichBrowser.os.version?.value}`);
  else if (typeof whichBrowser.os?.version === 'string') // não sei se tem esse caso
    osComps.push(`v ${whichBrowser.os.version}`);
  return osComps.length > 0 ? osComps.join(' ') : null;
};

const UserAgent_browserDisp = (whichBrowser: WhichBrowser) => {
  const name = whichBrowser.browser?.name;
  if (name == 'Microsoft Office')
    return 'Ms-Office';
  else if (name == 'Microsoft Outlook')
    return 'Ms-Outlook';
  else if (name == 'Samsung Internet')
    return 'Samsung';
  else
    return name;
};
const UserAgent_deviceDisp = (whichBrowser: WhichBrowser) => {
  try {
    const device = whichBrowser.getType();
    if (device == 'mobile:smart')
      return 'smart';
    else
      return device;
  } catch (error) {
    //csl('UserAgent_deviceDisp error', { userAgent })
    return error.message as string;
  }
};

// export const ClientInfo_connection = (clientInfo: ClientInfo) => {
//   const ipInfoUse = clientInfo.ipInfo;
//   return ClientInfo_orgDisp(ipInfoUse) + ' - ' + ipInfoUse?.hostname;
// }

// export const ClientInfo_obs = (clientInfo: ClientInfo) => {
//   const obsItens = [];
//   const ipInfoUse = clientInfo.ipInfo;
//   if (ipInfoUse != null) {
//     // if (ipInfoUse.org != null)
//     //   obsItens.push(`${ClientInfo_orgDisp(ipInfoUse)}`);
//     // if (ipInfoUse.city != null)
//     //   obsItens.push(`${ClientInfo_cityDisp(ipInfoUse)}`);
//     obsItens.push(`${clientInfo.ipv4 || clientInfo.ipv6}`);
//   }
//   if (clientInfo.userAgentVip.device != null)
//     obsItens.push(`${clientInfo.userAgentVip.device}`);
//   if (clientInfo.userAgentVip.browser != null)
//     obsItens.push(`${clientInfo.userAgentVip.browser}`);
//   if (clientInfo.userAgentVip.os != null)
//     obsItens.push(`${clientInfo.userAgentVip.os}`);
//   if (clientInfo.userAgentVip.model != null)
//     obsItens.push(`${clientInfo.userAgentVip.model}`);
//   return obsItens.join('; ');
// }