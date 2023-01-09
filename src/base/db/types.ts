import { ObjectId } from 'mongodb';

import { dbgError } from '../../libCommon/dbg';
import { IGenericObject } from '../../libCommon/types';
import { DateFromStrISO, FillClass } from '../../libCommon/util';

import { SendEmailParams } from '../../libServer/sendMail';

export class LoggedUserBase {
  sessionIdStr: string;
  userIdStr: string;
  email: string;
  emailSigned: string; // o usuario adm poderá simular outros usuarios, então preserva que é o adm original que se autenticou
  name: string;
  roles?: string[];
  firstSignIn: Date;
  lastReSignIn: Date;
  lastActivity: Date; // acesso API ou acionamento de transação no menu
}

//#region db
export class MainCtrl {
  key: string;
  blockMsg?: string;
}

export class SentMessage {
  userId?: ObjectId;
  date?: Date;
  type: 'sms' | 'email';
  target: string; // email ou phoneNumber
  message: string;
  resultOk?: string;
  resultError?: string;
}

export class SendMailLog {
  sendEmailParams: SendEmailParams;
  started?: Date;
  ended?: Date;
  elapsedMs?: number;
  resultOk?: string;
  resultError?: string;
  attention?: string;
  shouldDelete?: boolean;
}

export class ApiSyncLog {
  appVersion?: string;
  apiHost?: string;
  apiPath?: string;
  ip?: string;
  originHost?: string;
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
  infoAdicionalLog?: string;
  referer?: string;
}

export interface ApiAsyncLog {
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
}

export class RefererLog {
  date?: Date;
  url?: string;
  referer?: string;
}

export class ControlledAccess {
  _id?: ObjectId;
  browserId?: string;
  ips?: string[];
  dateAsked?: Date;
  info?: string; // qdo for dado autorização é o texto que identifica quem está usando
  dateAuthorized?: Date;
  searchTerms?: string;
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ControlledAccess().Fill({
        ...values,
        dateAsked: DateFromStrISO(values.dateAsked),
        dateAuthorized: DateFromStrISO(values.dateAuthorized),
      });
    } catch (error) {
      dbgError('erro em ControlledAccess.deserialize', error.message, values);
      return new ControlledAccess();
    }
  }
}

//#endregion

export interface SystemLog {
  //app: string;
  appVersion: string;
  //appDomain: string;
  date: Date;
  scope: string;
  categ: string;
  point: string;
  msg: string;
  details: object;
}

export class NotifAdmMessage {
  mainMsg: string;
  variableInfos?: string[];
  first: Date;
  last: Date;
  notifLastProc: string;
  total: number;
}
export class NotifyAdmCtrl {
  key?: string;
  start?: Date;
  last?: Date;
  messages?: NotifAdmMessage[];
  lockedStr?: string;
}
export class DbTest {
  key?: string;
  fld?: string;
}