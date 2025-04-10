import { IGenericObject } from '../../../../libCommon/types';

export const colUploadCmd = 'cmd(incluir/excluir)';
enum CmdApi_ValoresContas {
  quadroInitialization = 'quadroInitialization',
  quadroConsValoresGet = 'quadroConsValoresGet',
  quadroInputItensGet = 'quadroInputItensGet',
  quadroInputItensSet = 'quadroInputItensSet',

  importRealizadoStart = 'importRealizadoStart',
  importRealizadoCheck = 'importRealizadoCheck',
  importRealizadoDireto = 'importRealizadoDireto', // apenas carrega da tabela de interface, sem interagir com a API do datalake nem limpar a interface

  entityDesprDownload = 'entityDesprDownload',
  entityDesprUpload = 'entityDesprUpload',

  exportPlanejValoresGet = 'exportPlanejValoresGet',
  exportRealPlanValoresGet = 'exportRealPlanValoresGet',
  getProcsOrcCCsAuthQuadroCons = 'getProcsOrcCCsAuthQuadroCons',

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