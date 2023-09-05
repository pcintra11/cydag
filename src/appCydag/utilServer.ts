import { csd } from '../libCommon/dbg';
import { ErrorPlus } from '../libCommon/util';

import { rolesApp } from './endPoints';
import { LoggedUser } from './loggedUser';
import { CentroCustoModel, ProcessoOrcamentarioCentroCustoModel, ProcessoOrcamentarioModel } from './models';
import { ProcessoOrcamentarioCentroCusto } from './modelTypes';
import { CentroCustoConfig, ProcCentrosCustoConfig } from './types';

// Centros de Custo autorizados para o usuário
export interface IAuthCC {
  incluiPlanejadorCC?: boolean; incluiConsultaCC?: boolean;
  incluiPerfilGestorContr?: boolean; incluiPerfilOperContr?: boolean; incluiPerfilConsTodosCCs?: boolean
}
export const accessAllCCs = (loggedUserReq: LoggedUser, authCC: IAuthCC = {}) => {
  let result = false;
  if (authCC.incluiPerfilGestorContr && loggedUserReq.roles.includes(rolesApp.gestorContr))
    result = true;
  else if (authCC.incluiPerfilOperContr === true && loggedUserReq.roles.includes(rolesApp.operContr))
    result = true;
  else if (authCC.incluiPerfilConsTodosCCs === true && loggedUserReq.roles.includes(rolesApp.consTodosCCs))
    result = true;
  return result;
};

export const CheckProcCentroCustosAuth = (loggedUserReq: LoggedUser, processoOrcamentarioCentroCusto: ProcessoOrcamentarioCentroCusto,
  authCC: IAuthCC = {}) => {
  let authorized = false;
  if (accessAllCCs(loggedUserReq, authCC))
    authorized = true;
  else {
    if (processoOrcamentarioCentroCusto.emailResponsavel === loggedUserReq.email)
      authorized = true;
    if (authCC.incluiPlanejadorCC === true &&
      processoOrcamentarioCentroCusto.emailPlanejador === loggedUserReq.email)
      authorized = true;
    if (authCC.incluiConsultaCC === true &&
      processoOrcamentarioCentroCusto.emailConsulta.includes(loggedUserReq.email))
      authorized = true;
  }
  if (!authorized)
    throw new ErrorPlus('Centro de Custo não autorizado');
};

export const procsCentroCustosConfigAuthAllYears = async (loggedUserReq: LoggedUser, authCC: IAuthCC = {}, ano?: string) => {
  // {
  //   const condsCCConfig: any[] = [
  //     { $eq: ['$ano', '$$ano'] },
  //   ];
  //   if (!accessAllCCs(loggedUserReq, authCC)) {
  //     const selectByCCAttrib: any[] = [{ $eq: ['$emailResponsavel', loggedUserReq.email] }];
  //     if (authCC.incluiPlanejadorCC === true) selectByCCAttrib.push({ $eq: ['$emailPlanejador', loggedUserReq.email] });
  //     if (authCC.incluiConsultaCC === true) selectByCCAttrib.push({ $eq: ['$emailConsulta', loggedUserReq.email] }); // !!!!! aqui não está selecionando (campo array??)
  //     condsCCConfig.push({ $or: selectByCCAttrib });
  //   }
  //   const procsCentrosCustoConfigMongo = await ProcessoOrcamentarioModel.aggregate([ //@@!!!!! aqui tem limitação para o CosmoDb
  //     //{ $match: { status: { $ne: ProcessoOrcamentarioStatus.encerrado } } },
  //     {
  //       $lookup: {
  //         from: ProcessoOrcamentarioCentroCustoModel.modelName,
  //         let: { ano: '$ano' },
  //         pipeline: [
  //           { $match: { $expr: { $and: condsCCConfig } } },
  //           { $project: { _id: 0, centroCusto: 1, planejamentoEmAberto: 1 } }
  //         ],
  //         as: 'centroCustoConfig',
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0, ano: 1, status: 1, centroCustoConfig: 1,
  //         sizeCcsConfig: { $size: '$centroCustoConfig' }
  //       },
  //     },
  //     { $match: { sizeCcsConfig: { $gt: 0 } } },
  //     //{ $unwind: '$locality' },
  //     {
  //       $project: {
  //         sizeCcsConfig: 0
  //       },
  //     },
  //     { $sort: { ano: -1 } },
  //     //{ $project: { _id: 0, locality: 1, distance: 1, method: 1 } }
  //   ]);
  //   //csd('mongo', JSON.stringify(procsCentrosCustoConfigMongo, null, 2));
  // }
  const filtro = ano != null ? { ano } : {};
  const procs = await ProcessoOrcamentarioModel.find(filtro, { _id: 0, ano: 1, status: 1 }).lean().sort({ ano: -1 });
  //const procs = await ProcessoOrcamentarioModel.find({ status: { $ne: ProcessoOrcamentarioStatus.encerrado } }).sort({ ano: -1 });
  const procsCentrosCustoConfigAllYears: ProcCentrosCustoConfig[] = [];
  for (const procCentrosCustoConfig of procs) {
    // falta checar se na gravação ainda tem acesso ao CC !!! e tb no código acima (mongoFull)
    let filtrosCCs: any = null;
    if (accessAllCCs(loggedUserReq, authCC))
      filtrosCCs = {};
    else {
      const selectByCCAttrib: any[] = [{ emailResponsavel: loggedUserReq.email }];
      if (authCC.incluiPlanejadorCC === true) selectByCCAttrib.push({ emailPlanejador: loggedUserReq.email });
      if (authCC.incluiConsultaCC === true) selectByCCAttrib.push({ emailConsulta: loggedUserReq.email });
      filtrosCCs = { $or: selectByCCAttrib };
    }
    const centroCustosConfigDb = await ProcessoOrcamentarioCentroCustoModel.find({
      ano: procCentrosCustoConfig.ano,
      ...filtrosCCs,
    }, { _id: 0, centroCusto: 1, planejamentoEmAberto: 1 }).lean();
    if (centroCustosConfigDb.length > 0) {
      // ccsConfig.forEach((x) => {
      //   x.userCanWrite = userCanWrite(x);
      // });
      procsCentrosCustoConfigAllYears.push({ ...procCentrosCustoConfig, centroCustoConfig: centroCustosConfigDb.map((x) => CentroCustoConfig.fill(x)) });
    }
  }
  //csd('proc', JSON.stringify(procsCentrosCustoConfigAllYears, null, 2));
  return procsCentrosCustoConfigAllYears;
};

/**
 * 
 * @param procsCentrosCustoConfig Gera o array de todos os centros de custo (master data), referenciados numa relação de centros de custo config (vários anos)
 * @returns 
 */
export const ccsAuthArray = async (procsCentrosCustoConfig: ProcCentrosCustoConfig[]) => {
  const uniqCCS = new Set();
  procsCentrosCustoConfig.forEach((x) => x.centroCustoConfig.forEach((y) => uniqCCS.add(y.centroCusto)));
  const keysCC = [];
  uniqCCS.forEach((x) => keysCC.push(x));
  const centroCustoArray = await CentroCustoModel.find({ cod: { $in: keysCC } }).lean().sort({ cod: 1 });
  return centroCustoArray;
};

