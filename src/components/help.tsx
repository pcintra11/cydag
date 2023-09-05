import { useRouter } from 'next/router';

import { AnchorHrefMailTo, DateDisp } from '../libCommon/util';

import { configApp } from '../app_hub/appConfig';

import { LoggedUserBase } from '../app_base/loggedUserBase';

import { FakeLink, Tx } from './ui';

// apresenta um link para envio de email para o suporte, com as informações do problema
export function LinkHelpEmail({ tela, loggedUserBase, info, errorMsgHour }: { tela?: string, loggedUserBase?: LoggedUserBase, info?: string, errorMsgHour?: { message: string, hour: Date } }) {
  if (configApp.support.email == null)
    return (<></>);
  //const { loggedUser } = useLoggedUser({ id: 'LinkHelpEmail' });

  const router = useRouter();

  const subject = `Ajuda para utilização de ${configApp.appName}` + (tela != null ? ` - tela ${tela}` : '');
  let body = '';
  if (errorMsgHour != null) {
    const userInfo = loggedUserBase == null ? '' : `conta: ${loggedUserBase.email}\n`;
    body = `Mensagem: ${errorMsgHour.message}\n` +
      `Hora da ocorrência: ${DateDisp(errorMsgHour.hour, 'dmyhm')}\n` +
      `${userInfo}` +
      '-------------------\n' +
      'Se houver algo mais a relatar por favor nos informe abaixo.\n' +
      '\n\n';
  }
  if (info != null)
    body += `${info}\n\n\n`;

  const text = errorMsgHour != null
    ? 'Se o problema persistir por favor entre em contato clicando'
    : 'Se quiser falar conosco entre em contato clicando';
  //  mt='1.5rem'
  return (
    <Tx>
      {text}
      {' '}<FakeLink onClick={() => router.push(`${AnchorHrefMailTo(configApp.support.email, subject, body)}`)}>aqui</FakeLink>
    </Tx>
    
    // <>
    //   <a href={`${AnchorHrefMailTo(configApp.support.email, subject, body)}`}>{linkText}</a>
    // </>
  );
}