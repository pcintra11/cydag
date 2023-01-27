import { isAmbDev } from '../libCommon/isAmb';

export const configApp = {
  forceWaitMinimumMs: 500,
  maximumSearchResult: 200,
  csvTextNoData: '* nenhum dado *',
  csvDelimiter: ';',
  csvStrForNull: '(vazio)',
  csvColumnCmd: 'cmd(incluir/alterar/excluir)',
  decimalsSalario: 2,
  decimalsValsInput: 0,
  decimalsValsCalc: 2,
  decimalsValsCons: 0,
};

export enum UploadCsvCmd {
  add = 'incluir',
  upd = 'alterar',
  del = 'excluir',
}

export const classeCustoPessoalArray = [  // #!!!!!! deve ir para o MD !!!!
  '5200201001',
  '5200201002',
  '5200201003',
  '5200202001',
  '5200202002',
  '5200203001',
  '5200203002',
  '5200204001',
  '5200204002',
  '5200205001',
  '5200205002',
  '5200206003',
  '5200206050',
  '5200207001',
  '5200207002',
  '5200208001',
  '5200208002',
  '5200208003',
  '5200208004',
  '5200208005',
  '5200208007',
  '5200208008',
  '5200208009',
  '5200208011',
  '5200208012',
  '5200208013',
  '5200502008',
  '5200504030',
]; 

//#region tokens para links por email e call back ao sistema
export const linkEmailExpirationMinutes = () => {
  const minutes = isAmbDev() ? (30) : (24 * 60);
  return minutes;
};
export enum TokenType {
  resetPsw = 'resetPswTk',
}
