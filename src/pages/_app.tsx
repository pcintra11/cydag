import React from 'react';
import { useRouter } from 'next/router';
import { AppProps } from 'next/app';
import Head from 'next/head';
//import { ThemeProvider as ThemeProviderSC } from 'styled-components';
import { v1 as uuidv1 } from 'uuid';

import { ThemeProvider as ThemeProvider_mui } from '@mui/material/styles';
import { Box, Stack } from '@mui/material';

import { configApp } from '../app_hub/appConfig';

import { MenuEntriesHub, pagesHub, reSignInFuncHub, themeSchemesHub, imgAppHub, DisclaimerHub } from '../app_hub/clientResources';
import { EnvDeployConfig, isAmbDev } from '../app_base/envs';

import { CmdApi_Others } from './api/app_base/others/types';
import { ControlledAccessStatus } from './api/app_base/controlledAccess/types';
import { apisBase, pagesBase, PagesBaseArray } from '../app_base/endPoints';
import { LoggedUserBase } from '../app_base/modelTypes';
import { ControlledAccessCheck, ControlledAccessClaim } from '../app_base/controlledAccess';

import { IdByTime, IsErrorManaged, ErrorPlusHttpStatusCode, ErrorPlus, ObjDiff, ErrorPlusData, FillClassProps } from '../libCommon/util';
import { OnClient } from '../libCommon/sideProc';
import { csd, dbgError, dbgWarn } from '../libCommon/dbg';
import { cookiesSys } from '../libCommon/cookies_sys';
import { rolesDev } from '../libCommon/endPoints';
import { IGenericObject } from '../libCommon/types';

import { CallApiCliASync } from '../fetcher/fetcherCli';

import { IThemeVariants } from '../styles/themeTools';
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

import { PagesSuporteArray } from '../app_suporte/endPoints';

import { IChgUserAndRoute, chgUserAndRouteContext, preserveStateContext } from './_appResources';

// partes específicas por APP --------------------
import { useLoggedUser } from '../appCydag/useLoggedUser';
import { PagesAppArray } from '../appCydag/endPoints';
import { menuTypeApp } from '../appCydag/themes';

// partes específicas - autenticação pelo Azure (MSAL) --------------------
import { msalInstance } from '../msal';
import { MsalProvider } from '@azure/msal-react';

let themeVariants: IThemeVariants = {}; // defaultThemeVariants(themeSchemesHub);

