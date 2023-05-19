import { mesesFld } from '../../../../appCydag/util';
import { csd } from '../../../../libCommon/dbg';

enum CmdApi_Terceiro {
  crudInitialization = 'crudInitialization',
  itensGet = 'itensGet',
  itensSet = 'itensSet',
  //upload = 'upload',
}
export {
  CmdApi_Terceiro,
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
  nome: string;
  fornecedor: string;
  funcaoTerceiros: string;
  valMeses: string[];
  constructor() {
    this.valMeses = new Array(mesesFld.length).fill('');
  }
}

export interface IChangedLine {
  key: { refer: string };
  lineState: LineState;
  dataEdit: DataEdit;
}