// import { dbgColor } from './dbg';
// import { SystemWarningCli } from './systemMsgCli';
// import { AssertIsClient } from './util';

import { CtrlContext } from '../libCommon/ctrlContext';

export const globals = {
  browserId: null as string,  // fixo, mantido por cookie, cria na primeira vez e reusa sempre
  windowId: null as string, // para cada vez que abrir novamente o site
  cookieDevContext: false,
  ctrlLog: '',
  isDevUser: false,
};

export const ctrlContextFromGlobals = (context: string, colorDestaq?: number) => new CtrlContext(context, { ctrlLog: globals.ctrlLog, colorContext: colorDestaq });