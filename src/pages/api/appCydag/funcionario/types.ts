import { OrigemFunc, TipoColaborador, TipoParticipPerOrcam } from '../../../../appCydag/types';
import { csd, dbgError } from '../../../../libCommon/dbg';
import { IGenericObject } from '../../../../libCommon/types';
import { CutUndef, FillClassProps } from '../../../../libCommon/util';

enum CmdApi_Funcionario {
  crudInitialization = 'crudInitialization',
  itensGet = 'itensGet',
  itensSet = 'itensSet',
  upload = 'upload',
  exportFuncionarios = 'exportFuncionarios',
  getProcsOrcCCsAuthFuncionarios = 'getProcsOrcCCsAuthFuncionarios',
}
export {
  CmdApi_Funcionario,
  //CmdApi_Funcionario as CmdApi_Crud,
};

export enum LineState {
  original = 'original',
  inserted = 'inserted',
  updated = 'updated',
  deleted = 'deleted',
  reserved = 'reserved',
  aborted = 'aborted',
}

export class FuncionarioClient {
  centroCusto?: string;
  origem?: OrigemFunc;
  refer?: string;
  nome?: string;
  idVaga?: string;
  tipoColaborador?: TipoColaborador;
  funcao?: string;
  salarioLegado?: number;

  ativo?: boolean;
  tipoIni?: TipoParticipPerOrcam;
  mesIni?: number;
  tipoFim?: TipoParticipPerOrcam;
  mesFim?: number;
  salario?: number;
  dependentes?: number;
  valeTransp?: number;
  mesPromo?: number;
  tipoColaboradorPromo?: TipoColaborador;
  salarioPromo?: number;
  despsRecorr?: string[];
  constructor() {
    this.ativo = true;
    this.despsRecorr = [];
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new FuncionarioClient(); }
  static fill(values: FuncionarioClient, init = false) { return CutUndef(FillClassProps(FuncionarioClient.new(init), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(FuncionarioClient.new(), values);
    } catch (error) {
      dbgError('FuncionarioClient.deserialize', error.message, values);
      return FuncionarioClient.new(true);
    }
  }
}
export class DataEdit {
  nome?: string;
  idVaga?: string;
  tipoColaborador?: TipoColaborador;
  funcao?: string;

  ativo?: boolean;
  tipoIni?: TipoParticipPerOrcam;
  mesIni?: string;
  tipoFim?: TipoParticipPerOrcam;
  mesFim?: string;
  salario?: string;
  dependentes?: string;
  valeTransp?: string;
  mesPromo?: string;
  tipoColaboradorPromo?: TipoColaborador;
  salarioPromo?: string;
  despsRecorr?: string[];
  constructor() {
    this.despsRecorr = [];
  }
  static check(values: DataEdit) {
    if (values.tipoIni == null || values.mesIni == null)
      throw new Error('Informe o período inicial de forma completa (tipo e mês)');
    if (!((values.tipoFim == null && values.mesFim == null) ||
      (values.tipoFim != null && values.mesFim != null)))
      throw new Error('Período final deve ser informado de forma correta (tipo e mês)');
    if (!((values.mesPromo == null && values.tipoColaboradorPromo == null && values.salarioPromo == null) ||
      (values.mesPromo != null && values.tipoColaboradorPromo != null && values.salarioPromo != null)))
      throw new Error('Promoção deve ser informada de forma correta (mês, tipo e salário)');
    if (Number(values.mesIni) < 1 || Number(values.mesIni) > 12)
      throw new Error('Mês inicial inválido');
    if (values.mesFim != null &&
      (Number(values.mesFim) < 1 || Number(values.mesFim) > 12))
      throw new Error('Mês final inválido');
    if (values.mesPromo != null &&
      (Number(values.mesPromo) < 1 || Number(values.mesPromo) > 12))
      throw new Error('Mês para promoção inválido');
    if (values.mesFim != null &&
      Number(values.mesFim) < Number(values.mesIni))
      throw new Error('Mês final incompatível com o mês inicial');
    if (values.mesPromo != null) {
      if (Number(values.mesPromo) < Number(values.mesIni))
        throw new Error('Mês para promoção incompatível com o mês inicial');
      if (values.mesFim != null &&
        Number(values.mesPromo) > Number(values.mesPromo))
        throw new Error('Mês para promoção incompatível com o mês final');
    }
  }
}

export interface IChangedLine {
  key: { origem: OrigemFunc, refer: string };
  lineState: LineState;
  dataEdit: DataEdit;
  fldsChanged: string[];
}