
import { CallApiCliASync } from '../fetcher/fetcherCli';

import PageIndex from '../pages/cydag';
import { themeSchemesApp } from '../appCydag/themes';
import { pagesApp, apisApp } from '../appCydag/endPoints';
import { LoggedUser } from '../appCydag/loggedUser';
import { MenuEntriesApp } from '../appCydag/menuEntries';
import { CmdApi_UserAuth } from '../pages/api/appCydag/user/types';

const DisclaimerApp = null;
export const imgAppHub = '/appCydag/logo.png';

export const DisclaimerHub = DisclaimerApp;
export const themeSchemesHub = themeSchemesApp;
export const pagesHub = {
  signIn: pagesApp.signIn,
  signOut: pagesApp.signOut,
};
export const MenuEntriesHub = (loggedUser: LoggedUser, isLoadingUser: boolean) => MenuEntriesApp(loggedUser, isLoadingUser);

export const reSignInFuncHub = async () => {
  await CallApiCliASync<any>(apisApp.userAuth.apiPath,
    { cmd: CmdApi_UserAuth.reSignIn });
  return;
};

export const PageIndexHub = PageIndex;