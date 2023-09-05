import { useForm, useWatch } from 'react-hook-form';
//import { UseFormReturn as UseFormReturn_xx } from 'react-hook-form/dist/types';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { csd } from '../libCommon/dbg';

// const frm = useFrm({
//   schema: userSchema.profileUpdate,
//   defaultValues: {
//     email: loggedUser?.email,
//   }
// });

export function useFrm<FormData = any>({ schema, defaultValues, mode }:
  { schema?: yup.ObjectSchema<any>, defaultValues?: any, mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all' } = {}) {
  let schemaUse;
  if (schema != null)
    schemaUse = schema;
  else
    schemaUse = yup.object().shape({});
  return useForm<FormData>({
    mode,
    resolver: yupResolver(schemaUse),
    defaultValues
  });
}

/**
 * Assinala todos os campos com o valor informado ou '' se for null
 * Para as props em propsPreserveNull troca de undefined para null
 * Obs: Todos que são inputados por select devem preservar o null!
 * É a função complementar/oposta a NormalizePropsString
 * @param frmInitValues para relacionar todos os campos e assinalar com ao menos o '' ou null
 * @param values valores a assinalar
 * @param propsPreserveNull - propriedades onde o valor null será preservado (não vai substituir por '')
 */
export function FrmDefaultValues<T>(frmInitValues: T, valuesSet?: any): T {
  const result: any = {};
  for (const prop in frmInitValues) {
    let valueFinal: any = frmInitValues[prop];
    if (valueFinal == null)
      valueFinal = '';
    if (valuesSet != null &&
      valuesSet[prop] != null)
      valueFinal = valuesSet[prop];
    result[prop] = valueFinal;
  }
  return result;
}

// export function FrmDefaultValuesOld<T>(frmInitValues: T, values?: any, propsPreserveNull?: string[]): T {
//   for (const prop in frmInitValues) {
//     const valueInit = frmInitValues[prop];
//     let valueSet = undefined;
//     if (valueInit == null) {
//       if (propsPreserveNull == null || !propsPreserveNull.includes(prop))
//         valueSet = '';
//       else if (valueInit == undefined)
//         valueSet = null;
//     }
//     if (values != null &&
//       values[prop] != null)
//       valueSet = values[prop];
//     if (valueSet !== undefined)
//       frmInitValues[prop] = valueSet;
//   }
//   return frmInitValues;
// }
export function FrmSetValues(frm, values) { //@@!!!!! type !!
  for (const name in values)
    frm.setValue(name, values[name]);
  frm.clearErrors(); //@@!!!!!!
}

/**
 * Altera o valor de todas props com string vazio ('', ' ', ...) para null 
 * Prepara o objeto para gravação no db
 * É a função complementar/oposta a FrmDefaultValues
 */
export function NormalizePropsString<T>(dataForm: T) { // #!!!!!!!!!! usar prefixo Frm
  const result = {} as T;
  if (dataForm == null) return undefined;
  for (let index = 0; index < Object.keys(dataForm).length; index++) {
    const prop = Object.keys(dataForm)[index];
    let valueSet = dataForm[prop];
    if (typeof valueSet === 'string') {
      valueSet = valueSet.trim();
      if (valueSet === '')
        //(propsPreserveEmptyString == null || !propsPreserveEmptyString.includes(prop)))
        valueSet = null;
    }
    result[prop] = valueSet;
  }
  return result;
}

/**
 * Retorna todas propriedades do objAlts que são inexistentes ou com valor diferente do correspondente em objOriginal
 */
export const FrmChangedProps = (objAlts: object, objOriginal: object) => {
  const objAltsNormalized = NormalizePropsString(objAlts);
  const propsDiff = Object.keys(objAltsNormalized).reduce((propsDiffAcum, prop) => {
    let propIsDiff = false;
    if (objAltsNormalized[prop] !== null &&
      typeof objAltsNormalized[prop] === 'object')
      throw new Error(`FrmChangedChangedProps prop ${prop} é objeto`);
    if (objAltsNormalized[prop] !== objOriginal[prop])
      propIsDiff = true;
    if (!propIsDiff) return propsDiffAcum;
    return [
      ...propsDiffAcum,
      prop,
    ];
  }, []);
  return propsDiff;
};

export const useWatchMy = useWatch;