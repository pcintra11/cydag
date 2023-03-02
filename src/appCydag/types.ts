import { ObjectId } from 'mongodb';

import { csd, dbgError } from '../libCommon/dbg';
import { ErrorPlus, FillClass } from '../libCommon/util';
import { IGenericObject } from '../libCommon/types';
import { FldCsvDef, FldsCsvAll } from '../libCommon/uploadCsv';

import { configApp } from './config';
import { amountParse, mesesFld, sumRound } from './util';

class EnumMd<T> {
  cod: T;
  descr: string;
  plus: any;
  constructor(cod?: T, descr?: string, plus?: any) {
    this.cod = cod;
    this.descr = descr;
    this.plus = plus;
  }
}

//#region RevisaoValor
export enum RevisaoValor {
  atual = 'a',
  anterior = 'e',
  inicial = 'i',
}
export class RevisaoValorMd {
  static get Name() { return 'Revisão'; }
  static get all() {
    return [
      new EnumMd(RevisaoValor.atual, 'Atual'),
      new EnumMd(RevisaoValor.anterior, 'Anterior'),
      new EnumMd(RevisaoValor.inicial, 'Inicial'),
    ];
  }
  static descr(cod: RevisaoValor) {
    if (cod == null) return '';
    const item = RevisaoValorMd.all.find((x) => x.cod === cod);
    return item != null ? item.descr : `cod ${cod}`;
  }
  static codeFromStr(str: string) {
    if (!Object.values(RevisaoValor).includes(str as RevisaoValor)) throw new Error('valor inválido');
    const value = str as RevisaoValor;
    return value;
  }
}
//#endregion

//#region ProcessoOrcamentarioStatus
export enum ProcessoOrcamentarioStatus {
  preparacao = '1',
  inputPlanej = '2',
  bloqueado = '3',
  preCalculado = '4',
  encerrado = '5',
  // Aberta, Bloqueada, bloqueada e Calculada, bloqueada e consoliDada, Encerrada */
}
export enum OperInProcessoOrcamentario {
  cargaFunc,
  altPremissas,
  altConfigCCs,
  altValoresPlanejados,
}
export class ProcessoOrcamentarioStatusMd {
  static get all() {
    return [
      new EnumMd(ProcessoOrcamentarioStatus.preparacao, 'Preparação'),
      new EnumMd(ProcessoOrcamentarioStatus.inputPlanej, 'Input Planej.'),
      new EnumMd(ProcessoOrcamentarioStatus.bloqueado, 'Bloqueado'),
      new EnumMd(ProcessoOrcamentarioStatus.preCalculado, 'Pré Calculado'),
      new EnumMd(ProcessoOrcamentarioStatus.encerrado, 'Encerrado'),
    ];
  }
  static descr(cod: ProcessoOrcamentarioStatus) {
    if (cod == null) return '';
    const item = ProcessoOrcamentarioStatusMd.all.find((x) => x.cod === cod);
    return item != null ? item.descr : `cod ${cod}`;
  }
  static blockOper(oper: OperInProcessoOrcamentario, status: ProcessoOrcamentarioStatus) {
    if (oper === OperInProcessoOrcamentario.cargaFunc) {
      if (status !== ProcessoOrcamentarioStatus.preparacao) return 'O status atual do Processo Orçamentário não permite carga de funcionários';
    }
    else if (oper === OperInProcessoOrcamentario.altPremissas) {
      if (status > ProcessoOrcamentarioStatus.bloqueado) return 'O status atual do Processo Orçamentário não permite alteração em premissas';
    }
    else if (oper === OperInProcessoOrcamentario.altConfigCCs) {
      // if (status > ProcessoOrcamentarioStatus.bloqueado) return 'O status atual do Processo Orçamentário não permite ajustes na Configuração de Centros de Custo';
    }
    else if (oper === OperInProcessoOrcamentario.altValoresPlanejados) {
      if (status !== ProcessoOrcamentarioStatus.inputPlanej) return 'O status atual do Processo Orçamentário não permite alteração nos valores planejados';
    }
    else
      return `oper '${oper}' inválida`;
    return null;
  }
  static checkOperAllowed(oper: OperInProcessoOrcamentario, status: ProcessoOrcamentarioStatus) {
    const blockOper = ProcessoOrcamentarioStatusMd.blockOper(oper, status);
    if (blockOper != null) throw new ErrorPlus(blockOper);
  }
}
//#endregion

