import { LoggedUserBase } from '../base/db/types';
import { keyMainCtrl, MainCtrlModel } from '../base/db/models';

import { rolesDev } from '../libCommon/endPoints';
import { Env } from '../libCommon/envs';
import { ErrorPlus } from '../libCommon/util';

export type LogSentMessagesFn = (resultOk: string, resultError: string) => Promise<void>;

export async function CheckBlockAsync(loggedUser: LoggedUserBase) {
  const mainCtrl = await MainCtrlModel.findOne({ key: keyMainCtrl }).lean();
  if (mainCtrl == null)
    MainCtrlModel.create({ key: keyMainCtrl, blockMsg: null });
  if (loggedUser == null ||
    !loggedUser.roles.includes[rolesDev.dev]) {
    if (Env('blockMsg') != null)
      throw new ErrorPlus(`Sistema bloqueado: ${Env('blockMsg')}`);
    const mainCtrl = await MainCtrlModel.findOne({ key: keyMainCtrl }).lean();
    if (mainCtrl != null &&
      mainCtrl.blockMsg != null)
      throw new ErrorPlus(`Sistema bloqueado - ${mainCtrl.blockMsg}`);
  }
}
