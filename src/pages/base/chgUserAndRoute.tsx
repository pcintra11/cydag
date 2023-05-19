import React from 'react';

import { chgUserAndRouteContext } from '../_appResources';

import { csd } from '../../libCommon/dbg';

import { WaitingObs } from '../../components';
import { pagesBase } from '../../app_base/endPoints';

//import { useLoggedUser } from '../../appCydag/useLoggedUser';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const pageSelf = pagesBase.chgUserAndRoute;
export default function PageChgUserAndRoute() {
  const { chgUserAndRouteFinish } = React.useContext(chgUserAndRouteContext);

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