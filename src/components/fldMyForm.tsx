import React from 'react';
import { Controller } from 'react-hook-form';
import { UseFormReturn } from 'react-hook-form/dist/types';

// import InputLabel_mui from '@mui/material/InputLabel';
import { Typography as Typography_mui, useTheme } from '@mui/material';
import FormControl_mui from '@mui/material/FormControl';
import FormHelperText_mui from '@mui/material/FormHelperText';
import FormControlLabel_mui from '@mui/material/FormControlLabel';
import TextField_mui, { TextFieldProps as TextFieldProps_mui } from '@mui/material/TextField';
//import { InputProps as InputProps_mui } from '@mui/material/Input';
// import Select_mui, { SelectProps as SelectProps_mui } from '@mui/material/Select';
// import MenuItem_mui from '@mui/material/MenuItem';
import Checkbox_mui, { CheckboxProps as CheckboxProps_mui } from '@mui/material/Checkbox';

import { ErrorPlus, ErrorPlusData, FriendlyErrorMsgApi, NavigateToProperty, ObjHasProp } from '../libCommon/util';

import { PopupMsg } from './snackBar';
import { AbortProcComponent, LogErrorUnmanaged } from './abortProc';
import { csd, dbgError } from '../libCommon/dbg';
//import { FakeLink } from './ui';


interface IFrmInputProps {
  frm?: UseFormReturn<any>;
  name?: string;
  label?: string;
  helperTextExtra?: string;
  helperTextPre?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  displayNone?: boolean;
  visibilityHidden?: boolean;
  suppressErrorMessage?: boolean;
  onChange?: (ev) => void;
  onBlur?: (ev) => void;
  value?: string;  // apenas se não for via react-hook-form, que entra por useForm-defaults
  width?: string;
  type?: 'password' | 'text';
  mask?: string; // @@@!!
  multiline?: boolean;
  rows?: number;
  minRows?: number;
  maxRows?: number;
}
export const FrmInput = ({
  frm,
  name,
  label,
  helperTextExtra,
  helperTextPre,
  placeholder,
  autoFocus,
  disabled,
  displayNone,
  visibilityHidden,
  suppressErrorMessage,
  onChange: onChangeParm,
  onBlur: onBlurParm,
  value,
  width,
  type,
  //mask,
  multiline,
  rows,
  minRows,
  maxRows,
}: IFrmInputProps) => {

  const themePlus = useTheme();

  try {
    if ((frm == null && name != null) ||
      (frm != null && name == null))
      throw new Error('frm e name devem ser informados OU não informados.');

    const sx: React.CSSProperties = {};
    const textFieldProps: TextFieldProps_mui = {
      label,
      variant: themePlus.themePlusConfig?.inputVariant,
      disabled,
    };
    if (width == null)
      textFieldProps.fullWidth = true;
    else
      sx.width = width;
    if (displayNone)
      sx.display = 'none';

    if (visibilityHidden)
      sx.visibility = 'hidden';

    const inputProps = {
      placeholder,
      autoFocus: autoFocus || false,
      multiline,
      rows,
      minRows,
      maxRows,
    };

    const textsHelperText = [];
    if (frm != null &&
      name != null) {
      const errorObj = NavigateToProperty(frm.formState.errors, name);
      textFieldProps.error = errorObj?.message != null;
      if (errorObj?.message != null &&
        !suppressErrorMessage)
        textsHelperText.push(errorObj?.message);
    }
    if (helperTextPre != null)
      textsHelperText.push(helperTextPre); // @@!!!!! tem que ser pré !
    if (helperTextExtra != null)
      textsHelperText.push(helperTextExtra);
    // if (textsHelperText.length === 1)
    //   textFieldProps.helperText = textsHelperText[0];
    // else if (textsHelperText.length === 2)
    //   textFieldProps.helperText = <>{textsHelperText[0]}<br />{textsHelperText[1]}</>;
    textFieldProps.helperText = <>{textsHelperText.map((x, i) => i == 0 ? <span key={i}>{x}</span> : <span key={i}><br />{x}</span>)}</>;

    if (frm != null) {
      // nesse caso o 'defaultValue' vem da inicialização de defaultValues do useForm
      return (
        <Controller
          control={frm.control}
          name={name}
          render={({ field: { onChange, onBlur, name, value } }) =>
            <TextField_mui
              onChange={(ev) => allHandlers_Event(ev, onChange, onChangeParm)}
              onBlur={(ev) => allHandlers_Event(ev, onBlur, onBlurParm)}
              name={name}
              value={value}
              style={sx}
              {...textFieldProps}
              {...inputProps}
              type={type}
            />
          }
        />
      );
    }
    else {
      return (
        <TextField_mui
          onChange={onChangeParm}
          onBlur={onBlurParm}
          value={value || ''}
          style={sx}
          {...textFieldProps}
          {...inputProps}
        />
      );
    }
  } catch (error) { //@@!!!!!!
    LogErrorUnmanaged(error, 'FrmInput-render', { label, name, frm, value });
    return (<AbortProcComponent error={error} component='FrmInput' />);
  }
};

