import { Box } from '@mui/material';

import { ErrorPlus, FriendlyErrorMsgApi, IsErrorLogged, IsErrorManaged } from '../libCommon/util';
import { OnClient } from '../libCommon/sideProc';
import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';

import { SystemMsgCli } from '../libClient/systemMsgCli';

import { LoggedUserBase } from '../app_base/loggedUserBase';

import { LinkHelpEmail, Tx } from './';

export interface IAbortProcType {
  error: Error | ErrorPlus;
  point: string;
  hour?: Date;
}

// LogErrorUnmanaged deve estar aqui !!!!!
export function AbortProc({ error, tela, loggedUserBase }: { error: Error | ErrorPlus, tela: string, loggedUserBase?: LoggedUserBase }) {
  const hour = new Date();
  if (IsErrorManaged(error))
    return (
      <Tx m='1.5rem'>
        {error?.message}
      </Tx>
    );
  else {
    return (
      <Box m='1.5rem' display='flex' flexDirection='column' gap={1}>
        <Tx>{FriendlyErrorMsgApi(error)}.</Tx>
        <Tx>Lamentamos pelo ocorrido, mas já estamos cientes e trabalhando na solução.</Tx>
        <LinkHelpEmail tela={tela} loggedUserBase={loggedUserBase} errorMsgHour={{ message: FriendlyErrorMsgApi(error), hour }} />
      </Box>
    );
  }
}
export function AbortProcComponent({ error, component }: { error: Error | ErrorPlus, component: string }) {
  if (IsErrorManaged(error))
    return (<Tx>Problema em {component}: {error?.message}.</Tx>);
  else {
    return (<Tx>Problema em {component}: {FriendlyErrorMsgApi(error)}.</Tx>);
  }
}

export async function LogErrorUnmanaged(error: Error | ErrorPlus, point: string, details: object = {}) {
  // não é componente @!!!!!!
  // sempre passar details @@!!!!!
  const hour = new Date();
  if (!IsErrorManaged(error) &&
    !IsErrorLogged(error) &&
    OnClient()) {
    const msgError = typeof (error) == 'string' ? error : error.message;
    SystemMsgCli(CategMsgSystem.error, point, msgError, { ...details, hour });
  }
}