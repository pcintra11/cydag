'use client'

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { CallApiCliASync } from '../../fetcher/fetcherCli';
import { LoggedUser } from '../../appCydag/loggedUser';
import { useLoggedUser } from '../../appCydag/useLoggedUser';

import { ErrorPlus, ObjUpdAllProps } from '../../libCommon/util';
import { AbortProc, LogErrorUnmanaged, Tx } from '../../components';
import { isAmbPrd } from '../../app_base/envs';

let mount; let mainStatesCache;
const pageSelf = pagesApp.posLoginSSO;

const apis = {
  setLoggedUserServer: async () => {
    const apiReturn = await CallApiCliASync<any>(apisApp.setLoggedUserServer.apiPath);
    return {
      loggedUser: LoggedUser.deserialize(apiReturn.value.loggedUser),
      betterAuthUser: apiReturn.value.betterAuthUser,
    };
  },
};

export default function PosLoginSSO() {
  interface MainStates {
    error?: Error | ErrorPlus;
  }
  const [mainStates, setMainStates] = useState<MainStates>({});
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, setUser } = useLoggedUser({ id: pageSelf.pagePath });

  useEffect(() => {
    mount = true;
    (async () => {
      try {
        const { loggedUser, betterAuthUser } = await apis.setLoggedUserServer();
        if (!isAmbPrd()) //@!!!!!26
          console.log('Usuário betterAuth', betterAuthUser, ', considerado para o Cydag', loggedUser.emailSigned);
        setUser(loggedUser, pageSelf.pagePath);
        router.push({ pathname: pagesApp.home.pagePath });
      } catch (error: any) {
        console.log('erro em PosLoginSSO', error);
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-onSubmit`);
        //if (!IsErrorManaged(error)) {
        setMainStatesCache({ error });
        //   return;
        // }
      }
    })();
  }, []);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;

  try {
    return (
      <Tx>Conectando...</Tx>
    );
  } catch (error: any) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />);
  }
}