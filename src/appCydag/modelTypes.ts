import { ObjectId } from 'mongodb';
import _ from 'underscore';

import { csd, dbgError } from '../libCommon/dbg';
import { AmountPtBrParse, BinSearchProp, ConcatArrays, CutUndef, DateDisp, DateFromStrISO, DateToStrISO, ErrorPlus, FillClassProps, RandomNumber, Scramble, Unscramble } from '../libCommon/util';
import { IGenericObject } from '../libCommon/types';
import { FldCsvDef, FldsCsvAll } from '../libCommon/uploadCsv';
import { BooleanToSN, SNToBoolean, SearchTermsForDbSavePtBr, StrToNumber } from '../libCommon/util';

import { isAmbDev } from '../app_base/envs';
import { configApp } from '../app_hub/appConfig';

import { UserMd } from './models';
import { LoggedUser } from './loggedUser';
import { rolesApp, roleSimulateUserDyn } from './endPoints';
import { amountParse, amountParseValsCalc } from './util';
import { CategRegional, CategRegionalMd, InterfaceSapStatus, InterfaceSapCateg, OrigemClasseCusto, OrigemFunc, ProcessoOrcamentarioStatus, RevisaoValor, RevisaoValorMd, TipoColaborador, TipoColaboradorMd, TipoParticipPerOrcam, TipoParticipPerOrcamMd, TipoPlanejViagem, TipoSegmCentroCusto, TipoSegmCentroCustoMd } from './types';
import { configCydag } from './configCydag';

export const ignoreMongoProps = (values: any) => _.omit(values, ['__v', 'createdAt', 'updatedAt']);

