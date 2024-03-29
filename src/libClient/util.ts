import { CSSProperties } from 'react';
import { SxProps } from '@mui/material';

import { MessageLevelUpload } from '../libCommon/uploadCsv';
import { IThemePlus } from '../styles/themeTools';

export const propsByMessageLevel = (theme: IThemePlus, level: MessageLevelUpload) => {
  const sxProps: SxProps = { color: '' };
  if (level == MessageLevelUpload.error)
    sxProps.color = theme.palette.error.main;
  else if (level == MessageLevelUpload.warn)
    sxProps.color = theme.palette.warning.main;
  return sxProps;
};

/***
 * Apenas onde não tiver quebra de linha
 */
export const cssTextNoWrapEllipsis: CSSProperties = {
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
};