// export const FrmInput = (props: FrmInputProps) => {
//   const { errors, register, fld, lbl, grow, id, propsForward } = Deconstruct(props);
//   const errorObj = NavigateToProperty(fld, errors);
//   const { className, ...propsForwardUse } = propsForward;
//   let classNameUse = ClassNameUse(className, errorObj);
//   // const style: any = {};
//   // if (grow != null) {
//   //   style.flexGrow = grow;
//   //   classNameUse += ' xxx-grow-1';
//   // }
//   return (
//     // <div className='xxx-formFldBlock' style={style}>
//     <div className='xxx-formFldBlock'>
//       { lbl != null && <label htmlFor={id}>{lbl}</label>}
//       <input id={id} {...register(fld)} {...propsForwardUse} className={classNameUse} />
//       {errorObj && <div className='xxx-formFldErrorMessage'>{errorObj.message}</div>}
//     </div>
//   )
// };
// interface FrmTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
//   frm: UseFormReturn<any>;
//   name: string;
//   label: string;
//   autocompleteOptions?: string[];
//   mask?: string;
// };
// // para forms verticais width:100: label, msg de validação, etc eliminar !!!!!!
// export const FrmTextField = ({ frm, name, label, className, width, mask, autocompleteOptions, onChange, onBlur, ...propsForwardInput }: FrmTextFieldProps) => {
//   const errors = frm.formState.errors;
//   const register = frm.register;
//   const control = frm.control;
//   const setValue = frm.setValue;
//   const errorObj = NavigateToProperty(name, errors);

//   //const handleChange = onChangeAux == null ? () => null : onChangeAux;
//   const muiProps: any = {
//     width,
//     label,
//     variant: 'standard',
//     error: errorObj != null,
//     helperText: errorObj?.message,
//     className,
//   };
//   if (width == null)
//     muiProps.fullWidth = true;

//   //csl({ parans });
//   //  mask !!!!

//   const inputProps = {
//     ...register(name, {
//       onChange,
//       onBlur,
//     }),
//     ...propsForwardInput,
//   };

//   return <TextField_mui {...muiProps} inputProps={inputProps} />;

//   //#region 
//   //const name = `${fld}` as '';

//   // if (autocompleteOptions == null)
//   //   return (
//   //     <div>
//   //       <Controller
//   //         control={control}
//   //         name={name}
//   //         render={({ field: { onChange, value } }) =>
//   //           <TextField_mui {...parans} value={value} inputProps={inputProps} onChange={(ev) => { onChange(ev); handleChange(ev) }} />
//   //         }
//   //       />
//   //     </div>
//   //   );
//   // else

