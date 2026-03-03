import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Stack } from '@mui/material';

import { AbortProc, BtnLine, LogErrorUnmanaged } from '../../components';
import { Btn, Tx } from '../../components/ui';

import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { pagesApp } from '../../appCydag/endPoints';
import { UserSignOut } from '../../appCydag/userResourcesCli';

const pageSelf = pagesApp.signOut;
export default function PageSignOutMs() {
  const router = useRouter();
  const { loggedUser, isLoadingUser, setUser } = useLoggedUser({ id: pageSelf.pagePath });

  useEffect(() => {
    if (isLoadingUser) return;
    if (loggedUser != null) {
      UserSignOut(pageSelf.pagePath);
      setUser(null, pageSelf.pagePath);
    }
    setTimeout(() => {
      router.push(pagesApp.signInMs.pagePath);
    }, 0);
  }, [isLoadingUser]);

  try {
    return (
      <Stack spacing={1} height='100%' overflow='auto'>
        <Stack spacing={1}>
          <Tx>Desconectado</Tx>
          <BtnLine>
            <Btn onClick={() => router.push(pagesApp.signInMs.pagePath)}>Entrar novamente</Btn>
          </BtnLine>
        </Stack>
      </Stack>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />);
  }
}