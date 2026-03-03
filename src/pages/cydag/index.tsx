import React from 'react';
import { useRouter } from 'next/router';

import { Box, Stack } from '@mui/material';

import { Btn, BtnLine, LogErrorUnmanaged, AbortProc } from '../../components';

import { useLoggedUser } from '../../appCydag/useLoggedUser';
//import { GetLoggedUserFromHttpCookieASync } from '../../appCydag/getLoggedUserFromHttpCookieASync';
import { pagesApp } from '../../appCydag/endPoints';
import { isAmbPrd } from '../../app_base/envs';
import { authClient } from '../../libClient/betterAuth';
import { UrlForPage } from '../../libCommon/util';

const pageSelf = pagesApp.index;
const apis = {
  signInSocial: async (provider: 'microsoft') => {
    await authClient.signIn.social({
      provider,
      callbackURL: UrlForPage(pagesApp.posLoginSSO.pagePath),
    });
  },
};

export default function PageIndex() {
  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: 'index' });

  React.useEffect(() => {
    if (!router.isReady || isLoadingUser) return;
    if (loggedUser != null)
      router.push(pagesApp.home.pagePath);
    //router.push(pagesApp.signIn.pagePath);
    // GetLoggedUserFromHttpCookieASync('index') //@!!!
    //   .then((loggedUserCookieHttp) => dbg({ level: 1, context: 'index' }, 'loggedUser cookie http', loggedUserCookieHttp));
  }, [router.isReady, isLoadingUser, loggedUser?.email]);

  try {
    return (
      <Box height='100%' overflow='auto'>
        <Stack spacing={1}>
          {loggedUser == null
            ? <BtnLine left>
              <Btn onClick={() => apis.signInSocial('microsoft')}>Entrar com login de rede</Btn>
              {/* @!!!!!!!!!!26 */}
              {!isAmbPrd() &&
                <Btn onClick={() => router.push(pagesApp.signIn.pagePath)}>Entrar com email</Btn>
              }
            </BtnLine>
            : <Box>
              <Btn onClick={() => router.push(pagesApp.home.pagePath)}>Ir para o menu</Btn>
            </Box>
          }
        </Stack>
      </Box>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} />);
  }
}