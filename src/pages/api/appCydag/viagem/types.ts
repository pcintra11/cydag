import { csd, dbgError } from '../../../../libCommon/dbg';
import { FillClass } from '../../../../libCommon/util';

import { TipoPlanejViagem } from '../../../../appCydag/types';
import { IGenericObject } from '../../../../libCommon/types';

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
  tipoPlanejViagem: TipoPlanejViagem;
  localidadeDestino: string;
  funcId: string;
  qtdViagens: string;
  mediaPernoites: string;
  obs: string;
  valor: string;
  Fill?(values: IGenericObject) { FillClass(this, values); return this; }
}
export interface IChangedLine {
  //key: { tipoPlanejViagem: TipoPlanejViagem; localidadeDestino?: string; funcId?: string; _id?: string };
  key: { _id?: string };
  lineState: LineState;
  dataEdit: DataEdit;
}