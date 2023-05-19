// módulo atômico: deve ser independente ou dependente apenas de módulos independentes !!!

import { CtrlRecursion } from '../libCommon/ctrlRecursion';
import { CheckProps, PrimitivesType } from '../libCommon/checkProps';
import { OnClient } from '../libCommon/sideProc';
import { csd, dbgWarn } from '../libCommon/dbg';

const _ctrlRecursion: { func: string, ctrlRecursion: CtrlRecursion }[] = [];
const GetCtrlRecursion = (func: string) => {
  let item = _ctrlRecursion.find((x) => x.func == func);
  if (item == null)
    _ctrlRecursion.push(item = { func, ctrlRecursion: new CtrlRecursion(`envs->${func}`, 10) });
  return item.ctrlRecursion;
};


enum Amb {
  dev = 'dev',
  qas = 'qas',
  prd = 'prd',
  //devCompiled = 'devCompiled',
  none = 'none',
}
export function GetAmb() {
  try {
    const amb = Env('amb'); // aqui tá dando erro qdo é chamada notifyAdm - apenas na primeira vez apos compilação @@!!!!! (ordem dos imports!)
    if (amb != Amb.dev &&
      amb != Amb.qas &&
      amb != Amb.prd)
      throw new Error(`amb ${amb} não previsto`);
    return amb;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('GetAmb error', error.message);
    return null;
  }
}
export const isAmbNone = () => (GetAmb() == null);
export const isAmbDev = () => (GetAmb() === Amb.dev); //  || GetAmb() === Amb.devCompiled
//export const isAmbDevCompiled = () => (GetAmb() === Amb.devCompiled);
//export const isAmbQas = () => (GetAmb() === Amb.qas);
export const isAmbPrd = () => (GetAmb() === Amb.prd);

const nullOrObj = (valueStr) => {
  if (valueStr == null)
    return null;
  try {
    return JSON.parse(valueStr);
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.log(`valor JSON '${valueStr}' inválido`);
    return null;
  }
};

export function EnvBlockMsg() {
  let value = process.env.NEXT_PUBLIC_BLOCK_MSG;
  if (value != null &&
    value.trim() === '')
    value = null;
  return value;
}

export function EnvTestSeo() {
  const valueAux = process.env.NEXT_PUBLIC_TEST_SEO;
  if (valueAux != null &&
    valueAux.trim() === 'yes') return true;
  else return false;
}
//export const isLocalhost = () => (EnvDeployConfig().app_url.includes('//localhost'));
export const isLocalHost = () => Env('plataform') === Plataform.localhost;
export const isVercelHost = () => Env('plataform') === Plataform.vercel || Env('plataform') === Plataform.vercelPro;

type EnvName =
  'amb' |
  'emailSupport' |
  'friendlyErrorMsg' |
  'plataform' |
  'supportPhone';

export function Env(envName: EnvName, suffix?: string) {
  const ctrlRecursion = GetCtrlRecursion('Env');
  let thisCallCtrl = null;
  if ((thisCallCtrl = ctrlRecursion.in(envName)) == null) return;

  let value: string = null;

  try {
    if (envName == 'amb') value = process.env.NEXT_PUBLIC_AMB;

    else if (envName == 'supportPhone') value = process.env.NEXT_PUBLIC_SUPPORT_PHONE;
    else if (envName == 'emailSupport') value = process.env.NEXT_PUBLIC_EMAIL_SUPPORT;

    else if (envName == 'plataform') {
      value = process.env.NEXT_PUBLIC_PLATAFORM;
      if (value !== Plataform.localhost &&
        value !== Plataform.vercel &&
        value !== Plataform.vercelPro &&
        value !== Plataform.azure)
        dbgWarn('Env', `env plataform ${value} não prevista`);
    }

    else if (envName == 'friendlyErrorMsg') value = process.env.NEXT_PUBLIC_APP_FRIENDLY_ERROR_MESSAGE;

    else
      throw new Error(`Env(${envName}) não prevista`);

    if (value == null)
      throw new Error(`Env(${envName}) não configurada`);
  } catch (error) {
    ctrlRecursion.out(thisCallCtrl);
    throw new Error(`Env(${envName}), value: ${value}: ${error.message}`);
  }

  ctrlRecursion.out(thisCallCtrl);
  if (suffix == null)
    return value;
  else
    return `${value}_${suffix}`;
}

export function EnvDeveloper() {
  return { email: 'pcintra1@gmail.com', phoneNumber: '11999110101', zipCode: '04662002', streetNumber: '1527' };
}

