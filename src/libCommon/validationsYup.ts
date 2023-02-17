import * as yup from 'yup';

export const msgValidRequired = 'preenchimento obrigatório';
export const msgValidPositive = 'deve ser positivo';
export const msgValidInteger = 'deve ser inteiro';
export const msgValidNumber = 'deve ser um número';
export const msgValidNotZero = 'não pode ser zero';

const stringFn = ({ minChars, maxChars, qtdChars, contentType, required }: { minChars?: number, maxChars?: number, qtdChars?: number, contentType?: 'onlyNumber' | 'id', required?: boolean } = {}) => {
  let result = yup
    .string()
    .trim();
  if (required)
    result = result.required(msgValidRequired);
  if (qtdChars != null) {
    result = result.length(qtdChars, `deve ter ${qtdChars} caracteres`);
  }
  else {
    if (minChars != null) result = result.min(minChars, `deve ter no mínimo ${minChars} caracteres`);
    if (maxChars != null) result = result.max(maxChars, `deve ter no máximo ${maxChars} caracteres`);
  }
  if (contentType === 'onlyNumber') result = result.matches(new RegExp(/^[0-9]*$/, 'g'), 'deve ter apenas números');
  if (contentType === 'id') result = result.matches(new RegExp(/^([a-z])([a-z]|[0-9]|_)*$/, 'g'), 'deve ter apenas letras, números e o carácter "_" e iniciar por uma letra');
  return result;
};

const email = yup
  .string()
  .trim()
  .required(msgValidRequired)
  .lowercase()
  .email('email inválido');


const stringWord3CharOrEmpty = yup
  .string()
  .trim()
  .matches(/(^$|([a-z]){3,})/, 'Deve ter ao menos uma palavra com 3 caracteres');

const numberReqPositive = yup // criar versão 'optional' verificar na documentação @!!!!!!!!
  .number()  // o valor final sempre será null ou do tipo number (obs: qdo não é required sempre dá erro no caso de nulo)
  .positive(msgValidPositive)
  .integer(msgValidInteger)
  .required(msgValidRequired)
  .typeError(msgValidNumber)
  .notOneOf([0], msgValidNotZero);

// const numberOpc = (props?: any) => { 
//   return yup
//     .number()
//     .nullable(true)
//     .transform((_, val) => val === Number(val) ? val : null)
//     .positive(msgValidPositive)
//     .integer(msgValidInteger)
//     //.required(msgValidRequired)
//     //.typeError(msgValidNumber)
//     .notOneOf([0], msgValidNotZero);
// };

const zipCode = yup
  .string()
  .required(msgValidRequired)
  .matches(/^\d{8}$/, 'deve ter oito dígitos');

const phoneNumber = yup
  .string()
  //.nullable()
  .required(msgValidRequired)
  .matches(/^\d{11}$/, 'deve ter onze dígitos');

export const validationsYup = {
  stringFn,
  stringWord3CharOrEmpty,
  numberReqPositive,
  email,
  zipCode,
  phoneNumber,
};

// // 10 posições apenas com letras e numeros
// const codCentroCustoYup = yup
//   .string()
//   .required(msgValidRequired)
//   .trim()
//   .uppercase()
//   .matches(/(([A-Z])|([0-9])){10}/, 'Deve ter 10 posições com letras ou números');
