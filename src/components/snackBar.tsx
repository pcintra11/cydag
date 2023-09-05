import React from 'react';

import { Box, Snackbar, Alert } from '@mui/material';
//import CloseIcon from '@mui/icons-material/Close';

import { csd, dbgError } from '../libCommon/dbg';
import { ErrorPlus, FriendlyErrorMsgApi } from '../libCommon/util';

import { FakeLink, Tx } from './ui';

type Severity = 'info' | 'success' | 'error';
let _snackBarSet: (open: boolean, body: React.ReactElement, severity: Severity) => void = null;

interface ISnackBarMsg {
  body?: React.ReactElement;
  severity?: Severity;
}
const SnackBarMsg = ({ body, severity }: ISnackBarMsg) => {
  if (_snackBarSet == null) {
    dbgError('SnackBarMsg', `${SnackBarContainer.name} não foi criado, mensagem não emitida`);
    return;
  }
  if (body == null)
    _snackBarSet(false, null, null);
  else
    _snackBarSet(true, body, severity);
};

type PopUpMessage = string | string[] | React.ReactElement;
const makeBody = (message: PopUpMessage) => {
  if (typeof message === 'string')
    return (<>
      {message.split('\n').map((x, i) => <Tx color='white' paragraph key={i}>{x}</Tx>)}
    </>);
  else if (Array.isArray(message))
    return (<>
      {message.map((msg, imsg) => msg.split('\n').map((x, i) => <Tx color='white' paragraph key={`${imsg}-${i}`}>{x}</Tx>))}
    </>);
  else return message;
};

export const PopupMsg = {
  error: (message: PopUpMessage | Error | ErrorPlus) => {
    const messageUse = (message instanceof Error || message instanceof ErrorPlus) ? FriendlyErrorMsgApi(message) : message;
    SnackBarMsg({ body: makeBody(messageUse), severity: 'error' });
  },
  success: (message: PopUpMessage) => SnackBarMsg({ body: makeBody(message), severity: 'success' }),
  info: (message: PopUpMessage) => SnackBarMsg({ body: makeBody(message), severity: 'info' }),
  clear: () => SnackBarMsg({}),
};

export function SnackBarContainer() {
  const [mainStates, setMainStates] = React.useState<{ open: boolean, message?: string, body?: React.ReactElement, severity?: Severity, autoHideDuration?: number }>({ open: false });
  //csl({ ctrl });
  const handleClose = () => { // event: React.SyntheticEvent | Event, reason?: string
    //csl('mySnack close', reason);
    setMainStates({ open: false });
  };
  _snackBarSet = (open: boolean, body: React.ReactElement, severity: Severity) => {
    const autoHideDuration = severity === 'success' ? 4000 : null;
    if (open) {
      if (mainStates.open)
        setTimeout(() => setMainStates({ open: true, body, severity, autoHideDuration }), 100);
      else
        setMainStates({ open: true, body, severity, autoHideDuration });
    }
    else
      setMainStates({ open: false });
  };

  const closeIcon = (
    <Box mt={2} display='flex'>
      {/* <IconButton
        size='small'
        aria-label='close'
        color='inherit'
        onClick={handleClose}
      >
        <CloseIcon fontSize='small' />
      </IconButton> */}
      <Box ml='auto'>
        <FakeLink color='white' onClick={handleClose}>Fechar</FakeLink>
      </Box>
    </Box>
  );

  // revisar as cores para alert (muito fracas)
  return (
    <Snackbar
      open={mainStates.open}
      autoHideDuration={mainStates.autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      {mainStates.open
        ? <Alert severity={mainStates.severity} variant='filled'>
          {mainStates.message != null &&
            <>
              {mainStates.message.split('\n').map((x, i) => <Tx key={i}>{x}</Tx>)}
            </>
          }
          {mainStates.body != null && <>{mainStates.body}</>}
          {closeIcon}
        </Alert>
        : <Box></Box>
      }
    </Snackbar>
  );
}