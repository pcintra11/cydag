
import { CallApiCliASync } from '../fetcher/fetcherCli';
import { globals } from '../libClient/clientGlobals';

// import { DisclaimerApp  } from '../vzn/disclaimer';
// import { themeSchemesApp } from '../vzn/themes';
// export const imgAppHub = null; // vzn
// import { pagesApp, apisApp } from '../vzn/endPoints';
// import { LoggedUser } from '../vzn/loggedUser';
// import { MenuEntriesApp } from '../vzn/menuEntries';
// import { CmdApi_User } from '../pages/api/vzn/user/types';


const DisclaimerApp = null;
import { themeSchemesApp } from '../appCydag/themes';
export const imgAppHub = '/appCydag/logo.png';
import { pagesApp, apisApp } from '../appCydag/endPoints';
import { LoggedUser } from '../appCydag/loggedUser';
import { MenuEntriesApp } from '../appCydag/menuEntries';
import { CmdApi_UserAuth } from '../pages/api/appCydag/user/types';
export const ControlledAccessCheckHub = null;
export const ControlledAccessClaimHub = null;
export const routerConfirmLoginHub = null;


export const DisclaimerHub = DisclaimerApp;
export const themeSchemesHub = themeSchemesApp;
export const pagesHub = {
  index: pagesApp.index,
  signIn: pagesApp.signIn,
  signOut: pagesApp.signOut,
};
export const MenuEntriesHub = (loggedUser: LoggedUser, isLoadingUser: boolean) => MenuEntriesApp(loggedUser, isLoadingUser);

export const reSignInFuncHub = async () => {
  await CallApiCliASync<any>(apisApp.userAuth.apiPath, globals.windowId, { cmd: CmdApi_UserAuth.reSignIn });
  return;
};