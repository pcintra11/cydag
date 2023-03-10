import { OrigemFunc, TipoColaborador, TipoParticipPerOrcam } from '../../../../appCydag/types';
import { csd, dbgError } from '../../../../libCommon/dbg';
import { IGenericObject } from '../../../../libCommon/types';
import { FillClass } from '../../../../libCommon/util';

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
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
  static deserialize(values: IGenericObject) {
    try {
      return new FuncionarioClient().Fill(values);
    } catch (error) {
      dbgError('Erro em FuncionarioClient.deserialize', error.message, values);
      return new FuncionarioClient();
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
      throw new Error('Informe o per??odo inicial de forma completa (tipo e m??s)');
    if (!((values.tipoFim == null && values.mesFim == null) ||
      (values.tipoFim != null && values.mesFim != null)))
      throw new Error('Per??odo final deve ser informado de forma correta (tipo e m??s)');
    if (!((values.mesPromo == null && values.tipoColaboradorPromo == null && values.salarioPromo == null) ||
      (values.mesPromo != null && values.tipoColaboradorPromo != null && values.salarioPromo != null)))
      throw new Error('Promo????o deve ser informada de forma correta (m??s, tipo e sal??rio)');
    if (Number(values.mesIni) < 1 || Number(values.mesIni) > 12)
      throw new Error('M??s inicial inv??lido');
    if (values.mesFim != null &&
      (Number(values.mesFim) < 1 || Number(values.mesFim) > 12))
      throw new Error('M??s final inv??lido');
    if (values.mesPromo != null &&
      (Number(values.mesPromo) < 1 || Number(values.mesPromo) > 12))
      throw new Error('M??s para promo????o inv??lido');
    if (values.mesFim != null &&
      Number(values.mesFim) < Number(values.mesIni))
      throw new Error('M??s final incompat??vel com o m??s inicial');
    if (values.mesPromo != null) {
      if (Number(values.mesPromo) < Number(values.mesIni))
        throw new Error('M??s para promo????o incompat??vel com o m??s inicial');
      if (values.mesFim != null &&
        Number(values.mesPromo) > Number(values.mesPromo))
        throw new Error('M??s para promo????o incompat??vel com o m??s final');
    }
  }
}

export interface IChangedLine {
  key: { origem: OrigemFunc, refer: string };
  lineState: LineState;
  dataEdit: DataEdit;
  fldsChanged: string[];
}