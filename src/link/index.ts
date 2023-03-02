
import { CallApiCliASync } from '../fetcher/fetcherCli';
import { globals } from '../libClient/clientGlobals';

// import { DisclaimerApp  } from '../vsn/disclaimer';
// import { themeSchemesApp } from '../vsn/themes';
// export const imgAppHub = null; // vzn
// export const menuTypeHub = MenuType.barraSuperior; // vzn
// import { pagesApp, apisApp } from '../vsn/endPoints';
// import { LoggedUser } from '../vsn/loggedUser';
// import { MenuEntriesApp } from '../vsn/menuEntries';
// import { CmdApi_User } from '../pages/api/vsn/user/types';
// import { CmdApi_ControlledAccess } from '../pages/api/vsn/controlledAccess/types';
// export const ControlledAccessCheckHub = async () => {
//   return await CallApiCliASync(apisApp.notLoggedApis.apiPath, globals.windowId, { cmd: CmdApi_ControlledAccess.controlledAccessCheckAllowed });
// };
// export const ControlledAccessClaimHub = async (info: string) => {
//   return CallApiCliASync(apisApp.notLoggedApis.apiPath, globals.windowId, { cmd: CmdApi_ControlledAccess.controlledAccessClaimAccess, info });
// };
// export const routerConfirmLoginHub = { pathname: pagesApp.welcome.pagePath, query: { confirmUserLogged: 'x' } };


const DisclaimerApp = null;
import { themeSchemesApp } from '../appCydag/themes';
export const imgAppHub = '/appCydag/logo.png';
//export const menuTypeHub = MenuType.lateral;
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