//   //   return (
//   //     <div>
//   //       <Controller
//   //         control={control}
//   //         name={name}
//   //         render={({ field: { onChange, value } }) =>
//   //           <TextField_mui {...parans} value={value} inputProps={inputProps} onChange={(ev) => { onChange(ev); handleChange(ev) }} />
//   //         }
//   //       />
//   //       {!parans.disabled && autocompleteOptions.map((x, i) =>
//   //         <div key={i}>
//   //           <FakeLink text={x} onClick={() => { setValue(name, x) }} />
//   //         </div>
//   //       )}
//   //     </div>
//   //   );

//   // return (
//   //   <div>
//   //     <Controller
//   //       control={control}
//   //       name={name}
//   //       render={({ field: { onChange, value } }) =>
//   //         // <TextField_mui {...parans} value={value} onChange={(ev) => { onChange(ev); handleChange(ev) }} />
//   //         <Autocomplete
//   //           freeSolo
//   //           options={autocompleteOptions}
//   //           renderInput={(x) =>
//   //             <TextField_mui {...x} {...parans} value={value} onChange={(ev) => { onChange(ev); handleChange(ev) }} />}
//   //         />
//   //       }
//   //     />
//   //   </div>
//   // );
//   //#endregion
// };

// interface FrmCheckboxPropsHtml extends InputHTMLAttributes<HTMLInputElement> {
//   frm: UseFormReturn<any>;
//   fld: string;
//   label: string;
// }
// export const FrmCheckboxHtml = ({ frm, fld, label, className: classNameInf, width, id: idInf, name, onChange, onBlur, ...propsForwardInput }: FrmCheckboxPropsHtml) => {
//   const errors = frm.formState.errors;
//   const register = frm.register;
//   const errorObj = NavigateToProperty(fld, errors);
//   const id = idInf || `${fld}_id`;
//   const className = ClassNameUse(classNameInf, errorObj);

//   const inputProps = {
//     ...register(fld, {
//       onChange,
//       onBlur,
//     }),
//     ...propsForwardInput,
//     className,
//   };

//   return (
//     <div className='xxx-inline'>
//       <div className='xxx-formFldBlock'>
//         {label != null && <label htmlFor={id}>{label}</label>}
//         <input id={id} {...register(fld)} {...inputProps} type='checkbox' />
//         {errorObj && <div className='xxx-formFldErrorMessage'>{errorObj.message}</div>}
//       </div>
//     </div>
//   )
// };

interface IFrmCheckboxProps {
  frm?: UseFormReturn<any>;
  name?: string;
  label: string;
  disabled?: boolean;
  hide?: boolean;
  onChange?: (ev) => void;
  onBlur?: (ev) => void;
  value?: boolean;
  width?: string;
  noWrap?: boolean;
}
export const FrmCheckbox = ({
  frm,
  name,
  label, // @!!!!!!!!! wrap 
  disabled,
  hide,
  onChange: onChangeParm,
  onBlur: onBlurParm,
  value,
  width,
  noWrap,
}: IFrmCheckboxProps) => {
  if ((frm == null && name != null) ||
    (frm != null && name == null))
    throw new Error('FrmCheckbox: frm e name devem ser informados OU não informados');

  const sx: React.CSSProperties = {};
  const checkBoxProps: CheckboxProps_mui = {
    disabled,
  };
  if (hide)
    sx.display = 'none';
  if (width != null)
    sx.width = width;

  let errorObj = null;
  let component;

  if (frm != null) {
    // nesse caso o 'defaultValue' vem da inicialização de defaultValues do useForm
    errorObj = NavigateToProperty(frm.formState.errors, name);
    component = (
      <Controller
        control={frm.control}
        name={name}
        render={({ field: { onChange, onBlur, name, value } }) => {
          return (
            <FormControlLabel_mui
              label={noWrap ? <Typography_mui noWrap variant="body1">{label}</Typography_mui> : label}
              style={sx}
              control={
                <Checkbox_mui
                  onChange={(ev) => allHandlers_Event(ev, onChange, onChangeParm)}
                  onBlur={(ev) => allHandlers_Event(ev, onBlur, onBlurParm)}
                  name={name}
                  checked={value}
                  {...checkBoxProps}
                />
              }
            />
          );
        }
        } />
    );
  }
  else {
    // nesse caso o valor é sempre controlado por setState
    component = (
      <FormControlLabel_mui
        label={label}
        control={
          <Checkbox_mui
            onChange={onChangeParm}
            onBlur={onBlurParm}
            checked={value || false}
            {...checkBoxProps}
          />
        }
      />
    );
  }

  return (
    <FormControl_mui>
      {component}
      {errorObj &&
        <FormHelperText_mui error>{errorObj.message}</FormHelperText_mui>
      }
    </FormControl_mui>
  );
};

