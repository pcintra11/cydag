import { rolesDev } from '../libCommon/endPoints';

export class LoggedUserBase {
  sessionIdStr?: string;
  userIdStr?: string;
  email?: string;
  emailSigned?: string; // o usuário adm poderá simular outros usuários, então preserva que é o adm original que se autenticou
  name?: string;
  roles?: string[];
  firstSignIn?: Date;
  lastReSignIn?: Date;
  lastActivity?: Date; // acesso API ou acionamento de transação no menu
  static isDev(loggedUser: LoggedUserBase) { return loggedUser?.roles?.includes(rolesDev.dev); }
  static canChangeTheme(loggedUser: LoggedUserBase) { return loggedUser?.roles?.includes(rolesDev.prototype); }
}