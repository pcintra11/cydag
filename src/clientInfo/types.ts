import WhichBrowser from 'which-browser';

// import WhichBrowser from 'which-browser';
// import IPinfoWrapper from 'node-ipinfo';
// import { IPinfo } from 'node-ipinfo/dist/src/common';
// export interface UserAgentVip {
//   browser: string;
//   os: string;
//   device: string;
//   model: string;
//   isMobile: boolean;
// };

export interface ClientInfoVip {
  browserId: string;
  ipv4: string;
  ipv6: string;
  ipObs: string;
  // ipInfo_org: string;
  // ipInfo_hostname: string;

  browser: string;
  os: string;
  device: string;
  model: string;
  isMobile: boolean;
}

export interface ClientInfo {
  browserId: string;
  ipv4: string;
  ipv6: string;
  //ipInfo: IPinfo;
  ipObs: string;
  //userAgentVip: UserAgentVip;
  userAgentFull: WhichBrowser;
  error?: string;
}