export function EnvSvrDatabase(database: string) {
  if (isAmbNone()) return null;
  const ctrlRecursion = GetCtrlRecursion('EnvSvrDatabase');
  let thisCallCtrl = null;
  if ((thisCallCtrl = ctrlRecursion.in(database)) == null) return;

  let value: string = null;
  try {
    if (OnClient()) throw new Error(`EnvSvrDatabase(${database}) requisitada no client`);
    //const envVar = envName.replace(/^(database)/,'SITE_DATABASE_');
    const envVar = `SITE_DATABASE_${database.toUpperCase()}`;
    value = process.env[envVar];
  } catch (error) {
    ctrlRecursion.out(thisCallCtrl);
    throw new Error(`EnvSvrDatabase(${database}), value: ${value}: ${error.message}`);
  }
  ctrlRecursion.out(thisCallCtrl);
  return value;
}


export enum Plataform {
  localhost = 'localhost',
  vercel = 'vercel',
  vercelPro = 'vercelPro',
  azure = 'azure',
}

type EnvNameSvr =
  'googleClientKey' |
  'keyScrambleApp';
/**
 * Variáveis string (não objeto)
 */
export function EnvSvr(envName: EnvNameSvr) {
  if (isAmbNone()) return null;
  const ctrlRecursion = GetCtrlRecursion('EnvSvr');
  let thisCallCtrl = null;
  if ((thisCallCtrl = ctrlRecursion.in(envName)) == null) return;
  let value: string = null;
  try {
    if (OnClient())
      throw new Error(`EnvSvr(${envName}) requisitada no client`);
    if (envName == 'googleClientKey') value = process.env.SITE_GOOGLE_CLIENT_KEY;
    else if (envName == 'keyScrambleApp') value = process.env.SITE_KEY_SCRAMBLEAPP;
    else throw new Error(`EnvSvr(${envName}) não prevista`);
    if (value == null)
      throw new Error(`EnvSvr(${envName}) não configurada`);
  } catch (error) {
    ctrlRecursion.out(thisCallCtrl);
    throw error;
  }
  ctrlRecursion.out(thisCallCtrl);
  return value;
}

export function EnvSvrCtrlLog() {
  if (isAmbNone()) return '';
  const value = process.env.SITE_CTRL_LOG;
  return value || '';
}
export function EnvCors() {
  if (isAmbNone()) return [];
  const valueEnv = process.env.SITE_CORS;
  const value = valueEnv == null ? [] : JSON.parse(valueEnv);
  return value;
}

export function EnvInfoHost() {
  const comps = [Env('plataform'), Env('amb')];
  return comps.join('-');
}

