import { TokenDecodeASync, TokenEncodeASync } from '../libServer/util';
import { linkEmailExpirationMinutes, TokenType } from './config';

export const TokenResetPswEncodeASync = async (email: string) => {
  return await TokenEncodeASync(TokenType.resetPsw, { email }, linkEmailExpirationMinutes());
};
export const TokenResetPswDecodeASync = async (token: string) => {
  return await TokenDecodeASync(TokenType.resetPsw, token);
};