(() => { // set todas as variáveis globais no client, incluindo aquelas usadas em chamadas de API antes do effect ser resolvido
  if (OnClient()) {
    const dbgShowCookieStr = CookieCli.get(cookiesSys.dbgShowCookieStr);
    if (dbgShowCookieStr == 'dbgShow') // @!!!!! pensar em algo dinâmico que só o dev saiba
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

    const themeVariantsCookie = CookieCli.getJSON(`${configApp.appName}-${cookiesSys.themeVariants}`);
    if (themeVariantsCookie != null)
      themeVariants = { ...themeVariants, ...themeVariantsCookie };

    globals.ctrlLog = CookieCli.get(cookiesSys.ctrlLog);
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

const checkControlledAccess = EnvDeployConfig().controlled_access === true;

//let renderCount = 0;
class MainStates {
  error?: Error | ErrorPlus;
  controlledAccessStatus?: ControlledAccessStatus;
  themeVariants?: IThemeVariants;
  ctrlLog?: string;
  menuType?: MenuType;
  chgUserAndRoute?: IChgUserAndRoute;
  preserveState?: IGenericObject;
}
let mount = false; const mainStatesCache = new MainStates();
//csd('_app compile ****************************************');

export default function _app({ Component, pageProps }: AppProps) {
  // 'Component' é o export default da pagina
  // pageProps => is an object with the initial props that were preloaded for your page by one of our data fetching methods, otherwise it's an empty object.
  const [mainStates, setMainStates] = React.useState<MainStates>({
    themeVariants: themeVariants,
    controlledAccessStatus: (checkControlledAccess ? ControlledAccessStatus.checking : ControlledAccessStatus.allowed),
    ctrlLog: globals.ctrlLog,
    menuType: menuTypeApp,
  });
  FillClassProps(mainStatesCache, mainStates); const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; FillClassProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser, setUser } = useLoggedUser({ id: '_app' });
  //csd('_app render', router.route );
  const agora = new Date();
  const dbgContext = `${router.route} (_app)`;

  const loggedUserBase: LoggedUserBase = loggedUser;

  //#region _App contexts
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

  //csl(dbgContext, { loggedUser, isLoadingUser, reloginFromCookieNotConfirmed });

  const retryAccessControlled = () => {
    router.push({ pathname: router.pathname, query: { retry: IdByTime() } });
  };

  React.useEffect(() => {
    // verifica se frontend habilitado, se device permitido e log do referer (entrada na app)
    // restaura preferências do device para nivelLog e temas de cores
    mount = true;
    (async () => {
      if (EnvDeployConfig().front_end == false) {
        setMainStatesCache({ error: new ErrorPlus('Não está habilitado o front-end neste deploy') });
        return;
      }
      //csl('pagesPossible', pagesPossible);
      if (checkControlledAccess) {
        try {
          // todo o controle é pelo browserId (gerado na primeira vez ao acessar pelo device, e antes de limpar os cookies)
          // se o cookie for limpo MAS já houve alguma associação do browserId autorizado para algum IP vai liberar tb (pelo IP)
          const { controlledAccessStatus, message } = await ControlledAccessCheck();
          csd('Autorização:', message);
          setMainStatesCache({ controlledAccessStatus });
        } catch (error) {
          // não autorizado: vai dar a opção de pedir para autorizar, que deverá ser atendida pela ADM do sistema
          LogErrorUnmanaged(error, '_app-checkBrowserAllowed');
          if (IsErrorManaged(error)) {
            const controlledAccessStatus = ErrorPlusData(error).controlledAccessStatus as ControlledAccessStatus;
            setMainStatesCache({ controlledAccessStatus });
            if (controlledAccessStatus === ControlledAccessStatus.notAllowed ||
              controlledAccessStatus === ControlledAccessStatus.waiting) {
              DialogMy({
                body: controlledAccessStatus === ControlledAccessStatus.notAllowed
                  ? 'Esse é um ambiente controlado e precisa de autorização para uso.'
                  : 'Sua solicitação de acesso ainda está pendente',
                dialogInputs: [
                  { label: 'Informe abaixo o seu nome' },
                ],
                buttons: [
                  { text: 'Cancela' },
                  {
                    text: controlledAccessStatus === ControlledAccessStatus.notAllowed
                      ? 'Solicitar acesso'
                      : 'Re-solicitar acesso',
                    fnCheck: (inputResponses: string[]) => inputResponses[0].trim() == '' ? 'Nome não informado' : null,
                    onClick: (inputResponses: string[]) => {
                      ControlledAccessClaim(inputResponses[0])
                        //CallApiCliASync(apis.notLoggedApis.apiPath, globals.windowId, { cmd: controlledAccess_CmdApi.controlledAccessClaimAccess, info: inputResponses[0] })
                        .then(({ controlledAccessStatus }) => {
                          setMainStatesCache({ controlledAccessStatus });
                        })
                        .catch((error) => dbgError(dbgContext, `ControlledAccessClaimHub: ${error.message}`));
                    }
                  },
                ]
              });
            }
            else
              setMainStatesCache({ error: new ErrorPlus(`controlledAccessCheckAllowed status não previsto: ${controlledAccessStatus}`) });
          }
          else
            setMainStatesCache({ error: new ErrorPlus(`controlledAccessCheckAllowed error: ${error.message}`) });
        }
      }
      else
        CallApiCliASync<any>(apisBase.others.apiPath,
          { cmd: CmdApi_Others.logReferer }, { fetchAndForget: true });
      //.catch((error) => dbgError(dbgContext, 'logReferer', error.message));
      //await SleepMsDevRandom(1000, '_app');
      try {
        const themeVariantsCookie = CookieCli.getJSON(`${configApp.appName}-${cookiesSys.themeVariants}`);
        if (themeVariantsCookie != null) {
          if (ObjDiff(themeVariantsCookie, mainStates.themeVariants) != null)
            setMainStatesCache({ themeVariants: { ...mainStates.themeVariants, ...themeVariantsCookie } });
        }
      } catch (error) {
        dbgError(dbgContext, 'logReferer', error.message);
      }
    })();
    return () => { mount = false; };
  }, [router.query?.retry]);

  //csl('_app ********************* buscando pageDef para', router.asPath, pagesPossible());
  const pageDef = usePageByVariant(pagesPossible(), router, false);

  const menuEntriesForMenuTypes = React.useMemo(() =>
    MenuEntriesHub(loggedUser, isLoadingUser),
    [loggedUserBase?.email, isLoadingUser, loggedUser]);

  // o cookie morre naturalmente pelo TTL
  // num tempo MENOR que o ttl, caso não houver nenhuma interação (relogin ou uso de API),
  // força a apresentação do nome do usuário na tela de boas vindas, para certificar que é ele mesmo
  React.useEffect(() => {
    //csl('_app effect isLoadingUser', isLoadingUser);
    // verifica usuário logado pelo cookie e restaura sessão
    (async () => {
      if (isLoadingUser) return;
      // try {
      //   await CallApiCliASync<any>(apisBase.others.apiPath, globals.windowId,
      //     { cmd: CmdApi_Others.checkBlock });
      // }
      // catch (error) {
      //   setMainStatesCache({ error });
      //   return;
      // }
      dbgWarn('_app', 'ready');
      if (loggedUserBase != null) {
        if (reSignInFuncHub != null) {
          //const hoursInactivity = 1; //12; // @@@!!! em mobile não deve interferir !
          try {
            await reSignInFuncHub();
            // se depois de algum tempo buscar o login do cookie será forçado a apresentação da pagina 'welcome', para o usuário ver o nome
            // if (DateDifHours(agora, loggedUserBase.lastActivity) >= hoursInactivity &&
            //   routerConfirmLoginHub != null)
            //   router.push(routerConfirmLoginHub); // @!!!!!!! aqui um popup, não desviar paa tela de welcome!!!!
          } catch (error) {
            LogErrorUnmanaged(error, '_app-init');
            if (IsErrorManaged(error))
              dbgError(dbgContext, 'reSignInFunc', error.message);
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

  //#region funções
  const changeMenuType = () => {
    if (mainStates.menuType == MenuType.lateral)
      setMainStatesCache({ menuType: MenuType.barraSuperior });
    else if (mainStates.menuType == MenuType.barraSuperior)
      setMainStatesCache({ menuType: MenuType.none });
    else if (mainStates.menuType == MenuType.none)
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

  //#endregion

  try {
    const themePlus = GenThemePlus(themeSchemesHub, mainStates.themeVariants);

    const menuType: MenuType = loggedUserBase != null ? mainStates.menuType : MenuType.none;

    const msgInitiatingArray = [];
    let blockByAuthorizedInPage = false;
    let blockByControlledAccess = null;
    if (pageDef?.options?.onlyAuthenticated) {
      if (isLoadingUser) msgInitiatingArray.push('Verificando usuário logado');
      else if (loggedUserBase == null) blockByAuthorizedInPage = true;
    }
    if (mainStatesCache.controlledAccessStatus === ControlledAccessStatus.checking)
      msgInitiatingArray.push('Verificando acesso controlado');
    else {
      if (mainStatesCache.controlledAccessStatus === ControlledAccessStatus.notAllowed)
        blockByControlledAccess = 'Device não autorizado';
      else if (mainStatesCache.controlledAccessStatus === ControlledAccessStatus.asked)
        blockByControlledAccess = 'Foi solicitado agora o acesso para o device';
      else if (mainStatesCache.controlledAccessStatus === ControlledAccessStatus.waiting)
        blockByControlledAccess = 'O acesso solicitado anteriormente ainda está pendente';
    }

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

          <chgUserAndRouteContext.Provider value={{ chgUserAndRouteStart, chgUserAndRouteFinish }}>
            {/* <ThemeProviderSC theme={themeMui}> */}
            <ThemeProvider_mui theme={themePlus}>
              {msgInitiatingArray.length > 0
                ? <Stack gap={1} pl='1.5rem' pr='1rem' pt='1rem' pb='0.5rem'>
                  <WaitingObs text={msgInitiatingArray.join(', ')} />
                </Stack>
                : <>
                  {(blockByAuthorizedInPage) &&
                    <Stack gap={1} pl='1.5rem' pr='1rem' pt='1rem' pb='0.5rem'>
                      <Box>Sua conta não está autorizada para essa tela</Box>
                      <BtnLine left>
                        <Btn onClick={() => router.push(pagesHub.signOut.pagePath)}>Desconectar e entrar com outra conta</Btn>
                      </BtnLine>
                    </Stack>
                  }
                  {(blockByControlledAccess != null) &&
                    <Stack gap={1} pl='1.5rem' pr='1rem' pt='1rem' pb='0.5rem'>
                      <Box>{blockByControlledAccess}</Box>
                      <FakeLink onClick={() => retryAccessControlled()}>Se você já falou com o responsável clique aqui para tentar novamente o acesso.</FakeLink>
                    </Stack>
                  }
                  {(blockByAuthorizedInPage == false && blockByControlledAccess == null) &&
                    <DevConfigBarContext.Provider value={{ _appMainStates: mainStates, themeVariants: mainStates.themeVariants, themeSchemes: themeSchemesHub, changeMenuType, changeThemeVariants, changeCtrlLog }}>
                      <Stack gap={1} height='100%'>
                        <Box flex={1} overflow='hidden'>
                          <Box height='100%'>
                            {/* <DevConfigBarContext.Provider value={{ _appMainStates: mainStates, changeMenuType: changeMenuType, changeThemeVariants, changeNivelLog }}> */}
                            <preserveStateContext.Provider value={{ preserveStateSet, preserveStateGet, preserveStateResetAll }}>
                              <Layout
                                menuEntriesForMenuTypes={menuEntriesForMenuTypes}
                                menuType={menuType}
                                Component={Component}
                                pageProps={pageProps}
                                pageDefCurr={pageDef}
                                imgApp={imgAppHub}
                              />
                            </preserveStateContext.Provider>
                          </Box>
                          {/* <Box height='100%' display='flex' flexDirection='column' gap={1}>
                          <Box flex={1} overflow='auto'>
                            <Box>xx 1</Box> <Box>xx 2</Box> <Box>xx 3</Box> <Box>xx 4</Box> <Box>xx 5</Box> <Box>xx 6</Box> <Box>xx 7</Box> <Box>xx 8</Box> <Box>xx 9</Box> <Box>xx 0</Box>                      <Box>xx 1</Box> <Box>xx 2</Box> <Box>xx 3</Box> <Box>xx 4</Box> <Box>xx 5</Box> <Box>xx 6</Box> <Box>xx 7</Box> <Box>xx 8</Box> <Box>xx 9</Box> <Box>xx 0</Box>
                            <Box>ffff</Box>
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
                  }
                </>
              }
              <DialogContainer />

            </ThemeProvider_mui >
            {/* </ThemeProviderSC > */}
          </chgUserAndRouteContext.Provider>

        </MsalProvider>

        <SnackBarContainer />

        <GlobalStyleSC theme={themePlus} />
        {/* <style jsx global>{`${cssByTheme(themePlus)}`}</style>  aqui ainda pendente devido ao 'div#__next height: 100%;' não funcionar */}
      </Box>
    );
  } catch (error) {
    LogErrorUnmanaged(error, '_app-render');
    return (<AbortProc error={error} tela='_app' loggedUserBase={loggedUserBase} />);
  }
}