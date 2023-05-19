import { LoggedUserBase, MainCtrl } from '../app_base/modelTypes';
import { keyMainCtrl, MainCtrlModel } from '../app_base/model';

import { rolesDev } from '../libCommon/endPoints';
import { EnvBlockMsg } from '../app_base/envs';
import { ErrorPlus } from '../libCommon/util';

export type LogSentMessagesFn = (resultOk: string, resultError: string) => Promise<void>;

export async function CheckBlockAsync(loggedUser: LoggedUserBase) {
  const mainCtrl = await MainCtrlModel.findOne({ key: keyMainCtrl }).lean();
  if (mainCtrl == null)
    MainCtrlModel.create(
      MainCtrl.fill({
        key: keyMainCtrl,
        blockMsg: null
      }, true));
  if (!(loggedUser != null &&
    (loggedUser.roles.includes(rolesDev.dev) ||
      (loggedUser.email !== loggedUser.emailSigned)))) {
    const mainCtrl = await MainCtrlModel.findOne({ key: keyMainCtrl }).lean();
    if (mainCtrl != null &&
      mainCtrl.blockMsg != null &&
      mainCtrl.blockMsg.trim() != '')
      throw new ErrorPlus(mainCtrl.blockMsg);
    if (EnvBlockMsg() != null)
      throw new ErrorPlus(EnvBlockMsg());
  }
}
