import React from 'react';
import { useRouter } from 'next/router';
import { AppProps } from 'next/app';
import Head from 'next/head';
//import { ThemeProvider as ThemeProviderSC } from 'styled-components';
import { v1 as uuidv1 } from 'uuid';

import { ThemeProvider as ThemeProvider_mui } from '@mui/material/styles';
import { Box, Stack } from '@mui/material';

import { MenuEntriesHub, pagesHub, reSignInFuncHub, ControlledAccessCheckHub, ControlledAccessClaimHub, themeSchemesHub, imgAppHub, DisclaimerHub, routerConfirmLoginHub } from '../link';
import { Env, EnvDeployConfig } from '../libCommon/envs';

import { CmdApi_Others } from './api/base/others/types';
import { apisBase, pagesBase, PagesBaseArray } from '../base/endPoints';
import { LoggedUserBase } from '../base/db/types';

import { IdByTime, DateDifHours, ObjUpdAllProps, OnClient, NumberOrDef, IsErrorManaged, HttpStatusCode, ErrorPlusHttpStatusCode, ErrorPlus, ObjDiff } from '../libCommon/util';
import { csd, dbgError, dbgShowCli, dbgWarn, NivelLog, ScopeDbg, SetNivelLog } from '../libCommon/dbg';
import { cookiesSys } from '../libCommon/cookies_sys';
import { PageDef, rolesDev } from '../libCommon/endPoints';
import { isAmbDev } from '../libCommon/isAmb';

import { CallApiCliASync } from '../fetcher/fetcherCli';

import { ThemeVariants } from '../styles/themeTools';
import { globals } from '../libClient/clientGlobals';
import { CookieCli } from '../libClient/cookiesCli';

import { GlobalStyleSC } from '../styles/globalStyle';
import { GenThemePlus } from '../styles/themeTools';

import { Btn, BtnLine, DevConfigBar, DialogContainer, DialogMy, FakeLink, WaitingObs } from '../components';
import { AbortProc, LogErrorUnmanaged } from '../components';
import { SnackBarContainer } from '../components';
import { DevConfigBarContext } from '../components';
import { Layout, MenuType } from '../components/menus';
import { usePageByVariant } from '../hooks/usePageByVariant';

import { PagesSuporteArray } from '../suporte/endPoints';

import { msalInstance } from '../msal';
import { MsalProvider } from '@azure/msal-react';
import { useLoggedUser } from '../appCydag/useLoggedUser';
import { PagesAppArray } from '../appCydag/endPoints';
import { menuTypeApp } from '../appCydag/themes';

//#region troca de usu??rio logado em p??gina de servi??o
// Ao setar o loggedUser em uma pagina ela ser?? sempre renderizada, pois est?? dentro do _App.
// Como uma 'autentica????o' sempre vai acabar 'roteando' para uma p??gina 'p??s login' o 'setUser' ?? executado em uma
// 'p??gina de servi??o', pois a renderiza????o extra n??o trar?? nenhum preju??zo nessa p??gina
export interface IChgUserAndRoute { loggedUser: LoggedUserBase, pagePath: string, query?: any }
export interface IChgUserAndRouteContext {
  chgUserAndRouteStart: (chgUserAndRoute?: IChgUserAndRoute) => void;
  chgUserAndRouteFinish: () => void;
}
export const _AppLogRedir = React.createContext<IChgUserAndRouteContext>(null);
//#endregion

let themeVariants: ThemeVariants = {}; // defaultThemeVariants(themeSchemesHub);

