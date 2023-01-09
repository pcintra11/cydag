import _ from 'underscore';

import { mesesFld } from '../../../../appCydag/util';

enum CmdApi_ValoresTransfer {
  initialization = 'initialization',
  valoresGet = 'valoresGet',
  valoresSet = 'valoresSet',
}
export {
  CmdApi_ValoresTransfer,
};

export class DataEdit {
  valMeses: string[];
  constructor() {
    this.valMeses = new Array(mesesFld.length).fill('');
  }
}

export interface IChangedLine {
  key: { localidadeDestino: string };
  dataEdit: DataEdit;
}