//#region OrigemClasseCusto
export enum OrigemClasseCusto {
  calculada = 'c',
  inputada = 'i', // classeCusto OU subClasseCusto (código < '30')
  //detalhada = 'd', // apenas em subClasseCusto dinâmicas (código >= '30') ???
  totalImputada = 't', // apenas em classeCusto (gera subClasses dinâmicas código >= '30')
  totalCalculada = 'k', // apenas em classeCusto (gera subClasses dinâmicas código < '30')
}
export class OrigemClasseCustoMd {
  static get all() {
    return [
      new EnumMd(OrigemClasseCusto.inputada, 'inf'),
      new EnumMd(OrigemClasseCusto.totalImputada, 'tot(inf)'),
      new EnumMd(OrigemClasseCusto.calculada, 'calc'),
      new EnumMd(OrigemClasseCusto.totalCalculada, 'tot(calc)'),
    ];
  }
  static descr(cod: OrigemClasseCusto) {
    if (cod == null) return '';
    const item = OrigemClasseCustoMd.all.find((x) => x.cod === cod);
    return item != null ? item.descr : `cod ${cod}`;
  }
}
//#endregion

//#region TipoSegmCentroCusto
export enum TipoSegmCentroCusto {
  empresa = 'e',
  agrupPremissas = 'a',
}
export class TipoSegmCentroCustoMd {
  static codeFromStr(str: string) {
    if (!Object.values(TipoSegmCentroCusto).includes(str as TipoSegmCentroCusto)) throw new Error('valor inválido');
    const value = str as TipoSegmCentroCusto;
    return value;
  }
}
//#endregion

//#region TipoPlanejViagem
export enum TipoPlanejViagem {
  porPremissa = 'p',
  porValor = 'v',
}
//#endregion

//#region TipoParticipPerOrcam
export enum TipoParticipPerOrcam {
  adm = 'a',
  desl = 'd',
  quadro = 'q',
  transf = 't',
}
export class TipoParticipPerOrcamMd {
  static get all() {
    return [
      new EnumMd(TipoParticipPerOrcam.quadro, 'Quadro', { ini: true }),
      new EnumMd(TipoParticipPerOrcam.adm, 'Adm.', { ini: true }),
      new EnumMd(TipoParticipPerOrcam.desl, 'Desl.', { fim: true }),
      new EnumMd(TipoParticipPerOrcam.transf, 'Transf.', { ini: true, fim: true }),
    ];
  }
  static descr(cod: TipoParticipPerOrcam) {
    if (cod == null) return '';
    const item = TipoParticipPerOrcamMd.all.find((x) => x.cod === cod);
    return item != null ? item.descr : `cod ${cod}`;
  }
  static codeFromStr(str: string) {
    if (!Object.values(TipoParticipPerOrcam).includes(str as TipoParticipPerOrcam)) throw new Error('valor inválido');
    const value = str as TipoParticipPerOrcam;
    return value;
  }
}
//#endregion

//#region OrigemFunc
export enum OrigemFunc {
  legado = '1',
  local = '2',
  //terceiro = '3',
}
export class OrigemFuncMd {
  static get all() {
    return [
      new EnumMd(OrigemFunc.legado, 'Legado'),
      new EnumMd(OrigemFunc.local, 'Local'),
      //new EnumMd(OrigemFunc.terceiro, 'Terc.'),
    ];
  }
  static descr(cod: OrigemFunc) {
    if (cod == null) return '';
    const item = OrigemFuncMd.all.find((x) => x.cod === cod);
    return item != null ? item.descr : `cod ${cod}`;
  }
}
//#endregion

