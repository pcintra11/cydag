import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

import { MongooseSlot, AddIndex, ICollectionDef } from '../libServer/dbMongo';

import { csd } from '../libCommon/dbg';

import { AgrupPremissas, Diretoria, CentroCusto, ClasseCusto, ClasseCustoRestrita, Empresa, FatorCusto, Funcionario, Gerencia, Localidade, ProcessoOrcamentario, ProcessoOrcamentarioCentroCusto, UnidadeNegocio, User, ValoresImputados, ValoresRealizadosInterfaceSap, Premissa, ValoresPremissa, Terceiro, FuncaoTerceiro, Viagem, ValoresLocalidade, ValoresTransfer, ValoresRealizados, ValoresPlanejadosCalc, CtrlInterface, ValoresPlanejadosHistorico } from './modelTypes';
import { CategRegional, InterfaceSapStatus, InterfaceSapCateg, OrigemClasseCusto, OrigemFunc, ProcessoOrcamentarioStatus, RevisaoValor, TipoColaborador, TipoPlanejViagem, TipoSegmCentroCusto } from './types';

//const dbgContext = 'models';

export const databaseInterfaceSap = 'interfaceSap';

export const collectionsDef: ICollectionDef[] = [];

//#region ProcessoOrcamentario User
//#region ProcessoOrcamentario
const modelNameProcessoOrcamentario = 'processo_orcamentarios';
collectionsDef.push({
  name: modelNameProcessoOrcamentario,
  indexes: [
    { fields: { ano: -1 }, options: { name: 'ano', unique: true } },
    { fields: { status: 1 }, options: { name: 'status', unique: false } },
  ],
});
interface ProcessoOrcamentarioMd extends mongoose.Document<ObjectId, any, ProcessoOrcamentario>, ProcessoOrcamentario { }
export const ProcessoOrcamentarioModel = (() => {
  const modelName = modelNameProcessoOrcamentario;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    status: { type: String, enum: ProcessoOrcamentarioStatus, required: true },
    horaLoadFuncFull: { type: Date, required: false },
    horaLoadFuncIncr: { type: Date, required: false },
    horaPreCalcValoresPlanejados: { type: Date, required: false },
    horaLoadValoresRealizados: { type: Date, required: false },
    horaRevisaoInicial: { type: Date, required: false },
    horaRevisaoAnterior: { type: Date, required: false },
    //percLimiteFarois: { type: Number, required: true },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ProcessoOrcamentarioMd>(modelName, schema);
})();
//#endregion

//#region ProcessoOrcamentarioCentroCusto
const modelNameProcessoOrcamentarioCentroCusto = 'processo_orcamentario_centro_custos';
collectionsDef.push({
  name: modelNameProcessoOrcamentarioCentroCusto,
  indexes: [
    { fields: { ano: 1, centroCusto: 1 }, options: { name: 'procCentroCusto', unique: true } },
  ],
});
interface ProcessoOrcamentarioCentroCustoMd extends mongoose.Document<ObjectId, any, ProcessoOrcamentarioCentroCusto>, ProcessoOrcamentarioCentroCusto { }
export const ProcessoOrcamentarioCentroCustoModel = (() => {
  const modelName = modelNameProcessoOrcamentarioCentroCusto;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    centroCusto: { type: String, required: true },
    planejamentoEmAberto: { type: Boolean, required: true },
    permiteNovosClb: { type: Boolean, required: true },
    emailResponsavel: { type: String, required: false },
    emailPlanejador: { type: String, required: false },
    emailConsulta: { type: [String], required: false },
    agrupPremissas: { type: String, required: false },
    //centroCustoBenef: { type: String, required: false },
    localidade: { type: String, required: true },
    unidadeNegocio: { type: String, required: false },
    diretoria: { type: String, required: false },
    gerencia: { type: String, required: false },
    //depto: { type: String, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ProcessoOrcamentarioCentroCustoMd>(modelName, schema);
})();
//#endregion


