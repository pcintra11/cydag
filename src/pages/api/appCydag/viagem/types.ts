import { csd, dbgError } from '../../../../libCommon/dbg';
import { IGenericObject } from '../../../../libCommon/types';
import { CutUndef, FillClassProps } from '../../../../libCommon/util';

import { TipoPlanejViagem } from '../../../../appCydag/types';

enum CmdApi_Viagem {
  crudInitialization = 'crudInitialization',
  itensGet = 'itensGet',
  itensSet = 'itensSet',
  //upload = 'upload',
  exportInitialization = 'exportInitialization',
  export = 'export',
}
export {
  CmdApi_Viagem,
};

export enum LineState {
  original = 'original',
  inserted = 'inserted',
  updated = 'updated',
  deleted = 'deleted',
  reserved = 'reserved',
  aborted = 'aborted',
}

export class ViagemClient {
  centroCusto?: string;
  tipoPlanejViagem?: TipoPlanejViagem;
  localidadeDestino?: string;
  funcId?: string;
  qtdViagens?: number;
  mediaPernoites?: number;
  obs?: string;
  valor?: number;
  static new() { return new ViagemClient(); }
  static fill(values: ViagemClient) { return CutUndef(FillClassProps(ViagemClient.new(), values)); }
  static deserialize(values: IGenericObject) {
    try {
      return FillClassProps(ViagemClient.new(), values);
    } catch (error) {
      dbgError('ViagemClient.deserialize', error.message, values);
      return ViagemClient.new();
    }
  }
}

export class DataEdit {
  tipoPlanejViagem?: TipoPlanejViagem;
  localidadeDestino?: string;
  funcId?: string;
  qtdViagens?: string;
  mediaPernoites?: string;
  obs?: string;
  valor?: string;
  static new() { return new DataEdit(); }
  static fill(values: DataEdit) { return CutUndef(FillClassProps(DataEdit.new(), values)); }
}
export interface IChangedLine {
  //key: { tipoPlanejViagem: TipoPlanejViagem; localidadeDestino?: string; funcId?: string; _id?: string };
  key: { _id?: string };
  lineState: LineState;
  dataEdit: DataEdit;
}