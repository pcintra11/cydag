//import type { NextApiRequest, NextApiResponse } from "next";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../../../lib/auth";

// O toNodeHandler já lida com os cabeçalhos do Node e 
// resolve as URLs usando a BETTER_AUTH_URL automaticamente.
export default toNodeHandler(auth);

// import { toNextJsHandler } from "better-auth/next-js";

// // Este handler gerencia todas as rotas de auth (login, callback, session, etc.)
// //export default toNextJsHandler(auth);

// const authHandler = toNextJsHandler(auth);

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     const { method } = req;

//     console.log('metodo', method);

//     // 1. Verificamos se o método da requisição existe no handler do BetterAuth
//     // Usamos 'as any' ou uma verificação de chave para satisfazer o TS
//     const handlerFn = (authHandler as any)[method || "GET"];

//     if (!handlerFn) {
//         return res.status(405).json({ message: `Método ${method} não permitido` });
//     }

//     // 2. Chamamos o handler específico passando a requisição e a resposta
//     // O toNextJsHandler do BetterAuth lida com a conversão interna
//     return await handlerFn(req, res);
// }