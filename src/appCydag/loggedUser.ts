import _ from 'underscore';

import { LoggedUserBase } from '../app_base/modelTypes';

import { dbgError } from '../libCommon/dbg';
import { IGenericObject } from '../libCommon/types';
import { CutUndef, DateFromStrISO, FillClassProps } from '../libCommon/util';

export class LoggedUser extends LoggedUserBase {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new LoggedUser(); }
  static fill(values: LoggedUser, init = false) { return CutUndef(FillClassProps(LoggedUser.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(LoggedUser.new(),
        {
          //..._.omit(values, ['ttlSeconds']),
          ...values,
          firstSignIn: DateFromStrISO(values.firstSignIn),
          lastReSignIn: DateFromStrISO(values.lastReSignIn),
          lastActivity: DateFromStrISO(values.lastActivity),
        });
    } catch (error) {
      dbgError('LoggedUser.deserialize', error.message, values);
      return LoggedUser.new(true);
    }
  }
}