//#region TipoColaborador
export enum TipoColaborador {
  clt = '1',
  aprendiz = '2',
  estag = '3',
  gestorpj = '4',
  dir = '5',
  dir_clt = '6',
  dir_pj = '7',
  terc = '8',
}
export class TipoColaboradorMd {
  static get all() {
    return [
      new EnumMd(TipoColaborador.clt, 'Clt', { calcINSS: true }),
      new EnumMd(TipoColaborador.aprendiz, 'Aprendiz', { calcINSS: true }),
      new EnumMd(TipoColaborador.estag, 'Estag.', { calcINSS: true }),
      new EnumMd(TipoColaborador.gestorpj, 'Gestor (PJ)', { calcINSS: true }),
      new EnumMd(TipoColaborador.dir, 'Diretor', { calcINSSHonorarios: true }),
      new EnumMd(TipoColaborador.dir_clt, 'Dir. (CLT)', { calcINSS: true }),
      new EnumMd(TipoColaborador.dir_pj, 'Dir. (PJ)', { calcINSS: true }),
      new EnumMd(TipoColaborador.terc, 'Prest. Serv.', { calcINSS: true }),
    ];
  }
  static descr(cod: TipoColaborador) {
    if (cod == null) return '';
    const item = TipoColaboradorMd.all.find((x) => x.cod === cod);
    return item != null ? item.descr : `cod ${cod}`;
  }
  static codeFromStr(str: string) {
    if (!Object.values(TipoColaborador).includes(str as TipoColaborador)) throw new Error('valor inválido');
    const value = str as TipoColaborador;
    return value;
  }
}
//#endregion

//#region CategRegional
export enum CategRegional {
  principais = 'p',
  outras = 'o',
}
export class CategRegionalMd {
  static get all() {
    return [
      new EnumMd(CategRegional.principais, 'Regionais Principais'),
      new EnumMd(CategRegional.outras, 'Outras Regionais'),
    ];
  }
  static descr(cod: CategRegional) {
    if (cod == null) return '';
    const item = CategRegionalMd.all.find((x) => x.cod === cod);
    return item != null ? item.descr : `cod ${cod}`;
  }
  static codeFromStr(str: string) {
    if (!Object.values(CategRegional).includes(str as CategRegional)) throw new Error('valor inválido');
    const value = str as CategRegional;
    return value;
  }
}
//#endregion

//#region InterfaceSap
export enum InterfaceSapCateg {
  importReal = 'importReal',
}
export enum InterfaceSapStatus {
  queued = 'queued',
  failed = 'failed',
  running = 'running',
  success = 'success',
}
//#endregion

//#region classes usadas com frequência em várias páginas
export class CentroCustoConfig {
  centroCusto: string;
  planejamentoEmAberto: boolean;
  emailResponsavel: string;
  emailPlanejador: string;
  emailConsulta: string[];
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
}
export class ProcCentrosCustoConfig {
  _id?: ObjectId;
  ano?: string;
  status?: ProcessoOrcamentarioStatus;
  centroCustoConfig?: CentroCustoConfig[];
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ProcCentrosCustoConfig().Fill({
        ...values,
        centroCustoConfig: values.centroCustoConfig.map((x) => new CentroCustoConfig().Fill(x)),
      });
    } catch (error) {
      dbgError('Erro em ProcsCentrosCustoConfig.deserialize', error.message, values);
      return new ProcCentrosCustoConfig();
    }
  }
}

export class CentroCustoConfigOption {
  cod?: string;
  descr?: string;
  ccConfig?: CentroCustoConfig;
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
}
export interface IAnoCentroCustos { ano: string, centroCustoConfigOptions: CentroCustoConfigOption[] }

export class ColValsAnaliseAnual {
  planTot: number;
  planComplReal: number;
  planYTD: number;
  planMes: number;
  realYTD: number;
  realMes: number;
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static ValsReset() {
    return new ColValsAnaliseAnual().Fill({
      planTot: 0,
      planComplReal: 0,
      planYTD: 0,
      planMes: 0,
      realYTD: 0,
      realMes: 0,
    });
  }
  static sumVals(valsTrg: ColValsAnaliseAnual, valsAdd: ColValsAnaliseAnual) {
    valsTrg.planTot = sumRound(valsTrg.planTot, valsAdd.planTot);
    valsTrg.planComplReal = sumRound(valsTrg.planComplReal, valsAdd.planComplReal);
    valsTrg.planYTD = sumRound(valsTrg.planYTD, valsAdd.planYTD);
    valsTrg.planMes = sumRound(valsTrg.planMes, valsAdd.planMes);
    valsTrg.realYTD = sumRound(valsTrg.realYTD, valsAdd.realYTD);
    valsTrg.realMes = sumRound(valsTrg.realMes, valsAdd.realMes);
  }
}
export class ValoresAnaliseAnual extends ColValsAnaliseAnual {
  centroCusto?: string;
  categRegional?: CategRegional;
  unidadeNegocio?: string;
  diretoria?: string;
  fatorCusto?: string;
  classeCusto?: string;
  static get F() {
    return {
      ano: 'ano' as 'ano',
      mes: 'mes' as 'mes',
      centroCustoArray: 'centroCustoArray' as 'centroCustoArray',
    };
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ValoresAnaliseAnual().Fill(values);
    } catch (error) {
      dbgError('Erro em ValoresAnaliseAnual.deserialize', error.message, values);
      return new ValoresAnaliseAnual();
    }
  }
  vals() {
    return new ColValsAnaliseAnual().Fill(this);
  }
}
export class ValoresAnaliseRealPlan  {
  centroCusto?: string;
  classeCusto?: string;
  valMesesReal?: number[];
  valMesesPlan?: number[];
  static get F() {
    return {
      ano: 'ano' as 'ano',
      centroCustoArray: 'centroCustoArray' as 'centroCustoArray',
    };
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ValoresAnaliseRealPlan().Fill(values);
    } catch (error) {
      dbgError('Erro em ValoresAnaliseRealPlan.deserialize', error.message, values);
      return new ValoresAnaliseRealPlan();
    }
  }
}

