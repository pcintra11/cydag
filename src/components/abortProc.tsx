import { Box } from '@mui/material';

import { LoggedUserBase } from '../base/db/types';

import { ErrorPlus, FriendlyErrorMsgApi, IsErrorLogged, IsErrorManaged, OnClient } from '../libCommon/util';
import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';

import { SystemMsgCli } from '../libClient/systemMsgCli';

import { LinkHelpEmail } from './';

export interface AbortProcType {
  error: Error | ErrorPlus;
  point: string;
  hour?: Date;
}

// LogErrorUnmanaged deve estar aqui !!!!!
export function AbortProc({ error, tela, loggedUserBase }: { error: Error | ErrorPlus, tela: string, loggedUserBase?: LoggedUserBase }) {
  const hour = new Date();
  if (IsErrorManaged(error))
    return (
      <Box mt='1.5rem'>
        {error?.message}
      </Box>
    );
  else {
    return (
      <Box mt='1.5rem' display='flex' flexDirection='column' gap={1}>
        <Box>{FriendlyErrorMsgApi(error)}.</Box>
        <Box>Lamentamos pelo ocorrido, mas já estamos cientes e trabalhando na solução.</Box>
        <LinkHelpEmail tela={tela} loggedUserBase={loggedUserBase} errorMsgHour={{ message: FriendlyErrorMsgApi(error), hour }} />
      </Box>
    );
  }
}
export function AbortProcComponent({ error, component }: { error: Error | ErrorPlus, component: string }) {
  if (IsErrorManaged(error))
    return (<Box>Problema em {component}: {error?.message}.</Box>);
  else {
    return (<Box>Problema em {component}: {FriendlyErrorMsgApi(error)}.</Box>);
  }
}

export async function LogErrorUnmanaged(error: Error | ErrorPlus | string, point: string, details: object = {}) {
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