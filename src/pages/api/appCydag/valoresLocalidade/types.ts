import _ from 'underscore';

import { mesesFld } from '../../../../appCydag/util';

enum CmdApi_ValoresLocalidade {
  initialization = 'initialization',
  valoresGet = 'valoresGet',
  valoresSet = 'valoresSet',
}
export {
  CmdApi_ValoresLocalidade,
};

export class DataEdit {
  valMeses: string[];
  constructor() {
    this.valMeses = new Array(mesesFld.length).fill('');
  }
}

export interface IChangedLine {
  key: { localidade: string };
  dataEdit: DataEdit;
}