// const labelId = `${name}-label`;
// return (
//   <FormControl_mui {...props}>
//     <InputLabel_mui id={labelId}>{label}</InputLabel_mui>
//     <Controller
//       control={control}
//       name={name}
//       render={({ field }) => (
//         <Select_mui
//           labelId={labelId}
//           label={label}
//           inputRef={field.ref}
//         >
//         </Select_mui>
//       )}
//     />
//   </FormControl_mui>
// );

// export class SelectOption {
//   value: string;
//   text: string;
//   constructor(value: string, text?: string) {
//     this.value = value;
//     this.text = text != null ? text : value.toString();
//   }
// }
// interface FrmSelectProps {
//   frm?: UseFormReturn<any>;
//   name?: string;
//   label?: string;
//   variant?: 'standard' | 'outlined' | 'filled';
//   disabled?: boolean;
//   hide?: boolean;
//   suppressErrorMessage?: boolean;
//   onChange?: (ev) => void;
//   onBlur?: (ev) => void;
//   value?: string; // apenas se não for via react-hook-form, que entra por useForm-defaults
//   options: SelectOption[];
//   width?: string | number;

//   minWidth?: string | number;
// }
// export const FrmSelect = ({ //@@!!!!!! desativar, usar sempre o componente básico e no modo não controlado 
//   frm,
//   name,
//   label,
//   variant,
//   disabled,
//   hide,
//   suppressErrorMessage,
//   onChange: onChangeParm,
//   onBlur: onBlurParm,
//   value,
//   options,

//   width,
//   minWidth,
// }: FrmSelectProps) => {
//   if ((frm == null && name != null) ||
//     (frm != null && name == null))
//     throw new Error('frm e name devem ser informados OU não informados');

//   let errorObj = null;
//   let component;

//   const formControlSx: any = {}; // SxProps<Theme>
//   if (width !== null)
//     formControlSx.width = width;
//   if (minWidth !== null)
//     formControlSx.minWidth = minWidth;

//   const defaultMuiInputVariant = 'standard';

//   const selectSx: React.CSSProperties = {};
//   const selectProps: SelectProps_mui = {
//     variant: variant || defaultMuiInputVariant,
//     disabled,
//   };
//   // if (width == null)
//   //   selectProps.fullWidth = true;
//   // else
//   //   sx.width = width;
//   if (hide)
//     selectSx.display = 'none';

//   if (frm != null &&
//     name != null)
//     errorObj = NavigateToProperty(frm.formState.errors, name);

//   if (frm != null) {
//     // nesse caso o 'defaultValue' vem da inicialização de defaultValues do useForm
//     component = (
//       <Controller
//         control={frm.control}
//         name={name}
//         render={({ field: { onChange, onBlur, name, value } }) => {
//           return (
//             <Select_mui
//               onChange={(ev) => allHandlers_Event(ev, onChange, onChangeParm)}
//               onBlur={(ev) => allHandlers_Event(ev, onBlur, onBlurParm)}
//               name={name}
//               value={value}
//               style={selectSx}
//               {...selectProps}
//             >
//               {options.map((option, index) =>
//                 <MenuItem_mui key={index} value={option.value}>
//                   {option.text}
//                 </MenuItem_mui>
//               )}
//             </Select_mui>
//           );
//         }
//         } />
//     );
//   }
//   else {
//     // nesse caso o valor é sempre controlado por setState
//     component = (
//       <Select_mui
//         onChange={onChangeParm}
//         onBlur={onBlurParm}
//         value={value || ''}
//         style={selectSx}
//         {...selectProps}
//       >
//         {options.map((option, index) =>
//           <MenuItem_mui key={index} value={option.value}>
//             {option.text}
//           </MenuItem_mui>
//         )}
//       </Select_mui>
//     );
//   }

