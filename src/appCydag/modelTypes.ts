import { ObjectId } from 'mongodb';

import { csd, dbgError } from '../libCommon/dbg';
import { AmountPtBrParse, BinSearchProp, ConcatArrays, DateDisp, DateFromStrISO, DateToStrISO, ErrorPlus, FillClass, RandomNumber, Scramble, Unscramble } from '../libCommon/util';
import { IGenericObject } from '../libCommon/types';
import { FldCsvDef, FldsCsvAll } from '../libCommon/uploadCsv';
import { BooleanToSN, SNToBoolean, SearchTermsForDbSavePtBr, StrToNumber } from '../libCommon/util';
import { isAmbDev } from '../libCommon/isAmb';

import { UserMd } from './models';
import { LoggedUser } from './loggedUser';
import { rolesApp, roleSimulateUserDyn } from './endPoints';
import { configApp } from './config';
import { amountParse, amountParseValsCalc } from './util';
import { CategRegional, CategRegionalMd, InterfaceSapStatus, InterfaceSapCateg, OrigemClasseCusto, OrigemFunc, ProcessoOrcamentarioStatus, RevisaoValor, RevisaoValorMd, TipoColaborador, TipoColaboradorMd, TipoParticipPerOrcam, TipoParticipPerOrcamMd, TipoPlanejViagem, TipoSegmCentroCusto, TipoSegmCentroCustoMd } from './types';

