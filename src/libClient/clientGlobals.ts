// import { dbgColor } from './dbg';
// import { SystemWarningCli } from './systemMsgCli';
// import { AssertIsClient } from './util';

import { CtrlContext } from '../libCommon/ctrlContext';

export const globals = {
  browserId: null as string,  // fixo, mantido por cookie
  windowId: null as string, // aleatório, pelo tempo
  loggedUserIsDev: false,
  loggedUserCanChangeTheme: false,
  cookieCanChangeTheme: false,
  cookieDbgShow: false,
  ctrlLog: '', // ok
};

export const ctrlContextFromGlobals = (context: string, colorDestaq?: number) => new CtrlContext(context, { ctrlLog: globals.ctrlLog, colorContext: colorDestaq });