import React from 'react';
import { useRouter } from 'next/router';

import { AbortProc, LogErrorUnmanaged } from '../../components';

import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { pagesApp } from '../../appCydag/endPoints';
import { UserSignOut } from '../../appCydag/userResourcesCli';

const pageSelf = pagesApp.signOut;
export default function PageSignOut() {
  const router = useRouter();
  const { loggedUser, isLoadingUser, setUser } = useLoggedUser({ id: pageSelf.pagePath });

  React.useEffect(() => {
    if (isLoadingUser) return;
    if (loggedUser != null) {
      UserSignOut(pageSelf.pagePath);
      setUser(null, pageSelf.pagePath);
    }
    setTimeout(() => {
      router.push(pagesApp.signIn.pagePath);
    }, 0);
  }, [isLoadingUser]);

  try {
    return (
      <>
        <div>
          Desconectado
        </div>
      </>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />);
  }
}