//#region ProcessoOrcamentario User
export class ProcessoOrcamentario {
  _id?: ObjectId;
  ano: string;
  //versao?: string;
  status: ProcessoOrcamentarioStatus;
  //percLimiteFarois?: number;
  //revisaoInicialJa?: boolean;
  //events: any[]; // carga usuarios, etc
  horaLoadFuncFull?: Date;
  horaLoadFuncIncr?: Date;
  horaPreCalcValoresPlanejados?: Date;
  horaLoadValoresRealizados?: Date;
  horaRevisaoInicial?: Date;
  horaRevisaoAnterior?: Date;
  created?: Date;
  lastUpdated?: Date;
  static get F() {
    return {
      ano: 'ano' as 'ano',
    };
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ProcessoOrcamentario().Fill({
        ...values,
        horaLoadFuncFull: DateFromStrISO(values.horaLoadFuncFull),
        horaLoadFuncIncr: DateFromStrISO(values.horaLoadFuncIncr),
        horaPreCalcValoresPlanejados: DateFromStrISO(values.horaPreCalcValoresPlanejados),
        horaLoadValoresRealizados: DateFromStrISO(values.horaLoadValoresRealizados),
        horaRevisaoInicial: DateFromStrISO(values.horaRevisaoInicial),
        horaRevisaoAnterior: DateFromStrISO(values.horaRevisaoAnterior),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em ProcessoOrcamentario.deserialize', error.message, values);
      return new ProcessoOrcamentario();
    }
  }
  obsArray?() {
    const result: string[] = [];
    if (this.horaLoadFuncFull != null) {
      result.push(`Carga Func. (full): ${DateDisp(this.horaLoadFuncFull, 'dmyhm')}`);
      if (this.horaLoadFuncIncr != null)
        result.push(`Carga Func. (incr.): ${DateDisp(this.horaLoadFuncIncr, 'dmyhm')}`);
    }
    // if (this.horaPreCalcValoresPlanejados != null)
    //   result.push(`Pré cálc. vals plan: ${DateDisp(this.horaPreCalcValoresPlanejados, 'dmyhm')}`);
    if (this.horaLoadValoresRealizados != null)
      result.push(`Carga Realizado: ${DateDisp(this.horaLoadValoresRealizados, 'dmyhm')}`);
    if (this.horaRevisaoAnterior != null)
      result.push(`Rev. Anterior: ${DateDisp(this.horaRevisaoAnterior, 'dmyhm')}`);
    if (this.horaRevisaoInicial != null)
      result.push(`Rev. Inicial: ${DateDisp(this.horaRevisaoInicial, 'dmyhm')}`);
    return result;
  }
}
export class ProcessoOrcamentarioCentroCusto {
  _id?: ObjectId;
  ano?: string;
  centroCusto?: string;
  planejamentoEmAberto?: boolean;
  permiteNovosClb?: boolean;
  emailResponsavel?: string;
  emailPlanejador?: string;
  emailConsulta?: string[];
  agrupPremissas?: string;
  localidade?: string;
  unidadeNegocio?: string;
  diretoria?: string;
  gerencia?: string;
  //depto?: string;
  //modeGestorUnidadeNegocio?: string;
  created?: Date;
  lastUpdated?: Date;
  static get F() {
    return {
      centroCusto: 'centroCusto' as 'centroCusto',
    };
  }
  static get mandatoryFieldsInsert() {
    return [
      'localidade',
      'planejamentoEmAberto',
      'permiteNovosClb',
    ];
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ProcessoOrcamentarioCentroCusto().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em ProcessoOrcamentarioCentroCusto.deserialize', error.message, values);
      return new ProcessoOrcamentarioCentroCusto();
    }
  }
  static get fldsCsvDefCrud() {
    return [
      new FldCsvDef(configApp.csvColumnCmd),
      new FldCsvDef('centroCusto', { mandatoryValue: true, up: (data: IGenericObject) => data.centroCusto.toUpperCase() }),
      new FldCsvDef('emailResponsavel', { up: (data: IGenericObject) => data.emailResponsavel.toLowerCase() }),
      new FldCsvDef('emailPlanejador', { up: (data: IGenericObject) => data.emailPlanejador.toLowerCase() }),
      new FldCsvDef('emailConsulta', { down: (data: ProcessoOrcamentarioCentroCusto) => data.emailConsulta.join(','), up: (data: IGenericObject) => data.emailConsulta.split(',').map((x) => x.trim().toLowerCase()) }),
      new FldCsvDef('planejamentoEmAberto', { fldDisp: 'planejamentoEmAberto(s/n)', down: (data: ProcessoOrcamentarioCentroCusto) => BooleanToSN(data.planejamentoEmAberto), up: (data: IGenericObject) => SNToBoolean(data['planejamentoEmAberto(s/n)'].trim().toLowerCase()) }),
      new FldCsvDef('permiteNovosClb', { fldDisp: 'permiteNovosClb(s/n)', down: (data: ProcessoOrcamentarioCentroCusto) => BooleanToSN(data.permiteNovosClb), up: (data: IGenericObject) => SNToBoolean(data['permiteNovosClb(s/n)'].trim().toLowerCase()) }),
      new FldCsvDef('agrupPremissas', { up: (data: IGenericObject) => data.agrupPremissas.toUpperCase() }),
      new FldCsvDef('localidade', { up: (data: IGenericObject) => data.localidade.toUpperCase() }),
      new FldCsvDef('unidadeNegocio', { up: (data: IGenericObject) => data.unidadeNegocio.toUpperCase() }),
      new FldCsvDef('diretoria', { up: (data: IGenericObject) => data.diretoria.toUpperCase() }),
      new FldCsvDef('gerencia', { up: (data: IGenericObject) => data.gerencia.toUpperCase() }),
      //new FldCsvDef('depto', { up: (data: IGenericObject) => data.depto.toUpperCase() }),
    ];
  }
}
export class User {
  _id?: ObjectId;
  email?: string;
  nome?: string;
  ativo?: boolean;
  //email_superior?: string;
  roles?: string[];
  rolesControlled?: string[];
  psw?: string;
  tokenResetPsw?: string;
  searchTerms?: string;
  created?: Date;
  lastUpdated?: Date;
  //_idSuperior?: ObjectId;
  constructor() {
    this.ativo = true;
    this.roles = [];
    this.rolesControlled = [];
  }
  static get F() {
    return {
      email: 'email' as 'email',
      nome: 'nome' as 'nome',
      ativo: 'ativo' as 'ativo',
      roles: 'roles' as 'roles',
      psw: 'psw' as 'psw',
      searchTerms: 'searchTerms' as 'searchTerms',
    };
  }
  static SearchTermsGen(documentInsOrUpd: IGenericObject, documentDb?: User) {
    const textsUpd = [];
    if (documentInsOrUpd.nome != undefined) { textsUpd.push(documentInsOrUpd.nome); } else if (documentDb != null) textsUpd.push(documentDb.nome);
    if (documentInsOrUpd.email != undefined) { textsUpd.push(documentInsOrUpd.email.replace(/@.*/, '')); } else if (documentDb != null) textsUpd.push(documentDb.email.replace(/@.*/, ''));
    return SearchTermsForDbSavePtBr(textsUpd);
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new User().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em User.deserialize', error.message, values);
      return new User();
    }
  }
  toCsvCrud?() {
    const entity = this;
    try {
      return {
        email: entity.email,
        nome: entity.nome,
        ativo: BooleanToSN(entity.ativo),
        perfilGestorContr: BooleanToSN(entity.roles.includes(rolesApp.gestorContr)),
        perfilOperContr: BooleanToSN(entity.roles.includes(rolesApp.operContr)),
        perfilAcessaSalarios: BooleanToSN(entity.roles.includes(rolesApp.acessaSalarios)),
        perfilConsTodosCCs: BooleanToSN(entity.roles.includes(rolesApp.consTodosCCs)),
        perfilCargaFunc: BooleanToSN(entity.roles.includes(rolesApp.cargaFunc)),
      };
    } catch (error) {
      dbgError('Erro em User.toCsvCrud', error.message, entity);
      return null;
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { email: entity.email, nome: entity.nome };
    } catch (error) {
      dbgError('Erro em User.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new User(), [
      new FldCsvDef('ativo', { down: (data: User) => BooleanToSN(data.ativo), up: (data: IGenericObject) => SNToBoolean(data.ativo.trim().toLowerCase()) }),
      new FldCsvDef('roles', { down: (data: User) => data.roles.join(','), up: (data: IGenericObject) => data.roles.split(',').map((x) => x.trim().toLowerCase()) }),
      new FldCsvDef('rolesControlled', { suppressColumn: true }),
      new FldCsvDef('searchTerms', { suppressColumn: true, def: (data: IGenericObject) => User.SearchTermsGen(data) }),
      new FldCsvDef('created', { down: (data: User) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: User) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
  static loggedUser(userMd: UserMd, emailSigned: string, firstSignIn: Date, lastReSignIn: Date, lastActivity: Date, hasSomeCCResponsavel: boolean, hasSomeCCPlanejador: boolean, hasSomeCCConsulta: boolean, ttlSeconds?: number) {
    const rolesUse = ConcatArrays(userMd.roles, userMd.rolesControlled);
    if (hasSomeCCResponsavel) rolesUse.push(rolesApp.dyn_responsCC);
    if (hasSomeCCPlanejador) rolesUse.push(rolesApp.dyn_planejCC);
    if (hasSomeCCConsulta) rolesUse.push(rolesApp.dyn_consultaCC);
    if (userMd.roles.includes(rolesApp.gestorContr) ||
      userMd.roles.includes(rolesApp.operContr) ||
      userMd.roles.includes(rolesApp.consTodosCCs)) {
      rolesUse.push(rolesApp.dyn_consTodosCCs);
    }
    if (emailSigned != userMd.email)
      rolesUse.push(roleSimulateUserDyn);
    return {
      sessionIdStr: null,
      userIdStr: userMd._id.toString(),
      email: userMd.email,
      emailSigned,
      roles: rolesUse,
      name: userMd.nome,
      firstSignIn,
      lastReSignIn,
      lastActivity,
      ttlSeconds,
    } as LoggedUser;
  }
}
//#endregion

//#region dados mestre gerais
export const agrupPremissasCoringa = { cod: '*', descr: '*** Padrão ***' };
export class AgrupPremissas {
  _id?: ObjectId;
  cod?: string;
  descr?: string;
  searchTerms?: string;
  created?: Date;
  lastUpdated?: Date;
  static get Name() { return 'Agrup. Premissas'; }
  static get F() {
    return {
      cod: 'cod' as 'cod',
      descr: 'descr' as 'descr',
      searchTerms: 'searchTerms' as 'searchTerms',
    };
  }
  static SearchTermsGen(documentInsOrUpd: IGenericObject, documentDb?: AgrupPremissas) {
    const textsUpd = [];
    if (documentInsOrUpd.cod != undefined) { textsUpd.push(documentInsOrUpd.cod); } else if (documentDb != null) textsUpd.push(documentDb.cod);
    if (documentInsOrUpd.descr != undefined) { textsUpd.push(documentInsOrUpd.descr); } else if (documentDb != null) textsUpd.push(documentDb.descr);
    return SearchTermsForDbSavePtBr(textsUpd);
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new AgrupPremissas().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em AgrupPremissas.deserialize', error.message, values);
      return new AgrupPremissas();
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('Erro em AgrupPremissas.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new AgrupPremissas(), [
      new FldCsvDef('searchTerms', { suppressColumn: true, def: (data: IGenericObject) => AgrupPremissas.SearchTermsGen(data) }),
      new FldCsvDef('created', { down: (data: AgrupPremissas) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: AgrupPremissas) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}

export class CentroCusto {
  _id?: ObjectId;
  cod?: string;
  descr?: string;
  //ativo?: boolean;
  //sap?: boolean;
  searchTerms?: string;
  created?: Date;
  lastUpdated?: Date;
  static get Name() { return 'Centro de Custo'; }
  static get F() {
    return {
      cod: 'cod' as 'cod',
      descr: 'descr' as 'descr',
      //ativo: 'ativo' as 'ativo',
      //sap: 'sap' as 'sap',
      searchTerms: 'searchTerms' as 'searchTerms',
    };
  }
  static SearchTermsGen(documentInsOrUpd: IGenericObject, documentDb?: CentroCusto) {
    const textsUpd = [];
    if (documentInsOrUpd.cod != undefined) { textsUpd.push(documentInsOrUpd.cod); } else if (documentDb != null) textsUpd.push(documentDb.cod);
    if (documentInsOrUpd.descr != undefined) { textsUpd.push(documentInsOrUpd.descr); } else if (documentDb != null) textsUpd.push(documentDb.descr);
    return SearchTermsForDbSavePtBr(textsUpd);
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new CentroCusto().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em CentroCusto.deserialize', error.message, values);
      return new CentroCusto();
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('Erro em CentroCusto.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new CentroCusto(), [
      new FldCsvDef('searchTerms', { suppressColumn: true, def: (data: IGenericObject) => CentroCusto.SearchTermsGen(data) }),
      new FldCsvDef('created', { down: (data: CentroCusto) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: CentroCusto) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
export class Diretoria {
  _id?: ObjectId;
  cod: string;
  descr: string;
  searchTerms?: string;
  created?: Date;
  lastUpdated?: Date;
  static get F() {
    return {
      cod: 'cod' as 'cod',
      descr: 'descr' as 'descr',
      searchTerms: 'searchTerms' as 'searchTerms',
    };
  }
  static SearchTermsGen(documentInsOrUpd: IGenericObject, documentDb?: Diretoria) {
    const textsUpd = [];
    if (documentInsOrUpd.cod != undefined) { textsUpd.push(documentInsOrUpd.cod); } else if (documentDb != null) textsUpd.push(documentDb.cod);
    if (documentInsOrUpd.descr != undefined) { textsUpd.push(documentInsOrUpd.descr); } else if (documentDb != null) textsUpd.push(documentDb.descr);
    return SearchTermsForDbSavePtBr(textsUpd);
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new Diretoria().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em Diretoria.deserialize', error.message, values);
      return new Diretoria();
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('Erro em Diretoria.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new Diretoria(), [
      new FldCsvDef('searchTerms', { suppressColumn: true, def: (data: IGenericObject) => Diretoria.SearchTermsGen(data) }),
      new FldCsvDef('created', { down: (data: Diretoria) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: Diretoria) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
export const empresaCoringa = { cod: '*', descr: '*** Padrão ***' };
export class Empresa {
  _id?: ObjectId;
  cod?: string;
  descr?: string;
  searchTerms?: string;
  created?: Date;
  lastUpdated?: Date;
  static get Name() { return 'Empresa'; }
  static get F() {
    return {
      cod: 'cod' as 'cod',
      descr: 'descr' as 'descr',
      searchTerms: 'searchTerms' as 'searchTerms',
    };
  }
  static SearchTermsGen(documentInsOrUpd: IGenericObject, documentDb?: Empresa) {
    const textsUpd = [];
    if (documentInsOrUpd.cod != undefined) { textsUpd.push(documentInsOrUpd.cod); } else if (documentDb != null) textsUpd.push(documentDb.cod);
    if (documentInsOrUpd.descr != undefined) { textsUpd.push(documentInsOrUpd.descr); } else if (documentDb != null) textsUpd.push(documentDb.descr);
    return SearchTermsForDbSavePtBr(textsUpd);
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new Empresa().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em Empresa.deserialize', error.message, values);
      return new Empresa();
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('Erro em Empresa.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new Empresa(), [
      new FldCsvDef('searchTerms', { suppressColumn: true, def: (data: IGenericObject) => Empresa.SearchTermsGen(data) }),
      new FldCsvDef('created', { down: (data: Empresa) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: Empresa) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
export class FuncaoTerceiro {
  _id?: ObjectId;
  cod?: string;
  descr?: string;
  static get F() {
    return {
      cod: 'cod' as 'cod',
      descr: 'descr' as 'descr',
    };
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new FuncaoTerceiro().Fill({
        ...values,
      });
    } catch (error) {
      dbgError('Erro em FuncaoTerceiros.deserialize', error.message, values);
      return new FuncaoTerceiro();
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('Erro em FuncaoTerceiros.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    return FldsCsvAll(new FuncaoTerceiro());
  }
}
export class Gerencia {
  _id?: ObjectId;
  cod?: string;
  descr?: string;
  searchTerms?: string;
  created?: Date;
  lastUpdated?: Date;
  static get F() {
    return {
      cod: 'cod' as 'cod',
      descr: 'descr' as 'descr',
      searchTerms: 'searchTerms' as 'searchTerms',
    };
  }
  static SearchTermsGen(documentInsOrUpd: IGenericObject, documentDb?: Gerencia) {
    const textsUpd = [];
    if (documentInsOrUpd.cod != undefined) { textsUpd.push(documentInsOrUpd.cod); } else if (documentDb != null) textsUpd.push(documentDb.cod);
    if (documentInsOrUpd.descr != undefined) { textsUpd.push(documentInsOrUpd.descr); } else if (documentDb != null) textsUpd.push(documentDb.descr);
    return SearchTermsForDbSavePtBr(textsUpd);
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new Gerencia().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em Gerencia.deserialize', error.message, values);
      return new Gerencia();
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('Erro em Gerencia.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new Gerencia(), [
      new FldCsvDef('searchTerms', { suppressColumn: true, def: (data: IGenericObject) => Gerencia.SearchTermsGen(data) }),
      new FldCsvDef('created', { down: (data: Gerencia) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: Gerencia) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}

export const localidadeCoringa = { cod: '*', descr: '*** Padrão ***' };
export class Localidade {
  _id?: ObjectId;
  cod?: string;
  descr?: string;
  searchTerms?: string;
  created?: Date;
  lastUpdated?: Date;
  static get F() {
    return {
      cod: 'cod' as 'cod',
      descr: 'descr' as 'descr',
      searchTerms: 'searchTerms' as 'searchTerms',
    };
  }
  static SearchTermsGen(documentInsOrUpd: IGenericObject, documentDb?: Localidade) {
    const textsUpd = [];
    if (documentInsOrUpd.cod != undefined) { textsUpd.push(documentInsOrUpd.cod); } else if (documentDb != null) textsUpd.push(documentDb.cod);
    if (documentInsOrUpd.descr != undefined) { textsUpd.push(documentInsOrUpd.descr); } else if (documentDb != null) textsUpd.push(documentDb.descr);
    return SearchTermsForDbSavePtBr(textsUpd);
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new Localidade().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em Localidade.deserialize', error.message, values);
      return new Localidade();
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('Erro em Localidade.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new Localidade(), [
      new FldCsvDef('searchTerms', { suppressColumn: true, def: (data: IGenericObject) => Localidade.SearchTermsGen(data) }),
      new FldCsvDef('created', { down: (data: Localidade) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: Localidade) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
export class UnidadeNegocio {
  _id?: ObjectId;
  cod: string;
  descr: string;
  categRegional: CategRegional;
  searchTerms?: string;
  created?: Date;
  lastUpdated?: Date;
  static get F() {
    return {
      cod: 'cod' as 'cod',
      descr: 'descr' as 'descr',
      categRegional: 'categRegional' as 'categRegional',
      searchTerms: 'searchTerms' as 'searchTerms',
    };
  }
  static SearchTermsGen(documentInsOrUpd: IGenericObject, documentDb?: UnidadeNegocio) {
    const textsUpd = [];
    if (documentInsOrUpd.cod != undefined) { textsUpd.push(documentInsOrUpd.cod); } else if (documentDb != null) textsUpd.push(documentDb.cod);
    if (documentInsOrUpd.descr != undefined) { textsUpd.push(documentInsOrUpd.descr); } else if (documentDb != null) textsUpd.push(documentDb.descr);
    return SearchTermsForDbSavePtBr(textsUpd);
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new UnidadeNegocio().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em UnidadeNegocio.deserialize', error.message, values);
      return new UnidadeNegocio();
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('Erro em UnidadeNegocio.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new UnidadeNegocio(), [
      new FldCsvDef('categRegional', { mandatoryValue: false, down: (data: UnidadeNegocio) => data.categRegional.toString(), up: (data: IGenericObject) => CategRegionalMd.codeFromStr(data.categRegional) }),
      new FldCsvDef('searchTerms', { suppressColumn: true, def: (data: IGenericObject) => UnidadeNegocio.SearchTermsGen(data) }),
      new FldCsvDef('created', { down: (data: UnidadeNegocio) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: UnidadeNegocio) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
//#endregion

//#region estrutura de contas
export class FatorCusto {
  _id?: ObjectId;
  fatorCusto: string;
  descr: string;
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new FatorCusto().Fill(values);
    } catch (error) {
      dbgError('Erro em FatorCusto.deserialize', error.message, values);
      return new FatorCusto();
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new FatorCusto(), []);
  }
  static descrFator(fatorCusto: string, fatorCustoArray: FatorCusto[], abrev?: number) {
    let descr: string = BinSearchProp(fatorCustoArray, fatorCusto, 'descr', 'fatorCusto') || `Linha de Custo ${fatorCusto}`;
    if (abrev != null &&
      descr.length > abrev)
      descr = descr.substring(0, abrev - 4) + '...';
    return descr;
  }
}
export class ClasseCusto {
  _id?: ObjectId;
  classeCusto: string;
  descr: string;
  fatorCusto: string;
  origem: OrigemClasseCusto;
  seqApresent: number;
  searchTerms?: string;
  created?: Date;
  lastUpdated?: Date;
  static get F() {
    return {
      classeCusto: 'classeCusto' as 'classeCusto',
      descr: 'descr' as 'descr',
      fatorCusto: 'fatorCusto' as 'fatorCusto',
      origem: 'origem' as 'origem',
      seqApresent: 'seqApresent' as 'seqApresent',
      searchTerms: 'searchTerms' as 'searchTerms',
    };
  }
  static SearchTermsGen(documentInsOrUpd: IGenericObject, documentDb?: ClasseCusto) {
    const textsUpd = [];
    if (documentInsOrUpd.classeCusto != undefined) { textsUpd.push(documentInsOrUpd.classeCusto); } else if (documentDb != null) textsUpd.push(documentDb.classeCusto);
    if (documentInsOrUpd.descr != undefined) { textsUpd.push(documentInsOrUpd.descr); } else if (documentDb != null) textsUpd.push(documentDb.descr);
    return SearchTermsForDbSavePtBr(textsUpd);
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ClasseCusto().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em ClasseCusto.deserialize', error.message, values);
      return new ClasseCusto();
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new ClasseCusto(), [
      new FldCsvDef('searchTerms', { suppressColumn: true, def: (data: IGenericObject) => ClasseCusto.SearchTermsGen(data) }),
      new FldCsvDef('created', { down: (data: ClasseCusto) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: ClasseCusto) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
export class ClasseCustoRestrita {
  _id?: ObjectId;
  classeCusto?: string;
  centroCustoArray?: string[];
  obs?: string;
  created?: Date;
  lastUpdated?: Date;
  static get F() {
    return {
      classeCusto: 'classeCusto' as 'classeCusto',
      centroCustoArray: 'centroCustoArray' as 'centroCustoArray',
      obs: 'obs' as 'obs',
    };
  }
  constructor() {
    this.centroCustoArray = [];
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ClasseCustoRestrita().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em ClasseCustoRestrita.deserialize', error.message, values);
      return new ClasseCustoRestrita();
    }
  }
}
//#endregion

//#region Premissas
export class Premissa {
  _id?: ObjectId;
  cod?: string;
  descr?: string;
  tipoSegmCentroCusto?: TipoSegmCentroCusto;
  segmTipoClb?: boolean;

  despRecorrFunc?: boolean;
  descrDespRecorrFunc?: string;
  classeCusto?: string;

  obsValor?: string;
  //formato?: FormatoValorPremissa;
  decimais?: number;
  seqApresent?: number;
  anoIni?: string;
  anoFim?: string;
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new Premissa().Fill(values);
    } catch (error) {
      dbgError('Erro em Premissa.deserialize', error.message, values);
      return new Premissa();
    }
  }
  static get fldsCsvDefUpload() {
    return FldsCsvAll(new Premissa(), [
      new FldCsvDef('tipoSegmCentroCusto', { mandatoryValue: true, down: (data: Premissa) => data.tipoSegmCentroCusto.toString(), up: (data: IGenericObject) => TipoSegmCentroCustoMd.codeFromStr(data.tipoSegmCentroCusto) }),
      new FldCsvDef('segmTipoClb', { down: (data: Premissa) => BooleanToSN(data.segmTipoClb), up: (data: IGenericObject) => SNToBoolean(data.segmTipoClb.trim().toLowerCase()) }),
      new FldCsvDef('despRecorrFunc', { down: (data: Premissa) => BooleanToSN(data.despRecorrFunc), up: (data: IGenericObject) => SNToBoolean(data.despRecorrFunc.trim().toLowerCase()) }),
      new FldCsvDef('decimais', { up: (data: IGenericObject) => StrToNumber(data.decimais) }),
      new FldCsvDef('seqApresent', { up: (data: IGenericObject) => StrToNumber(data.seqApresent) }),
    ]);
  }
}
export class ValoresPremissa {
  _id?: ObjectId;
  ano?: string;
  revisao?: RevisaoValor;
  premissa?: string;
  ativa?: boolean;
  tipoSegmCentroCusto?: TipoSegmCentroCusto;
  segmTipoClb?: boolean;
  empresa?: string;
  agrupPremissas?: string;
  tipoColaborador?: TipoColaborador;
  valMeses?: number[];
  lastUpdated?: Date;
  static get F() {
    return {
      ano: 'ano' as 'ano',
      revisao: 'revisao' as 'revisao',
      empresa: 'empresa' as 'empresa',
      agrupPremissas: 'agrupPremissas' as 'agrupPremissas',
    };
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ValoresPremissa().Fill({
        ...values,
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em ValoresPremissa.deserialize', error.message, values);
      return new ValoresPremissa();
    }
  }
  static get fldsCsvDefUpload() {
    const maxDecimals = 4;
    const agora = new Date();
    return FldsCsvAll(new ValoresPremissa(), [
      new FldCsvDef('revisao', { down: (data: ValoresPremissa) => data.revisao.toString(), up: (data: IGenericObject) => RevisaoValorMd.codeFromStr(data.revisao), def: () => RevisaoValor.atual }),
      new FldCsvDef('ativa', { down: (data: ValoresPremissa) => BooleanToSN(data.ativa), up: (data: IGenericObject) => SNToBoolean(data.ativa.trim().toLowerCase()) }),
      new FldCsvDef('tipoSegmCentroCusto', { down: (data: ValoresPremissa) => data.tipoSegmCentroCusto.toString(), up: (data: IGenericObject) => TipoSegmCentroCustoMd.codeFromStr(data.tipoSegmCentroCusto) }),
      new FldCsvDef('segmTipoClb', { down: (data: ValoresPremissa) => BooleanToSN(data.segmTipoClb), up: (data: IGenericObject) => SNToBoolean(data.segmTipoClb.trim().toLowerCase()) }),
      new FldCsvDef('valMeses', {
        suppressColumn: true, // #!!!!!! prever uma forma de baixar em m01, m02 e subir compondo o array
        def: (data: IGenericObject) => [
          AmountPtBrParse(data.m01, maxDecimals, true, true), AmountPtBrParse(data.m02, maxDecimals, true, true), AmountPtBrParse(data.m03, maxDecimals, true, true), AmountPtBrParse(data.m04, maxDecimals, true, true),
          AmountPtBrParse(data.m05, maxDecimals, true, true), AmountPtBrParse(data.m06, maxDecimals, true, true), AmountPtBrParse(data.m07, maxDecimals, true, true), AmountPtBrParse(data.m08, maxDecimals, true, true),
          AmountPtBrParse(data.m09, maxDecimals, true, true), AmountPtBrParse(data.m10, maxDecimals, true, true), AmountPtBrParse(data.m11, maxDecimals, true, true), AmountPtBrParse(data.m12, maxDecimals, true, true),
        ]
      }),
      new FldCsvDef('lastUpdated', { down: (data: ValoresPremissa) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
export class ValoresLocalidade {
  _id?: ObjectId;
  ano?: string;
  revisao?: RevisaoValor;
  localidade?: string;
  valMeses?: number[];
  lastUpdated?: Date;
  static get F() {
    return {
      ano: 'ano' as 'ano',
      revisao: 'revisao' as 'revisao',
    };
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ValoresLocalidade().Fill({
        ...values,
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em ValoresLocalid.deserialize', error.message, values);
      return new ValoresLocalidade();
    }
  }
  static get fldsCsvDefUpload() {
    const maxDecimals = 2;
    const agora = new Date();
    return FldsCsvAll(new ValoresLocalidade(), [
      new FldCsvDef('revisao', { def: () => RevisaoValor.atual }),
      new FldCsvDef('valMeses', {
        suppressColumn: true,
        def: (data: IGenericObject) => [
          AmountPtBrParse(data.m01, maxDecimals, true, true), AmountPtBrParse(data.m02, maxDecimals, true, true), AmountPtBrParse(data.m03, maxDecimals, true, true), AmountPtBrParse(data.m04, maxDecimals, true, true),
          AmountPtBrParse(data.m05, maxDecimals, true, true), AmountPtBrParse(data.m06, maxDecimals, true, true), AmountPtBrParse(data.m07, maxDecimals, true, true), AmountPtBrParse(data.m08, maxDecimals, true, true),
          AmountPtBrParse(data.m09, maxDecimals, true, true), AmountPtBrParse(data.m10, maxDecimals, true, true), AmountPtBrParse(data.m11, maxDecimals, true, true), AmountPtBrParse(data.m12, maxDecimals, true, true),
        ]
      }),
      new FldCsvDef('lastUpdated', { down: (data: ValoresLocalidade) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
export class ValoresTransfer {
  _id?: ObjectId;
  ano?: string;
  revisao?: RevisaoValor;
  localidadeOrigem?: string;
  localidadeDestino?: string;
  valMeses?: number[];
  lastUpdated?: Date;
  static get F() {
    return {
      ano: 'ano' as 'ano',
      revisao: 'revisao' as 'revisao',
      localidadeOrigem: 'localidadeOrigem' as 'localidadeOrigem',
    };
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ValoresTransfer().Fill({
        ...values,
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em ValoresTransfer.deserialize', error.message, values);
      return new ValoresTransfer();
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new ValoresTransfer(), [
      new FldCsvDef('revisao', { def: () => RevisaoValor.atual }),
      new FldCsvDef('valMeses', {
        suppressColumn: true,
        def: (data: IGenericObject) => [
          amountParse(data.m01, configApp.decimalsValsInput), amountParse(data.m02, configApp.decimalsValsInput), amountParse(data.m03, configApp.decimalsValsInput), amountParse(data.m04, configApp.decimalsValsInput),
          amountParse(data.m05, configApp.decimalsValsInput), amountParse(data.m06, configApp.decimalsValsInput), amountParse(data.m07, configApp.decimalsValsInput), amountParse(data.m08, configApp.decimalsValsInput),
          amountParse(data.m09, configApp.decimalsValsInput), amountParse(data.m10, configApp.decimalsValsInput), amountParse(data.m11, configApp.decimalsValsInput), amountParse(data.m12, configApp.decimalsValsInput),
        ]
      }),
      new FldCsvDef('lastUpdated', { down: (data: ValoresTransfer) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
//#endregion

//#region Valores planejados / finais etc
export class ValoresImputados {
  _id?: ObjectId;
  ano?: string;
  revisao?: RevisaoValor;
  centroCusto?: string;
  classeCusto?: string;
  idDetalhe?: string;
  descr?: string;
  valMeses?: number[];
  lastUpdated?: Date;
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ValoresImputados().Fill({
        ...values,
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em ValoresImputados.deserialize', error.message, values);
      return new ValoresImputados();
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new ValoresImputados(),
      [
        new FldCsvDef('revisao', { def: () => RevisaoValor.atual }),
        new FldCsvDef('valMeses', {
          suppressColumn: true,
          def: (data: IGenericObject) => [
            amountParse(data.m01, configApp.decimalsValsInput), amountParse(data.m02, configApp.decimalsValsInput), amountParse(data.m03, configApp.decimalsValsInput), amountParse(data.m04, configApp.decimalsValsInput),
            amountParse(data.m05, configApp.decimalsValsInput), amountParse(data.m06, configApp.decimalsValsInput), amountParse(data.m07, configApp.decimalsValsInput), amountParse(data.m08, configApp.decimalsValsInput),
            amountParse(data.m09, configApp.decimalsValsInput), amountParse(data.m10, configApp.decimalsValsInput), amountParse(data.m11, configApp.decimalsValsInput), amountParse(data.m12, configApp.decimalsValsInput),
          ]
        }),
        new FldCsvDef('lastUpdated', { down: (data: ValoresImputados) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
      ]);
  }
}
export class ValoresPlanejadosCalc {
  _id?: ObjectId;
  ano?: string;
  revisao?: RevisaoValor;
  centroCusto?: string;
  classeCusto?: string;
  valMeses?: number[];
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ValoresPlanejadosCalc().Fill(values);
    } catch (error) {
      dbgError('Erro em ValoresPlanejadosCalc.deserialize', error.message, values);
      return new ValoresPlanejadosCalc();
    }
  }
}
export class ValoresPlanejadosHistorico {
  _id?: ObjectId;
  ano?: string;
  centroCusto?: string;
  classeCusto?: string;
  valMeses?: number[];
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ValoresPlanejadosHistorico().Fill({
        ...values,
      });
    } catch (error) {
      dbgError('Erro em ValoresPlanejadosHistorico.deserialize', error.message, values);
      return new ValoresPlanejadosHistorico();
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new ValoresPlanejadosHistorico(),
      [
        new FldCsvDef('valMeses', {
          suppressColumn: true,
          def: (data: IGenericObject) => [
            amountParseValsCalc(data.m01), amountParseValsCalc(data.m02), amountParseValsCalc(data.m03), amountParseValsCalc(data.m04),
            amountParseValsCalc(data.m05), amountParseValsCalc(data.m06), amountParseValsCalc(data.m07), amountParseValsCalc(data.m08),
            amountParseValsCalc(data.m09), amountParseValsCalc(data.m10), amountParseValsCalc(data.m11), amountParseValsCalc(data.m12),
          ]
        }),
      ]);
  }
}

export class ValoresRealizados {
  _id?: ObjectId;
  ano?: string;
  centroCusto?: string;
  classeCusto?: string;
  valMeses?: number[];
  static get F() {
    return {
      ano: 'ano' as 'ano',
    };
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ValoresRealizados().Fill(values);
    } catch (error) {
      dbgError('Erro em ValoresRealizados.deserialize', error.message, values);
      return new ValoresRealizados();
    }
  }
  static get fldsCsvDefUpload() {
    return FldsCsvAll(new ValoresRealizados(),
      [
        new FldCsvDef('valMeses', {
          suppressColumn: true,
          def: (data: IGenericObject) => [
            amountParseValsCalc(data.m01), amountParseValsCalc(data.m02), amountParseValsCalc(data.m03), amountParseValsCalc(data.m04),
            amountParseValsCalc(data.m05), amountParseValsCalc(data.m06), amountParseValsCalc(data.m07), amountParseValsCalc(data.m08),
            amountParseValsCalc(data.m09), amountParseValsCalc(data.m10), amountParseValsCalc(data.m11), amountParseValsCalc(data.m12),
          ]
        }),
      ]);
  }
}
//#endregion

//#region Funcionario e Terceiro
export class FuncionarioRevisao {
  ativo?: boolean;
  tipoIni?: TipoParticipPerOrcam;
  mesIni?: number;
  tipoFim?: TipoParticipPerOrcam;
  mesFim?: number;
  salario_messy?: string;
  dependentes?: number;
  valeTransp?: number;
  mesPromo?: number;
  tipoColaboradorPromo?: TipoColaborador;
  salarioPromo_messy?: string;
  despsRecorr?: string[];

  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
}
export class Funcionario {
  ano?: string;
  centroCusto?: string;
  origem?: OrigemFunc;
  refer?: string;
  nome?: string;
  tipoColaborador?: TipoColaborador;
  funcao?: string;
  salario_messy?: string;
  dependentes?: number;
  valeTransp?: number;
  idVaga?: string;
  idCentroCustoRh?: string;
  revisaoAtual?: FuncionarioRevisao;
  revisaoAnterior?: FuncionarioRevisao;
  revisaoInicial?: FuncionarioRevisao;
  created?: Date;
  lastUpdated?: Date;
  static get F() {
    return {
      ano: 'ano' as 'ano',
      revisao: 'revisao' as 'revisao',
      centroCusto: 'centroCusto' as 'centroCusto',
    };
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new Funcionario().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em Funcionario.deserialize', error.message, values);
      return new Funcionario();
    }
  }
  static scrambleSalario(salario: number, centroCusto: string, refer: string) {
    if (salario == null || centroCusto == null || refer == null)
      throw new ErrorPlus('salario, centroCusto e refer devem ser informados');
    if (isAmbDev())
      return salario.toString();
    else
      return Scramble(''.padStart(RandomNumber(1, 20), '0') + salario.toString(), `${centroCusto}-${refer}`, true);
  }
  static unscrambleSalario(valor_messy: string, centroCusto: string, refer: string) {
    if (valor_messy == null)
      return null;
    if (centroCusto == null || refer == null)
      throw new Error('centroCusto e refer devem ser informados');
    if (isAmbDev()) {
      let result = 0;
      if (valor_messy == null)
        dbgError('salario_messy inválido (sem criptografia)', centroCusto, refer, valor_messy);
      else {
        try {
          result = StrToNumber(valor_messy, configApp.decimalsSalario);
        }
        catch (error) {
          dbgError('salario inválido (não numérico)', centroCusto, refer, valor_messy);
        }
      }
      return result;
    }
    else {
      const salStr = Unscramble(valor_messy, `${centroCusto}-${refer}`, true);
      let result = 0;
      if (salStr == null)
        dbgError('salario_messy inválido (criptografia)', centroCusto, refer, valor_messy);
      else {
        try {
          result = StrToNumber(salStr, configApp.decimalsSalario);
        }
        catch (error) {
          dbgError('salario desmascarado inválido (não numérico)', centroCusto, refer, salStr);
        }
      }
      return result;
    }
  }

  static tipoParticipPerOrcamUpload(stage: 'ini' | 'fim', str: string) {
    const tipo = TipoParticipPerOrcamMd.codeFromStr(str);
    if (stage == 'ini' && TipoParticipPerOrcamMd.all.find(x => x.plus.ini && x.cod == tipo) == null)
      throw new Error('valor inválido para inicio do período');
    if (stage == 'fim' && TipoParticipPerOrcamMd.all.find(x => x.plus.fim && x.cod == tipo) == null)
      throw new Error('valor inválido para fim do período');
    return tipo;
  }

  static funcionarioRevisao(revisao: RevisaoValor) {
    const result = revisao == RevisaoValor.atual ? 'revisaoAtual' :
      revisao == RevisaoValor.anterior ? 'revisaoAnterior' :
        revisao == RevisaoValor.inicial ? 'revisaoInicial' : null;
    return result;
  }

  static get fldsCsvDefUpload() {
    return [
      new FldCsvDef('centroCusto', { mandatoryValue: true, up: (data: IGenericObject) => data.centroCusto.toUpperCase() }),
      new FldCsvDef('refer', { mandatoryValue: true, fldDisp: 'cpf' }),
      new FldCsvDef('nome', { mandatoryValue: true }),
      new FldCsvDef('tipoColaborador', { mandatoryValue: true, down: (data: Funcionario) => data.tipoColaborador.toString(), up: (data: IGenericObject) => TipoColaboradorMd.codeFromStr(data.tipoColaborador) }),
      new FldCsvDef('funcao'),
      new FldCsvDef('salario_messy', { mandatoryValue: true, fldDisp: 'salarioBase', down: () => null, up: (data: IGenericObject) => Funcionario.scrambleSalario(amountParse(data.salarioBase, configApp.decimalsSalario), data.centroCusto, data.cpf) }),
      new FldCsvDef('dependentes', { mandatoryValue: false, up: (data: IGenericObject) => StrToNumber(data.dependentes) }),
      new FldCsvDef('valeTransp', { mandatoryValue: false, up: (data: IGenericObject) => StrToNumber(data.valeTransp, configApp.decimalsValsInput) }),
      new FldCsvDef('idVaga'),
      new FldCsvDef('idCentroCustoRh'),
      new FldCsvDef('tipoIni', { mandatoryValue: true, up: (data: IGenericObject) => Funcionario.tipoParticipPerOrcamUpload('ini', data.tipoIni) }),
      new FldCsvDef('mesIni', { mandatoryValue: true, up: (data: IGenericObject) => StrToNumber(data.mesIni) }),
      new FldCsvDef('tipoFim', { mandatoryValue: false, up: (data: IGenericObject) => Funcionario.tipoParticipPerOrcamUpload('fim', data.tipoFim) }),
      new FldCsvDef('mesFim', { mandatoryValue: false, up: (data: IGenericObject) => StrToNumber(data.mesFim) }),
    ];
  }
}

export class Viagem {
  _id?: ObjectId;
  ano: string;
  revisao: RevisaoValor;
  centroCusto: string;
  tipoPlanejViagem: TipoPlanejViagem;
  localidadeDestino?: string;
  funcId?: string;
  // estimativa anual, será distruído nos meses do processo orçamentário (12 a princípio)
  qtdViagens?: number;
  mediaPernoites?: number;
  obs?: string;
  valor?: number;
  created: Date;
  lastUpdated: Date;
  // static get F() {
  //   return {
  //     ano: 'ano' as 'ano',
  //     revisao: 'revisao' as 'revisao',
  //     centroCusto: 'centroCusto' as 'centroCusto',
  //   };
  // }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new Viagem().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em Viagem.deserialize', error.message, values);
      return new Viagem();
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new Viagem(), [
      new FldCsvDef('qtdViagens', { mandatoryValue: false, up: (data: IGenericObject) => StrToNumber(data.qtdViagens) }),
      new FldCsvDef('mediaPernoites', { mandatoryValue: false, up: (data: IGenericObject) => StrToNumber(data.mediaPernoites) }),
      new FldCsvDef('created', { down: (data: Viagem) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: Viagem) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
export class Terceiro {
  _id?: ObjectId;
  ano?: string;
  revisao?: RevisaoValor;
  centroCusto?: string;
  refer?: string;
  nome?: string;
  fornecedor?: string;
  funcaoTerceiros?: string;
  valMeses?: number[];
  created?: Date;
  lastUpdated?: Date;
  // static get F() {
  //   return {
  //     ano: 'ano' as 'ano',
  //     revisao: 'revisao' as 'revisao',
  //     centroCusto: 'centroCusto' as 'centroCusto',
  //   };
  // }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new Terceiro().Fill({
        ...values,
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Erro em Terceiro.deserialize', error.message, values);
      return new Terceiro();
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(new Terceiro(), [
      new FldCsvDef('valMeses', {
        suppressColumn: true,
        def: (data: IGenericObject) => [
          amountParseValsCalc(data.m01), amountParseValsCalc(data.m02), amountParseValsCalc(data.m03), amountParseValsCalc(data.m04),
          amountParseValsCalc(data.m05), amountParseValsCalc(data.m06), amountParseValsCalc(data.m07), amountParseValsCalc(data.m08),
          amountParseValsCalc(data.m09), amountParseValsCalc(data.m10), amountParseValsCalc(data.m11), amountParseValsCalc(data.m12),
        ]
      }),
      new FldCsvDef('created', { down: (data: Terceiro) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: Terceiro) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
//#endregion

//#region CtrlInterface ValoresRealizadosInterfaceSap
export class CtrlInterface {
  _id?: ObjectId;
  categ: InterfaceSapCateg;
  dag_run_id: string;
  started: Date;
  lastChecked: Date;
  status: InterfaceSapStatus;
  pending: boolean;
  info?: any; // ano, ultimo mes com valor, nr de registros
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new CtrlInterface().Fill({
        ...values,
        started: DateFromStrISO(values.started),
        lastChecked: DateFromStrISO(values.lastChecked),
      });
    } catch (error) {
      dbgError('Erro em CtrlInterface.deserialize', error.message, values);
      return new CtrlInterface();
    }
  }
}
export class ValoresRealizadosInterfaceSap {
  _id?: ObjectId;
  ano?: string;
  centroCusto?: string;
  classeCusto?: string;
  m01?: number;
  m02?: number;
  m03?: number;
  m04?: number;
  m05?: number;
  m06?: number;
  m07?: number;
  m08?: number;
  m09?: number;
  m10?: number;
  m11?: number;
  m12?: number;
}

//#endregion

//#region velhos

// export class AjusteContaCalculada {
//   _id?: ObjectId;
//   ano?: string;
//   revisao?: RevisaoValor;
//   centroCusto?: string;
//   classeCusto?: string;
//   subClasseCusto?: string;
//   //ID_AJUSTE_AUTOMATICO?: string;
//   valMeses?: number[];
// }

// export class SubClasseCusto {
//   _id?: ObjectId;
//   classeCusto?: string;
//   subClasseCusto?: string;
//   descr?: string;
//   origem?: string;
// }
// export enum FormatoValorPremissa {//   numerico = 'n',//   boleano = 'b',// }

//#endregion
