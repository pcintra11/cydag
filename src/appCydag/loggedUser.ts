import _ from 'underscore';

import { LoggedUserBase } from '../base/db/types';

import { dbgError } from '../libCommon/dbg';
import { IGenericObject } from '../libCommon/types';
import { DateFromStrISO, FillClass } from '../libCommon/util';

export class LoggedUser extends LoggedUserBase {
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      const result = new LoggedUser().Fill(_.omit(values, ['ttlSeconds']) as LoggedUser);
      result.firstSignIn = DateFromStrISO(values.firstSignIn);
      result.lastReSignIn = DateFromStrISO(values.lastReSignIn);
      result.lastActivity = DateFromStrISO(values.lastActivity);
      return result;
    } catch (error) {
      dbgError('erro em LoggedUser.deserialize', error.message, values);
      return new LoggedUser();
    }
  }
}