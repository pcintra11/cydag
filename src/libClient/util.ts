import { CSSProperties } from 'react';
import { SxProps } from '@mui/material';

import { MessageLevelUpload } from '../libCommon/uploadCsv';
import { ThemePlus } from '../styles/themeTools';

export const propsByMessageLevel = (theme: ThemePlus, level: MessageLevelUpload) => {
  const sxProps: SxProps = { color: '' };
  if (level == MessageLevelUpload.error)
    sxProps.color = theme.palette.error.main;
  else if (level == MessageLevelUpload.warn)
    sxProps.color = theme.palette.warning.main;
  return sxProps;
};

export const cssTextNoWrapEllipsis: CSSProperties = {
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
};