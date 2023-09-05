import React from 'react';
import { useRouter } from 'next/router';
import { AppProps } from 'next/app';
import Head from 'next/head';
//import { ThemeProvider as ThemeProviderSC } from 'styled-components';
import { v1 as uuidv1 } from 'uuid';
import { isMobile } from 'react-device-detect';

import { ThemeProvider as ThemeProvider_mui } from '@mui/material/styles';
import { Box, Stack } from '@mui/material';

import { configApp } from '../app_hub/appConfig';
import { MenuEntriesHub, pagesHub, themeSchemesHub, imgAppHub, DisclaimerHub } from '../app_hub/clientResources';
import { EnvDeployConfig } from '../app_base/envs';
import { CmdApi_Others } from './api/app_base/others/types';
//import { ControlledAccessStatus } from './api/app_base/controlledAccess/types';
import { apisBase, PagesBaseArray } from '../app_base/endPoints';
import { LoggedUserBase } from '../app_base/loggedUserBase';
//import { ControlledAccessCheck, ControlledAccessClaim } from '../app_base/controlledAccess';

import { IdByTime, ErrorPlus, ObjDiffNew, ErrorPlusData, FillClassProps } from '../libCommon/util';
import { OnClient } from '../libCommon/sideProc';
import { csd, dbgError, dbgWarn, devContextCli } from '../libCommon/dbg';
import { cookiesSys } from '../libCommon/cookies_sys';
import { AppContainerType, PageDef } from '../libCommon/endPoints';
import { IGenericObject } from '../libCommon/types';

import { CallApiCliASync } from '../fetcher/fetcherCli';

import { IThemeVariants } from '../styles/themeTools';
import { globals } from '../libClient/clientGlobals';
import { CookieCli } from '../libClient/cookiesCli';

//import { GlobalStyleSC } from '../styles/globalStyle';
import { GenThemePlus } from '../styles/themeTools';

import { Btn, BtnLine, DevConfigBar, DialogContainer, FakeLink, Tx, WaitingObs } from '../components';
import { AbortProc, LogErrorUnmanaged } from '../components';
import { SnackBarContainer } from '../components';
import { DevConfigBarContext } from '../components';
import { Layout, MenuType } from '../components/menus';
import { globalStyle } from '../components/globalStyle';
import { usePageByVariant } from '../hooks/usePageByVariant';

import { PagesSuporteArray, PagesTestDivArray } from '../app_suporte/endPoints';

import { preserveStateContext } from './_appResources'; // IChgUserAndRoute, chgUserAndRouteContext

// partes específicas por APP --------------------
import { useLoggedUser } from '../appCydag/useLoggedUser';
import { PagesAppArray } from '../appCydag/endPoints';
import { menuTypeApp } from '../appCydag/themes';

// partes específicas - autenticação pelo Azure (MSAL) --------------------
import { msalInstance } from '../msal';
import { MsalProvider } from '@azure/msal-react';

const themeVariants: IThemeVariants = {}; // defaultThemeVariants(themeSchemesHub);

(() => { // set todas as variáveis globais no client, incluindo aquelas usadas em chamadas de API antes do effect ser resolvido
  if (OnClient()) {
    const cookieDevContextValue = CookieCli.get(cookiesSys.cookieDevContext);
    if (cookieDevContextValue == 'dev') // @!!!!! pensar em algo dinâmico que só o dev saiba
      globals.cookieDevContext = true;
    else
      globals.cookieDevContext = false;

    // const canChangeThemeCookieStr = CookieCli.get(cookiesSys.canChangeThemeCookieStr);
    // if (canChangeThemeCookieStr == 'canChangeTheme')
    //   globals.cookieCanChangeTheme = true;
    // else
    //   globals.cookieCanChangeTheme = false;

    const idByTime = IdByTime();
    globals.browserId = CookieCli.get(cookiesSys.browserId);
    if (globals.browserId == null)
      CookieCli.set(cookiesSys.browserId, globals.browserId = `${idByTime}_${uuidv1()}`);
    globals.windowId = idByTime;

    // se for ativado causará warning entre a geração da pagina e a primeira renderização (Prop `className` did not match. Server: ...)
    // const themeVariantsCookie = CookieCli.getJSON(`${configApp.appName}-${cookiesSys.themeVariants}`);
    // if (themeVariantsCookie != null)
    //   themeVariants = { ...themeVariants, ...themeVariantsCookie };

    globals.ctrlLog = CookieCli.get(cookiesSys.ctrlLog);
  }
  return;
})();

