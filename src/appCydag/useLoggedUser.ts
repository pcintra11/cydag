import React from 'react';

import { csd, dbgError } from '../libCommon/dbg';
const useMsal = () => ({ accounts: [], inProgress: Math.random() > 0.5 ? 'none' : '' });
//import { useMsal } from '@azure/msal-react';
// import { clientId } from '../msal';
const clientId = '';

import { EnvDeployConfig } from '../app_base/envs';

import { GlobalState } from '../hooks/useGlobalState';
import { useGlobalState } from '../hooks/useGlobalState';

import { LoggedUser } from './loggedUser';

import { GetLoggedUserFromHttpCookieASync } from './getLoggedUserFromHttpCookieASync';
import { UserSignInASync } from './userResourcesCli';
import { pswSignInAzure } from '../pages/api/appCydag/user/types';

// export function UseAzureUserInfo() {
//   const { instance, accounts } = useMsal();
//   const [profile, setProfile] = React.useState<any>(null);
//   const name = accounts.length > 0 ? accounts[0].name as string : 'não logado';
//   //Adquire silenciosamente um token de acesso que é anexado a uma solicitação de dados do Microsoft Graph
//   React.useEffect(() => {
//     console.log('useEff');
//     const request = { scopes: ['User.Read'], account: accounts[0] };
//     instance.acquireTokenSilent(request).then((response) => {
//       msGraphGetUserProfile(response.accessToken, setProfile); //.then(response => setGraphData(response));
//     }).catch((e) => {
//       instance.acquireTokenPopup(request).then((response) => {
//         msGraphGetUserProfile(response.accessToken, setProfile); //.then(response => setGraphData(response));
//       });
//     });

//   }, [instance, accounts]);
//   return { userInfo: { name, profile } };
// }
/**
 * Anexa um determinado token de acesso a uma chamada de API do Microsoft Graph. Retorna informações sobre o usuário
 */
//  export async function msGraphGetUserProfile(accessToken: string, setProfile: (data: any) => void) {
//   // Adicione os pontos de extremidade aqui para os serviços da API do Microsoft Graph que você gostaria de usar.
//   const graphConfig = { graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me' };
//   const headers = new Headers();
//   const bearer = `Bearer ${accessToken}`;
//   headers.append('Authorization', bearer);
//   const options = {
//     method: 'GET',
//     headers: headers
//   };
//   return fetch(graphConfig.graphMeEndpoint, options)
//     .then(response => response.json())
//     .then(response => setProfile(response))
//     .catch(error => { console.log('callMsGraph error', { error }); setProfile(null); });
// }

let globalUser: GlobalState = null;
//let reloginFromCookieNotConfirmed = false;
//const setReloginConfirmed = () => reloginFromCookieNotConfirmed = false;

interface IParm {
  reRender?: boolean;
  id?: string;
}
export function useLoggedUser(parm: IParm = {}) {
  const parmDef: IParm = { reRender: true, id: null };
  const parmUse: IParm = { ...parmDef, ...parm };
  const { reRender, id } = parmUse;
  const [handleRedirectFase] = React.useState(false); // ainda não está em uso !
  const { accounts, inProgress } = useMsal();
  //const [msalInitiating, setMsalInitiating] = React.useState(true);

  //csd('useLoggedUser render', {handleRedirectFase: handleRedirectFase, inProgress, accounts});

  try {
    // if (OnServer()) // causa warning no client que a pagna do server e client são diferentes para isLoadingUser !
    //   return { loggedUser, isLoadingUser }; // , ...userFunctions
    if (globalUser == null) {
      if (EnvDeployConfig().mode_auth == 'azure')
        globalUser = new GlobalState({ loadingStateWaitExternal: true, id: 'loggedUser', debug: false });
      else
        globalUser = new GlobalState({ defaultValueAsyncFunction: () => GetLoggedUserFromHttpCookieASync(`useLoggedUser-${id}`), id: 'loggedUser', debug: false });
    }

    // o login será feito por aqui OU na pagina signInAzure
    // para funcionar aqui o azure já deve estar autenticado E o evento handleRedirect já ter sido processado
    // o desligamento do status 'loading' será totalmente nesse componente 

    //dbgInfo(`useLoggedUser ${id}`);
    const { value: userAux, setState, isLoading: isLoadingUser } = useGlobalState(globalUser, { reRender, id });
    const loggedUser = userAux as LoggedUser;

    if (EnvDeployConfig().mode_auth == 'azure') {
      // determina um limite de tempo para o evento handleRedirect ocorrer
      // React.useEffect(() => {
      //   mount = true;
      //   setTimeout(() => {
      //     if (!mount) return;
      //     csd('timeout **********************');
      //     setHandleRedirectFase(true);
      //   }, 5000);
      //   return () => { mount = false; };
      // }, []);

      // React.useEffect(() => {
      //   //csd('useLoggedUser effect handleRedirect', inProgress);
      //   if (!handleRedirectFase) { // tentativa em postergar o isLoading MAS não está ainda funfando
      //     if (inProgress == 'handleRedirect')
      //       setHandleRedirectFase(true);
      //   }
      // }, [inProgress]);

      React.useEffect(() => {
        if (!isLoadingUser) return;
        // if (!handleRedirectFase) return; aqui está causando travamento do msal processes 
        if (inProgress !== 'none') return;
        const accountAzureApp = accounts.find((x) => x.idTokenClaims.aud === clientId);
        if (accountAzureApp != null) {
          UserSignInASync(accountAzureApp.username.toLowerCase(), pswSignInAzure)
            .then((loggedUserNow) => setUser(loggedUserNow, 'useLoggedUser', false))
            .catch(() => setUser(null, 'useLoggedUser', false));
        }
        else
          setUser(null, 'useLoggedUser', false);
      }, [isLoadingUser, handleRedirectFase, inProgress, accounts.map((x) => x.idTokenClaims?.aud).join(',')]);
    }

    // if (userAux != null) {
    //   if (isOriginValueFromCookie) {
    //     //loggedUser = LoggedUser.deserialize(userAux);
    //     reloginFromCookieNotConfirmed = true; // posteriormente será 'setado com origin memory' (revalidação de login)
    //   }
    //   // else
    //   //   loggedUser = userAux as LoggedUser;
    // }

    const setUser = (loggedUser: LoggedUser, caller?: string, isLoading?: boolean) => {
      //csd('setUser', { loggedUser, caller, isLoading });
      setState(loggedUser, caller, isLoading);
    };

    //return { loggedUser, isLoadingUser, setUser, reloginFromCookieNotConfirmed, setReloginConfirmed };
    return { loggedUser, isLoadingUser, setUser };
  }
  catch (error) {
    dbgError('useLoggedUser', error.message);
    return { loggedUser: null as LoggedUser, isLoadingUser: false, setUser: (...params) => dbgError('setUser', 'caso de erro não tratado!', ...params) };
  }
}