//#region client e svr objetos
interface IDeployConfig {
  front_end: boolean;
  back_end: boolean;
  domain: string; // para cookies share entre domain e sub domains
  app_url: string; // com protocol e porta
  api_url: string;
  controlled_access: boolean;
  mode_auth: string;
}
export function EnvDeployConfig() {
  if (isAmbNone()) return {} as IDeployConfig;
  const envName = 'NEXT_PUBLIC_DEPLOY_CONFIG';
  const value: IDeployConfig = nullOrObj(process.env.NEXT_PUBLIC_DEPLOY_CONFIG);
  if (value == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  const errorProp = CheckProps(value, [
    { name: 'front_end', type: PrimitivesType.boolean },
    { name: 'back_end', type: PrimitivesType.boolean },
    { name: 'domain', type: PrimitivesType.string },
    { name: 'app_url', type: PrimitivesType.string },
    { name: 'api_url', type: PrimitivesType.string },
    { name: 'controlled_access', type: PrimitivesType.boolean, optional: true },
    { name: 'mode_auth', type: PrimitivesType.string, optional: true },
  ]);
  if (errorProp != null)
    throw new Error(`Env ${envName} - ${errorProp}`);
  value.domain = value.domain.trim();
  value.app_url = value.app_url.trim();
  value.api_url = value.api_url.trim();
  value.controlled_access = value.controlled_access || false;

  if (value.domain == '')
    value.domain = undefined;

  if (value.front_end == true) {
    if (value.app_url == '')
      throw new Error(`Env(${envName}) - app_url em branco`);
    if (value.back_end == true) {
      if (value.api_url.substring(0, 1) != '*')
        throw new Error(`Env(${envName}): api_url deve ter prefixo *`);
      value.api_url = `${value.app_url}${value.api_url.substring(1)}`;
    }
    else {
      if (value.api_url.substring(0, 1) == '*')
        throw new Error(`Env(${envName}): api_url NÂO deve ter prefixo *`);
    }
  }
  else {
    if (value.app_url != '')
      throw new Error(`Env(${envName}) - app_url não deve ser informada`);
    if (value.api_url != '')
      throw new Error(`Env(${envName}) - api_url não deve ser informada`); //  (é apenas destinatário !)
  }
  // if (value.api_url != '') {
  //   const quebrasBarra = value.api_url.split('/');
  //   value.appUrl_hostDomain = quebrasBarra.length > 2 ? quebrasBarra[2] : null;
  // }
  // else
  //   value.appUrl_hostDomain = '';
  //console.log(`${envName}:`, value);
  return value;
}

interface IMSalConfig {
  client_id: string;
  authority: string;
}
export function EnvMSalConfig() {
  if (isAmbNone()) return {} as IMSalConfig;
  const envName = 'NEXT_PUBLIC_MSAL_CONFIG';
  const value: IMSalConfig = nullOrObj(process.env.NEXT_PUBLIC_MSAL_CONFIG);
  if (value == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  const errorProp = CheckProps(value, [
    { name: 'client_id', type: PrimitivesType.string },
    { name: 'authority', type: PrimitivesType.string },
  ]);
  if (errorProp != null)
    throw new Error(`Env ${envName} - ${errorProp}`);
  value.client_id = value.client_id.trim();
  value.authority = value.authority.trim();
  return value;
}

// interface INivelLog {
//   api: number;
//   db: number;
//   email: number;
//   test: number;
//   commom: number;
// }
// export function EnvNivelLog() {
//   const envName = 'NEXT_PUBLIC_NIVEL_LOG';
//   const value: INivelLog = nullOrObj(process.env.NEXT_PUBLIC_NIVEL_LOG);
//   //if (value == null) throw new Error(`Env ${envName} não configurada ou inválida`);
//   if (value == null) return { api: 0, db: 0, email: 0, test: 0, commom: 0 } as INivelLog;
//   const errorProp = CheckProps(value, [
//     { name: 'api', type: PrimitivesType.number, optional: true },
//     { name: 'db', type: PrimitivesType.number, optional: true },
//     { name: 'email', type: PrimitivesType.number, optional: true },
//     { name: 'test', type: PrimitivesType.number, optional: true },
//     { name: 'commom', type: PrimitivesType.number, optional: true },
//   ]);
//   if (errorProp != null)
//     throw new Error(`Env ${envName} - ${errorProp}`);
//   return value;
// }

interface IApiTimeout {
  exec: number;
  alertCallFromCli: number;
  waitCallFromCli: number;
  waitCallFromSvr: number;
}
export function EnvApiTimeout() {
  const envName = 'NEXT_PUBLIC_API_TIMEOUT';
  const value: IApiTimeout = nullOrObj(process.env.NEXT_PUBLIC_API_TIMEOUT);
  if (value == null) {
    if (Env('plataform') === Plataform.localhost)
      return { exec: 50000, alertCallFromCli: 55000, waitCallFromCli: 60000, waitCallFromSvr: 50000 } as IApiTimeout;
    else if (Env('plataform') === Plataform.vercel)
      return { exec: 10000, alertCallFromCli: 15000, waitCallFromCli: 20000, waitCallFromSvr: 10000 } as IApiTimeout;
    else if (Env('plataform') === Plataform.vercelPro)
      return { exec: 50000, alertCallFromCli: 55000, waitCallFromCli: 60000, waitCallFromSvr: 50000 } as IApiTimeout;
    else if (Env('plataform') === Plataform.azure)
      return { exec: 50000, alertCallFromCli: 55000, waitCallFromCli: 60000, waitCallFromSvr: 50000 } as IApiTimeout;
    else
      return { exec: 10000, alertCallFromCli: 15000, waitCallFromCli: 20000, waitCallFromSvr: 10000 } as IApiTimeout;
  }
  const errorProp = CheckProps(value, [
    { name: 'exec', type: PrimitivesType.number, optional: false },
    { name: 'alertCallFromCli', type: PrimitivesType.number, optional: false },
    { name: 'waitCallFromCli', type: PrimitivesType.number, optional: false },
    { name: 'waitCallFromSvr', type: PrimitivesType.number, optional: false },
  ]);
  if (errorProp != null)
    throw new Error(`Env ${envName} - ${errorProp}`);
  return value;
}

interface ICloudinary {
  cloudName: string;
  folder: string;
  subFolder: string;
}
export function EnvCloudinary() {
  if (isAmbNone()) return {} as ICloudinary;
  const envName = 'NEXT_PUBLIC_CLOUDINARY';
  const value = nullOrObj(process.env.NEXT_PUBLIC_CLOUDINARY) as ICloudinary;
  if (value == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  const errorProp = CheckProps(value, [
    { name: 'cloudName', type: PrimitivesType.string },
    { name: 'folder', type: PrimitivesType.string },
    { name: 'subFolder', type: PrimitivesType.string },
  ]);
  if (errorProp != null)
    throw new Error(`Env ${envName} - ${errorProp}`);
  return value;
}
//#endregion


//#region apenas svr
interface IIpinfo {
  token: string;
  timeout: number;
}
export function EnvSvrIpinfo() {
  const envName = 'SITE_IPINFO';
  if (OnClient()) throw new Error(`EnvSvr (${envName}) requisitada no client`);
  const value: IIpinfo = nullOrObj(process.env.SITE_IPINFO);
  if (value == null) return {} as IIpinfo;
  const errorProp = CheckProps(value, [
    { name: 'token', type: PrimitivesType.string },
    { name: 'timeout', type: PrimitivesType.number },
  ]);
  if (errorProp != null)
    throw new Error(`Env ${envName} - ${errorProp}`);
  return value;
}

export interface IEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string; name: string; };
}
export function EnvSvrEmailConfig() {
  if (isAmbNone()) return {} as IEmailConfig;
  const envName = 'SITE_EMAIL_CONFIG';
  if (OnClient()) throw new Error(`EnvSvr (${envName}) requisitada no client`);
  const value: IEmailConfig = nullOrObj(process.env.SITE_EMAIL_CONFIG);
  if (value == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  const errorProp = CheckProps(value, [
    { name: 'host', type: PrimitivesType.string },
    { name: 'port', type: PrimitivesType.number },
    { name: 'secure', type: PrimitivesType.boolean },
    {
      name: 'auth', type: PrimitivesType.object, propsInObj: [
        { name: 'user', type: PrimitivesType.string },
        { name: 'pass', type: PrimitivesType.string },
        { name: 'name', type: PrimitivesType.string },
      ]
    },
    // {
    //   name: 'replyTo', type: PrimitivesType.object, optional: true, propsInObj: [
    //     { name: 'address', type: PrimitivesType.string },
    //     { name: 'name', type: PrimitivesType.string },
    //   ]
    // },
    // {
    //   name: 'to', type: PrimitivesType.object, optional: true, propsInObj: [
    //     { name: 'address', type: PrimitivesType.string },
    //     { name: 'name', type: PrimitivesType.string },
    //   ]
    // },
  ]);
  if (errorProp != null)
    throw new Error(`Env ${envName} - ${errorProp}`);
  return value;
}

interface ICloudinaryAccount {
  key: string;
  secret: string;
}
export function EnvSvrCloudinaryAccount() {
  if (isAmbNone()) return {} as ICloudinaryAccount;
  const envName = 'SITE_CLOUDINARY_APIACCOUNT';
  if (OnClient()) throw new Error(`EnvSvr (${envName}) requisitada no client`);
  const value: ICloudinaryAccount = nullOrObj(process.env.SITE_CLOUDINARY_APIACCOUNT);
  if (value == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  const errorProp = CheckProps(value, [
    { name: 'key', type: PrimitivesType.string },
    { name: 'secret', type: PrimitivesType.string },
  ]);
  if (errorProp != null)
    throw new Error(`Env ${envName} - ${errorProp}`);
  return value;
}

interface IMobizon {
  domain: string;
  api_key: string;
}
export function EnvSvrMobizon() {
  if (isAmbNone()) return {} as IMobizon;
  const envName = 'SITE_MOBIZON';
  if (OnClient()) throw new Error(`EnvSvr (${envName}) requisitada no client`);
  const value: IMobizon = nullOrObj(process.env.SITE_MOBIZON);
  if (value == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  const errorProp = CheckProps(value, [
    { name: 'domain', type: PrimitivesType.string },
    { name: 'api_key', type: PrimitivesType.string },
  ]);
  if (errorProp != null)
    throw new Error(`Env ${envName} - ${errorProp}`);
  return value;
}

interface ISessionUser {
  psw: string;
  ttl_minutes: number;
}
export function EnvSvrSessionUser() {
  const envName = 'SITE_SESSION_USER';
  if (OnClient()) throw new Error(`EnvSvr (${envName}) requisitada no client`);
  const value: ISessionUser = nullOrObj(process.env.SITE_SESSION_USER);
  if (value == null) return {} as ISessionUser;
  const errorProp = CheckProps(value, [
    { name: 'psw', type: PrimitivesType.string },
    { name: 'ttl_minutes', type: PrimitivesType.number, optional: true },
  ]);
  if (errorProp != null)
    throw new Error(`Env ${envName} - ${errorProp}`);
  return value;
}
//#endregion