//   return (
//     <FormControl_mui sx={formControlSx}>
//       {label &&
//         <InputLabel_mui>{label}</InputLabel_mui>
//       }
//       {component}
//       {(!suppressErrorMessage && errorObj?.message != null) &&
//         <FormHelperText_mui error>{errorObj.message}</FormHelperText_mui>
//       }
//     </FormControl_mui>
//   );
// };

// interface FrmTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
//   frm: UseFormReturn<any>;
//   name: string;
//   label?: string;
// }
// export const FrmTextarea = ({ frm, name, label, className: classNameInf, id: idInf, onChange, onBlur, ...propsForwardInput }: FrmTextareaProps) => {
//   function ClassNameUse(className, errorMsg) {
//     let classNameUse = '';
//     if (errorMsg)
//       classNameUse += ' xxx-formFldError';
//     if (className != null)
//       classNameUse += ' ' + className;
//     return classNameUse.trim();
//   }
//   const errors = frm.formState.errors;
//   const register = frm.register;
//   const errorObj = NavigateToProperty(name, errors);
//   const id = idInf || `${name}_id`;
//   const className = ClassNameUse(classNameInf, errorObj);
//   const inputProps = {
//     ...register(name, {
//       onChange,
//       onBlur,
//     }),
//     ...propsForwardInput,
//     className,
//   };
//   return (
//     <div className='xxx-formFldBlock'>
//       {label != null && <label htmlFor={id}>{label}</label>}
//       <textarea id={id} {...register(name)} {...propsForwardInput} />
//       {errorObj && <div className='xxx-formFldErrorMessage'>{errorObj.message}</div>}
//     </div>
//   )
// };

// interface FrmSelectPropsHtml extends SelectHTMLAttributes<HTMLSelectElement> {
//   frm: UseFormReturn<any>;
//   fld: string;
//   label?: string;
//   options?: SelectOption[];
//   optionsGroup?: { group: string, options: SelectOption[] }[];
// }
// export const FrmSelectHtml = ({ frm, fld, label, className: classNameInf, id: idInf, name, options, optionsGroup, onChange, onBlur, ...propsForwardSelect }: FrmSelectPropsHtml) => {
//   const errors = frm.formState.errors;
//   const register = frm.register;
//   const errorObj = NavigateToProperty(fld, errors);
//   const id = idInf || `${fld}_id`;
//   const className = ClassNameUse(classNameInf, errorObj);

//   //const handleChange = onChangeAux == null ? () => null : onChangeAux;
//   if (name != null)
//     SystemWarningCli('FrmTextField', `name ${name} não deve ser passado e foi desprezado`);

//   if (options == null &&
//     optionsGroup == null)
//     throw new Error('Deve ser passado options OU optionsGroup');
//   if (options != null &&
//     optionsGroup != null)
//     throw new Error('Não deve ser passado options E optionsGroup');

//   const htmlProps = {
//     ...register(fld, {
//       onChange,
//       onBlur,
//     }),
//     className,
//   };

//   let component;
//   //csl({ options });

//   if (options != null)
//     component = (
//       <select id={id} {...register(fld)} {...htmlProps} {...propsForwardSelect}>
//         {options.map((option, index) => <option value={option.value} key={index} >{option.text}</option>)}
//       </select>
//     );
//   else
//     component = (
//       <select id={id} {...register(fld)} {...propsForwardSelect}>
//         {optionsGroup.map((optGroup, index) =>
//           <optgroup label={optGroup.group} key={index}>
//             {optGroup.options.map((option, index) =>
//               <option value={option.value} key={index} >{option.text}</option>
//             )}
//           </optgroup>
//         )}
//       </select>
//     );
//   return (
//     <div className='xxx-formFldBlock'>
//       {label != null && <label htmlFor={id}>{label}</label>}
//       {component}
//       {errorObj && <div className='xxx-formFldErrorMessage'>{errorObj.message}</div>}
//     </div>
//   )
// };