const pagesPossible = () => {
  return [
    ...PagesAppArray(),
    ...PagesSuporteArray(),
    ...PagesTestDivArray(),
    ...PagesBaseArray()
  ];
};

//const checkControlledAccess = EnvDeployConfig().controlled_access === true;

//let renderCount = 0;
class MainStates {
  error?: Error | ErrorPlus;
  //controlledAccessStatus?: ControlledAccessStatus;
  themeVariants?: IThemeVariants;
  showDevConfigBar?: boolean;
  ctrlLog?: string;
  menuType?: MenuType;
  //chgUserAndRoute?: IChgUserAndRoute;
  preserveState?: IGenericObject;
  reserveFooterMobile?: boolean;
  static new() {
    const obj = new MainStates();
    obj.themeVariants = themeVariants;
    //obj.controlledAccessStatus = (checkControlledAccess ? ControlledAccessStatus.checking : ControlledAccessStatus.allowed);
    obj.ctrlLog = globals.ctrlLog;
    obj.menuType = menuTypeApp;
    return obj;
  }
}
let mount = false; const mainStatesCache = MainStates.new();
//csd('_app compile ****************************************');

export default function _app({ Component, pageProps }: AppProps) {
  // 'Component' é o export default da pagina
  // pageProps => is an object with the initial props that were preloaded for your page by one of our data fetching methods, otherwise it's an empty object.
  const [mainStates, setMainStates] = React.useState(MainStates.new());
  FillClassProps(mainStatesCache, mainStates); const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; FillClassProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: '_app' });
  //csd('_app render', router.route );
  const agora = new Date();
  const dbgContext = `${router.route} (_app)`;

  const loggedUserBase: LoggedUserBase = loggedUser;

  //#region _App contexts
  // const chgUserAndRouteStart = (chgUserAndRoute?: IChgUserAndRoute) => {
  //   //csd('chgUserAndRouteStart', chgUserAndRoute);
  //   setMainStatesCache({ chgUserAndRoute });
  //   setTimeout(() => router.push(pagesBase.chgUserAndRoute.pagePath), 0);
  // };
  // const chgUserAndRouteFinish = () => {
  //   //csd('chgUserAndRouteFinish', mainStates.chgUserAndRoute);
  //   if (mainStates.chgUserAndRoute == null) {
  //     // isso deve ser previsto, pois depois de resetar mainStates.chgUserAndRoute haverá novo render na pagina PageChgUserAndRoute
  //     //dbgError('chgUserAndRouteFinish', 'sem dados para direcionamento');
  //     // setUser(null, 'chgUserAndRoute(_app)');

  //     //router.push('/'); // isso não está legal, mas não pode travar tb, especialmente no mobile!
  //     return;
  //   }
  //   setUser(mainStates.chgUserAndRoute.loggedUser, 'chgUserAndRoute(_app)');
  //   setTimeout(() => router.push({ pathname: mainStates.chgUserAndRoute.pagePath, query: mainStates.chgUserAndRoute.query }), 0);
  //   setMainStatesCache({ chgUserAndRoute: null });
  // };

  const preserveStateSet = (page: string, state: IGenericObject) => {
    const preserveState = mainStatesCache.preserveState || {};
    preserveState[page] = { state };
    setMainStatesCache({ preserveState });
    //csd('preserveStateSet', page, state);
  };
  const preserveStateGet = (page: string, destroy?: boolean) => {
    let preserveState = undefined;
    if (mainStatesCache.preserveState != null) {
      preserveState = mainStatesCache.preserveState[page];
      if (destroy === true)
        setMainStatesCache({ preserveState: undefined });
    }
    //csd('preserveStateGet', page, destroy, preserveState?.state);
    return preserveState?.state;
  };
  const preserveStateResetAll = () => {
    setMainStatesCache({ preserveState: null });
  };
  //#endregion

  //csd('_app render'); // , { isLoadingUser, loggedUser, mainStates }

  //csl(dbgContext, { loggedUser, isLoadingUser, reLoginFromCookieNotConfirmed });

  const retryAccessControlled = () => {
    router.push({ pathname: router.pathname, query: { retry: IdByTime() } });
  };

  React.useEffect(() => {
    // verifica se frontend habilitado, se device permitido e log do referer (entrada na app)
    // restaura preferências do device para nivelLog e temas de cores
    mount = true;
    (async () => {
      if (isMobile) setMainStatesCache({ reserveFooterMobile: true });
      if (EnvDeployConfig().front_end == false) {
        setMainStatesCache({ error: new ErrorPlus('Não está habilitado o front-end neste deploy') });
        return;
      }
      //csl('pagesPossible', pagesPossible);
      // if (checkControlledAccess) {
      //   try {
      //     // todo o controle é pelo browserId (gerado na primeira vez ao acessar pelo device, e antes de limpar os cookies)
      //     // se o cookie for limpo MAS já houve alguma associação do browserId autorizado para algum IP vai liberar tb (pelo IP)
      //     const { controlledAccessStatus, message } = await ControlledAccessCheck();
      //     csd('Autorização:', message);
      //     setMainStatesCache({ controlledAccessStatus });
      //   } catch (error) {
      //     // não autorizado: vai dar a opção de pedir para autorizar, que deverá ser atendida pela ADM do sistema
      //     LogErrorUnmanaged(error, '_app-checkBrowserAllowed');
      //     if (IsErrorManaged(error)) {
      //       const controlledAccessStatus = ErrorPlusData(error).controlledAccessStatus as ControlledAccessStatus;
      //       setMainStatesCache({ controlledAccessStatus });
      //       if (controlledAccessStatus === ControlledAccessStatus.notAllowed ||
      //         controlledAccessStatus === ControlledAccessStatus.waiting) {
      //         DialogMy({
      //           body:
      //             <DialogContent>
      //               <DialogContentText>
      //                 {`${controlledAccessStatus === ControlledAccessStatus.notAllowed
      //                   ? 'Esse é um ambiente controlado e precisa de autorização para uso.'
      //                   : 'Sua solicitação de acesso ainda está pendente'
      //                   }`}
      //               </DialogContentText>
      //             </DialogContent>,
      //           dialogInputs: [
      //             { label: 'Informe abaixo o seu nome' },
      //           ],
      //           buttons: [
      //             {
      //               text: controlledAccessStatus === ControlledAccessStatus.notAllowed
      //                 ? 'Solicitar acesso'
      //                 : 'Re-solicitar acesso',
      //               fnCheck: (inputResponses: string[]) => inputResponses[0].trim() == '' ? 'Nome não informado' : null,
      //               onClick: (inputResponses: string[]) => {
      //                 ControlledAccessClaim(inputResponses[0])
      //                   //CallApiCliASync(apis.notLoggedApis.apiPath, globals.windowId, { cmd: controlledAccess_CmdApi.controlledAccessClaimAccess, info: inputResponses[0] })
      //                   .then(({ controlledAccessStatus }) => {
      //                     setMainStatesCache({ controlledAccessStatus });
      //                   })
      //                   .catch((error) => dbgError(dbgContext, `ControlledAccessClaimHub: ${error.message}`));
      //               }
      //             },
      //           ]
      //         });
      //       }
      //       else
      //         setMainStatesCache({ error: new ErrorPlus(`controlledAccessCheckAllowed status não previsto: ${controlledAccessStatus}`) });
      //     }
      //     else
      //       setMainStatesCache({ error: new ErrorPlus(`controlledAccessCheckAllowed error: ${error.message}`) });
      //   }
      // }
      //else
      CallApiCliASync<any>(apisBase.others.apiPath,
        { cmd: CmdApi_Others.logSiteEntryPoint }, { fetchAndForget: true });
      //.catch((error) => dbgError(dbgContext, 'logReferer', error.message));
      //await SleepMsDevRandom(1000, '_app');
      try {
        const themeVariantsCookie = CookieCli.getJSON(`${configApp.appName}-${cookiesSys.themeVariants}`);
        if (themeVariantsCookie != null) {
          if (ObjDiffNew(themeVariantsCookie, mainStates.themeVariants) != null)
            setMainStatesCache({ themeVariants: { ...mainStates.themeVariants, ...themeVariantsCookie } });
        }
        if (!mainStates.showDevConfigBar &&
          devContextCli())
          setMainStatesCache({ showDevConfigBar: true });
      } catch (error) {
        dbgError(dbgContext, 'logReferer', error.message);
      }
    })();
    return () => { mount = false; };
  }, [router.query?.retry]);

  //csd('_app ********************* buscando pageDef para', router.asPath); // , pagesPossible()
  const pageDef = usePageByVariant(pagesPossible(), router, false);

  const menuEntriesForMenuTypes = React.useMemo(() =>
    MenuEntriesHub(loggedUser, isLoadingUser),
    [loggedUserBase?.email, isLoadingUser, loggedUser]);

  // o cookie morre naturalmente pelo TTL
  // num tempo MENOR que o ttl, caso não houver nenhuma interação (reLogin ou uso de API),
  // força a apresentação do nome do usuário na tela de boas vindas, para certificar que é ele mesmo
  React.useEffect(() => {
    //csl('_app effect isLoadingUser', isLoadingUser);
    // verifica usuário logado pelo cookie e restaura sessão
    (async () => {
      if (isLoadingUser) return;
      globals.isDevUser = false;
      // try {
      //   await CallApiCliASync<any>(apisBase.others.apiPath, globals.windowId,
      //     { cmd: CmdApi_Others.checkBlock });
      // }
      // catch (error) {
      //   setMainStatesCache({ error });
      //   return;
      // }
      //dbgWarn('_app', 'ready', loggedUserBase);
      if (loggedUserBase != null) {
        // if (reSignInFuncHub != null) {
        //   //const hoursInactivity = 1; //12; // @@@!!! em mobile não deve interferir !
        //   try {
        //     @@!!!!!!!! esse resignin, com é mais demorado que o PageSignOut, está refazendo o login de forma indevida
        //     await reSignInFuncHub();
        //     // se depois de algum tempo buscar o login do cookie será forçado a apresentação da pagina 'welcome', para o usuário ver o nome
        //     // if (DateDifHours(agora, loggedUserBase.lastActivity) >= hoursInactivity &&
        //     //   routerConfirmLoginHub != null)
        //     //   router.push(routerConfirmLoginHub); // @!!!!!!! aqui um popup, não desviar paa tela de welcome!!!!
        //   } catch (error) {
        //     LogErrorUnmanaged(error, '_app-init');
        //     if (IsErrorManaged(error))
        //       dbgError(dbgContext, 'reSignInFunc', error.message);
        //   }
        //   //}
        // }
        globals.isDevUser = LoggedUserBase.isDev(loggedUserBase);
        if (!mainStates.showDevConfigBar &&
          (LoggedUserBase.isDev(loggedUserBase) ||
            LoggedUserBase.canChangeTheme(loggedUserBase)))
          setMainStatesCache({ showDevConfigBar: true });
      }
      // else {
      //   if (pageDef?.options?.onlyAuthenticated) {
      //     router.push({
      //       pathname: pagesHub.signIn.pagePath,
      //       query: { pageNeedAuthentication: pageDef.pagePath, ...router.query }
      //     });
      //   }
      // }
    })();
  }, [isLoadingUser, loggedUser]); // , loggedUser?.email

  if (mainStates.error != null)
    return (<AbortProc error={mainStates.error} tela={'_app'} loggedUserBase={loggedUserBase} />);

  //#region funções
  const changeMenuType = () => {
    if (mainStates.menuType == MenuType.lateral)
      setMainStatesCache({ menuType: MenuType.barraSuperior });
    else if (mainStates.menuType == MenuType.barraSuperior)
      //   setMainStatesCache({ menuType: MenuType.none });
      // else if (mainStates.menuType == MenuType.none)
      setMainStatesCache({ menuType: MenuType.lateral });
  };
  const changeThemeVariants = (themeVariants: IThemeVariants) => {
    setMainStatesCache({ themeVariants });
    CookieCli.setJSON(`${configApp.appName}-${cookiesSys.themeVariants}`, themeVariants);
  };

  const changeCtrlLog = (ctrlLog: string) => {
    globals.ctrlLog = ctrlLog;
    setMainStatesCache({ ctrlLog }); CookieCli.set(cookiesSys.ctrlLog, ctrlLog);
  };

  const loginAndRoute = () => {
    router.push({
      pathname: pagesHub.signIn.pagePath,
      query: { pageNeedAuthentication: pageDef.pagePath, ...router.query }
    });
  };
  //#endregion

  try {
    const themePlus = GenThemePlus(themeSchemesHub, mainStates.themeVariants);

    const menuType: MenuType = loggedUserBase != null ? mainStates.menuType : MenuType.none;

    const msgInitiatingArray = [];
    let blockByUser = null;
    const blockByControlledAccess: string = null;
    if (pageDef?.options?.onlyAuthenticated) {
      if (isLoadingUser) msgInitiatingArray.push('Verificando usuário logado');
      else if (router.query.email != null && (loggedUserBase === null || loggedUserBase.email != router.query.email))
        blockByUser = `Você deve entrar com o email ${router.query.email}`;
      else if (loggedUserBase == null)
        blockByUser = 'Usuário não logado';
      else if (!PageDef.IsUserAuthorized(pageDef, loggedUser?.roles))
        blockByUser = 'Usuário sem autorização para essa página'; //@!!!!!! testar tb nas paginas??
    }
    // if (mainStatesCache.controlledAccessStatus === ControlledAccessStatus.checking)
    //   msgInitiatingArray.push('Verificando acesso controlado');
    // else {
    //   if (mainStatesCache.controlledAccessStatus === ControlledAccessStatus.notAllowed)
    //     blockByControlledAccess = 'Device não autorizado';
    //   else if (mainStatesCache.controlledAccessStatus === ControlledAccessStatus.asked)
    //     blockByControlledAccess = 'Foi solicitado agora o acesso para o device';
    //   else if (mainStatesCache.controlledAccessStatus === ControlledAccessStatus.waiting)
    //     blockByControlledAccess = 'O acesso solicitado anteriormente ainda está pendente';
    // }

    const DevBarLine = () => (
      <Stack direction='row' justifyContent='flex-end'>
        <DevConfigBar loggedUser={loggedUserBase} />
      </Stack>
    );

    if (pageDef == null ||
      pageDef.options?.appContainerType === AppContainerType.noThemeNoLayout) {
      const AnyComponent = Component as any;
      if (OnClient()) csd('noThemeNoLayout');
      return (
        <>
          <AnyComponent />
          {globalStyle()}
        </>
      );
    }

    if (pageDef?.options?.appContainerType === AppContainerType.themeButNoLayout) {
      const AnyComponent = Component as any; //@!!!!!!!?
      csd('themeButNoLayout');
      return (
        <>
          <ThemeProvider_mui theme={themePlus}>
            <DevConfigBarContext.Provider value={{ _appMainStates: mainStates, themeVariants: mainStates.themeVariants, themeSchemes: themeSchemesHub, changeMenuType, changeThemeVariants, changeCtrlLog }}>
              <Stack spacing={0} height='100%' bgcolor='#f0f0f0' pb={mainStates.reserveFooterMobile ? '48px' : null}>
                <Box flex={1} overflow='hidden'>
                  <AnyComponent />
                </Box>
                {/* <Tx>----- antes do devBarLine ------</Tx> */}
                <DevBarLine />
              </Stack>
            </DevConfigBarContext.Provider>
            {globalStyle()}
            <DialogContainer />
            <SnackBarContainer />
          </ThemeProvider_mui>
        </>
      );
    }

    return (
      <>
        <Head>
          <title>{pageDef?.options?.pageTitle}</title>
          <link rel='icon' href='/favicon.ico' />
        </Head>
        <Box height='100%' >
          <MsalProvider instance={msalInstance}>
            {/* <chgUserAndRouteContext.Provider value={{ chgUserAndRouteStart, chgUserAndRouteFinish }}> */}
            <ThemeProvider_mui theme={themePlus}>
              {msgInitiatingArray.length > 0
                ? <Stack spacing={1} pl='1.5rem' pr='1rem' pt='1rem' pb='0.5rem'>
                  <WaitingObs text={msgInitiatingArray.join(', ')} />
                </Stack>
                : <>
                  {(blockByUser != null) &&
                    <Stack spacing={1} pl='1.5rem' pr='1rem' pt='1rem' pb='0.5rem'>
                      <Tx>{blockByUser}</Tx>
                      <BtnLine left>
                        <Btn onClick={() => loginAndRoute()}>Ir para o login</Btn>
                      </BtnLine>
                    </Stack>
                  }
                  {(blockByControlledAccess != null) &&
                    <Stack spacing={1} pl='1.5rem' pr='1rem' pt='1rem' pb='0.5rem'>
                      <Tx>{blockByControlledAccess}</Tx>
                      <FakeLink onClick={() => retryAccessControlled()}>Se você já falou com o responsável clique aqui para tentar novamente o acesso.</FakeLink>
                    </Stack>
                  }
                  {(blockByUser == null && blockByControlledAccess == null) &&
                    <DevConfigBarContext.Provider value={{ _appMainStates: mainStates, themeVariants: mainStates.themeVariants, themeSchemes: themeSchemesHub, changeMenuType, changeThemeVariants, changeCtrlLog }}>
                      <Stack spacing={0} height='100%' pb={mainStates.reserveFooterMobile ? '43px' : null}>
                        <Box flex={1} overflow='hidden'>
                          <preserveStateContext.Provider value={{ preserveStateSet, preserveStateGet, preserveStateResetAll }}>
                            <Layout
                              menuEntriesForMenuTypes={menuEntriesForMenuTypes}
                              menuType={pageDef?.options?.hideMenu ? null : menuType}
                              Component={Component}
                              pageProps={pageProps}
                              pageDefCurr={pageDef}
                              imgApp={imgAppHub}
                            />
                          </preserveStateContext.Provider>
                        </Box>
                        {/* <DisclaimerCookie pageTermsPath={pageTerms.pagePath} pagePrivacyPath={pagePrivacy.pagePath} /> */}
                        {mainStates.showDevConfigBar && <DevBarLine />}
                        {DisclaimerHub != null && <DisclaimerHub />}
                      </Stack>
                    </DevConfigBarContext.Provider>
                  }
                </>
              }
              <DialogContainer />
              <SnackBarContainer />
            </ThemeProvider_mui >
            {globalStyle()}
          </MsalProvider>
          {/* </ThemeProviderSC > */}
          {/* </chgUserAndRouteContext.Provider> */}
          {/* <GlobalStyleSC theme={themePlus} /> */}
          {/* <style jsx global>{`${cssByTheme(themePlus)}`}</style>  aqui ainda pendente devido ao 'div#__next height: 100%;' não funcionar */}
        </Box>
      </>
    );
  } catch (error) {
    LogErrorUnmanaged(error, '_app-render');
    return (<AbortProc error={error} tela='_app' loggedUserBase={loggedUserBase} />);
  }
}