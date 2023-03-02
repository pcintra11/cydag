import React from 'react';

import { _AppLogRedir } from './_app';

import { WaitingObs } from '../components';
import { pagesBase } from '../base/endPoints';

//import { useLoggedUser } from '../../appCydag/useLoggedUser';

const pageSelf = pagesBase.chgUserAndRoute;
export default function PageChgUserAndRoute() {
  const { chgUserAndRouteFinish } = React.useContext(_AppLogRedir);

  React.useEffect(() => {
    //if (!router.isReady) return;
    // const chgUserAndRoute = chgUserAndRouteFinish();
    // if (chgUserAndRoute?.pathname != null) {
    //   setUser(chgUserAndRoute.loggedUser, pageSelf.pagePath);
    //   setTimeout(() => router.push({ pathname: chgUserAndRoute.pathname, query: chgUserAndRoute.query }), 0);
    //   return;
    // }
    // else
    //   setTimeout(() => router.push({ pathname: pagesApp.index.pagePath }), 0);
    chgUserAndRouteFinish();
  }, []);
  return (<WaitingObs text='Redirecionando' />);
}