//const fldErrorGeneric = '__errorGeneric';
// export const FrmSetErrorGeneric = ({frm}: {frm: UseFormReturn<any> }) => {
//   const {errors, fld} = Deconstruct({frm, fld: fldErrorGeneric });
//   const errorObj = NavigateToProperty(fld, errors);
//   return (
//     <>
//       {(errorObj && errorObj.message != null) && <p className='xxx-errorHeader'>{errorObj.message}</p>}
//     </>
//   )
// };
// export function FrmClearErrors(frm: UseFormReturn<any>) {
//   frm.clearErrors();
// }
export function FrmSetError(frm: UseFormReturn<any>, name: any, message?: string) {
  const nameUse = name; // || fldErrorGeneric;
  try {
    if (message != null)
      frm.setError(nameUse, {  // possível se houver no form o 'FrmSetErrorGeneric'
        type: 'manual',
        message,
        //shouldFocus: true, // não funcionou !
      });
    //if (fld != fldErrorGeneric)
    frm.setFocus(name); // dá erro se o campo não existir ! @@!!!!!! parou de funcionar?
  } catch (error) {
    //csl(error);
  }
}
export function FrmError(frm: UseFormReturn<any>, error: Error | ErrorPlus) {
  const name = ErrorPlusData(error).fldName; /// qdo fldName é string (ex: veio de api) não acha o campo??? tem que ser literal?? @@!!!!!!
  const message = FriendlyErrorMsgApi(error);
  if (frm != null &&
    name != null) {
    if (ObjHasProp(frm.getValues(), name)) { //@@!!!!!!
      try {
        frm.setError(name, {  // possível se houver no form o 'FrmSetErrorGeneric'
          type: 'manual',
          message: message,
          //shouldFocus: true, // não funcionou !
        });
        //frm.setFocus(name); // dá erro se o campo não existir ! @@!!!!!!
      } catch (error) {
        dbgError('FrmError', error.message, `msg: "${message}"`);
      }
    }
    else {
      dbgError('FrmError', `campo de formulário ${name} não consta no formulário`, `msg: "${message}"`);
      PopupMsg.error(message);
    }
  }
  else {
    //dbgError('FrmError', 'formulário ou nome de campo não informados', `msg: "${message}"`);
    PopupMsg.error(message);
  }
}
// export function SnackBarError(error: Error | ErrorPlus | string, point: string) {
//   if (typeof error !== 'string')
//     LogErrorUnmanaged(error, point || 'SnackBarError');
//   const message = (typeof error == 'string') ? error : FriendlyErrorMsgApi(error);
//   PopupMsg.error(message);
// }

// export function FrmClearErrorGeneric(frm: UseFormReturn<any>) {
//   FrmSetError(null, fldErrorGeneric, frm);
// }

// function Deconstruct(props: any) {
//   // normaliza o Id, checa se fld informado
//   const { id: idInf, frm, fld: fldInf, label, options, optionsGroup, ...propsForward } = props;
//   const fld: string = fldInf;
//   if (fld == null)
//     throw new Error('deve ser informado fld');
//   let id;
//   if (idInf != null)
//     id = idInf;
//   else
//     id = `${fld}_id`;
//   //return { errors, register, control, setValue, fld, label, options, optionsGroup, id, propsForward };
//   return { frm, fld, label, options, optionsGroup, id, propsForward };
// };

const allHandlers_Event = (ev, ...handlers: ((ev) => void)[]) => {
  handlers.forEach((handler) => handler != null && handler(ev));
};
// const allHandlers_EventValue = (ev, value, ...handlers: ((ev, value) => void)[]) => {
//   csl({ handlers});
//   handlers.forEach((handler) => handler != null && handler(ev, value));
// }

