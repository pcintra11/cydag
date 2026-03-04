import { isAmbDev } from "../app_base/envs";
import { SendEmailLinkResetPswBetterAuth } from "../appCydag/emailMessages";
import { UserMd, UserModel } from "../appCydag/models";
import { CategMsgSystem } from "../libCommon/logSystemMsg_cliSvr";
import { DateAdd } from "../libCommon/util";
import { CloseDbASync, ConnectDbASync } from "../libServer/dbMongo";
import { SystemMsgSvrASync } from "../libServer/systemMsgSvr";

export const SendPasswordResetHub = async (email: string, url: string, token: string, resetPasswordTokenExpiresInSeconds: number) => {
  const funcName = 'SendPasswordResetHub';
  try {
    await ConnectDbASync({});
    try {
      const userDb = await UserModel.findOne({ email }).lean() as UserMd;
      if (userDb != null) {
        const expireIn = DateAdd(new Date(), { seconds: resetPasswordTokenExpiresInSeconds });
        console.log('reset psw url', url); //@!!!!!!!!!!26
        if (isAmbDev())
          console.log('email para reset de psw não enviado em DEV ****', url);
        else
          await SendEmailLinkResetPswBetterAuth(userDb._id, email, userDb.nome, url, expireIn);
      }
    } catch (error: any) {
      await SystemMsgSvrASync(CategMsgSystem.error, `${funcName}-throw 1`, error.message, null, { email, url, token });
    }
    await CloseDbASync({});
  } catch (error: any) {
    await SystemMsgSvrASync(CategMsgSystem.error, `${funcName}-throw 2`, error.message, null, { email, url, token });
  }
}