(() => { // set todas as v??riaveis globais no client, incluindo aquelas usadas em chamadas de API antes do effect ser resolvido
  if (OnClient()) {
    const dbgShowCookieStr = CookieCli.get(cookiesSys.dbgShowCookieStr);
    if (dbgShowCookieStr == 'dbgShow') // @!!!!! pensar em algo dinamico que s?? o dev saiba
      globals.cookieDbgShow = true;
    else
      globals.cookieDbgShow = false;

    const canChangeThemeCookieStr = CookieCli.get(cookiesSys.canChangeThemeCookieStr);
    if (canChangeThemeCookieStr == 'canChangeTheme')
      globals.cookieCanChangeTheme = true;
    else
      globals.cookieCanChangeTheme = false;

    const idByTime = IdByTime();
    globals.browserId = CookieCli.get(cookiesSys.browserId);
    if (globals.browserId == null)
      CookieCli.set(cookiesSys.browserId, globals.browserId = `${idByTime} ${uuidv1()}`);
    globals.windowId = idByTime;

    const themeVariantsCookie = CookieCli.getJSON(Env('appName', cookiesSys.themeVariants));
    if (themeVariantsCookie != null)
      themeVariants = { ...themeVariants, ...themeVariantsCookie };

    // organizar @@!!!!!
    const nivelLogACookie = CookieCli.get(cookiesSys.nivelLogA); if (nivelLogACookie != null) SetNivelLog(NumberOrDef(nivelLogACookie, 0), ScopeDbg.a);
    const nivelLogDCookie = CookieCli.get(cookiesSys.nivelLogD); if (nivelLogDCookie != null) SetNivelLog(NumberOrDef(nivelLogDCookie, 0), ScopeDbg.d);
    const nivelLogECookie = CookieCli.get(cookiesSys.nivelLogE); if (nivelLogECookie != null) SetNivelLog(NumberOrDef(nivelLogECookie, 0), ScopeDbg.e);
    const nivelLogTCookie = CookieCli.get(cookiesSys.nivelLogT); if (nivelLogTCookie != null) SetNivelLog(NumberOrDef(nivelLogTCookie, 0), ScopeDbg.t);
    const nivelLogXCookie = CookieCli.get(cookiesSys.nivelLogX); if (nivelLogXCookie != null) SetNivelLog(NumberOrDef(nivelLogXCookie, 0), ScopeDbg.x);
  }
  return;
})();

const pagesPossible = () => {
  return [
    ...PagesAppArray(),
    ...PagesSuporteArray(),
    ...PagesBaseArray()
  ];
};

