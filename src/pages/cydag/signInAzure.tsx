import React from 'react';
import { useRouter } from 'next/router';
import { useMsal } from '@azure/msal-react';
import _ from 'underscore';

import { Stack } from '@mui/material';

import { pagesApp } from '../../appCydag/endPoints';
import { csd } from '../../libCommon/dbg';
import { AbortProc, BtnLine, LogErrorUnmanaged, PopupMsg } from '../../components';
import { Btn, Tx } from '../../components/ui';

import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { pswSignInAzure } from '../api/appCydag/user/types';
import { UserSignInASync } from '../../appCydag/userResourcesCli';

import {
  AuthenticationResult,
  //PublicClientApplication,
} from '@azure/msal-browser';

//let mount = false;

// https://www.daryllukas.me/azure-ad-authentication-using-msal-and-nextjs-react/
const pageSelf = pagesApp.signIn;
export default function PageSignInAzure() {
  const router = useRouter();
  const { instance, inProgress } = useMsal(); // accounts, 
  const { loggedUser, setUser } = useLoggedUser({ id: '_app' });
  //const [autoLoginStage, setAutoLoginStage] = React.useState(0);
  //const [msalLogged, setMsalLogged] = React.useState(false);
  const [msalInitiating, setMsalInitiating] = React.useState(true);
  const [loggingCydag, setLoggingCydag] = React.useState(false);

  //csd('sigInAzure render', { msalInitiating, inProgress, accounts, loggedUser });

  //const accountAzureApp = accounts.find((x) => x.idTokenClaims.aud === clientId);
  const loginPop = async () => {
    try {
      //https://stackoverflow.com/questions/71414668/intermittent-problem-using-loginpopup-msal-js-in-a-react
      //https://www.thirdrocktechkno.com/blog/microsoft-login-integration-with-react/
      //console.log('*********** LOGIN AZURE ****************');

      // instance.loginPopup({
      //   scopes: ['user.read', 'email', 'offline_access'],
      //   prompt: 'select_account',
      // }).then(r => {
      //   console.log('Retorno do login >> ', r);

      //   // UserSignInASync(r.account.username.toLowerCase(), pswSignInAzure).then(loggedUserNow => {
      //   //   setUser(loggedUserNow, pageSelf.pagePath);
      //   // });
      // });

      const accountAzureApp: AuthenticationResult | undefined = await instance.loginPopup({
        scopes: ['user.read', 'email', 'offline_access'],
        prompt: 'select_account',
      });

      //csd('Azure details> ', accountAzureApp);
      setLoggingCydag(true);

      const loggedUserNow = await UserSignInASync(accountAzureApp.account.username.toLowerCase(), pswSignInAzure);
      setUser(loggedUserNow, pageSelf.pagePath);
      //if (mount) setLoggingCydag(false);
    }
    catch (error) {
      //setAutoLoginStage(2);
      setUser(null, null);
      if (error.errorCode === 'user_cancelled')
        return;
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-loginPop`);
      PopupMsg.error(error);
    }
  };
  // const logoutPop = async () => {
  //   try {
  //     //await instance.logoutPopup(); 
  //     await instance.logoutRedirect();
  //   }
  //   catch (error) {
  //     LogErrorUnmanaged(error, `${pageSelf.pagePath}-logoutPop`);
  //   }
  // };

  // apenas para estabilizar o processo do msal, ao entrar na página
  React.useEffect(() => {
    //mount = true;
    //csd('signInAzure effect 1');
    if (!msalInitiating) return;
    if (inProgress !== 'none') return;
    if (loggedUser != null) return;
    setMsalInitiating(false);
    loginPop();
    //return () => { mount = false; };
  }, [inProgress]); // accounts.length, 

  // após a inicialização do msal checa se o usuário já está logado e vai para home
  React.useEffect(() => {
    //csd('signInAzure effect 2', {msalInitiating, inProgress});
    //if (msalInitiating) return;
    //if (inProgress !== 'none') return;
    if (loggedUser != null) {
      let nextPagePathName = pagesApp.home.pagePath;
      let nextPageQuery: any = undefined;
      if (router.query?.pageNeedAuthentication != null) {
        nextPagePathName = router.query.pageNeedAuthentication as string;
        nextPageQuery = _.omit(router.query, 'pageNeedAuthentication');
      }
      router.push({ pathname: nextPagePathName, query: nextPageQuery });
      //setTimeout(() => router.push({ pathname: nextPagePathName, query: nextPageQuery }), 0);
    }
  }, [router.isReady, msalInitiating, inProgress, loggedUser?.email]);

  if (loggingCydag) return (<Tx>Entrando no sistema...</Tx>);

  try {

    return (
      <Stack spacing={1} height='100%' overflow='auto'>
        <Stack spacing={1}>
          {msalInitiating
            ? <Tx>Azure inicializando...</Tx>
            : <>
              {/* <Box>Verificando a autenticação (stage)...</Box> */}
              <BtnLine>
                <Btn onClick={() => loginPop()}>Conectar</Btn>
              </BtnLine>
              {/* {accounts.length > 0 &&
                <BtnLine>
                  <Btn onClick={() => logoutPop()}>Desconectar</Btn>
                </BtnLine>
              } */}
            </>
          }
        </Stack>
      </Stack>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />);
  }
}