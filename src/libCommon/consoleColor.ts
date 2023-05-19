import clc, { Format } from 'cli-color';
import { OnClient } from './sideProc';
import { isVercelHost } from '../app_base/envs';

const colorErrX = clc.red.bold;
const colorAlertX = clc.yellow;
const colorWarnX = clc.blue;
const colorInfoX = clc.green;

const colorAllowed = () => OnClient() || !isVercelHost();  // @!!!!! agrupar todos os campos na mesma cor
export function colorX(colorFn: Format, param) {
  //export function colorX(colorFn: (text: string) => string, param) {
  if (colorAllowed())
    return colorFn(param);
  else
    return param;
}
export function colorErr(param: string) {
  return colorX(colorErrX, param);
}
export function colorAlert(param: string) {
  return colorX(colorAlertX, param);
}
export function colorWarn(param: string) {
  return colorX(colorWarnX, param);
}
export function colorInfo(param: string) {
  return colorX(colorInfoX, param);
}

export const colorsDbg = [
  clc.black,
  clc.bgRed,
  clc.bgMagenta,
  clc.bgYellowBright,
  clc.bgBlackBright,
  clc.bgBlueBright,
  clc.bgRedBright,
  clc.bgGreenBright,
  clc.bgWhite,
];

// ex:       csl(colorWarn(txt));

export function PreComp() { // para uso no render, quando o processamento é no server
  if (typeof window === 'undefined')
    return clc.underline.bgMagenta('(PreComp)'); //@@@@!!!!
  else
    return '';
}