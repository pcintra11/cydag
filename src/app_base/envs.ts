// módulo atômico: deve ser independente ou dependente apenas de módulos independentes !!!

import { CtrlRecursion } from '../libCommon/ctrlRecursion';
import { CheckProps, PrimitivesType } from '../libCommon/checkProps';
import { OnClient } from '../libCommon/sideProc';
import { csd, dbgWarn } from '../libCommon/dbg';
import { CutUndef, FillClassProps } from '../libCommon/util';

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
function GetAmb() {
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
  } catch (error) {
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
      throw new Error('Variável não prevista');

    if (value == null)
      throw new Error('Valor obrigatório');
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
    if (OnClient()) throw new Error('Variável server requisitada no client');
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
    if (OnClient()) throw new Error('Variável server requisitada no client');
    if (envName == 'googleClientKey') value = process.env.SITE_GOOGLE_CLIENT_KEY;
    else if (envName == 'keyScrambleApp') value = process.env.SITE_KEY_SCRAMBLEAPP;
    else throw new Error('Variável não prevista');
    if (value == null) throw new Error('Variável obrigatória');
  } catch (error) {
    ctrlRecursion.out(thisCallCtrl);
    throw new Error(`EnvSvr(${envName}), value: ${value}: ${error.message}`);
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
class DeployConfig {
  front_end?: boolean;
  back_end?: boolean;
  domain?: string; // para cookies share entre domain e sub domains
  app_url?: string; // com protocol e porta
  api_url?: string;
  controlled_access?: boolean;
  mode_auth?: string;
  static new() { return new DeployConfig(); }
  static fill(values: DeployConfig) { return CutUndef(FillClassProps(DeployConfig.new(), values)); }
}
export function EnvDeployConfig() {
  if (isAmbNone()) return DeployConfig.new();
  const envName = 'NEXT_PUBLIC_DEPLOY_CONFIG';
  const valueAux = nullOrObj(process.env.NEXT_PUBLIC_DEPLOY_CONFIG);
  if (valueAux == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  const errorProp = CheckProps(valueAux, [
    { name: 'front_end', type: PrimitivesType.boolean },
    { name: 'back_end', type: PrimitivesType.boolean },
    { name: 'domain', type: PrimitivesType.string },
    { name: 'app_url', type: PrimitivesType.string },
    { name: 'api_url', type: PrimitivesType.string },
    { name: 'controlled_access', type: PrimitivesType.boolean, optional: true },
    { name: 'mode_auth', type: PrimitivesType.string, optional: true },
  ]);
  if (errorProp != null) throw new Error(`Env ${envName} - ${errorProp}`);

  const value = DeployConfig.fill({
    front_end: valueAux.front_end,
    back_end: valueAux.back_end,
    domain: valueAux.domain.trim(),
    app_url: valueAux.app_url.trim(),
    api_url: valueAux.api_url.trim(),
    controlled_access: valueAux.controlled_access || false,
    mode_auth: valueAux.mode_auth,
  });
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

class MSalConfig {
  client_id?: string;
  authority?: string;
  static new() { return new MSalConfig(); }
  static fill(values: MSalConfig) { return CutUndef(FillClassProps(MSalConfig.new(), values)); }
}
export function EnvMSalConfig() {
  if (isAmbNone()) return MSalConfig.new();
  const envName = 'NEXT_PUBLIC_MSAL_CONFIG';
  const valueAux = nullOrObj(process.env.NEXT_PUBLIC_MSAL_CONFIG);
  if (valueAux == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  const errorProp = CheckProps(valueAux, [
    { name: 'client_id', type: PrimitivesType.string },
    { name: 'authority', type: PrimitivesType.string },
  ]);
  if (errorProp != null) throw new Error(`Env ${envName} - ${errorProp}`);
  const value = MSalConfig.fill({
    client_id: valueAux.client_id.trim(),
    authority: valueAux.authority.trim(),
  });
  return value;
}

class ApiTimeout {
  exec?: number;
  alertCallFromCli?: number;
  waitCallFromCli?: number;
  waitCallFromSvr?: number;
  static new() { return new ApiTimeout(); }
  static fill(values: ApiTimeout) { return CutUndef(FillClassProps(ApiTimeout.new(), values)); }
}
export function EnvApiTimeout() {
  const envName = 'NEXT_PUBLIC_API_TIMEOUT';
  const valueAux: ApiTimeout = nullOrObj(process.env.NEXT_PUBLIC_API_TIMEOUT);
  if (valueAux == null) {
    if (Env('plataform') === Plataform.localhost)
      return ApiTimeout.fill({ exec: 50000, alertCallFromCli: 55000, waitCallFromCli: 60000, waitCallFromSvr: 50000 });
    else if (Env('plataform') === Plataform.vercel)
      return ApiTimeout.fill({ exec: 10000, alertCallFromCli: 15000, waitCallFromCli: 20000, waitCallFromSvr: 10000 });
    else if (Env('plataform') === Plataform.vercelPro)
      return ApiTimeout.fill({ exec: 50000, alertCallFromCli: 55000, waitCallFromCli: 60000, waitCallFromSvr: 50000 });
    else if (Env('plataform') === Plataform.azure)
      return ApiTimeout.fill({ exec: 50000, alertCallFromCli: 55000, waitCallFromCli: 60000, waitCallFromSvr: 50000 });
    else
      return ApiTimeout.fill({ exec: 10000, alertCallFromCli: 15000, waitCallFromCli: 20000, waitCallFromSvr: 10000 });
  }
  const errorProp = CheckProps(valueAux, [
    { name: 'exec', type: PrimitivesType.number, optional: false },
    { name: 'alertCallFromCli', type: PrimitivesType.number, optional: false },
    { name: 'waitCallFromCli', type: PrimitivesType.number, optional: false },
    { name: 'waitCallFromSvr', type: PrimitivesType.number, optional: false },
  ]);
  if (errorProp != null) throw new Error(`Env ${envName} - ${errorProp}`);
  return ApiTimeout.fill(valueAux);
}

class Cloudinary {
  cloudName?: string;
  folder?: string;
  subFolder?: string;
  static new() { return new Cloudinary(); }
  static fill(values: Cloudinary) { return CutUndef(FillClassProps(Cloudinary.new(), values)); }
}
export function EnvCloudinary() {
  if (isAmbNone()) return Cloudinary.new();
  const envName = 'NEXT_PUBLIC_CLOUDINARY';
  const valueAux = nullOrObj(process.env.NEXT_PUBLIC_CLOUDINARY);
  if (valueAux == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  const errorProp = CheckProps(valueAux, [
    { name: 'cloudName', type: PrimitivesType.string },
    { name: 'folder', type: PrimitivesType.string },
    { name: 'subFolder', type: PrimitivesType.string },
  ]);
  if (errorProp != null) throw new Error(`Env ${envName} - ${errorProp}`);
  return Cloudinary.fill(valueAux);
}
//#endregion


//#region apenas svr
class Ipinfo {
  token?: string;
  timeout?: number;
  static new() { return new Ipinfo(); }
  static fill(values: Ipinfo) { return CutUndef(FillClassProps(Ipinfo.new(), values)); }
}
export function EnvSvrIpinfo() {
  const envName = 'SITE_IPINFO';
  if (OnClient()) throw new Error(`EnvSvr (${envName}) requisitada no client`);
  const valueAux = nullOrObj(process.env.SITE_IPINFO);
  //if (valueAux == null) Ipinfo.new();
  if (valueAux == null) return Ipinfo.fill({ token: '49bbb470525ee2', timeout: 5000 }); //#!!!!!!!!
  const errorProp = CheckProps(valueAux, [
    { name: 'token', type: PrimitivesType.string },
    { name: 'timeout', type: PrimitivesType.number },
  ]);
  if (errorProp != null) throw new Error(`Env ${envName} - ${errorProp}`);
  return Ipinfo.fill(valueAux);
}

export class EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: { user: string; pass: string; name: string; };
  static new() { return new EmailConfig(); }
  static fill(values: EmailConfig) { return CutUndef(FillClassProps(EmailConfig.new(), values)); }
}
export function EnvSvrEmailConfig() {
  if (isAmbNone()) return EmailConfig.new();
  const envName = 'SITE_EMAIL_CONFIG';
  if (OnClient()) throw new Error(`EnvSvr (${envName}) requisitada no client`);
  const valueAux = nullOrObj(process.env.SITE_EMAIL_CONFIG);
  if (valueAux == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  const errorProp = CheckProps(valueAux, [
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
  if (errorProp != null) throw new Error(`Env ${envName} - ${errorProp}`);
  return EmailConfig.fill(valueAux);
}

class CloudinaryAccount {
  key?: string;
  secret?: string;
  static new() { return new CloudinaryAccount(); }
  static fill(values: CloudinaryAccount) { return CutUndef(FillClassProps(CloudinaryAccount.new(), values)); }
}
export function EnvSvrCloudinaryAccount() {
  if (isAmbNone()) return CloudinaryAccount.new();
  const envName = 'SITE_CLOUDINARY_APIACCOUNT';
  if (OnClient()) throw new Error(`EnvSvr (${envName}) requisitada no client`);
  const valueAux = nullOrObj(process.env.SITE_CLOUDINARY_APIACCOUNT);
  if (valueAux == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  const errorProp = CheckProps(valueAux, [
    { name: 'key', type: PrimitivesType.string },
    { name: 'secret', type: PrimitivesType.string },
  ]);
  if (errorProp != null) throw new Error(`Env ${envName} - ${errorProp}`);
  return CloudinaryAccount.fill(valueAux);
}

class Mobizon {
  domain?: string;
  api_key?: string;
  static new() { return new Mobizon(); }
  static fill(values: Mobizon) { return CutUndef(FillClassProps(Mobizon.new(), values)); }
}
export function EnvSvrMobizon() {
  if (isAmbNone()) return Mobizon.new();
  const envName = 'SITE_MOBIZON';
  if (OnClient()) throw new Error(`EnvSvr (${envName}) requisitada no client`);
  const valueAux = nullOrObj(process.env.SITE_MOBIZON);
  if (valueAux == null) throw new Error(`Env ${envName} não configurada ou inválida`);
  const errorProp = CheckProps(valueAux, [
    { name: 'domain', type: PrimitivesType.string },
    { name: 'api_key', type: PrimitivesType.string },
  ]);
  if (errorProp != null) throw new Error(`Env ${envName} - ${errorProp}`);
  return Mobizon.fill(valueAux);
}

class SessionUser {
  psw?: string;
  ttl_minutes?: number;
  static new() { return new SessionUser(); }
  static fill(values: SessionUser) { return CutUndef(FillClassProps(SessionUser.new(), values)); }
}
export function EnvSvrSessionUser() {
  const envName = 'SITE_SESSION_USER';
  if (OnClient()) throw new Error(`EnvSvr (${envName}) requisitada no client`);
  const valueAux = nullOrObj(process.env.SITE_SESSION_USER);
  if (valueAux == null) return SessionUser.new();
  const errorProp = CheckProps(valueAux, [
    { name: 'psw', type: PrimitivesType.string },
    { name: 'ttl_minutes', type: PrimitivesType.number, optional: true },
  ]);
  if (errorProp != null) throw new Error(`Env ${envName} - ${errorProp}`);
  return SessionUser.fill(valueAux);
}
//#endregion