//let renderCount = 0;
let mount; let mainStatesCache;
class MainStates {
  error?: Error | ErrorPlus;
  blockContentReason?: string;
  themeVariants?: ThemeVariants;
  nivelLogA?: number; nivelLogD?: number; nivelLogE?: number; nivelLogT?: number; nivelLogX?: number;
  menuType?: MenuType;
  chgUserAndRoute?: IChgUserAndRoute;
}
export default function _app({ Component, pageProps }: AppProps) {
  // 'Component' ?? o export default da pagina
  // pageProps => is an object with the initial props that were preloaded for your page by one of our data fetching methods, otherwise it's an empty object.
  const [mainStates, setMainStates] = React.useState<MainStates>({
    themeVariants: themeVariants,
    nivelLogA: NivelLog(ScopeDbg.a), nivelLogD: NivelLog(ScopeDbg.d), nivelLogE: NivelLog(ScopeDbg.e), nivelLogT: NivelLog(ScopeDbg.t), nivelLogX: NivelLog(ScopeDbg.x),
    menuType: menuTypeApp,
  });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  //const { loggedUser, isLoadingUser, setUser, reloginFromCookieNotConfirmed, setReloginConfirmed } = useLoggedUser(true); 
  const router = useRouter();
  const { loggedUser, isLoadingUser, setUser } = useLoggedUser({ id: '_app' });
  //csl('_app', ++renderCount, router.route );
  //csl('_app', dbgContext);
  const agora = new Date();
  const dbgContext = `${router.route} (_app)`;

  const loggedUserBase: LoggedUserBase = loggedUser;

  const chgUserAndRouteStart = (chgUserAndRoute?: IChgUserAndRoute) => {
    //csd('chgUserAndRouteStart', chgUserAndRoute);
    setMainStatesCache({ chgUserAndRoute });
    setTimeout(() => router.push(pagesBase.chgUserAndRoute.pagePath), 0);
  };
  const chgUserAndRouteFinish = () => {
    //csd('chgUserAndRouteFinish', mainStates.chgUserAndRoute);
    if (mainStates.chgUserAndRoute == null) return;
    setUser(mainStates.chgUserAndRoute.loggedUser, 'chgUserAndRoute(_app)');
    setTimeout(() => router.push({ pathname: mainStates.chgUserAndRoute.pagePath, query: mainStates.chgUserAndRoute.query }), 0);
    setMainStatesCache({ chgUserAndRoute: null });
  };

  if (loggedUser == null ||
    !loggedUser.roles.includes[rolesDev.dev]) {
    if (Env('blockMsg') != null)
      return (<Box>Sistema bloqueado: {Env('blockMsg')} </Box>);
  }

  //csd('_app render', { isLoadingUser, loggedUser, mainStates });

  //csl(dbgContext, { loggedUser, isLoadingUser, reloginFromCookieNotConfirmed });

  const retryAccessControlled = () => {
    setMainStatesCache({ blockContentReason: null });
    router.push({ pathname: router.pathname, query: { retry: IdByTime() } });
  };

  React.useEffect(() => {
    //csl('_app effect main');
    // verifica se frontend habilitado, se device permitido e log do referer (entrada na app)
    // restaura prefer??ncias do device para nivelLog e temas de cores
    mount = true;
    (async () => {
      if (EnvDeployConfig().front_end == false) {
        setMainStatesCache({ error: new ErrorPlus('N??o est?? habilitado o front-end') });
        return;
      }
      //csl('pagesPossible', pagesPossible);
      if (EnvDeployConfig().controlled_access == true &&
        ControlledAccessCheckHub != null) {
        try {
          //const { value } = await CallApiCliASync(apis.notLoggedApis.apiPath, globals.windowId, { cmd: controlledAccess_CmdApi.controlledAccessCheckAllowed });
          const { value } = await ControlledAccessCheckHub(); //@@!!!!!!
          csd('Autoriza????o:', value);
        } catch (error) {
          //csd('controlledAccessCheckAllowed error', error);
          LogErrorUnmanaged(error, '_app-checkBrowserAllowed');
          if (IsErrorManaged(error)) {
            if (ErrorPlusHttpStatusCode(error) == HttpStatusCode.unAuthorized) {
              setMainStatesCache({ blockContentReason: error.message });
              DialogMy({
                body: 'Esse ?? um ambiente controlado e precisa de autoriza????o para uso.',
                dialogInputs: [
                  { label: 'Informe abaixo o seu nome' },
                ],
                buttons: [
                  { text: 'Cancela' },
                  {
                    text: 'Solicitar acesso',
                    fnCheck: (inputResponses: string[]) => inputResponses[0].trim() == '' ? 'Nome n??o informado' : null,
                    onClick: (inputResponses: string[]) => {
                      ControlledAccessClaimHub(inputResponses[0])
                        //CallApiCliASync(apis.notLoggedApis.apiPath, globals.windowId, { cmd: controlledAccess_CmdApi.controlledAccessClaimAccess, info: inputResponses[0] })
                        .then(({ value }) => {
                          if (value?.authorized == true)
                            setMainStatesCache({ blockContentReason: null });
                          else
                            setMainStatesCache({ blockContentReason: 'Acesso solicitado' });
                        })
                        .catch((error) => dbgError(`erro em ControlledAccessClaimHub: ${error.message}`));
                    }
                  },
                ]
              });
            }
            else
              setMainStatesCache({ blockContentReason: error.message + ' Mande um zap para o respons??vel acordar!' });
          }
          else
            setMainStatesCache({ error: new ErrorPlus(`controlledAccessCheckAllowed error: ${error.message}`) });
        }
      }
      else
        CallApiCliASync<any>(apisBase.others.apiPath, globals.windowId, { cmd: CmdApi_Others.logReferer }, { fetchAndForget: true }); //@!!!!!!
      //await SleepMsDevRandom(1000, '_app');
      try {
        const themeVariantsCookie = CookieCli.getJSON(Env('appName', cookiesSys.themeVariants));
        if (themeVariantsCookie != null) {
          if (ObjDiff(themeVariantsCookie, mainStates.themeVariants) != null)
            setMainStatesCache({ themeVariants: { ...mainStates.themeVariants, ...themeVariantsCookie } });
        }
        // csl('setting nivelLog');
        // setMainStatesCache({
        //   nivelLogA: NivelLog(ScopeDbg.a), nivelLogD: NivelLog(ScopeDbg.d), nivelLogE: NivelLog(ScopeDbg.e), nivelLogT: NivelLog(ScopeDbg.t), nivelLogX: NivelLog(ScopeDbg.x),
        // });
        //if (typeof window !== 'undefined')
        //  window.document.body.setAttribute('id', IdByTime());
      } catch (error) {
        dbgError(dbgContext, error.message);
      }
    })();
    return () => { mount = false; };
  }, [router.query?.retry]);

  //csl('_app ********************* buscando pageDef para', router.asPath, pagesPossible());
  const pageDef = usePageByVariant(pagesPossible(), router, false);

  const menuEntriesForMenuTypes = React.useMemo(() =>
    MenuEntriesHub(loggedUser, isLoadingUser),
    [loggedUserBase?.email, isLoadingUser]);

  // o cookie morre naturalmente pelo TTL
  // num tempo MENOR que o ttl, caso n??o houver nenhuma intera????o (relogin ou uso de API),
  // for??a a apresenta????odo do nome do usu??rio na tela de boas vindas, para certificar que ?? ele mesmo
  React.useEffect(() => {
    //csl('_app effect isLoadingUser', isLoadingUser);
    // verifica usuario logado pelo cookie e restaura sess??o
    (async () => {
      if (isLoadingUser) return;
      dbgWarn('ready');
      if (loggedUserBase != null) {
        if (reSignInFuncHub != null) {
          //if (reloginFromCookieNotConfirmed) {
          //csl('_app', { lastActivity: loggedUser.lastActivity, expire: loggedUser.expire() }) //@@@!!!
          //csl('setReloginConfirmed');
          //setReloginConfirmed();
          const hoursInactivity = 0; //12; // @@@!!! em mobile n??o deve interferir !
          try {
            await reSignInFuncHub(); //@@!!!!!!
            //csl({ loggedUserNow });
            // setUser(loggedUserNow, '_app(reSignIn)'); j?? est?? settado com as informa????es mais recentes do DB !!
            // se depois de algum tempo buscar o login do cookie ser?? for??ado a apresenta????o da pagina 'welcome', para o usuario ver o nome
            if (DateDifHours(agora, loggedUserBase.lastActivity) > hoursInactivity &&
              routerConfirmLoginHub != null)
              router.push(routerConfirmLoginHub);
          } catch (error) {
            LogErrorUnmanaged(error, '_app-init');
            if (IsErrorManaged(error))
              dbgError('reSignInFunc error:', error.message);
          }
          //}
        }
      }
      else {
        if (pageDef?.options?.onlyAuthenticated) {
          router.push({
            pathname: pagesHub.signIn.pagePath,
            query: { pageNeedAuthentication: pageDef.pagePath, ...router.query }
          });
        }
      }
    })();
  }, [isLoadingUser]); // , loggedUser?.email

  React.useEffect(() => {
    globals.loggedUserIsDev = loggedUserBase?.roles?.includes(rolesDev.dev);
    globals.loggedUserCanChangeTheme = loggedUserBase?.roles?.includes(rolesDev.prototype);
  }, [loggedUser?.email]);

  if (mainStates.error != null)
    return (<AbortProc error={mainStates.error} tela={'_app'} loggedUserBase={loggedUserBase} />);

  if (pageDef?.options?.onlyAuthenticated &&
    isLoadingUser)
    return (<WaitingObs text='Verificando usu??rio' />);

  //#region fun????es
  const changeMenuType = () => {
    if (mainStates.menuType == MenuType.lateral)
      setMainStatesCache({ menuType: MenuType.barraSuperior });
    else if (mainStates.menuType == MenuType.barraSuperior)
      setMainStatesCache({ menuType: MenuType.none });
    else if (mainStates.menuType == MenuType.none)
      setMainStatesCache({ menuType: MenuType.lateral });
  };
  const changeThemeVariants = (themeVariants: ThemeVariants) => {
    setMainStatesCache({ themeVariants });
    CookieCli.setJSON(Env('appName', cookiesSys.themeVariants), themeVariants);
  };

  const changeNivelLog = (nivel: number, scopeDbg: ScopeDbg) => {
    const adjustNivelLog = (nivelLog: number) => {
      const nivelLogMax = 3;
      if (nivelLog < 0) return nivelLogMax;
      else if (nivelLog > nivelLogMax) return 0;
      else return nivelLog;
    };
    const nivelUse = adjustNivelLog(nivel);
    if (scopeDbg == ScopeDbg.a) { setMainStatesCache({ nivelLogA: nivelUse }); CookieCli.set(cookiesSys.nivelLogA, nivelUse.toString()); }
    if (scopeDbg == ScopeDbg.d) { setMainStatesCache({ nivelLogD: nivelUse }); CookieCli.set(cookiesSys.nivelLogD, nivelUse.toString()); }
    if (scopeDbg == ScopeDbg.e) { setMainStatesCache({ nivelLogE: nivelUse }); CookieCli.set(cookiesSys.nivelLogE, nivelUse.toString()); }
    if (scopeDbg == ScopeDbg.t) { setMainStatesCache({ nivelLogT: nivelUse }); CookieCli.set(cookiesSys.nivelLogT, nivelUse.toString()); }
    if (scopeDbg == ScopeDbg.x) { setMainStatesCache({ nivelLogX: nivelUse }); CookieCli.set(cookiesSys.nivelLogX, nivelUse.toString()); }
    SetNivelLog(nivelUse, scopeDbg);
  };
  //#endregion

  try {
    const themePlus = GenThemePlus(themeSchemesHub, mainStates.themeVariants);

    const menuType: MenuType = loggedUserBase != null ? mainStates.menuType : MenuType.none;

    if (pageDef?.options?.onlyAuthenticated) {
      if (isLoadingUser) { }
      else {
        if (loggedUserBase == null)
          return (<Box>Verificando a autentica????o...</Box>);
        if (!PageDef.IsUserAuthorized(pageDef, loggedUserBase.roles)) {
          return (
            <ThemeProvider_mui theme={themePlus}>
              <Stack gap={1}>
                <Box>Sua conta n??o est?? autorizada para essa tela</Box>
                <BtnLine left>
                  <Btn onClick={() => router.push(pagesHub.signOut.pagePath)}>Desconectar e entrar com outra conta</Btn>
                </BtnLine>
              </Stack>
            </ThemeProvider_mui>
          );
        }
      }
    }

    // if (pageDef != null &&
    //   loggedUser != null &&
    //   (pageType == 'appNormal' ||
    //     pageType == 'appAdm'))
    //   UserAccessASync(loggedUser, pageDef.pagePath);

    const devConfigBarShow = () => {
      return isAmbDev() ||
        globals?.loggedUserIsDev === true ||
        globals?.loggedUserCanChangeTheme === true ||
        globals?.cookieCanChangeTheme === true ||
        globals?.cookieDbgShow === true; //@@!!!!!
    };

    return (
      <Box height='100%' >
        <Head>
          <title>{pageDef?.pageTitle}</title>
          <link rel='icon' href='/favicon.ico' />
        </Head>

        <MsalProvider instance={msalInstance}>

          <_AppLogRedir.Provider value={{ chgUserAndRouteStart, chgUserAndRouteFinish }}>
            {/* <ThemeProviderSC theme={themeMui}> */}
            <ThemeProvider_mui theme={themePlus}>
              {mainStates.blockContentReason == null
                ?
                // <div style={{
                //   display: 'grid', height: '100%',
                //   alignItems: 'start', alignContent: 'start', gap: 0,
                //   gridTemplateRows: 'minmax(300px,1fr) auto',
                // }}>
                <DevConfigBarContext.Provider value={{ _appMainStates: mainStates, themeVariants: mainStates.themeVariants, themeSchemes: themeSchemesHub, changeMenuType, changeThemeVariants, changeNivelLog }}>
                  <Stack gap={1} height='100%'>
                    <Box flex={1} overflow='hidden'>
                      <Box height='100%'>
                        {/* <DevConfigBarContext.Provider value={{ _appMainStates: mainStates, changeMenuType: changeMenuType, changeThemeVariants, changeNivelLog }}> */}
                        <Layout
                          menuEntriesForMenuTypes={menuEntriesForMenuTypes}
                          menuType={menuType}
                          Component={Component}
                          pageProps={pageProps}
                          pageDefCurr={pageDef}
                          imgApp={imgAppHub}
                        />
                      </Box>
                      {/* <Box height='100%' display='flex' flexDirection='column' gap={1}>
                          <Box flex={1} overflow='auto'>
                            <div>xx 1</div> <div>xx 2</div> <div>xx 3</div> <div>xx 4</div> <div>xx 5</div> <div>xx 6</div> <div>xx 7</div> <div>xx 8</div> <div>xx 9</div> <div>xx 0</div>                      <div>xx 1</div> <div>xx 2</div> <div>xx 3</div> <div>xx 4</div> <div>xx 5</div> <div>xx 6</div> <div>xx 7</div> <div>xx 8</div> <div>xx 9</div> <div>xx 0</div>
                            <div>ffff</div>
                          </Box>
                        </Box> */}
                    </Box>

                    {/* <DisclaimerCookie pageTermsPath={pageTerms.pagePath} pagePrivacyPath={pagePrivacy.pagePath} /> */}
                    {devConfigBarShow() &&
                      <Box style={{ marginLeft: 'auto' }}>
                        <DevConfigBar />
                      </Box>
                    }
                    {DisclaimerHub != null &&
                      <DisclaimerHub />
                    }
                  </Stack>
                </DevConfigBarContext.Provider>
                : <Stack gap={2}>
                  <Box>{mainStates.blockContentReason}</Box>
                  {/* @@!!!!!! */}
                  <FakeLink onClick={() => retryAccessControlled()}>Se voc?? j?? falou com o respons??vel clique aqui para tentar novamente o acesso.</FakeLink>
                </Stack>
              }
              <DialogContainer />

            </ThemeProvider_mui >
            {/* </ThemeProviderSC > */}
          </_AppLogRedir.Provider>

        </MsalProvider>

        <SnackBarContainer />

        <GlobalStyleSC theme={themePlus} />
        {/* <style jsx global>{`${cssByTheme(themePlus)}`}</style>  aqui ainda pendente devido ao 'div#__next height: 100%;' n??o funcionar */}
      </Box>
    );
  } catch (error) {
    LogErrorUnmanaged(error, '_app-render');
    return (<AbortProc error={error} tela='_app' loggedUserBase={loggedUserBase} />);
  }
}