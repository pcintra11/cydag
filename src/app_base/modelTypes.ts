import { ObjectId } from 'mongodb';

import { IPinfoVip } from '../techno_ipInfo/types';
import { BrowserInfoVip } from '../techno_whichBrowser/clientInfoSvr';

import { dbgError } from '../libCommon/dbg';
import { IGenericObject } from '../libCommon/types';
import { CutUndef, DateFromStrISO, FillClassProps } from '../libCommon/util';

import { SendEmailParams } from '../libServer/sendMail';

//#region db
export class MainCtrl {
  key?: string;
  blockMsg?: string;
  static new() { return new MainCtrl(); }
  static fill(values: MainCtrl) { return CutUndef(FillClassProps(MainCtrl.new(), values)); }
}

export class SentMessage {
  userId?: ObjectId;
  date?: Date;
  type?: 'sms' | 'email';
  target?: string; // email ou phoneNumber
  message?: string;
  resultOk?: string;
  resultError?: string;
  static new() { return new SentMessage(); }
  static fill(values: SentMessage) { return CutUndef(FillClassProps(SentMessage.new(), values)); }
}

export class SendMailLog {
  _id?: ObjectId;
  sendEmailParams?: SendEmailParams;
  started?: Date;
  ended?: Date;
  elapsedMs?: number;
  resultOk?: string;
  resultError?: string;
  attention?: string;
  shouldDelete?: boolean;
  static new() { return new SendMailLog(); }
  static fill(values: SendMailLog) { return CutUndef(FillClassProps(SendMailLog.new(), values)); }
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
  //sessionIdStr?: string;
  shouldDelete?: boolean;
  additionalInfo?: string;
  //referer?: string;
  static new() { return new ApiSyncLog(); }
  static fill(values: ApiSyncLog) { return CutUndef(FillClassProps(ApiSyncLog.new(), values)); }
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
  static new() { return new ApiAsyncLog(); }
  static fill(values: ApiAsyncLog) { return CutUndef(FillClassProps(ApiAsyncLog.new(), values)); }
}

export class SiteEntryPoint { // era RefererLog
  date?: Date;
  url?: string;
  referer?: string;
  ip?: string;
  ipInfo?: IPinfoVip;
  browserId?: string;
  userAgent?: string;
  browserInfo?: BrowserInfoVip;
  static new() { return new SiteEntryPoint(); }
  static fill(values: SiteEntryPoint) { return CutUndef(FillClassProps(SiteEntryPoint.new(), values)); }
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
  static new() { return new ControlledAccess(); }
  static fill(values: ControlledAccess) { return CutUndef(FillClassProps(ControlledAccess.new(), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ControlledAccess.new(), {
        ...values,
        dateAsked: DateFromStrISO(values.dateAsked),
        dateAuthorized: DateFromStrISO(values.dateAuthorized),
      });
    } catch (error) {
      dbgError('ControlledAccess.deserialize', error.message, values);
      return ControlledAccess.new();
    }
  }
}
//#endregion

export class SystemLog {
  appVersion?: string;
  date?: Date;
  scope?: string;
  categ?: string;
  point?: string;
  ip?: string;
  browserId?: string;
  userId?: ObjectId;
  msg?: string;
  details?: object;
  static new() { return new SystemLog(); }
  static fill(values: SystemLog) { return CutUndef(FillClassProps(SystemLog.new(), values)); }
}

export class NotifAdmMessage {
  mainMsg?: string;
  variableInfos?: string[];
  first?: Date;
  last?: Date;
  notifLastProc?: string;
  total?: number;
  static new() { return new NotifAdmMessage(); }
  static fill(values: NotifAdmMessage) { return CutUndef(FillClassProps(NotifAdmMessage.new(), values)); }
}
export class NotifyAdmCtrl {
  key?: string;
  start?: Date;
  last?: Date;
  messages?: NotifAdmMessage[];
  lockedStr?: string;
  static new() { return new NotifyAdmCtrl(); }
  static fill(values: NotifyAdmCtrl) { return CutUndef(FillClassProps(NotifyAdmCtrl.new(), values)); }
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