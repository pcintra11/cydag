import { TokenDecodeASync, TokenEncodeASync } from '../libServer/util';

import { isAmbPrd } from '../app_base/envs';
import { configApp } from '../app_hub/appConfig';

//#region tokens para links por email e call back ao sistema
// export const linkEmailExpirationMinutes = () => {
//   const minutes = isAmbDev() ? (30) : (24 * 60);
//   return minutes;
// };
enum TokenType {
  resetPsw = 'resetPswTk',
}

export const TokenResetPswEncodeASync = async (email: string) => {
  return await TokenEncodeASync(TokenType.resetPsw, { email }, configApp.linkEmailExpirationMinutes(isAmbPrd()));
};
export const TokenResetPswDecodeASync = async (token: string) => {
  return await TokenDecodeASync(TokenType.resetPsw, token);
};