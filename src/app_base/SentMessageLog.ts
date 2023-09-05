
import { dbgError } from '../libCommon/dbg';
import { CtrlContext } from '../libCommon/ctrlContext';

import { CloseDbASync, ConnectDbASync, UriDb } from '../libServer/dbMongo';

import { SentMessageModel } from './model';
import { SentMessage } from './modelTypes';

export async function SentMessageLogASync(sentMessage: SentMessage, resultOk: string, resultError: string, ctrlContext: CtrlContext) {
  const agora = new Date();
  if (UriDb() == null)
    return;
  try {
    await ConnectDbASync({ ctrlContext });
    await SentMessageModel.create(
      SentMessage.fill({
        ...sentMessage,
        date: agora,
        resultOk,
        resultError,
      }));
    await CloseDbASync({ ctrlContext });
  } catch (error) {
    dbgError('SentMessageLog', error.message);
  }
}