import * as yup from 'yup';

export const msgValidRequired = 'informação obrigatória';
export const msgValidPositive = 'deve ser positivo';
export const msgValidInteger = 'deve ser inteiro';
export const msgValidNumber = 'deve ser um número';
export const msgValidNotZero = 'não pode ser zero';

const stringReq = yup
  .string()
  .required(msgValidRequired);

const email = yup
  .string()
  .trim()
  .required(msgValidRequired)
  .lowercase()
  .email('email inválido');

const stringReq3to30 = yup // nome de pessoa
  .string()
  .required(msgValidRequired)
  .min(3, 'deve ter no mínimo 3 caracteres')
  .max(30, 'deve ter no máximo 30 caracteres');
const stringReq10to50 = yup // titulo de negocio
  .string()
  .required(msgValidRequired)
  .min(10, 'deve ter no mínimo 10 caracteres')
  .max(50, 'deve ter no máximo 50 caracteres');
const stringReq20to400 = yup
  .string()
  .required(msgValidRequired)
  .min(20, 'deve ter no mínimo 20 caracteres')
  .max(400, 'deve ter no máximo 400 caracteres');

const stringWord3CharOrEmpty = yup
  .string()
  .trim()
  .matches(/(^$|([a-z]){3,})/, 'Deve ter ao menos uma palavra com 3 caracteres');

const numberReqPositive = yup
  .number()  // o valor final sempre será null ou do tipo number (obs: qdo não é required sempre dá erro no caso de nulo)
  .positive(msgValidPositive)
  .integer(msgValidInteger)
  .required(msgValidRequired)
  .typeError(msgValidNumber)
  .notOneOf([0], msgValidNotZero);

const numberInString = yup
  .string()
  .trim()
  .matches(new RegExp(/^[0-9]*$/, 'g'), 'número inválido');

const zipCodeYup = yup
  .string()
  .required(msgValidRequired)
  .matches(/^\d{8}$/, 'deve ter oito dígitos');

const phoneNumber = yup
  .string()
  //.nullable()
  .required(msgValidRequired)
  .matches(/^\d{11}$/, 'deve ter onze dígitos');

export const validationsYup = {
  stringReq,
  stringReq3to30,
  stringReq10to50,
  stringReq20to400,
  stringWord3CharOrEmpty,
  numberReqPositive,
  numberInString,
  email,
  zipCodeYup,
  phoneNumber,
};

// // 10 posições apenas com letras e numeros
// const codCentroCustoYup = yup
//   .string()
//   .required(msgValidRequired)
//   .trim()
//   .uppercase()
//   .matches(/(([A-Z])|([0-9])){10}/, 'Deve ter 10 posições com letras ou números');