//#region ProcessoOrcamentario User
export class ProcessoOrcamentario {
  _id?: ObjectId;
  ano?: string;
  //versao?: string;
  status?: ProcessoOrcamentarioStatus;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ProcessoOrcamentario(); }
  static fill(values: ProcessoOrcamentario, init = false) { return CutUndef(FillClassProps(ProcessoOrcamentario.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ProcessoOrcamentario.new(), {
        ...ignoreMongoProps(values),
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
      dbgError('ProcessoOrcamentario.deserialize', error.message, values);
      return ProcessoOrcamentario.new(true);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ProcessoOrcamentarioCentroCusto(); }
  static fill(values: ProcessoOrcamentarioCentroCusto, init = false) { return CutUndef(FillClassProps(ProcessoOrcamentarioCentroCusto.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ProcessoOrcamentarioCentroCusto.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('ProcessoOrcamentarioCentroCusto.deserialize', error.message, values);
      return ProcessoOrcamentarioCentroCusto.new(true);
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
  static new(init?: boolean) {
    const obj = new User();
    if (init) {
      obj.ativo = true;
      obj.roles = [];
      obj.rolesControlled = [];
    }
    return obj;
  }
  static fill(values: User, init = false) { return CutUndef(FillClassProps(User.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(User.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('User.deserialize', error.message, values);
      return User.new(true);
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
      dbgError('User.toCsvCrud', error.message, entity);
      return null;
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { email: entity.email, nome: entity.nome };
    } catch (error) {
      dbgError('User.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(User.new(true), [
      new FldCsvDef('ativo', { down: (data: User) => BooleanToSN(data.ativo), up: (data: IGenericObject) => SNToBoolean(data.ativo.trim().toLowerCase()) }),
      new FldCsvDef('roles', { down: (data: User) => data.roles.join(','), up: (data: IGenericObject) => data.roles.split(',').map((x) => x.trim().toLowerCase()) }),
      new FldCsvDef('rolesControlled', { suppressColumn: true }),
      new FldCsvDef('searchTerms', { suppressColumn: true, def: (data: IGenericObject) => User.SearchTermsGen(data) }),
      new FldCsvDef('created', { down: (data: User) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: User) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
  static loggedUser(userMd: UserMd, emailSigned: string, firstSignIn: Date, lastReSignIn: Date, lastActivity: Date, hasSomeCCResponsavel: boolean, hasSomeCCPlanejador: boolean, hasSomeCCConsulta: boolean) { // , ttlSeconds?: number
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
    return LoggedUser.fill({
      sessionIdStr: null,
      userIdStr: userMd._id.toString(),
      email: userMd.email,
      emailSigned,
      roles: rolesUse,
      name: userMd.nome,
      firstSignIn,
      lastReSignIn,
      lastActivity,
      //ttlSeconds,
    });
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new AgrupPremissas(); }
  static fill(values: AgrupPremissas, init = false) { return CutUndef(FillClassProps(AgrupPremissas.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(AgrupPremissas.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('AgrupPremissas.deserialize', error.message, values);
      return AgrupPremissas.new(true);
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('AgrupPremissas.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(AgrupPremissas.new(), [
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new CentroCusto(); }
  static fill(values: CentroCusto, init = false) { return CutUndef(FillClassProps(CentroCusto.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(CentroCusto.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('CentroCusto.deserialize', error.message, values);
      return CentroCusto.new(true);
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('CentroCusto.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(CentroCusto.new(), [
      new FldCsvDef('searchTerms', { suppressColumn: true, def: (data: IGenericObject) => CentroCusto.SearchTermsGen(data) }),
      new FldCsvDef('created', { down: (data: CentroCusto) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: CentroCusto) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
export class Diretoria {
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
  static SearchTermsGen(documentInsOrUpd: IGenericObject, documentDb?: Diretoria) {
    const textsUpd = [];
    if (documentInsOrUpd.cod != undefined) { textsUpd.push(documentInsOrUpd.cod); } else if (documentDb != null) textsUpd.push(documentDb.cod);
    if (documentInsOrUpd.descr != undefined) { textsUpd.push(documentInsOrUpd.descr); } else if (documentDb != null) textsUpd.push(documentDb.descr);
    return SearchTermsForDbSavePtBr(textsUpd);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new Diretoria(); }
  static fill(values: Diretoria, init = false) { return CutUndef(FillClassProps(Diretoria.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(Diretoria.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Diretoria.deserialize', error.message, values);
      return Diretoria.new(true);
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('Diretoria.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(Diretoria.new(), [
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new Empresa(); }
  static fill(values: Empresa, init = false) { return CutUndef(FillClassProps(Empresa.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(Empresa.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Empresa.deserialize', error.message, values);
      return Empresa.new(true);
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('Empresa.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(Empresa.new(), [
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new FuncaoTerceiro(); }
  static fill(values: FuncaoTerceiro, init = false) { return CutUndef(FillClassProps(FuncaoTerceiro.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(FuncaoTerceiro.new(), {
        ...ignoreMongoProps(values),
      });
    } catch (error) {
      dbgError('FuncaoTerceiros.deserialize', error.message, values);
      return FuncaoTerceiro.new(true);
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('FuncaoTerceiros.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    return FldsCsvAll(FuncaoTerceiro.new());
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new Gerencia(); }
  static fill(values: Gerencia, init = false) { return CutUndef(FillClassProps(Gerencia.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(Gerencia.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Gerencia.deserialize', error.message, values);
      return Gerencia.new(true);
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('Gerencia.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(Gerencia.new(), [
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new Localidade(); }
  static fill(values: Localidade, init = false) { return CutUndef(FillClassProps(Localidade.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(Localidade.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Localidade.deserialize', error.message, values);
      return Localidade.new(true);
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('Localidade.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(Localidade.new(), [
      new FldCsvDef('searchTerms', { suppressColumn: true, def: (data: IGenericObject) => Localidade.SearchTermsGen(data) }),
      new FldCsvDef('created', { down: (data: Localidade) => DateToStrISO(data.created), up: (data: IGenericObject) => DateFromStrISO(data.created) || agora, def: () => new Date() }),
      new FldCsvDef('lastUpdated', { down: (data: Localidade) => DateToStrISO(data.lastUpdated), up: (data: IGenericObject) => DateFromStrISO(data.lastUpdated) || agora, def: () => new Date() }),
    ]);
  }
}
export class UnidadeNegocio {
  _id?: ObjectId;
  cod?: string;
  descr?: string;
  categRegional?: CategRegional;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new UnidadeNegocio(); }
  static fill(values: UnidadeNegocio, init = false) { return CutUndef(FillClassProps(UnidadeNegocio.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(UnidadeNegocio.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('UnidadeNegocio.deserialize', error.message, values);
      return UnidadeNegocio.new(true);
    }
  }
  toCsv?() {
    const entity = this;
    try {
      return { cod: entity.cod, descr: entity.descr };
    } catch (error) {
      dbgError('UnidadeNegocio.toCsv', error.message, entity);
      return null;
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(UnidadeNegocio.new(), [
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
  fatorCusto?: string;
  descr?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new FatorCusto(); }
  static fill(values: FatorCusto, init = false) { return CutUndef(FillClassProps(FatorCusto.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(FatorCusto.new(), {
        ...ignoreMongoProps(values),
      });
    } catch (error) {
      dbgError('FatorCusto.deserialize', error.message, values);
      return FatorCusto.new(true);
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(FatorCusto.new(), []);
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
  classeCusto?: string;
  descr?: string;
  fatorCusto?: string;
  origem?: OrigemClasseCusto;
  seqApresent?: number;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ClasseCusto(); }
  static fill(values: ClasseCusto, init = false) { return CutUndef(FillClassProps(ClasseCusto.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ClasseCusto.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('ClasseCusto.deserialize', error.message, values);
      return ClasseCusto.new(true);
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(ClasseCusto.new(), [
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
  static new(init?: boolean) {
    const obj = new ClasseCustoRestrita();
    if (init)
      obj.centroCustoArray = [];
    return obj;
  }
  static fill(values: ClasseCustoRestrita, init = false) { return CutUndef(FillClassProps(ClasseCustoRestrita.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ClasseCustoRestrita.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('ClasseCustoRestrita.deserialize', error.message, values);
      return ClasseCustoRestrita.new(true);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new Premissa(); }
  static fill(values: Premissa, init = false) { return CutUndef(FillClassProps(Premissa.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(Premissa.new(), {
        ...ignoreMongoProps(values),
      });
    } catch (error) {
      dbgError('Premissa.deserialize', error.message, values);
      return Premissa.new(true);
    }
  }
  static get fldsCsvDefUpload() {
    return FldsCsvAll(Premissa.new(), [
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ValoresPremissa(); }
  static fill(values: ValoresPremissa, init = false) { return CutUndef(FillClassProps(ValoresPremissa.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ValoresPremissa.new(), {
        ...ignoreMongoProps(values),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('ValoresPremissa.deserialize', error.message, values);
      return ValoresPremissa.new(true);
    }
  }
  static get fldsCsvDefUpload() {
    const maxDecimals = 4;
    const agora = new Date();
    return FldsCsvAll(ValoresPremissa.new(), [
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ValoresLocalidade(); }
  static fill(values: ValoresLocalidade, init = false) { return CutUndef(FillClassProps(ValoresLocalidade.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ValoresLocalidade.new(), {
        ...ignoreMongoProps(values),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('ValoresLocalid.deserialize', error.message, values);
      return ValoresLocalidade.new(true);
    }
  }
  static get fldsCsvDefUpload() {
    const maxDecimals = 2;
    const agora = new Date();
    return FldsCsvAll(ValoresLocalidade.new(), [
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ValoresTransfer(); }
  static fill(values: ValoresTransfer, init = false) { return CutUndef(FillClassProps(ValoresTransfer.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ValoresTransfer.new(), {
        ...ignoreMongoProps(values),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('ValoresTransfer.deserialize', error.message, values);
      return ValoresTransfer.new(true);
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(ValoresTransfer.new(), [
      new FldCsvDef('revisao', { def: () => RevisaoValor.atual }),
      new FldCsvDef('valMeses', {
        suppressColumn: true,
        def: (data: IGenericObject) => [
          amountParse(data.m01, configCydag.decimalsValsInput), amountParse(data.m02, configCydag.decimalsValsInput), amountParse(data.m03, configCydag.decimalsValsInput), amountParse(data.m04, configCydag.decimalsValsInput),
          amountParse(data.m05, configCydag.decimalsValsInput), amountParse(data.m06, configCydag.decimalsValsInput), amountParse(data.m07, configCydag.decimalsValsInput), amountParse(data.m08, configCydag.decimalsValsInput),
          amountParse(data.m09, configCydag.decimalsValsInput), amountParse(data.m10, configCydag.decimalsValsInput), amountParse(data.m11, configCydag.decimalsValsInput), amountParse(data.m12, configCydag.decimalsValsInput),
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ValoresImputados(); }
  static fill(values: ValoresImputados, init = false) { return CutUndef(FillClassProps(ValoresImputados.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ValoresImputados.new(), {
        ...ignoreMongoProps(values),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('ValoresImputados.deserialize', error.message, values);
      return ValoresImputados.new(true);
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(ValoresImputados.new(),
      [
        new FldCsvDef('revisao', { def: () => RevisaoValor.atual }),
        new FldCsvDef('valMeses', {
          suppressColumn: true,
          def: (data: IGenericObject) => [
            amountParse(data.m01, configCydag.decimalsValsInput), amountParse(data.m02, configCydag.decimalsValsInput), amountParse(data.m03, configCydag.decimalsValsInput), amountParse(data.m04, configCydag.decimalsValsInput),
            amountParse(data.m05, configCydag.decimalsValsInput), amountParse(data.m06, configCydag.decimalsValsInput), amountParse(data.m07, configCydag.decimalsValsInput), amountParse(data.m08, configCydag.decimalsValsInput),
            amountParse(data.m09, configCydag.decimalsValsInput), amountParse(data.m10, configCydag.decimalsValsInput), amountParse(data.m11, configCydag.decimalsValsInput), amountParse(data.m12, configCydag.decimalsValsInput),
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ValoresPlanejadosCalc(); }
  static fill(values: ValoresPlanejadosCalc, init = false) { return CutUndef(FillClassProps(ValoresPlanejadosCalc.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ValoresPlanejadosCalc.new(), {
        ...ignoreMongoProps(values),
      });
    } catch (error) {
      dbgError('ValoresPlanejadosCalc.deserialize', error.message, values);
      return ValoresPlanejadosCalc.new(true);
    }
  }
}
export class ValoresPlanejadosHistorico {
  _id?: ObjectId;
  ano?: string;
  centroCusto?: string;
  classeCusto?: string;
  valMeses?: number[];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ValoresPlanejadosHistorico(); }
  static fill(values: ValoresPlanejadosHistorico, init = false) { return CutUndef(FillClassProps(ValoresPlanejadosHistorico.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ValoresPlanejadosHistorico.new(), {
        ...ignoreMongoProps(values),
      });
    } catch (error) {
      dbgError('ValoresPlanejadosHistorico.deserialize', error.message, values);
      return ValoresPlanejadosHistorico.new(true);
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(ValoresPlanejadosHistorico.new(),
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new ValoresRealizados(); }
  static fill(values: ValoresRealizados, init = false) { return CutUndef(FillClassProps(ValoresRealizados.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ValoresRealizados.new(), {
        ...ignoreMongoProps(values),
      });
    } catch (error) {
      dbgError('ValoresRealizados.deserialize', error.message, values);
      return ValoresRealizados.new(true);
    }
  }
  static get fldsCsvDefUpload() {
    return FldsCsvAll(ValoresRealizados.new(),
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new FuncionarioRevisao(); }
  static fill(values: FuncionarioRevisao, init = false) { return CutUndef(FillClassProps(FuncionarioRevisao.new(init), values)); }
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new Funcionario(); }
  static fill(values: Funcionario, init = false) { return CutUndef(FillClassProps(Funcionario.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(Funcionario.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Funcionario.deserialize', error.message, values);
      return Funcionario.new(true);
    }
  }
  static scrambleSalario(salario: number, centroCusto: string, refer: string) {
    if (salario == null || centroCusto == null || refer == null)
      throw new ErrorPlus('salario, centroCusto e refer devem ser informados');
    if (isAmbDev())
      return salario.toString();
    else
      return Scramble(''.padStart(RandomNumber(1, 20), '0') + salario.toString(), { key: `${centroCusto}-${refer}`, withCrc: true });
  }
  static unscrambleSalario(valor_messy: string, centroCusto: string, refer: string) {
    if (valor_messy == null)
      return null;
    if (centroCusto == null || refer == null)
      throw new Error('centroCusto e refer devem ser informados');
    if (isAmbDev()) {
      let result = 0;
      if (valor_messy == null)
        dbgError('salario_messy (sem criptografia)', centroCusto, refer, valor_messy);
      else {
        try {
          result = StrToNumber(valor_messy, configCydag.decimalsSalario);
        }
        catch (error) {
          dbgError('salario (não numérico)', centroCusto, refer, valor_messy);
        }
      }
      return result;
    }
    else {
      const salStr = Unscramble(valor_messy, { key: `${centroCusto}-${refer}`, withCrc: true });
      let result = 0;
      if (salStr == null)
        dbgError('salario_messy (criptografia)', centroCusto, refer, valor_messy);
      else {
        try {
          result = StrToNumber(salStr, configCydag.decimalsSalario);
        }
        catch (error) {
          dbgError('salario desmascarado (não numérico)', centroCusto, refer, salStr);
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
      new FldCsvDef('salario_messy', { mandatoryValue: true, fldDisp: 'salarioBase', down: () => null, up: (data: IGenericObject) => Funcionario.scrambleSalario(amountParse(data.salarioBase, configCydag.decimalsSalario), data.centroCusto, data.cpf) }),
      new FldCsvDef('dependentes', { mandatoryValue: false, up: (data: IGenericObject) => StrToNumber(data.dependentes) }),
      new FldCsvDef('valeTransp', { mandatoryValue: false, up: (data: IGenericObject) => StrToNumber(data.valeTransp, configCydag.decimalsValsInput) }),
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
  ano?: string;
  revisao?: RevisaoValor;
  centroCusto?: string;
  tipoPlanejViagem?: TipoPlanejViagem;
  localidadeDestino?: string;
  funcId?: string;
  // estimativa anual, será distruído nos meses do processo orçamentário (12 a princípio)
  qtdViagens?: number;
  mediaPernoites?: number;
  obs?: string;
  valor?: number;
  created?: Date;
  lastUpdated?: Date;
  // static get F() {
  //   return {
  //     ano: 'ano' as 'ano',
  //     revisao: 'revisao' as 'revisao',
  //     centroCusto: 'centroCusto' as 'centroCusto',
  //   };
  // }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new Viagem(); }
  static fill(values: Viagem, init = false) { return CutUndef(FillClassProps(Viagem.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(Viagem.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Viagem.deserialize', error.message, values);
      return Viagem.new(true);
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(Viagem.new(), [
      // #!!!!!!! tipoPlanejViagem check
      new FldCsvDef('qtdViagens', { mandatoryValue: false, up: (data: IGenericObject) => StrToNumber(data.qtdViagens) }),
      new FldCsvDef('mediaPernoites', { mandatoryValue: false, up: (data: IGenericObject) => StrToNumber(data.mediaPernoites) }),
      new FldCsvDef('valor', { mandatoryValue: false, up: (data: IGenericObject) => StrToNumber(data.valor, 2) }),
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new Terceiro(); }
  static fill(values: Terceiro, init = false) { return CutUndef(FillClassProps(Terceiro.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(Terceiro.new(), {
        ...ignoreMongoProps(values),
        created: DateFromStrISO(values.created),
        lastUpdated: DateFromStrISO(values.lastUpdated),
      });
    } catch (error) {
      dbgError('Terceiro.deserialize', error.message, values);
      return Terceiro.new(true);
    }
  }
  static get fldsCsvDefUpload() {
    const agora = new Date();
    return FldsCsvAll(Terceiro.new(), [
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
  categ?: InterfaceSapCateg;
  dag_run_id?: string;
  started?: Date;
  lastChecked?: Date;
  status?: InterfaceSapStatus;
  pending?: boolean;
  info?: any; // ano, ultimo mes com valor, nr de registros
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new CtrlInterface(); }
  static fill(values: CtrlInterface, init = false) { return CutUndef(FillClassProps(CtrlInterface.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(CtrlInterface.new(), {
        ...ignoreMongoProps(values),
        started: DateFromStrISO(values.started),
        lastChecked: DateFromStrISO(values.lastChecked),
      });
    } catch (error) {
      dbgError('CtrlInterface.deserialize', error.message, values);
      return CtrlInterface.new(true);
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
