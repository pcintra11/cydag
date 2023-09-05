import Cookies from 'js-cookie';

//import { dbg } from './dbg';
import { AssertIsClient } from '../libCommon/sideProc';
import { dbgError } from '../libCommon/dbg';

export interface ICookieOptions {
  expires?: Date; // default : NÂO deleta ao fechar o browser!
  path?: string;
}

function getAll() {
  return Cookies.get();
}

function get(name: string) {  // não recupera os que foram setados no server !
  AssertIsClient('cookieCli get', { name });
  return Cookies.get(name);
}
function getJSON(name: string) {
  const strObj = get(name);
  let result = null;
  if (strObj != null) {
    try {
      result = JSON.parse(strObj);
    } catch (error) {
      //csl('tem erro', strObj);
      // a função Cookies.getJSON nessa situação devolve o string !
    }
  }
  return result;
}

function set(name: string, value: string, options: ICookieOptions = null) {
  AssertIsClient('cookieCli set', { name, value });
  if (value == null) {
    //dbgError('cookieCli', name, 'set para null');
    remove(name);
    return;
  }
  return Cookies.set(name, value, options);
}
function setJSON(name: string, value: object, options: ICookieOptions = null) {
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
};