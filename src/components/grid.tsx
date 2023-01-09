import React from 'react';
import { Box, Input, SxProps } from '@mui/material';

import { amountParse, amountToStr } from '../appCydag/util';
import { SelectMy, SelOption, SwitchMy } from './ui';
import { csd } from '../libCommon/dbg';

interface IGridCell {
  textAlign?: 'right' | 'left' | 'center',
  columnSpan?: number,
  rowSpan?: number,
  sticky?: boolean,
  children: React.ReactNode
  bgcolor?: string;
  color?: string;
  pY?: string; // @!!!!!!!!
  pX?: string | number;
  pMult?: number; // default 1, se for stick 2
  alignSelf?: 'start' | 'center' | 'end' | 'stretch';
}
export const GridCell = ({ textAlign, columnSpan, rowSpan, sticky, bgcolor, color, pY, pX, pMult, alignSelf, children }: IGridCell) => {
  const propsCell: any = { width: '100%', display: 'flex' };
  if (columnSpan != null) {
    if (columnSpan == 0) return <></>;
    propsCell.gridColumn = `span ${columnSpan}`;
  }
  if (rowSpan != null)
    propsCell.gridRow = `span ${rowSpan}`;
  if (alignSelf != null)
    propsCell.alignSelf = alignSelf;

  const pMultHdrUse = pMult || (sticky === true) ? 2 : 1;
  const pUnitPx = 4;
  const paddingDefault = `${pUnitPx * pMultHdrUse}px`;

  propsCell.bgcolor = bgcolor;
  propsCell.color = color;
  // if (className != null)
  //   propsCell.className = className;
  const sxPropsCell: SxProps = { display: 'flex' };
  if (sticky) {
    sxPropsCell.position = 'sticky';
    sxPropsCell.top = 0;
    sxPropsCell.zIndex = 1;
  }

  const paddingXUse = pX || paddingDefault;
  const paddingYUse = pY || paddingDefault;
  const sxPropsContent: SxProps = { width: '100%', textAlign: '' };
  if (textAlign == 'right') sxPropsContent.textAlign = 'right';
  if (textAlign == 'center') sxPropsContent.textAlign = 'center';
  sxPropsContent.paddingLeft = paddingXUse;
  sxPropsContent.paddingRight = paddingXUse;
  sxPropsContent.paddingTop = paddingYUse;
  sxPropsContent.paddingBottom = paddingYUse;

  return (
    <Box {...propsCell} sx={sxPropsCell} overflow='clip'>
      <Box my='auto' sx={sxPropsContent}>
        {children}
      </Box>
    </Box>
  );
};

export enum ValueType { amount, number, boolean, options, string }

/**
 * compartilha os valores editados com o componente chamador
 */
export interface IFldChange {
  fld: string;
  index: number | null;
  value: any;
  valueError: boolean;
  initiating: boolean
}

/**
 * Controles globais para todas as celulas
 */
export interface IGridEditMainCtrl {
  /**
   * valores originais
   */
  dataOriginal: any;
  /**
   * Função que será chamada para compartilhar os valores editados
   */
  fldNewValue: (fldChange: IFldChange) => void;
  fontSizeGrid: string | number
} // ; setStateSubords: ISetStateSubords[]

/**
 * Controle para cada celula editada
 */
export interface IGridEditFldCtrl {
  fld: string;
  arrayItens?: number;
  valueType?: ValueType;
  options?: SelOption[];
  mandatory?: boolean;
  /**
   * atuVal => 'setState' para o chamador forçar algum valor (replicação de valores em array, zerar todas colunas, etc)
   */
  atuVal?: any
} // (value: any) => void | ((value: any) => void)[]

const valueOriginalForEdit = (dataOriginal: any, fld: string, index?: number, valueType?: ValueType) => {
  let result: any;
  //const valorOrig = NavigateToProperty(dataOriginal, fld);
  const valorOrig = index == null ? dataOriginal[fld] : dataOriginal[fld][index];
  if (valueType === ValueType.amount) result = amountToStr(valorOrig);
  else if (valueType === ValueType.number) result = amountToStr(valorOrig, 0);
  else if (valueType === ValueType.boolean) result = valorOrig;
  else result = valorOrig || '';
  //csd({ fld, valorOrig, valueType, result });
  return result;
};
export const GridCellEdit = ({ mainCtrl, fldCtrl, index, disabled }: { mainCtrl: IGridEditMainCtrl, fldCtrl: IGridEditFldCtrl, index?: number, disabled?: boolean }) => {
  // o valor editado é sempre string ou boolean, nunca numérico
  // o valor para envio ao db será undefined se for vazio ('')
  const { fld, arrayItens, valueType, options, mandatory } = fldCtrl;
  const { dataOriginal, fldNewValue, fontSizeGrid } = mainCtrl;
  if (arrayItens != null) {
    if (index == null) throw new Error(`fld ${fld} É do tipo array e NÂO FOI passado o index`);
  }
  else {
    if (index != null) throw new Error(`fld ${fld} NÂO é do tipo array e FOI passado o index`);
  }
  const [state, setState] = React.useState({ value: valueOriginalForEdit(dataOriginal, fld, index, valueType), valueError: false });

  const atuVal = (value: any, initiating = false) => {
    //userAlt && csd('chgVal', value);
    let valueError = false;
    let valToSend = undefined;
    try {
      if (valueType === ValueType.boolean)
        valToSend = value;
      else if (valueType === ValueType.options) {
        valToSend = value;
        if (valToSend == '') valToSend = undefined;
      }
      else {
        valToSend = value?.trim();
        if (valToSend == '') valToSend = undefined;
        else {
          if (valueType === ValueType.amount)
            amountParse(value);
          else if (valueType === ValueType.number)
            amountParse(value, 0);
        }
      }
      if (mandatory &&
        valToSend === undefined)
        throw new Error('campo obrigatório');
    }
    catch (error) {
      valueError = true;
    }
    //csd({ fld, mandatory, value, valueDb });
    setState({ value, valueError });
    fldNewValue({ fld, index, value, valueError, initiating });
  };
  React.useEffect(() => {
    if (arrayItens == null)
      fldCtrl.atuVal = (value) => atuVal(value, false);
    else {
      if (fldCtrl.atuVal == null)
        fldCtrl.atuVal = new Array(arrayItens).fill(undefined);
      fldCtrl.atuVal[index] = (value) => atuVal(value, false);
    }
    //setStateSubords.push({ fld, index, atuVal: (value) => atuVal(value, false) });
    //csd('effect', fld);
    atuVal(state.value, true); // força a validação ao montar o campo;
  }, []);
  let textAlign;
  if (valueType === ValueType.amount || valueType === ValueType.number) textAlign = 'right';
  if (valueType === ValueType.boolean)
    return (
      <SwitchMy disabled={disabled} checked={state.value}
        onChange={(ev) => atuVal(ev.target.checked)}
        size='small'
      />
    );
  else if (valueType === ValueType.options)
    return (
      <SelectMy disabled={disabled} value={state.value} error={state.valueError}
        onChange={(ev) => atuVal(ev.target.value)}
        options={options}
        fontSize={fontSizeGrid}
      />
    );
  else
    return (
      <Input disabled={disabled} value={state.value} error={state.valueError}
        onChange={(ev) => atuVal(ev.target.value)}
        // onBlur={(ev) => blurValMes(fld, ev.target.value, optionsFld)}
        inputProps={{ style: { padding: 0, textAlign, fontSize: fontSizeGrid } }}
      // onKeyDown={(ev) => handleKeyDownInput(funcId(data), fld, ev, optionsFld)}
      />
    );
};