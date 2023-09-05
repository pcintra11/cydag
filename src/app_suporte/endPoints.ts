import { ApiDef, AppContainerType, PageDef, rolesDev } from '../libCommon/endPoints';

//new PageDef('/tst/securePageSSR', true, 'SSR', 'SSR', 'master'));
// new PageDef('/tst/testSSR', 'teste ssr', 'teste ssr', true, { isLogged: true, isAdm: true, roles: [roleAdmUser] }));
// new PageDef('/tst/testCSS', 'teste css', 'teste css', true, { isLogged: true, isAdm: true }));

const pathPageSuporte = '/suporte';
export const pagesSuporte = {
  index: new PageDef('/'),
  inspect: new PageDef(`${pathPageSuporte}/inspect`, { txtDynamicMenu: 'inspect' }),
  playg: new PageDef(`${pathPageSuporte}/playg`, { pageTitle: 'Playground', onlyAuthenticated: true, roles: [rolesDev.dev] }),
  testsDiv: new PageDef(`${pathPageSuporte}/testsDiv`, { pageTitle: 'Testes diversos', onlyAuthenticated: true, roles: [rolesDev.dev] }),
};

const pathPageTestDiv = '/suporte/tst';
export const pagesTestDiv = {
  themes: new PageDef(`${pathPageTestDiv}/themes`, { pageTitle: 'Themes variados' }),
  testGlobalState: new PageDef(`${pathPageTestDiv}/testGlobalState`, { pageTitle: 'Global states' }),
  tablePlayg: new PageDef(`${pathPageTestDiv}/tablePlayg`, { pageTitle: 'Playground Table' }),
  testEffect: new PageDef(`${pathPageTestDiv}/testEffect`, { pageTitle: 'Testes Effect', onlyAuthenticated: false }),
  testImg: new PageDef(`${pathPageTestDiv}/testImg`, { pageTitle: 'Testes Img', onlyAuthenticated: false }),
  testCSS: new PageDef(`${pathPageTestDiv}/testCSS`, { pageTitle: 'Test CSS', appContainerType: AppContainerType.themeButNoLayout }),
};

export const PagesSuporteArray = () => {
  const pages: PageDef[] = [];
  for (const key in pagesSuporte)
    pages.push(pagesSuporte[key]);
  return pages;
};
export const PagesTestDivArray = () => {
  const pages: PageDef[] = [];
  for (const key in pagesTestDiv)
    pages.push(pagesTestDiv[key]);
  return pages;
};


const pathApi = 'app_suporte/tst';
export const apisTst = {
  playg_async: new ApiDef(`${pathApi}/playg_async`, [rolesDev.dev]),
  playg: new ApiDef(`${pathApi}/playg`, [rolesDev.dev]),
  teste: new ApiDef(`${pathApi}/teste`, [rolesDev.dev]),

  testSecureApi: new ApiDef(`${pathApi}/secureApi`, [rolesDev.dev]), //@!!!!!!!!!!!!!!9
  testApiASyncSvr: new ApiDef(`${pathApi}/testApiASyncSvr`, [rolesDev.dev]),
};
