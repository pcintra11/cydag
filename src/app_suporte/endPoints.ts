import { ApiDef, PageDef, rolesDev } from '../libCommon/endPoints';

//new PageDef('/tst/securePageSSR', true, 'SSR', 'SSR', 'master'));
// new PageDef('/tst/testSSR', 'teste ssr', 'teste ssr', true, { isLogged: true, isAdm: true, roles: [roleAdmUser] }));
// new PageDef('/tst/testCSS', 'teste css', 'teste css', true, { isLogged: true, isAdm: true }));

export const pagesSuporte = {
  inspect: new PageDef('/suporte/inspect', 'Inspeção de variáveis', 'inspectM', { onlyAuthenticated: true, roles: [rolesDev.dev] }),
  playg: new PageDef('/suporte/tst/playg', 'Playground', null, { onlyAuthenticated: true, roles: [rolesDev.dev] }),
  tests: new PageDef('/suporte/tst', 'Testes diversos', null, { onlyAuthenticated: true, roles: [rolesDev.dev] }),
};

export const PagesSuporteArray = () => {
  const pages: PageDef[] = [];
  for (const key in pagesSuporte)
    pages.push(pagesSuporte[key]);
  return pages;
};

const pathApi = 'app_suporte/tst';
export const apisTst = {
  playg_async: new ApiDef(`${pathApi}/playg_async`, [rolesDev.dev]),
  playg: new ApiDef(`${pathApi}/playg`, [rolesDev.dev]),
  teste: new ApiDef(`${pathApi}/teste`, [rolesDev.dev]),
};
