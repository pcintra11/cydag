import { themeSchemesApp } from '../appCydag/themes';
import { pagesApp } from '../appCydag/endPoints';
import { LoggedUser } from '../appCydag/loggedUser';
import { MenuEntriesApp } from '../appCydag/menuEntries';

const DisclaimerApp = null;

import PageIndex from '../pages/cydag';
export const imgAppHub = '/appCydag/logo.png';

export const DisclaimerHub = DisclaimerApp;
export const themeSchemesHub = themeSchemesApp;
export const pagesHub = {
  signIn: pagesApp.signIn,
  signOut: pagesApp.signOut,
};
export const MenuEntriesHub = (loggedUser: LoggedUser, isLoadingUser: boolean) => MenuEntriesApp(loggedUser, isLoadingUser);

// export const reSignInFuncHub = async () => {
//   await CallApiCliASync<any>(apisApp.userAuth.apiPath,
//     { cmd: CmdApi_UserAuth.reSignIn });
//   return;
// };

export const PageIndexHub = PageIndex;