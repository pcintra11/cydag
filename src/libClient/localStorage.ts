import store from 'store2';

import { AssertIsClient } from '../libCommon/util';

function getAll() {
  return store.getAll();
}

function get(name: string) {  // não recupera os que foram setados no server !
  AssertIsClient('localStorage', { name });
  return store.get(name);
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

function set(name: string, value: string) {
  AssertIsClient('localStorage', { name, value });
  //store.session.set(name, value);
  return store.set(name, value);
}
function setJSON(name: string, value: object) {
  return set(name, JSON.stringify(value));
}

function remove(name: string) {
  return store.remove(name);
}

export default {
  getAll,
  get,
  getJSON,
  set,
  setJSON,
  remove,
};