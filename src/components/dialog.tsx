import React from 'react';
import Dialog_mui from '@mui/material/Dialog';
import Button_mui from '@mui/material/Button';
import DialogActions_mui from '@mui/material/DialogActions';
import DialogContent_mui from '@mui/material/DialogContent';
import DialogContentText_mui from '@mui/material/DialogContentText';
import DialogTitle_mui from '@mui/material/DialogTitle';

import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';

import { SystemMsgCli } from '../libClient/systemMsgCli';

import { FrmInput } from './fldMyForm';
import { Box } from '@mui/material';

export interface IDialogInput { label: string }
export interface IDialogButton { text: string, onClick?: (inputResponses: string[]) => void; fnCheck?: (inputResponses: string[]) => string }

let _dialogSet: (open: boolean, title?: string, body?: string[], dialogInputs?: IDialogInput[], buttons?: IDialogButton[]) => void = null;

interface IDialogMyProps { title?: string, body: string[] | string, dialogInputs?: IDialogInput[], buttons: IDialogButton[] }
export const DialogMy = ({ title, body, dialogInputs, buttons }: IDialogMyProps) => {
  let bodyUse;
  if (Array.isArray(body))
    bodyUse = body;
  else
    bodyUse = [body];

  if (_dialogSet == null) {
    //dbgError(`${DialogMy.name} não foi criado, diálogo não processado: `, bodyUse.join('; '));
    SystemMsgCli(CategMsgSystem.error, 'DialogMy', `${DialogMy.name} não foi criado, diálogo não processado: `, { title, body });
    return;
  }
  // if (props == null)
  //   _dialogSet(false);
  // else
  _dialogSet(true, title, bodyUse, dialogInputs, buttons);
};

export function DialogContainer() {
  const [mainStates, setMainStates] = React.useState<{
    open: boolean;
    title?: string; body?: string[];
    dialogInputs?: IDialogInput[]; buttons?: IDialogButton[];
  }>({ open: false });
  const [msgErro, setMsgErro] = React.useState<string>(null);
  const [inputResponse1, setInputResponse1] = React.useState<string>();
  const [inputResponse2, setInputResponse2] = React.useState<string>();
  const [inputResponse3, setInputResponse3] = React.useState<string>();
  const handleClose = () => {
    setMainStates({ open: false });
  };
  _dialogSet = (open: boolean, title?: string, body?: string[], dialogInputs?: IDialogInput[], buttons?: IDialogButton[]) => {
    if (open) {
      setInputResponse1('');
      setInputResponse2('');
      setInputResponse3('');
      setMsgErro(null);
      if (mainStates.open) {
        setMainStates({ open: false });
        setTimeout(() => setMainStates({ open: true, title, body, dialogInputs, buttons }), 1000);
      }
      else
        setMainStates({ open: true, title, body, dialogInputs, buttons });
    }
    else
      setMainStates({ open: false });
  };

  const clickButton = (dialogButton: IDialogButton) => {
    const inputResponses = [inputResponse1, inputResponse2, inputResponse3];
    if (dialogButton.fnCheck != null) {
      const msgErro = dialogButton.fnCheck(inputResponses);
      setMsgErro(msgErro);
      if (msgErro != null)
        return;
    }
    handleClose();
    dialogButton.onClick != null && dialogButton.onClick(inputResponses);
  };

  // revisar as cores para alert (muito fracas)
  return (
    <Dialog_mui
      open={mainStates.open}
      onClose={handleClose}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      {mainStates.open &&
        <>
          {mainStates.title &&
            <DialogTitle_mui id='alert-dialog-title'>
              {mainStates.title}
            </DialogTitle_mui>
          }
          <DialogContent_mui>
            {mainStates.body.map((text, index) =>
              <DialogContentText_mui key={index} id='alert-dialog-description'>
                {text}
              </DialogContentText_mui>
            )}
          </DialogContent_mui>
          {mainStates.dialogInputs != null &&
            <Box m={1}>
              {(mainStates.dialogInputs.length > 0) && <FrmInput label={mainStates.dialogInputs[0].label} value={inputResponse1} onChange={(ev) => setInputResponse1(ev.target.value)} />}
              {(mainStates.dialogInputs.length > 1) && <FrmInput label={mainStates.dialogInputs[1].label} value={inputResponse2} onChange={(ev) => setInputResponse2(ev.target.value)} />}
              {(mainStates.dialogInputs.length > 2) && <FrmInput label={mainStates.dialogInputs[2].label} value={inputResponse3} onChange={(ev) => setInputResponse3(ev.target.value)} />}
            </Box>
          }
          {mainStates.buttons != null &&
            <DialogActions_mui>
              {mainStates.buttons.map((dialogButton, index) =>
                <Button_mui key={index} onClick={() => clickButton(dialogButton)}>{dialogButton.text}</Button_mui>
              )}
            </DialogActions_mui>
          }
          {msgErro &&
            <DialogContent_mui>
              {/* class error @!!!! */}
              <DialogContentText_mui className='Mui-error'>
                {msgErro}
              </DialogContentText_mui>
            </DialogContent_mui>
          }
        </>
      }
    </Dialog_mui>
  );
}