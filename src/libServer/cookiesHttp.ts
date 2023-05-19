import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';

import { AssertIsServer } from '../libCommon/sideProc';

function getAll(req: NextApiRequest) {
  AssertIsServer('cookiesHttp getAll');
  // os valores do cookie client serão mixados, mas os do server prevalecem em caso de nomes iguais
  return cookie.parse(req.headers.cookie || '');
}

function get(req: NextApiRequest, name: string) {
  AssertIsServer('cookiesHttp get');
  const allCookies = getAll(req);
  return allCookies[name];
}
// function getJSON(req: NextApiRequest, name: string) {
//   const strObj = get(req, name);
//   let result = null;
//   if (strObj != null) {
//     try {
//       result = JSON.parse(strObj);
//     } catch (error) {
//     }
//   }
//   return result;
// }

const infiniteAge = 60 * 60 * 24 * 1000; // 1000 dias

function set(res: NextApiResponse, name: string, value: string, options: { sameSite?: 'none', secure?: boolean } = {}) {
  // se houver algum do cliente será temporariamente sobroposto (até ser removido no server)
  AssertIsServer('cookiesHttp set', { name });
  res.setHeader('Set-Cookie', cookie.serialize(name, value, {
    httpOnly: true,
    maxAge: infiniteAge,
    ...options,
  }));
  return value;
}
// function setJSON(res: NextApiResponse, name: string, value: object) {
//   set(res, name, JSON.stringify(value));
//   return value;
// }

function remove(res: NextApiResponse, name: string, options: { sameSite?: 'none', secure?: boolean } = {}) {
  set(res, name, '', options);
  // res.setHeader('Set-Cookie', cookie.serialize(name, '', {
  //   httpOnly: true,
  //   //expires: new Date(), // não funcionou !!
  //   maxAge: infiniteAge,
  //   ...options,
  // }));
}

export default {
  getAll,
  get,
  set,
  remove,
};