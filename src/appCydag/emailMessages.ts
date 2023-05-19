import { ObjectId } from 'mongodb';

import { configApp } from '../app_hub/appConfig';
import { SentMessageLogASync } from '../app_base/SentMessageLog';


import { Env, EnvApiTimeout, EnvDeveloper, isAmbDev, isAmbPrd } from '../app_base/envs';
import { IGenericObject } from '../libCommon/types';
import { AnchorHrefMailTo, DateDisp, UrlForPage } from '../libCommon/util';
import { CtrlContext } from '../libCommon/ctrlContext';
import { dbgError } from '../libCommon/dbg';

import { SendEmailAsyncApi, SendMailASyncManaged } from '../libServer/asyncProcsCalls';

import { GenThemePlus } from '../styles/themeTools';

import { themeSchemesHub } from '../app_hub/clientResources';

import { pagesApp } from './endPoints';

// #region links por email
interface IBodyForLinks1Props {
  //homeHref: string;
  linkHref: string;
  linkText: string;
  title: string;
  text?: string;
  expireIn?: Date;
}

const bodyForLinks1 = (props: IBodyForLinks1Props) => {
  const theme = GenThemePlus(themeSchemesHub);

  const infoAmbiente = !isAmbPrd() ? `<p>Ambiente ${Env('amb')}</p>` : '';
  const textHtml = props.text != null ? `<p style='text-align:center; margin:20px; font-size:16pt;'>${props.text}</p>` : '';
  const expireInHtml = props.expireIn != null ? `<p style='text-align:center; margin-top:10px; margin-bottom:40px; font-size:10pt;'>Link válido até ${DateDisp(props.expireIn, 'dmyhm')}</p>` : '';
  //const homeHref = Env('appUrl');
  //const subjectEmailHelp = `Ajuda para o procedimento "${props.linkText}"`;
  const subjectEmailHelp = `Ajuda para o procedimento "${props.linkText}"`;
  return (
    `
    <div style='text-align:center; margin:10px; font-size:20pt;'>
      <hr style='height:10px; margin: 10px; color:${theme.palette.primary.main}' />

      <p style='font-size:35pt;'>${configApp.appName}</p>

      <p style='text-align:center; margin:20px; font-size:20pt;'>${props.title}</p>

      ${textHtml}

      <a href=${props.linkHref}>
        <span style='padding-left:20px;padding-right:20px;font-size:16pt;display:inline-block;letter-spacing:normal;color:white;background:${theme.palette.primary.dark};'>
          <span style='font-size:16pt; line-height:2; mso-line-height-alt:32px;'>&nbsp;${props.linkText}&nbsp;</span>
        </span>
      </a>

      ${expireInHtml}
    
      <hr />
      <div style='font-size:12pt;'>
        <p>
          Se você não reconhece essa atividade por favor desconsidere a mensagem.
        </p>        
        <p>
          Não responda para esse endereço. Precisando de ajuda entre em contato por este email: <a href=${AnchorHrefMailTo(configApp.support.email, subjectEmailHelp)}>${configApp.support.email}</a>
        </p>       
      </div>
      ${infoAmbiente}
    </div>
    `);
  // <div>
  //   <a href=${homeHref}>${Env('appUrl_hostDomain')}</a>
  // </div>
};

export async function SendLink_resetPswASync(ctrlContext: CtrlContext, userId: ObjectId, email: string, name: string,
  query: IGenericObject, expireIn: Date) {
  return await SendLinkASync(ctrlContext, userId, email, pagesApp.userResetPsw.pagePath, query, expireIn, bodyForLinks1,
    'Reset de senha',
    `Olá ${name}.`,
    null,
    'Clique aqui para alterar sua senha');
}

// possíveis retornos
// para erros graves throw error
// para erros no envio (timeout) tenta enviar novamente em background (de forma assíncrona)
async function SendLinkASync(ctrlContext: CtrlContext, userId: ObjectId, email: string, pagePath: string, query: IGenericObject, expireIn: Date, bodyCb: (props: IBodyForLinks1Props) => string,
  subject: string, title: string, text: string, linkText: string) {
  const elapsedMsApi = ctrlContext.calcExecTime.elapsedMs();
  //let resultOk = null;
  //let resultError = null;
  const replyTo = configApp.support.email;
  // const methodAsync = false; // (new Date()).getSeconds() < 30 ? true : false;
  // dbgInfo('subject', subject, ' - método async', methodAsync);
  try {
    //const homeHref = FullUrl(ctrlApiExec, pageHome.pagePath);
    const linkHref = UrlForPage(pagePath, query);
    const bodyHtml = bodyCb({ linkHref, linkText, title, text, expireIn }); // homeHref, 
    let to: string = null;
    let bcc: string = null;
    const emailDeveloper = EnvDeveloper().email;
    if (!email.includes(',')) {
      if (isAmbDev())
        to = (email != emailDeveloper) ? `pcintra1+${email.replace('@', '.')}@gmail.com` : email;  // dinamizar para email diferente @!!!!!
      else {
        to = email;
        bcc = (email != emailDeveloper) ? emailDeveloper : null;
      }
    }
    else
      to = email;
    const sendMailParams = {
      to,
      bcc,
      subject,
      bodyHtml,
      replyTo,
    };

    const logFn = (userId != null) ? async (resultOk, resultError) => await SentMessageLogASync({ userId, type: 'email', target: email, message: subject }, resultOk, resultError, ctrlContext) : undefined;
    // if (methodAsync)
    //   SendMail(sendMailParams, varsHttp.apiPathMainParams(), logFn)
    //     .then((sendMail) => dbgInfo('SendLink return(async):', `response: ${sendMail.resultOk} ; error: ${sendMail.resultError}`))
    //     .catch((error) => dbgError('SendLink error(async)', error.message)); // @@@@@!!!!
    // else {
    let resultSync: Awaited<ReturnType<typeof SendMailASyncManaged>> = null;
    let errorSync: string = null;
    try {
      const timeOutSendMail = (EnvApiTimeout().exec * 0.9) - elapsedMsApi;
      //console.log({ elapsedMsApi, timeOutSendMail });
      resultSync = await SendMailASyncManaged(sendMailParams, ctrlContext, timeOutSendMail, logFn);
      //dbgInfo('SendLink return(sync) processed');
    } catch (error) {
      errorSync = error.message;
    }
    if (resultSync != null) {
      if (resultSync.resultError != null)
        throw new Error(`Erro no envio síncrono: ${resultSync.resultError} (foi processado e NÂO SERÁ tentado de forma assíncrona)`);
      else
        return { sentSync: true, result: resultSync.resultOk };
    }
    else {
      // tenta enviar de forma assíncrona !
      await SendEmailAsyncApi({ ...sendMailParams, subject: sendMailParams.subject }, ctrlContext);
      return { sentSync: false, result: `Erro na tentativa de envio síncrono: ${errorSync} (SERÁ tentado de forma assíncrona)` };
    }
    //}
  } catch (error) {
    dbgError('SendLink(sync)', error.message);
    //resultError = error.message;
    throw error;

  }
  //console.log('link sent, error:', errorMail);
  //if (resultError != null)
  //throw new Error(resultError);
}
//#endregion
