import React from 'react';
import { useRouter } from 'next/router';

import { AbortProc, BtnLine, LogErrorUnmanaged } from '../../components';
import { Btn, Tx } from '../../components/ui';

import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { pagesApp } from '../../appCydag/endPoints';
import { useMsal } from '@azure/msal-react';
import { Stack } from '@mui/material';
import { UserSignOut } from '../../appCydag/userResourcesCli';

const pageSelf = pagesApp.signOut;
export default function PageSignOutAzure() {
  const router = useRouter();
  const { loggedUser, isLoadingUser, setUser } = useLoggedUser({ id: pageSelf.pagePath });
  const { instance, accounts } = useMsal();

  const logoutPop = async () => {
    try {
      const result = await instance.logoutPopup();
      UserSignOut(pageSelf.pagePath);
      setUser(null, pageSelf.pagePath);
    }
    catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-logoutPop`);
    }
  };

  React.useEffect(() => {
    if (accounts.length > 0)
      logoutPop();
  }, [isLoadingUser]);

  try {
    return (
      <Stack spacing={1} height='100%' overflow='auto'>
        <Stack spacing={1}>
          {accounts.length === 0
            ? <>
              <Tx>Desconectado</Tx>
              <BtnLine>
                <Btn onClick={() => router.push(pagesApp.signIn.pagePath)}>Entrar novamente</Btn>
              </BtnLine>
            </>
            : <Tx>Desconectando ...</Tx>
          }
        </Stack>
      </Stack>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />);
  }
}