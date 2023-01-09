import _ from 'underscore';

import { dbgError } from '../../../../libCommon/dbg';
import { IGenericObject } from '../../../../libCommon/types';

enum CmdApi_ValoresContas {
  quadroInitialization = 'quadroInitialization',
  quadroConsValoresGet = 'quadroConsValoresGet',
  quadroImputItensGet = 'quadroImputItensGet',
  quadroImputItensSet = 'quadroImputItensSet',

  importRealizadoStart = 'importRealizadoStart',
  importRealizadoCheck = 'importRealizadoCheck',

  exportPlanejValoresGet = 'exportPlanejValoresGet',
  exportRealPlanValoresGet = 'exportRealPlanValoresGet',

  analiseAnualCentroCustoInitialization = 'analiseAnualCentroCustoInitialization',
  analiseAnualControladoriaInitialization = 'analiseAnualControladoriaInitialization',
  comparativoAnualControladoriaInitialization = 'comparativoAnualControladoriaInitialization',

  analiseAnualCentroCustoValoresGet = 'analiseAnualCentroCustoValoresGet',
  analiseAnualControladoriaValoresGet = 'analiseAnualControladoriaValoresGet',
  comparativoAnualControladoriaValoresGet = 'comparativoAnualControladoriaValoresGet',
}
export {
  CmdApi_ValoresContas,
};

export interface IChangedLine { 
  key: IGenericObject;
  descr: string;  // #!!!!!! usar o novo protocolo
  valMeses: number[];
} // apenas se diferente de undefined é considerado como uma nova informação