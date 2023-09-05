import { ApiDef, PageDef, rolesDev } from '../libCommon/endPoints';

const pathPage = '/base';
export const pagesBase = {
  controlledAccess: new PageDef(`${pathPage}/controlledAccess`, { pageTitle: 'Acesso Controlado para Dispositivos', txtDynamicMenu: 'Acesso Controlado', onlyAuthenticated: true, roles: [rolesDev.controlledAccess] }),
  chgUserAndRoute: new PageDef(`${pathPage}/chgUserAndRoute`),
};

export const PagesBaseArray = () => {
  const pages: PageDef[] = [];
  for (const key in pagesBase)
    pages.push(pagesBase[key]);
  return pages;
};

const pathApi = 'app_base';
export const apisBase = {
  asyncProc: new ApiDef(`${pathApi}/asyncProc`), // apenas serverCall
  httpCryptoCookie: new ApiDef(`${pathApi}/httpCryptoCookie`),
  logSystemMsgClient: new ApiDef(`${pathApi}/logSystemMsgClient`),
  cloudinarySignature: new ApiDef(`${pathApi}/cloudinarySignature`),
  others: new ApiDef(`${pathApi}/others`),
  controlledAccess: new ApiDef(`${pathApi}/controlledAccess`, [rolesDev.controlledAccess]),
  revalidate: new ApiDef(`${pathApi}/revalidate`),
};