export class ColValsComparativoAnual {
  planAnt: number;
  planAtu: number;
  realAnt: number;
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static ValsReset() {
    return new ColValsComparativoAnual().Fill({
      planAnt: 0,
      planAtu: 0,
      realAnt: 0,
    });
  }
  static sumVals(valsTrg: ColValsComparativoAnual, valsAdd: ColValsComparativoAnual) {
    valsTrg.planAnt = sumRound(valsTrg.planAnt, valsAdd.planAnt);
    valsTrg.planAtu = sumRound(valsTrg.planAtu, valsAdd.planAtu);
    valsTrg.realAnt = sumRound(valsTrg.realAnt, valsAdd.realAnt);
  }
}
export class ValoresComparativoAnual extends ColValsComparativoAnual {
  centroCusto?: string;
  categRegional?: CategRegional;
  unidadeNegocio?: string;
  diretoria?: string;
  fatorCusto?: string;
  classeCusto?: string;
  static get F() {
    return {
      ano: 'ano' as 'ano',
    };
  }
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ValoresComparativoAnual().Fill(values);
    } catch (error) {
      dbgError('Erro em ValoresComparativoAnual.deserialize', error.message, values);
      return new ValoresComparativoAnual();
    }
  }
  vals() {
    return new ColValsComparativoAnual().Fill(this);
  }
}


export class ValoresPlanejadosDetalhes {
  centroCusto?: string;
  classeCusto?: string;
  idDetalhe?: string;
  descr?: string;
  valMeses?: number[];
  constructor() {
    this.valMeses = new Array(mesesFld.length).fill(undefined);
  }
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
      return new ValoresPlanejadosDetalhes().Fill(values);
    } catch (error) {
      dbgError('Erro em ValoresPlanejadosDetalhes.deserialize', error.message, values);
      return new ValoresPlanejadosDetalhes();
    }
  }
  static get fldsCsvDefUpload() {
    return FldsCsvAll(new ValoresPlanejadosDetalhes(),
      [
        new FldCsvDef('valMeses', {
          suppressColumn: true,
          def: (data: IGenericObject) => [
            amountParse(data.m01, configApp.decimalsValsCalc), amountParse(data.m02, configApp.decimalsValsCalc), amountParse(data.m03, configApp.decimalsValsCalc), amountParse(data.m04, configApp.decimalsValsCalc),
            amountParse(data.m05, configApp.decimalsValsCalc), amountParse(data.m06, configApp.decimalsValsCalc), amountParse(data.m07, configApp.decimalsValsCalc), amountParse(data.m08, configApp.decimalsValsCalc),
            amountParse(data.m09, configApp.decimalsValsCalc), amountParse(data.m10, configApp.decimalsValsCalc), amountParse(data.m11, configApp.decimalsValsCalc), amountParse(data.m12, configApp.decimalsValsCalc),
          ]
        }),
      ]);
  }
}

export class ValoresTotCentroCustoClasseCusto {
  centroCusto?: string;
  classeCusto?: string;
  tot?: number;
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new ValoresTotCentroCustoClasseCusto().Fill(values);
    } catch (error) {
      dbgError('Erro em ValoresTotCentroCustoClasseCusto.deserialize', error.message, values);
      return new ValoresTotCentroCustoClasseCusto();
    }
  }
}
//#endregion
