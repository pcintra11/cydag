import { IGenericObject } from '../../../../libCommon/types';

enum CmdApi_PremissaGeral {
  initialization = 'initialization',
  valoresGet = 'valoresGet',
  valoresSet = 'valoresSet',
}
export {
  CmdApi_PremissaGeral,
};

export interface IChangedLine {
  key: IGenericObject;
  ativa: boolean; // #!!!!! usar o novo protocolo !
  valMeses: number[];
}