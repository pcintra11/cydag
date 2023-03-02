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
 * Assinala todos os campos com o valor informado ou ''
 * Para as props em propsPreserveNull troca de undefined para null
 * Obs: Todos que são inputados por select devem preservar o null!
 * @param frmInitValues para relacionar todos os campos e assinalar com ao menos o '' ou null
 * @param values valores a assinalar
 * @param propsPreserveNull - propriedades onde o valor null será preservado (não vai substituir por '')
 */
export function FrmDefaultValues<T>(frmInitValues: T, valuesDb?: any): T {
  for (const prop in frmInitValues) {
    const valueInit = frmInitValues[prop];
    let valueSet = undefined;
    if (valueInit == null)
      valueSet = '';
    if (valuesDb != null &&
      valuesDb[prop] != null)
      valueSet = valuesDb[prop];
    if (valueSet !== undefined)
      frmInitValues[prop] = valueSet;
  }
  return frmInitValues;
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

export function NormalizePropsString<T>(dataform: T) {
  const result = {} as T;
  if (dataform == null) return undefined;
  for (let index = 0; index < Object.keys(dataform).length; index++) {
    const prop = Object.keys(dataform)[index];
    let valueSet = dataform[prop];
    if (typeof valueSet === 'string') {
      valueSet = valueSet.trim();
      if (valueSet == '')
        //(propsPreserveEmptyString == null || !propsPreserveEmptyString.includes(prop)))
        valueSet = undefined;
    }
    result[prop] = valueSet;
  }
  return result;
}
// export function NormalizePropsStringOld<T>(dataform: T, propsPreserveEmptyString?: string[]) {
//   const result = {} as T;
//   if (dataform == null) return undefined;
//   for (let index = 0; index < Object.keys(dataform).length; index++) {
//     const prop = Object.keys(dataform)[index];
//     let valueSet = dataform[prop];
//     if (typeof valueSet === 'string') {
//       valueSet = valueSet.trim();
//       if (valueSet == '' &&
//         (propsPreserveEmptyString == null || !propsPreserveEmptyString.includes(prop)))
//         valueSet = undefined;
//     }
//     result[prop] = valueSet;
//   }
//   return result;
// }
export const useWatchMy = useWatch;