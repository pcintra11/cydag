import { blue, green, orange, grey, brown } from '@mui/material/colors';
import { csd } from '../libCommon/dbg';

const colorsBack = [
  grey[200], grey[400], grey[600],
  brown[200], brown[400], brown[600],
];

const colorsElement = [
  blue[300], blue[500], blue[700], blue[900],
  green[300], green[500], green[700], green[900],
  orange[300], orange[500], orange[700], orange[900],
];

let lastColorBackSeq = 0;
const back = (index?: number) => {
  const colorIndex = index != null ? index : lastColorBackSeq++;
  return colorsBack[colorIndex % colorsBack.length];
};

let lastColorElementSeq = 0;
const element = (index?: number) => {
  const colorIndex = index != null ? index : lastColorElementSeq++;
  return colorsElement[colorIndex % colorsElement.length];
};

const reset = () => {
  lastColorBackSeq = 0;
  lastColorElementSeq = 0;
};

export const colorsTst = {
  back,
  element,
  reset,
};
