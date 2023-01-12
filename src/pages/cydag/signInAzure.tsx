import React from 'react';
import { useRouter } from 'next/router';
import { useMsal } from '@azure/msal-react';
import _ from 'underscore';

import { Box, Stack } from '@mui/material';

import { _AppLogRedir } from '../_app';

import { pagesApp } from '../../appCydag/endPoints';
import { csd } from '../../libCommon/dbg';
import { AbortProc, BtnLine, LogErrorUnmanaged, SnackBarError } from '../../components';
import { Btn } from '../../components/ui';

import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { pswSignInAzure } from '../api/appCydag/user/types';
import { UserSignInASync } from '../../appCydag/userResourcesCli';

import {
  AuthenticationResult,
  //PublicClientApplication,
} from '@azure/msal-browser';

// https://www.daryllukas.me/azure-ad-authentication-using-msal-and-nextjs-react/
const pageSelf = pagesApp.signIn;
export default function PageSignInAzure() {
  const router = useRouter();
  const { instance, accounts, inProgress } = useMsal();
  const { loggedUser, setUser } = useLoggedUser({ id: '_app' });
  //const [autoLoginStage, setAutoLoginStage] = React.useState(0);
  //const [msalLogged, setMsalLogged] = React.useState(false);
  const [msalInitiating, setMsalInitiating] = React.useState(true);

  //csd('sigInAzure render', { msalInitiating, inProgress, accounts, loggedUser });

  //const accountAzureApp = accounts.find((x) => x.idTokenClaims.aud === clientId);
  const loginPop = async () => {
    try {
      //https://stackoverflow.com/questions/71414668/intermittent-problem-using-loginpopup-msal-js-in-a-react
      //https://www.thirdrocktechkno.com/blog/microsoft-login-integration-with-react/
      console.log('*********** LOGIN AZURE ****************');

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

      // console.log('Azure details> ', accountAzureApp);

      const loggedUserNow = await UserSignInASync(accountAzureApp.account.username.toLowerCase(), pswSignInAzure);
      setUser(loggedUserNow, pageSelf.pagePath);
    }
    catch (error) {
      //setAutoLoginStage(2);
      setUser(null, null);
      if (error.errorCode === 'user_cancelled')
        return;
      SnackBarError(error, `${pageSelf.pagePath}-loginPop`);
    }
  };
  const logoutPop = async () => {
    try {
      //await instance.logoutPopup(); 
      await instance.logoutRedirect();
    }
    catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-logoutPop`);
    }
  };

  // apenas para estabilizar o processo do msal, ao entrar na página
  React.useEffect(() => {
    //csd('signInAzure effect 1');
    if (!msalInitiating) return;
    if (inProgress !== 'none') return;
    //csd('signInAzure effect 1 - anulando initiating');
    setMsalInitiating(false);
  }, [inProgress]); // accounts.length, 

  // após a inicialização do msal checa se o usuário já está logado e vai para home
  React.useEffect(() => {
    //csd('signInAzure effect 2');
    if (msalInitiating) return;
    if (inProgress !== 'none') return;
    if (loggedUser != null) {
      const nextPagePathName = pagesApp.home.pagePath;
      const nextPageQuery: any = undefined;
      // if (router.query?.pageNeedAuthentication != null) {
      //   nextPagePathName = router.query.pageNeedAuthentication as string;
      //   nextPageQuery = _.omit(router.query, 'pageNeedAuthentication');
      // }
      router.push({ pathname: nextPagePathName, query: nextPageQuery });
      //setTimeout(() => router.push({ pathname: nextPagePathName, query: nextPageQuery }), 0);
    }
  }, [msalInitiating, inProgress, loggedUser?.email]);

  try {

    return (
      <Stack gap={1} height='100%' overflow='auto'>
        <Stack gap={1}>
          {msalInitiating
            ? <Box>Azure inicializando...</Box>
            : <>
              {/* <Box>Verificando a autenticação (stage)...</Box> */}
              <BtnLine>
                <Btn onClick={() => loginPop()}>Conectar</Btn>
              </BtnLine>
              {accounts.length > 0 &&
                <BtnLine>
                  <Btn onClick={() => logoutPop()}>Desconectar</Btn>
                </BtnLine>
              }
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