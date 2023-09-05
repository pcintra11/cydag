import { LoggedUserBase } from '../app_base/loggedUserBase';

import { csd, dbgError } from '../libCommon/dbg';
import { IGenericObject } from '../libCommon/types';
import { CutUndef, DateFromStrISO, FillClassProps } from '../libCommon/util';

export class LoggedUser extends LoggedUserBase {
  static new() { return new LoggedUser(); }
  static fill(values: LoggedUser) { return CutUndef(FillClassProps(LoggedUser.new(), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(LoggedUser.new(), {
        ...values,
        firstSignIn: DateFromStrISO(values.firstSignIn),
        lastReSignIn: DateFromStrISO(values.lastReSignIn),
        lastActivity: DateFromStrISO(values.lastActivity),
        //ttlSeconds: values.ttlSeconds != null ? Number(values.ttlSeconds) : null,
      });
    } catch (error) {
      dbgError('LoggedUser.deserialize', error.message, values);
      return LoggedUser.new();
    }
  }
}