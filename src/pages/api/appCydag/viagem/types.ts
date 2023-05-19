import { csd } from '../../../../libCommon/dbg';
import { CutUndef, FillClassProps } from '../../../../libCommon/util';

import { TipoPlanejViagem } from '../../../../appCydag/types';

enum CmdApi_Viagem {
  crudInitialization = 'crudInitialization',
  itensGet = 'itensGet',
  itensSet = 'itensSet',
  //upload = 'upload',
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

export class DataEdit {
  tipoPlanejViagem?: TipoPlanejViagem;
  localidadeDestino?: string;
  funcId?: string;
  qtdViagens?: string;
  mediaPernoites?: string;
  obs?: string;
  valor?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new DataEdit(); }
  static fill(values: DataEdit, init = false) { return CutUndef(FillClassProps(DataEdit.new(init), values)); }
}
export interface IChangedLine {
  //key: { tipoPlanejViagem: TipoPlanejViagem; localidadeDestino?: string; funcId?: string; _id?: string };
  key: { _id?: string };
  lineState: LineState;
  dataEdit: DataEdit;
}