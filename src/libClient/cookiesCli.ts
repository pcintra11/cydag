import Cookies from 'js-cookie';

//import { dbg } from './dbg';
import { AssertIsClient } from '../libCommon/util';

export interface CookieOptions {
  expires?: Date; // default : NÂO deleta ao fechar o browser!
  path?: string;
}

function getAll() {
  return Cookies.get();
}

function get(name: string) {  // não recupera os que foram setados no server !
  AssertIsClient('cookieCli', { name });
  return Cookies.get(name);
}
function getJSON(name: string) {
  const strObj = get(name);
  let result = null;
  if (strObj != null) {
    try {
      result = JSON.parse(strObj);
    } catch (error) {
      //console.log('tem erro', strObj);
      // a função Cookies.getJSON nessa situação devolve o string !
    }
  }
  return result;
}

function set(name: string, value: string, options: CookieOptions = null) {
  AssertIsClient('cookieCli', { name, value });
  return Cookies.set(name, value, options);
}
function setJSON(name: string, value: object, options: CookieOptions = null) {
  return set(name, JSON.stringify(value), options);
}

function remove(name: string) {
  return Cookies.remove(name);
}

export const CookieCli = {
  getAll,
  get,
  getJSON,
  set,
  setJSON,
  remove,
}