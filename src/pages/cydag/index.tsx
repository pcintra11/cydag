import React from 'react';
import { useRouter } from 'next/router';

import { Box, Stack } from '@mui/material';

import { Btn, BtnLine, LogErrorUnmanaged, AbortProc } from '../../components';

import { useLoggedUser } from '../../appCydag/useLoggedUser';
//import { GetLoggedUserFromHttpCookieASync } from '../../appCydag/getLoggedUserFromHttpCookieASync';
import { pagesApp } from '../../appCydag/endPoints';

const pageSelf = pagesApp.index;
export default function PageIndex() {
  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: 'index' });

  React.useEffect(() => {
    if (!router.isReady || isLoadingUser) return;
    if (loggedUser != null)
      router.push(pagesApp.home.pagePath);
    router.push(pagesApp.signIn.pagePath);
    // GetLoggedUserFromHttpCookieASync('index') //@!!!
    //   .then((loggedUserCookieHttp) => dbg({ level: 1, context: 'index' }, 'loggedUser cookie http', loggedUserCookieHttp));
  }, [router.isReady, isLoadingUser, loggedUser?.email]);

  try {
    return (
      <Box height='100%' overflow='auto'>
        <Stack gap={1}>
          {loggedUser == null
            ? <BtnLine left>
              <Btn onClick={() => router.push(pagesApp.signIn.pagePath)}>Entrar no Sistema</Btn>
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