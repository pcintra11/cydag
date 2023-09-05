import IPinfoWrapper from 'node-ipinfo';
import { IPinfo } from 'node-ipinfo/dist/src/common';

import { EnvSvrIpinfo } from '../app_base/envs';

import { IPinfoVip } from './types';

export async function GetIPinfoASync(ip: string) {
  //const result: any = {};
  //try {
  const ipInfoConfig = EnvSvrIpinfo();
  const ipInfoClass = new IPinfoWrapper(ipInfoConfig.token, undefined, Number(ipInfoConfig.timeout));
  //try {
  const ipInfo = await ipInfoClass.lookupIp(ip);
  return ipInfo;
  //} catch (error) {
  //await SystemMsgSvrASync(CategMsgSystem.error, 'GetClientInfo-lookupIpv4', error.message, ctrlApiExec);
  //ipInfo = { error: error.message };
  //}
  // } catch (error) {
  //   await SystemMsgSvrASync(CategMsgSystem.error, 'GetClientInfo(throw)', error.message, ctrlApiExec);
  //   result.error = error.message;
  // }
}

export function GetIPinfoVip(ipInfo: IPinfo) {
  const result: IPinfoVip = {
    org: IPinfo_orgDisp(ipInfo),
    hostname: ipInfo?.hostname,
  };
  return result;
}

export const IPinfo_orgDisp = (ipInfo: IPinfo) => { // era ClientInfo_orgDisp
  if (ipInfo?.org != null &&
    ipInfo?.org.startsWith('AS')) {
    const AS_Number = ipInfo.org.split(' ')[0];
    let operadora = ipInfo.org + ' ';
    operadora = operadora.substr(operadora.indexOf(' '));
    operadora = operadora.toLowerCase();

    operadora = operadora.replace(/ serviços de banda larga(\.)? /, ' ');
    operadora = operadora.replace(/ solucoes de(\.)? /, ' ');
    operadora = operadora.replace(/ soluções de(\.)? /, ' ');
    operadora = operadora.replace(/ telecomunicacoes e informatica(\.)? /, ' ');
    operadora = operadora.replace(/ telecomunicações e informática(\.)? /, ' ');

    operadora = operadora.replace(/ inc(\.)? /, ' ');
    operadora = operadora.replace(/ ltda(\.)? /, ' ');
    operadora = operadora.replace(/ llc(\.)? /, ' ');
    operadora = operadora.replace(/ ltd(\.)? /, ' ');
    operadora = operadora.replace(/ me(\.)? /, ' ');

    operadora = operadora.replace(/ brasil(\.)? /, ' ');
    operadora = operadora.replace(/ communications(\.)? /, ' ');
    operadora = operadora.replace(/ comunicacoes(\.)? /, ' ');
    operadora = operadora.replace(/ comunicacao(\.)? /, ' ');
    operadora = operadora.replace(/ comunicação(\.)? /, ' ');
    operadora = operadora.replace(/ comunicações(\.)? /, ' ');
    operadora = operadora.replace(/ corporation(\.)? /, ' ');
    operadora = operadora.replace(/ eireli(\.)? /, ' ');
    operadora = operadora.replace(/ holdings(\.)? /, ' ');
    operadora = operadora.replace(/ tecnologia(\.)? /, ' ');
    operadora = operadora.replace(/ technologies(\.)? /, ' ');
    operadora = operadora.replace(/ telecom(\.)? /, ' ');
    operadora = operadora.replace(/ telecomunicacoes(\.)? /, ' ');
    operadora = operadora.replace(/ telecomunicações(\.)? /, ' ');

    operadora = operadora.replace(/ s\.a(\.)? /, '');
    operadora = operadora.replace(/ s\/a /, '');
    operadora = operadora.replace(/,/g, '');
    //orgAux = orgAux.replace(/\.$/, '');
    operadora = operadora.trim();
    if (operadora === '')
      operadora = ipInfo.org;
    return `${operadora} (${AS_Number})`;
  }
  else
    return ipInfo?.org;
};
// const IPinfo_cityDisp = (ipInfo: IPinfo) => {
//   let result = ipInfo.city;
//   //if (!['São Paulo', 'Sao Paulo'].includes(ipInfo.city)) {
//   if (ipInfo.region != null)
//     result += ', ' + ipInfo.region;
//   if (ipInfo.countryCode != null)
//     result += ', ' + ipInfo.countryCode;
//   //}
//   return result;
// }