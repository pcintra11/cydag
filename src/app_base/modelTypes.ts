import { ObjectId } from 'mongodb';

import { dbgError } from '../libCommon/dbg';
import { IGenericObject } from '../libCommon/types';
import { CutUndef, DateFromStrISO, FillClassProps } from '../libCommon/util';

import { ISendEmailParams } from '../libServer/sendMail';

export class LoggedUserBase {
  sessionIdStr?: string;
  userIdStr?: string;
  email?: string;
  emailSigned?: string; // o usuário adm poderá simular outros usuários, então preserva que é o adm original que se autenticou
  name?: string;
  roles?: string[]; //@!!!!!!!! mascarar?
  firstSignIn?: Date;
  lastReSignIn?: Date;
  lastActivity?: Date; // acesso API ou acionamento de transação no menu
}

//#region db
export class MainCtrl {
  key?: string;
  blockMsg?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new MainCtrl(); }
  static fill(values: MainCtrl, init = false) { return CutUndef(FillClassProps(MainCtrl.new(init), values)); }
}

export class SentMessage {
  userId?: ObjectId;
  date?: Date;
  type?: 'sms' | 'email';
  target?: string; // email ou phoneNumber
  message?: string;
  resultOk?: string;
  resultError?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new SentMessage(); }
  static fill(values: SentMessage, init = false) { return CutUndef(FillClassProps(SentMessage.new(init), values)); }
}

export class SendMailLog {
  _id?: ObjectId;
  sendEmailParams?: ISendEmailParams;
  started?: Date;
  ended?: Date;
  elapsedMs?: number;
  resultOk?: string;
  resultError?: string;
  attention?: string;
  shouldDelete?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new SendMailLog(); }
  static fill(values: SendMailLog, init = false) { return CutUndef(FillClassProps(SendMailLog.new(init), values)); }
}

export class ApiSyncLog {
  _id?: ObjectId;
  appVersion?: string;
  apiHost?: string;
  apiPath?: string;
  ip?: string;
  //originHost?: string;
  paramsTypeVariant?: string;
  paramsTypeKey?: string;
  userId?: ObjectId;
  userInfo?: string;
  started?: Date;
  parm?: IGenericObject;
  ended?: Date;
  elapsedMs?: number;
  result?: IGenericObject;
  attention?: string;
  sessionIdStr?: string;
  shouldDelete?: boolean;
  additionalInfo?: string;
  referer?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ApiSyncLog(); }
  static fill(values: ApiSyncLog, init = false) { return CutUndef(FillClassProps(ApiSyncLog.new(init), values)); }
}

export class ApiAsyncLog {
  _id?: ObjectId;
  appVersion?: string;
  apiHost?: string;
  type?: string;   // send mail, notifyAdm ....
  customType?: string;   // processado pela app (calcLocalitiesDistances, ....)
  info?: string;
  params?: any;
  register?: Date;
  started?: Date;
  ended?: Date;
  elapsedMs?: number;
  resultOk?: string;
  resultError?: string;
  attention?: string;
  shouldDelete?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ApiAsyncLog(); }
  static fill(values: ApiAsyncLog, init = false) { return CutUndef(FillClassProps(ApiAsyncLog.new(init), values)); }
}

export class RefererLog {
  date?: Date;
  url?: string;
  referer?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new RefererLog(); }
  static fill(values: RefererLog, init = false) { return CutUndef(FillClassProps(RefererLog.new(init), values)); }
}

export class ControlledAccess {
  _id?: ObjectId;
  __v?: any;
  browserId?: string;
  ips?: string[];
  dateAsked?: Date;
  info?: string; // qdo for dado autorização é o texto que identifica quem está usando
  dateAuthorized?: Date;
  searchTerms?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ControlledAccess(); }
  static fill(values: ControlledAccess, init = false) { return CutUndef(FillClassProps(ControlledAccess.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ControlledAccess.new(), {
        ...values,
        dateAsked: DateFromStrISO(values.dateAsked),
        dateAuthorized: DateFromStrISO(values.dateAuthorized),
      });
    } catch (error) {
      dbgError('ControlledAccess.deserialize', error.message, values);
      return ControlledAccess.new(true);
    }
  }
}
//#endregion

export class SystemLog {
  //app: string;
  appVersion?: string;
  //appDomain: string;
  date?: Date;
  scope?: string;
  categ?: string;
  point?: string;
  msg?: string;
  details?: object;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new SystemLog(); }
  static fill(values: SystemLog, init = false) { return CutUndef(FillClassProps(SystemLog.new(init), values)); }
}

export class NotifAdmMessage {
  mainMsg?: string;
  variableInfos?: string[];
  first?: Date;
  last?: Date;
  notifLastProc?: string;
  total?: number;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new NotifAdmMessage(); }
  static fill(values: NotifAdmMessage, init = false) { return CutUndef(FillClassProps(NotifAdmMessage.new(init), values)); }
}
export class NotifyAdmCtrl {
  key?: string;
  start?: Date;
  last?: Date;
  messages?: NotifAdmMessage[];
  lockedStr?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new NotifyAdmCtrl(); }
  static fill(values: NotifyAdmCtrl, init = false) { return CutUndef(FillClassProps(NotifyAdmCtrl.new(init), values)); }
}
export class DbTest {
  key?: string;
  fld?: string;
}

export class CacheApp {
  key1: string;
  key2: string;
  date: Date;
  data: string;
}

export class Junk {
  app?: string;
  host?: string;
  key: string;
  date: Date;
  textField: string;
  obj1?: IGenericObject;
  obj2?: IGenericObject;
  obj3?: IGenericObject;
  obj4?: IGenericObject;
}