//#region User
const modelNameUser = 'users';
collectionsDef.push({
  name: modelNameUser,
  indexes: [
    { fields: { email: 1 }, options: { name: 'email', unique: true } },
    { fields: { ativo: 1 }, options: { name: 'ativo', unique: false, partialFilterExpression: { ativo: { $eq: true } } } },
    { fields: { searchTerms: 1 }, options: { name: 'searchTerms', unique: false } },
  ],
});
export interface UserMd extends mongoose.Document<ObjectId, any, User>, User { }
export const UserModel = (() => {
  const modelName = modelNameUser;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    email: { type: String, required: true },
    nome: { type: String, required: true },
    ativo: { type: Boolean, required: true },
    //email_superior: { type: String, required: false },
    roles: { type: Array, required: true },
    rolesControlled: { type: Array, required: true },
    psw: { type: String, required: false },
    tokenResetPsw: { type: String, required: false },
    searchTerms: { type: String, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<UserMd>(modelName, schema);
})();
//#endregion

//#endregion

//#region dados mestre gerais
//#region AgrupPremissas
const modelNameAgrupPremissas = 'agrup_premissas';
collectionsDef.push({
  name: modelNameAgrupPremissas,
  indexes: [
    { fields: { cod: 1 }, options: { name: 'cod', unique: true } },
    { fields: { searchTerms: 1 }, options: { name: 'searchTerms', unique: false } },
  ],
});
interface AgrupPremissasMd extends mongoose.Document<ObjectId, any, AgrupPremissas>, AgrupPremissas { }
export const AgrupPremissasModel = (() => {
  const modelName = modelNameAgrupPremissas;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    cod: { type: String, required: true },
    descr: { type: String, required: true },
    searchTerms: { type: String, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<AgrupPremissasMd>(modelName, schema);
})();
//#endregion

//#region CentroCusto
const modelNameCentroCusto = 'centro_custos';
collectionsDef.push({
  name: modelNameCentroCusto,
  indexes: [
    { fields: { cod: 1 }, options: { name: 'cod', unique: true } },
    { fields: { searchTerms: 1 }, options: { name: 'searchTerms', unique: false } },
  ],
});
export interface CentroCustoMd extends mongoose.Document<ObjectId, any, CentroCusto>, CentroCusto { }
export const CentroCustoModel = (() => {
  const modelName = modelNameCentroCusto;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    cod: { type: String, required: true },
    descr: { type: String, required: true },
    //ativo: { type: Boolean, required: true },
    //sap: { type: Boolean, required: true },
    searchTerms: { type: String, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<CentroCustoMd>(modelName, schema);
})();
//#endregion

//#region Diretoria
const modelNameDiretoria = 'diretorias';
collectionsDef.push({
  name: modelNameDiretoria,
  indexes: [
    { fields: { cod: 1 }, options: { name: 'cod', unique: true } },
    { fields: { searchTerms: 1 }, options: { name: 'searchTerms', unique: false } },
  ],
});
interface DiretoriaMd extends mongoose.Document<ObjectId, any, Diretoria>, Diretoria { }
export const DiretoriaModel = (() => {
  const modelName = modelNameDiretoria;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    cod: { type: String, required: true },
    descr: { type: String, required: true },
    searchTerms: { type: String, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<DiretoriaMd>(modelName, schema);
})();
//#endregion

//#region Empresa
const modelNameEmpresa = 'empresas';
collectionsDef.push({
  name: modelNameEmpresa,
  indexes: [
    { fields: { cod: 1 }, options: { name: 'cod', unique: true } },
    { fields: { searchTerms: 1 }, options: { name: 'searchTerms', unique: false } },
  ],
});
interface EmpresaMd extends mongoose.Document<ObjectId, any, Empresa>, Empresa { }
export const EmpresaModel = (() => {
  const modelName = modelNameEmpresa;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    cod: { type: String, required: true },
    descr: { type: String, required: true },
    searchTerms: { type: String, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<EmpresaMd>(modelName, schema);
})();
//#endregion

//#region FuncaoTerceiro
const modelNameFuncaoTerceiro = 'funcao_terceiros';
collectionsDef.push({
  name: modelNameFuncaoTerceiro,
  indexes: [
    { fields: { cod: 1 }, options: { name: 'cod', unique: true } },
  ],
});
interface FuncaoTerceiroMd extends mongoose.Document<ObjectId, any, FuncaoTerceiro>, FuncaoTerceiro { }
export const FuncaoTerceiroModel = (() => {
  const modelName = modelNameFuncaoTerceiro;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    cod: { type: String, required: true },
    descr: { type: String, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<FuncaoTerceiroMd>(modelName, schema);
})();
//#endregion

//#region Gerencia
const modelNameGerencia = 'gerencias';
collectionsDef.push({
  name: modelNameGerencia,
  indexes: [
    { fields: { cod: 1 }, options: { name: 'cod', unique: true } },
    { fields: { searchTerms: 1 }, options: { name: 'searchTerms', unique: false } },
  ],
});
interface GerenciaMd extends mongoose.Document<ObjectId, any, Gerencia>, Gerencia { }
export const GerenciaModel = (() => {
  const modelName = modelNameGerencia;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    cod: { type: String, required: true },
    descr: { type: String, required: true },
    searchTerms: { type: String, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<GerenciaMd>(modelName, schema);
})();
//#endregion

//#region Localidade
const modelNameLocalidade = 'localidades';
collectionsDef.push({
  name: modelNameLocalidade,
  indexes: [
    { fields: { cod: 1 }, options: { name: 'cod', unique: true } },
    { fields: { searchTerms: 1 }, options: { name: 'searchTerms', unique: false } },
  ],
});
interface LocalidadeMd extends mongoose.Document<ObjectId, any, Localidade>, Localidade { }
export const LocalidadeModel = (() => {
  const modelName = modelNameLocalidade;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    cod: { type: String, required: true },
    descr: { type: String, required: true },
    searchTerms: { type: String, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<LocalidadeMd>(modelName, schema);
})();
//#endregion

//#region UnidadeNegocio
const modelNameUnidadeNegocio = 'unidade_negocios';
collectionsDef.push({
  name: modelNameUnidadeNegocio,
  indexes: [
    { fields: { cod: 1 }, options: { name: 'cod', unique: true } },
    { fields: { searchTerms: 1 }, options: { name: 'searchTerms', unique: false } },
  ],
});
interface UnidadeNegocioMd extends mongoose.Document<ObjectId, any, UnidadeNegocio>, UnidadeNegocio { }
export const UnidadeNegocioModel = (() => {
  const modelName = modelNameUnidadeNegocio;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    cod: { type: String, required: true },
    descr: { type: String, required: true },
    categRegional: { type: String, enum: CategRegional, required: false },
    searchTerms: { type: String, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<UnidadeNegocioMd>(modelName, schema);
})();
//#endregion

//#endregion

//#region estrutura de contas
//#region FatorCusto
const modelNameFatorCusto = 'fator_custos';
collectionsDef.push({
  name: modelNameFatorCusto,
  indexes: [
    { fields: { fatorCusto: 1 }, options: { name: 'fatorCusto', unique: true } },
  ],
});
interface FatorCustoMd extends mongoose.Document<ObjectId, any, FatorCusto>, FatorCusto { }
export const FatorCustoModel = (() => {
  const modelName = modelNameFatorCusto;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    fatorCusto: { type: String, required: true },
    descr: { type: String, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<FatorCustoMd>(modelName, schema);
})();
//#endregion

//#region ClasseCusto
const modelNameClasseCusto = 'classe_custos';
collectionsDef.push({
  name: modelNameClasseCusto,
  indexes: [
    { fields: { classeCusto: 1 }, options: { name: 'classeCusto', unique: true } },
  ],
});
interface ClasseCustoMd extends mongoose.Document<ObjectId, any, ClasseCusto>, ClasseCusto { }
export const ClasseCustoModel = (() => {
  const modelName = modelNameClasseCusto;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    classeCusto: { type: String, required: true },
    descr: { type: String, required: true },
    fatorCusto: { type: String, required: true },
    origem: { type: String, enum: OrigemClasseCusto, required: true },
    seqApresent: { type: Number, required: true },
    searchTerms: { type: String, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ClasseCustoMd>(modelName, schema);
})();
//#endregion

//#region ClasseCustoRestrita
const modelNameClasseCustoRestrita = 'classe_custo_restritas';
collectionsDef.push({
  name: modelNameClasseCustoRestrita,
  indexes: [
    { fields: { classeCusto: 1 }, options: { name: 'classeCusto', unique: true } },
  ],
});
interface ClasseCustoRestritaMd extends mongoose.Document<ObjectId, any, ClasseCustoRestrita>, ClasseCustoRestrita { }
export const ClasseCustoRestritaModel = (() => {
  const modelName = modelNameClasseCustoRestrita;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    classeCusto: { type: String, required: true },
    centroCustoArray: { type: [String], required: true },
    obs: { type: String, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ClasseCustoRestritaMd>(modelName, schema);
})();
//#endregion

//#endregion


//#region Premissas
//#region Premissa
const modelNamePremissa = 'premissas';
collectionsDef.push({
  name: modelNamePremissa,
  indexes: [
    { fields: { cod: 1 }, options: { name: 'cod', unique: true } },
  ],
});
interface PremissaMd extends mongoose.Document<ObjectId, any, Premissa>, Premissa { }
export const PremissaModel = (() => {
  const modelName = modelNamePremissa;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    cod: { type: String, required: true },
    descr: { type: String, required: true },

    tipoSegmCentroCusto: { type: String, enum: TipoSegmCentroCusto, required: true },
    segmTipoClb: { type: Boolean, required: true },
    despRecorrFunc: { type: Boolean, required: true },
    descrDespRecorrFunc: { type: String, required: false },
    classeCusto: { type: String, required: false },
    //subClasseCusto: { type: String, required: false },

    obsValor: { type: String, required: true },
    //formato: { type: String, enum: FormatoValorPremissa, required: false },
    decimais: { type: Number, required: true },
    seqApresent: { type: Number, required: true },
    anoIni: { type: String, required: true },
    anoFim: { type: String, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<PremissaMd>(modelName, schema);
})();
//#endregion

//#region ValoresPremissa
const modelNameValoresPremissa = 'valores_premissas';
collectionsDef.push({
  name: modelNameValoresPremissa,
  indexes: [
    { fields: { ano: 1, revisao: 1, premissa: 1, tipoSegmCentroCusto: 1, segmTipoClb: 1, empresa: 1, agrupPremissas: 1, tipoColaborador: 1 }, options: { name: 'primaryKey', unique: true } },
  ],
});
interface ValoresPremissaMd extends mongoose.Document<ObjectId, any, ValoresPremissa>, ValoresPremissa { }
export const ValoresPremissaModel = (() => {
  const modelName = modelNameValoresPremissa;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    revisao: { type: String, enum: RevisaoValor, required: true },
    premissa: { type: String, required: true },
    ativa: { type: Boolean, required: true },
    tipoSegmCentroCusto: { type: String, enum: TipoSegmCentroCusto, required: true },
    segmTipoClb: { type: Boolean, required: true },
    empresa: { type: String, required: false },
    agrupPremissas: { type: String, required: false },
    tipoColaborador: { type: String, required: false },
    valMeses: { type: [Number], required: true },
    lastUpdated: { type: Date, required: true },  // db.viagens.updateMany({lastUpdated: null},{$set:{lastUpdated: new Date()}}) 
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ValoresPremissaMd>(modelName, schema);
})();
//#endregion

//#region ValoresLocalidade
const modelNameValoresLocalidade = 'valores_localidades';
collectionsDef.push({
  name: modelNameValoresLocalidade,
  indexes: [
    { fields: { ano: 1, revisao: 1, localidade: 1 }, options: { name: 'primaryKey', unique: true } },
  ],
});
interface ValoresLocalidadeMd extends mongoose.Document<ObjectId, any, ValoresLocalidade>, ValoresLocalidade { }
export const ValoresLocalidadeModel = (() => {
  const modelName = modelNameValoresLocalidade;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    revisao: { type: String, enum: RevisaoValor, required: true },
    localidade: { type: String, required: true },
    valMeses: { type: [Number], required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ValoresLocalidadeMd>(modelName, schema);
})();
//#endregion

//#region ValoresTransfer
const modelNameValoresTransfer = 'valores_transfers';
collectionsDef.push({
  name: modelNameValoresTransfer,
  indexes: [
    { fields: { ano: 1, revisao: 1, localidadeOrigem: 1, localidadeDestino: 1 }, options: { name: 'primaryKey', unique: true } },
  ],
});
interface ValoresTransferMd extends mongoose.Document<ObjectId, any, ValoresTransfer>, ValoresTransfer { }
export const ValoresTransferModel = (() => {
  const modelName = modelNameValoresTransfer;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    revisao: { type: String, enum: RevisaoValor, required: true },
    localidadeOrigem: { type: String, required: true },
    localidadeDestino: { type: String, required: true },
    valMeses: { type: [Number], required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ValoresTransferMd>(modelName, schema);
})();
//#endregion

//#endregion

//#region ValoresImputados / ValoresPlanejadosCalc / valoresPlanejadosHistorico / ValoresRealizados
//#region ValoresImputados
const modelNameValoresImputados = 'valores_imputados';
collectionsDef.push({
  name: modelNameValoresImputados,
  indexes: [
    { fields: { ano: 1, revisao: 1, centroCusto: 1, classeCusto: 1, idDetalhe: 1 }, options: { name: 'primaryKey', unique: true } },
  ],
});
interface ValoresImputadosMd extends mongoose.Document<ObjectId, any, ValoresImputados>, ValoresImputados { }
export const ValoresImputadosModel = (() => {
  const modelName = modelNameValoresImputados;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    revisao: { type: String, enum: RevisaoValor, required: true },
    centroCusto: { type: String, required: true },
    classeCusto: { type: String, required: true },
    idDetalhe: { type: String, required: false },
    descr: { type: String, required: false },
    valMeses: { type: [Number], required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ValoresImputadosMd>(modelName, schema);
})();
//#endregion

//#region ValoresPlanejadosCalc
const modelNameValoresPlanejadosCalc = 'valores_planejados_calcs';
collectionsDef.push({
  name: modelNameValoresPlanejadosCalc,
  indexes: [
    { fields: { ano: 1, revisao: 1, centroCusto: 1, classeCusto: 1 }, options: { name: 'primaryKey', unique: true } },
  ],
});
interface ValoresPlanejadosCalcMd extends mongoose.Document<ObjectId, any, ValoresPlanejadosCalc>, ValoresPlanejadosCalc { }
export const ValoresPlanejadosCalcModel = (() => {
  const modelName = modelNameValoresPlanejadosCalc;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    revisao: { type: String, enum: RevisaoValor, required: true },
    centroCusto: { type: String, required: true },
    classeCusto: { type: String, required: true },
    valMeses: { type: [Number], required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ValoresPlanejadosCalcMd>(modelName, schema);
})();
//#endregion

//#region valoresPlanejadosHistorico
const modelNameValoresPlanejadosHistorico = 'valores_planejados_historicos';
collectionsDef.push({
  name: modelNameValoresPlanejadosHistorico,
  indexes: [
    { fields: { ano: 1, centroCusto: 1, classeCusto: 1 }, options: { name: 'primaryKey', unique: true } },
  ],
});
interface ValoresPlanejadosHistoricoMd extends mongoose.Document<ObjectId, any, ValoresPlanejadosHistorico>, ValoresPlanejadosHistorico { }
export const ValoresPlanejadosHistoricoModel = (() => { // valores de anos anteriores (imputados e calculados) (sem detalhes, no nível de carga ao SAP)
  const modelName = modelNameValoresPlanejadosHistorico;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    centroCusto: { type: String, required: true },
    classeCusto: { type: String, required: true },
    valMeses: { type: [Number], required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ValoresPlanejadosHistoricoMd>(modelName, schema);
})();
//#endregion

//#region ValoresRealizados
const modelNameValoresRealizados = 'valores_realizados';
collectionsDef.push({
  name: modelNameValoresRealizados,
  indexes: [
    { fields: { ano: 1, centroCusto: 1, classeCusto: 1 }, options: { name: 'primaryKey', unique: true } },
  ],
});
interface ValoresRealizadosMd extends mongoose.Document<ObjectId, any, ValoresRealizados>, ValoresRealizados { }
export const ValoresRealizadosModel = (() => {
  const modelName = modelNameValoresRealizados;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    centroCusto: { type: String, required: true },
    classeCusto: { type: String, required: true },
    valMeses: { type: [Number], required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ValoresRealizadosMd>(modelName, schema);
})();
//#endregion

//#endregion

//#region Funcionario e Terceiro
//#region Funcionario
const modelNameFuncionario = 'funcionarios';
collectionsDef.push({
  name: modelNameFuncionario,
  indexes: [
    { fields: { ano: 1, centroCusto: 1, origem: 1, refer: 1 }, options: { name: 'primaryKey', unique: true } },
  ],
});
interface FuncionarioMd extends mongoose.Document<ObjectId, any, Funcionario>, Funcionario { }
export const FuncionarioModel = (() => {
  const modelName = modelNameFuncionario;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    centroCusto: { type: String, required: true },
    origem: { type: String, enum: OrigemFunc, required: true },
    refer: { type: String, required: true },
    nome: { type: String, required: true },
    tipoColaborador: { type: String, enum: TipoColaborador, required: true },
    funcao: { type: String, required: false },
    salario_messy: { type: String, required: false },
    dependentes: { type: Number, required: false },
    valeTransp: { type: Number, required: false },
    idVaga: { type: String, required: false },
    idCentroCustoRh: { type: String, required: false },
    revisaoAtual: { type: Object, required: true },
    revisaoAnterior: { type: Object, required: false },
    revisaoInicial: { type: Object, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<FuncionarioMd>(modelName, schema);
})();
//#endregion

//#region Viagem
const modelNameViagem = 'viagens';
collectionsDef.push({
  name: modelNameViagem,
  indexes: [
    // { fields: { ano: 1, revisao: 1, centroCusto: 1, localidadeDestino: 1, funcId: 1 }, options: { name: 'primaryKey', unique: true } }
  ],
});
interface ViagemMd extends mongoose.Document<ObjectId, any, Viagem>, Viagem { }
export const ViagemModel = (() => {
  const modelName = modelNameViagem;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    revisao: { type: String, enum: RevisaoValor, required: true },
    centroCusto: { type: String, required: true },
    tipoPlanejViagem: { type: String, enum: TipoPlanejViagem, required: true },
    localidadeDestino: { type: String, required: false },
    funcId: { type: String, required: false },
    qtdViagens: { type: Number, required: false },
    mediaPernoites: { type: Number, required: false },
    obs: { type: String, required: false },
    valor: { type: Number, required: false },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ViagemMd>(modelName, schema);
})();
//#endregion

//#region Terceiro
const modelNameTerceiro = 'terceiros';
collectionsDef.push({
  name: modelNameTerceiro,
  indexes: [
    { fields: { ano: 1, revisao: 1, centroCusto: 1, refer: 1 }, options: { name: 'primaryKey', unique: true } },
  ],
});
interface TerceiroMd extends mongoose.Document<ObjectId, any, Terceiro>, Terceiro { }
export const TerceiroModel = (() => {
  const modelName = modelNameTerceiro;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    revisao: { type: String, enum: RevisaoValor, required: true },
    centroCusto: { type: String, required: true },
    refer: { type: String, required: true },
    nome: { type: String, required: true },
    fornecedor: { type: String, required: true },
    funcaoTerceiros: { type: String, required: true },
    valMeses: { type: [Number], required: true },
    created: { type: Date, required: true },
    lastUpdated: { type: Date, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<TerceiroMd>(modelName, schema);
})();
//#endregion

//#endregion

//#region CtrlInterface ValoresRealizadosInterfaceSap
//#region CtrlInterface
const modelNameCtrlInterface = 'ctrl_interfaces';
collectionsDef.push({
  name: modelNameCtrlInterface,
  indexes: [
    { fields: { categ: 1, dag_run_id: 1 }, options: { name: 'primaryKey', unique: true } },
    { fields: { categ: 1, status: 1 }, options: { name: 'status', unique: false } },
  ],
});
interface CtrlInterfaceMd extends mongoose.Document<ObjectId, any, CtrlInterface>, CtrlInterface { }
export const CtrlInterfaceModel = (() => {
  const modelName = modelNameCtrlInterface;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    categ: { type: String, enum: InterfaceSapCateg, required: true },
    dag_run_id: { type: String, required: true },
    started: { type: Date, required: true },
    lastChecked: { type: Date, required: true },
    status: { type: String, enum: InterfaceSapStatus, required: true },
    pending: { type: Boolean, required: true },
    info: { type: Object, required: false },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<CtrlInterfaceMd>(modelName, schema);
})();
//#endregion

//#region ValoresRealizadosInterfaceSap
const modelNameValoresRealizadosInterfaceSap = 'interface_sap_valores_realizados';
collectionsDef.push({
  name: modelNameValoresRealizadosInterfaceSap,
  database: databaseInterfaceSap,
  indexes: [
    { fields: { ano: 1, centroCusto: 1, classeCusto: 1 }, options: { name: 'primaryKey', unique: true } },
  ],
});
interface ValoresRealizadosInterfaceSapMd extends mongoose.Document<ObjectId, any, ValoresRealizadosInterfaceSap>, ValoresRealizadosInterfaceSap { }
export const ValoresRealizadosInterfaceSapModel = (() => {
  const modelName = modelNameValoresRealizadosInterfaceSap;
  const mongoose = MongooseSlot(databaseInterfaceSap).mongoose;
  const schema = new mongoose.Schema({
    ano: { type: String, required: true },
    centroCusto: { type: String, required: true },
    classeCusto: { type: String, required: true },
    m01: { type: Number, required: false },
    m02: { type: Number, required: false },
    m03: { type: Number, required: false },
    m04: { type: Number, required: false },
    m05: { type: Number, required: false },
    m06: { type: Number, required: false },
    m07: { type: Number, required: false },
    m08: { type: Number, required: false },
    m09: { type: Number, required: false },
    m10: { type: Number, required: false },
    m11: { type: Number, required: false },
    m12: { type: Number, required: false },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ValoresRealizadosInterfaceSapMd>(modelName, schema);
})();
//#endregion
//#endregion

//#region velhos
// const modelNameFuncionarioValorEventual = 'funcionario_valores_eventuaispremissa_s';
// export interface FuncionarioValorEventuaisMd extends mongoose.Document<ObjectId, any, any> { }
// export const FuncionarioValorEventualModel = (() => {
//   const modelName = modelNameFuncionarioValorEventual;
//   const mongoose = MongooseSlot().mongoose;
//   const schema = new mongoose.Schema({
//     ano: { type: String, required: true },
//   });
//   return mongoose.model<FuncionarioValorEventuaisMd>(modelName, schema);
// })();
//#endregion
