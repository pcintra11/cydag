import React from 'react';
import { useRouter } from 'next/router';
import _ from 'underscore';

import { _AppLogRedir } from '../_app';

import { csd } from '../../libCommon/dbg';

import { WaitingObs } from '../../components';

import { pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';

const pageSelf = pagesApp.logRedir;
export default function PageLogRedir() {
  const { logRedirSetGet } = React.useContext(_AppLogRedir);

  const router = useRouter();
  const { setUser } = useLoggedUser({ id: pageSelf.pagePath });

  React.useEffect(() => {
    if (!router.isReady) return;
    const logRedir = logRedirSetGet();
    if (logRedir?.pathname != null) {
      setUser(logRedir.loggedUser, pageSelf.pagePath);
      setTimeout(() => router.push({ pathname: logRedir.pathname, query: logRedir.query }), 0);
      return;
    }
    else
      setTimeout(() => router.push({ pathname: pagesApp.index.pagePath }), 0);
  }, []);
  return (<WaitingObs text='Redirecionando' />);
}