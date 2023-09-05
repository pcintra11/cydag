import { csd } from './dbg';
import { ErrorPlus, HttpStatusCode } from './util';

export const rolesDev = {
  dev: 'dev',  // funções do desenvolvedor
  controlledAccess: 'controlledAccess', // controle de acesso por dispositivo / IP
  prototype: 'prototype', // simulação de themas, etc
  userSimulate: 'userSimulate',
  //dbgShow: 'dbgShow',  // mostra os debugs
  //tst: 'tst', // paginas de testes temporários
};
export const RolesDevArray = () => {
  const roles: string[] = [];
  for (const key in rolesDev)
    roles.push(rolesDev[key]);
  return roles;
};

const IsAuthorized = (rolesNeeded: string[], rolesUser?: string[]) => {
  if (rolesNeeded == null ||
    rolesNeeded.length == 0)
    return true;
  if (rolesUser == null)
    return false;
  return rolesNeeded.reduce((prev, curr) => prev || rolesUser.includes(curr), false); // se tiver algumas das roles já autoriza
};

/**
 * Deve ter ALGUMA das roles (normais OU adicionais)
 * @param apiDef 
 * @param rolesUser 
 * @param additionalRoles 
 */
export const CheckRoleAllowed = (rolesNeeded: string[], rolesUser?: string[]) => { // , additionalRoles?: string[]
  // let rolesCheck = [];
  // if (rolesNeeded.length > 0)
  //   rolesCheck = [...rolesCheck, ...rolesNeeded];
  // if (additionalRoles?.length > 0) // ao mudar API para simulUser retirar additional 
  //   rolesAuth = [...rolesAuth, ...additionalRoles];
  if (!IsAuthorized(rolesNeeded, rolesUser))
    throw new ErrorPlus('Não autorizado.', { httpStatusCode: HttpStatusCode.unAuthorized });
};

export enum AppContainerType {
  noThemeNoLayout,
  themeButNoLayout,
}
interface IPageDefOptions {
  pageTitle?: string;
  txtDynamicMenu?: string;
  onlyAuthenticated?: boolean;
  roles?: string[];
  variant?: string; // é um objeto!
  appContainerType?: AppContainerType;
  hideMenu?: boolean;
}
export class PageDef {
  pagePath: string;
  options?: IPageDefOptions;
  constructor(pagePath: string, options?: IPageDefOptions) {
    if (!pagePath.startsWith('/'))
      throw new Error(`pagePath deve ser com base na raiz (${pagePath})`);
    if (options?.roles != null &&
      options?.onlyAuthenticated !== true)
      throw new Error('PageDef: role apenas para onlyAuthenticated');
    this.pagePath = pagePath;
    this.options = options; // || {};
  }
  static IsUserAuthorized(pageDef: PageDef, rolesUser?: string[]) {
    return IsAuthorized(pageDef.options?.roles, rolesUser);
  }
  static MenuText(pageDef: PageDef) {
    return (pageDef.options?.txtDynamicMenu || pageDef.options?.pageTitle || pageDef.pagePath);
  }
}

export class ApiDef {
  apiPath: string;
  roles: string[];
  constructor(apiPath: string, roles?: string[]) {
    // if (options?.roles != null &&
    //   options?.onlyAuthenticated !== true)
    //   throw new Error('ApiDef: role apenas para onlyAuthenticated');
    // if (externalHost == null)
    this.apiPath = apiPath;
    // else
    //   this.apiPath = `${externalHost}/${apiPath}`;
    this.roles = roles || [];
  }
}