import { csd, dbgError } from './dbg';
import { isAmbNone } from './isAmb';
import { CheckProps, CtrlRecursion, OnClient, PrimitivesType, StrLeft } from './util';

const _ctrlRecursion: { func: string, ctrlRecursion: CtrlRecursion }[] = [];
const GetCtrlRecursion = (func: string) => {
  let item = _ctrlRecursion.find((x) => x.func == func);
  if (item == null)
    _ctrlRecursion.push(item = { func, ctrlRecursion: new CtrlRecursion(`envs->${func}`, 10) });
  return item.ctrlRecursion;
};

const nullOrObj = (valueStr) => {
  if (valueStr == null)
    return null;
  try {
    return JSON.parse(valueStr);
  }
  catch (error) {
    dbgError(`valor JSON '${valueStr}' inválido`);
    return null;
  }
};

export const isLocalhost = () => (EnvDeployConfig().app_url.includes('//localhost'));

type EnvName =
  'amb' |
  'blockMsg' |
  'appName' |
  'appVersion' |
  'cloudinaryCloudName' |
  'emailSupport' |
  'friendlyErrorMsg' |
  'supportPhone';
type EnvNameSvr =
  'googleClientKey' |
  'plataform';

export function Env(envName: EnvName, suffix?: string) {
  const ctrlRecursion = GetCtrlRecursion('Env');
  if (ctrlRecursion.inExceeded(envName)) return;

  let value: string = null;

  try {
    if (envName == 'amb')
      value = process.env.NEXT_PUBLIC_AMB;
    else if (envName == 'blockMsg')
      value = process.env.NEXT_PUBLIC_BLOCK_MSG;

    else if (envName == 'appName')
      value = process.env.NEXT_PUBLIC_APP_NAME;
    else if (envName == 'appVersion')
      value = process.env.NEXT_PUBLIC_APP_VERSION;

    else if (envName == 'supportPhone')
      value = process.env.NEXT_PUBLIC_SUPPORT_PHONE;
    else if (envName == 'emailSupport')
      value = process.env.NEXT_PUBLIC_EMAIL_SUPPORT;

    else if (envName == 'cloudinaryCloudName') {
      value = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUDNAME;
      // valueStr = process.env.NEXT_PUBLIC_CLOUDINARY_INFO;
      // value = nullOrObj(valueStr);
      // if (value != null) {
      //   const errorProp = CheckProps(value, [
      //     { name: 'cloud_name', type: PrimitivesType.string },
      //     { name: 'folder_avatar', type: PrimitivesType.string },
      //     { name: 'folder_business', type: PrimitivesType.string },
      //   ]);
      //   if (errorProp != null)
      //     throw new Error(`Env(${name}): prop ${errorProp}`);
      // }
    }

    else if (envName == 'friendlyErrorMsg')
      value = process.env.NEXT_PUBLIC_APP_FRIENDLY_ERROR_MESSAGE;

    else
      throw new Error(`Env(${envName}) não prevista`);

    if (value == null &&
      (envName == 'amb' ||
        envName == 'appName' ||
        envName == 'appVersion' ||

        envName == 'cloudinaryCloudName' ||
        envName == 'emailSupport' ||
        envName == 'supportPhone'))
      throw new Error(`Env(${envName}) não configurada`);
  } catch (error) {
    ctrlRecursion.out();
    throw new Error(`Env(${envName}), value: ${value}: ${error.message}`);
  }

  ctrlRecursion.out();
  if (suffix == null)
    return value;
  else
    return `${value}_${suffix}`;
}

export function EnvDeveloper() {
  return { email: 'pcintra1@gmail.com', phoneNumber: '11999110101' };
}

export function EnvSvrDatabase(database: string) {
  if (isAmbNone()) return null;
  const ctrlRecursion = GetCtrlRecursion('EnvSvrDatabase');
  if (ctrlRecursion.inExceeded(database)) return;
  let value: string = null;
  try {
    if (OnClient()) throw new Error(`EnvSvrDatabase(${database}) requisitada no client`);
    //const envVar = envName.replace(/^(database)/,'SITE_DATABASE_');
    const envVar = `SITE_DATABASE_${database.toUpperCase()}`;
    value = process.env[envVar];
  } catch (error) {
    ctrlRecursion.out();
    throw new Error(`EnvSvrDatabase(${database}), value: ${value}: ${error.message}`);
  }
  ctrlRecursion.out();
  return value;
}


export function EnvSvr(envName: EnvNameSvr) {
  if (isAmbNone()) return null;
  const ctrlRecursion = GetCtrlRecursion('EnvSvr');
  if (ctrlRecursion.inExceeded(envName)) return;
  let value: string = null;
  try {
    if (OnClient())
      throw new Error(`EnvSvr(${envName}) requisitada no client`);
    if (envName == 'plataform')
      value = process.env.SITE_PLATAFORM;
    else if (envName == 'googleClientKey')
      value = process.env.SITE_GOOGLE_CLIENT_KEY;
    else
      throw new Error(`EnvSvr(${envName}) não prevista`);
    if (value == null)
      throw new Error(`EnvSvr(${envName}) não configurada`);
  } catch (error) {
    ctrlRecursion.out();
    throw new Error(`EnvSvr(${envName}), value: ${value}: ${error.message}`);
  }
  ctrlRecursion.out();
  return value;
}

//#region client e svr
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
      if (StrLeft(value.api_url, 1) != '*')
        throw new Error(`Env(${envName}): api_url deve ter prefixo *`);
      value.api_url = `${value.app_url}${value.api_url.substring(1)}`;
    }
    else {
      if (StrLeft(value.api_url, 1) == '*')
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

interface INivelLog {
  api: number;
  db: number;
  email: number;
  test: number;
  commom: number;
}
export function EnvNivelLog() {
  const envName = 'NEXT_PUBLIC_NIVEL_LOG';
  const value: INivelLog = nullOrObj(process.env.NEXT_PUBLIC_NIVEL_LOG);
  //if (value == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  if (value == null) return { api: 0, db: 0, email: 0, test: 0, commom: 0 } as INivelLog;
  const errorProp = CheckProps(value, [
    { name: 'api', type: PrimitivesType.number, optional: true },
    { name: 'db', type: PrimitivesType.number, optional: true },
    { name: 'email', type: PrimitivesType.number, optional: true },
    { name: 'test', type: PrimitivesType.number, optional: true },
    { name: 'commom', type: PrimitivesType.number, optional: true },
  ]);
  if (errorProp != null)
    throw new Error(`Env ${envName} - ${errorProp}`);
  return value;
}

interface IApiTimeout {
  exec: number;
  alertCallFromCli: number;
  waitCallFromCli: number;
  waitCallFromSvr: number;
}
export function EnvApiTimeout() {
  const envName = 'NEXT_PUBLIC_API_TIMEOUT';
  const value: IApiTimeout = nullOrObj(process.env.NEXT_PUBLIC_API_TIMEOUT);
  if (value == null) return { exec: 0, alertCallFromCli: 0, waitCallFromCli: 0, waitCallFromSvr: 0 } as IApiTimeout;
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