import { csd } from './dbg';
import { ErrorPlus, HttpStatusCode } from './util';

export const rolesDev = {
  dev: 'dev',  // funções do desenvolvedor
  controlledAccess: 'controlledAccess', // controle de acesso por dispositivo / IP
  prototype: 'prototype', // simulação de themas, etc
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

interface IPageDefOptions {
  onlyAuthenticated?: boolean;
  roles?: string[];
  variant?: string; // é um objeto!
}
export class PageDef {
  pagePath: string;
  pageTitle?: string;
  txtDynamicMenu?: string; // se vazio usa o page title
  options?: IPageDefOptions;
  constructor(pagePath: string, pageTitle: string = null, txtDynamicMenu: string = null, options?: IPageDefOptions) {
    if (!pagePath.startsWith('/'))
      throw new Error(`pagePath deve ser com base na raiz (${pagePath})`);
    if (options?.roles != null &&
      options?.onlyAuthenticated !== true)
      throw new Error('PageDef: role apenas para onlyAuthenticated');
    this.pagePath = pagePath;
    this.pageTitle = pageTitle;
    this.txtDynamicMenu = txtDynamicMenu || pageTitle;
    this.options = options; // || {};
  }
  static IsUserAuthorized(pageDef: PageDef, rolesUser?: string[]) {
    return IsAuthorized(pageDef.options?.roles, rolesUser);
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