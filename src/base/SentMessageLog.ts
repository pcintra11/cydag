
import { dbgError } from '../libCommon/dbg';

import { CtrlApiExec } from '../libServer/util';
import { CloseDbASync, ConnectDbASync, UriDb } from './db/functions';

import { SentMessageModel } from './db/models';
import { SentMessage } from './db/types';

export async function SentMessageLogASync(sentMessage: SentMessage, resultOk: string, resultError: string, ctrlApiExec: CtrlApiExec) {
  const agora = new Date();
  if (UriDb() == null)
    return;
  try {
    await ConnectDbASync({ context: `${ctrlApiExec.context()}-SentMessageLog` });
    await SentMessageModel.create({
      ...sentMessage,
      date: agora,
      resultOk,
      resultError,
    } as SentMessage);
    await CloseDbASync({ context: `${ctrlApiExec.context()}-SentMessageLog` });
  }
  catch (error) {
    dbgError('SentMessageLogASync error', error.message);
  }
}