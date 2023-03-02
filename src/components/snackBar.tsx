import React from 'react';

import Snackbar_mui from '@mui/material/Snackbar';
import IconButton_mui from '@mui/material/IconButton';
import CloseIcon_mui from '@mui/icons-material/Close';
import Alert_mui from '@mui/material/Alert';

import { dbgError } from '../libCommon/dbg';

type Severities = 'info' | 'success' | 'error';
let _snackBarSet: (open: boolean, message?: string, severity?: Severities) => void = null;

// popups de alerta, sucesso, erro, etc
const SnackBarMsg = (props?: { message: string, severity?: Severities }) => {
  if (_snackBarSet == null) {
    dbgError(`${SnackBarContainer.name} não foi criado, mensagem não emitida: `, props.message);
    return;
  }
  if (props == null)
    _snackBarSet(false);
  else
    _snackBarSet(true, props.message, props.severity);
};

export const PopupMsg = {
  error: (message: string) => SnackBarMsg({ message, severity: 'error' }),
  success: (message: string) => SnackBarMsg({ message, severity: 'success' }),
  info: (message: string) => SnackBarMsg({ message, severity: 'info' }),
  clear: () => SnackBarMsg(),
};

const autoHideDurationDefault = 4000;
export function SnackBarContainer() {
  const [mainStates, setMainStates] = React.useState<{ open: boolean, message?: string, severity?: Severities, autoHideDuration?: number }>({ open: false });
  //csl({ ctrl });
  const handleClose = () => { // event: React.SyntheticEvent | Event, reason?: string
    //csl('mySnack close', reason);
    setMainStates({ open: false });
  };
  _snackBarSet = (open: boolean, message?: string, severity?: Severities) => {
    //csl('_snackBarSet open', mainStates.open, 'message', message);
    const autoHideDuration = severity == 'error' ? null : autoHideDurationDefault;
    if (open) {
      if (mainStates.open)
        setTimeout(() => setMainStates({ open: true, message: message, severity, autoHideDuration }), 100);
      else
        setMainStates({ open: true, message, severity, autoHideDuration });
    }
    else
      setMainStates({ open: false });
  };

  const action = (
    <React.Fragment>
      <IconButton_mui
        size='small'
        aria-label='close'
        color='inherit'
        onClick={handleClose}
      >
        <CloseIcon_mui fontSize='small' />
      </IconButton_mui>
    </React.Fragment>
  );

  // revisar as cores para alert (muito fracas)
  return (
    <Snackbar_mui
      open={mainStates.open}
      autoHideDuration={mainStates.autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      {mainStates.open
        ? <Alert_mui severity={mainStates.severity} variant='filled'>
          {mainStates.message}
          {action}
        </Alert_mui>
        : <div></div>
      }
    </Snackbar_mui>
  );
}