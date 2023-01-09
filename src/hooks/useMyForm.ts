import { useForm, useWatch } from 'react-hook-form';
//import { UseFormReturn as UseFormReturn_xx } from 'react-hook-form/dist/types';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

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
 * @param frmStructure (para relacionar todos os campos e assinalar com ao menos o '' ou null)
 * @param values (valores a assinalar)
 */
export function FrmDefaultValues<T>(frmStructure: T, values?: any, propsPreserveNull?: string[]): T {
  for (const prop in frmStructure) {
    let valueSet = values != null ? values[prop] : null;
    if (valueSet == null &&
      (propsPreserveNull == null || !propsPreserveNull.includes(prop)))
      valueSet = '';
    else if (valueSet === undefined)
      valueSet = null;
    frmStructure[prop] = valueSet;
  }
  return frmStructure;
}

export function FrmSetValues(frm, values) { //@@!!!!! type !!
  for (const name in values)
    frm.setValue(name, values[name]);
  frm.clearErrors(); //@@!!!!!!
}

// export function NormalizePropsStringOld<T>(dataform: T, propsPreserveEmptyString?: string[]) {
//   const result: any = {};
//   if (dataform == null)
//     return null;
//   for (let index = 0; index < Object.keys(dataform).length; index++) {
//     const prop = Object.keys(dataform)[index];
//     let valueSet = dataform[prop];
//     if (typeof valueSet === 'string') {
//       valueSet = valueSet.trim();
//       if (valueSet == '' &&
//         (propsPreserveEmptyString == null || !propsPreserveEmptyString.includes(prop)))
//         valueSet = null;
//     }
//     result[prop] = valueSet;
//   }
//   return result as T;
// }
/**
 * Retorna novo objeto removendo os brancos do valor das propriedades (trim). Se o valor for vazio altera para null.
 */
export function NormalizePropsString<T>(dataform: T, propsPreserveEmptyString?: string[]) {
  const result = {} as T;
  if (dataform == null) return undefined;
  for (let index = 0; index < Object.keys(dataform).length; index++) {
    const prop = Object.keys(dataform)[index];
    let valueSet = dataform[prop];
    if (typeof valueSet === 'string') {
      valueSet = valueSet.trim();
      if (valueSet == '' &&
        (propsPreserveEmptyString == null || !propsPreserveEmptyString.includes(prop)))
        valueSet = undefined;
    }
    result[prop] = valueSet;
  }
  return result;
}

export const useWatchMy = useWatch;