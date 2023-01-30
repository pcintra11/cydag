import { Env } from '../libCommon/envs';

enum Amb {
  dev = 'dev',
  qas = 'qas',
  prd = 'prd',
  devCompiled = 'devCompiled',
  none = 'none',
}
export function GetAmb() {
  try {
    const amb = Env('amb'); // aqui tá dando erro qdo é chamada notifyAdm - apenas na primeira vez apos compilação @@!!!!! (odem dos imports!)
    if (amb != Amb.dev &&
      amb != Amb.qas &&
      amb != Amb.prd &&
      amb != Amb.devCompiled &&
      amb != Amb.none)
      throw new Error(`amb ${amb} não previsto`);
    return amb;
  } catch (error) {
    console.log('GetAmb error', error.message);
    return null;
  }
}

export const isAmbNone = () => (GetAmb() === Amb.none || GetAmb() == null);
export const isAmbDev = () => (GetAmb() === Amb.dev || GetAmb() === Amb.devCompiled);
export const isAmbDevCompiled = () => (GetAmb() === Amb.devCompiled);
export const isAmbQas = () => (GetAmb() === Amb.qas);
export const isAmbDevOrQas = () => (GetAmb() === Amb.dev || GetAmb() === Amb.qas);
export const isAmbPrd = () => (GetAmb() === Amb.prd);

// export const isAmb = {
//   dev: () => (GetAmb() === Ambs.dev || GetAmb() === Ambs.devCompiled),
//   devCompiled: () => (GetAmb() === Ambs.devCompiled),
//   tst: () => (GetAmb() === Ambs.tst),
//   devOrTst: () => (GetAmb() === Ambs.dev || GetAmb() === Ambs.tst),
//   prd: () => (GetAmb() === Ambs.prd),
// }
