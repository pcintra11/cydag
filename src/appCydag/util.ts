import { Env } from '../libCommon/envs';
import { isAmbDev } from '../libCommon/isAmb';
import { AmountPtBrFormat, AmountPtBrParse, RoundDecs } from '../libCommon/util';

import { configApp } from './config';

export const mesesFld = [
  'jan', 'fev', 'mar', 'abr',
  'mai', 'jun', 'jul', 'ago',
  'set', 'out', 'nov', 'dez',
];
export const mesesHdr = [
  'Jan', 'Fev', 'Mar', 'Abr',
  'Mai', 'Jun', 'Jul', 'Ago',
  'Set', 'Out', 'Nov', 'Dez',
];

export const mesDefault = () => {
  const mesAtu = (new Date()).getMonth() + 1;
  if (mesAtu === 1) return undefined;
  else return mesAtu - 1;
};

/**
 * 
 * @returns Gera um array de 12 valores zerados
 */
export const genValMeses = (value: any) => { return mesesFld.reduce((prev) => [...prev, value], []); };

/**
 * Para dois arrays de valores de meses acumula em todos os meses
 * @param valMesesTrg 
 * @param valMesesAdd 
 */
export const sumValMeses = (valMesesTrg: number[], valMesesAdd: number[]) => {
  mesesFld.forEach((_, index) => { if (valMesesAdd[index] != null) valMesesTrg[index] = sumRound(valMesesTrg[index], valMesesAdd[index]); });
  return valMesesTrg;
};
export const multiplyValMeses = (valMesesTrg: number[], mult: number[]) => {
  mesesFld.forEach((_, index) => { if (mult[index] != null) valMesesTrg[index] = multiplyRound(valMesesTrg[index], mult[index]); });
  return valMesesTrg;
};

export const sumRound = (val1: number, val2: number) => {
  return RoundDecs(val1 + val2, configApp.decimalsValsCalc);
};
export const multiplyRound = (val: number, mult: number) => {
  return RoundDecs(val * mult, configApp.decimalsValsCalc);
};
export const roundInterface = (val: number | null) => {
  if (val == null) return null;
  else return RoundDecs(val, configApp.decimalsValsCalc);
};

export const amountToStr = (val: number, decimals: number) => {
  return AmountPtBrFormat(val, decimals);
};
export const percToStr = (val: number | null, decimals = 1) => {
  if (val == null)
    return '';
  return AmountPtBrFormat(val * 100, decimals) + '%';
};

export const amountParse = (valStr: string, decimals: number) => { //  = configApp.decimalsCalc
  return AmountPtBrParse(valStr, decimals, true);
};
export const amountParseValsCalc = (valStr: string) => {
  return RoundDecs(AmountPtBrParse(valStr, 2, true), configApp.decimalsValsCalc);
};

export const anoAdd = (ano: string, add: number) => (Number(ano) + add).toString();
