import nodemailer, { SentMessageInfo } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { Env, EnvSvr, EnvSvrEmailConfig, IEmailConfig } from '../libCommon/envs';

import { isAmbDevOrQas } from '../libCommon/isAmb';
import { dbg, ScopeDbg } from '../libCommon/dbg';
import { CalcExecTime, CtrlRecursion } from '../libCommon/util';

import { LogSentMessagesFn } from './util';

interface EmailConfig {
  host: string;
  port: number;
  auth: { user: '', pass: '', name: '' };
  to?: string | Mail.Address;
  //from?: string | Mail.Address;
  replyTo?: string | Mail.Address;
  secure: boolean;
}

export interface SendEmailParams {
  to: string | Mail.Address;
  bcc?: string;
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  replyTo?: string | Mail.Address;
  forceErrPsw?: boolean;
  forceErrTO?: boolean;
}

const _ctrlRecursion: { func: string, ctrlRecursion: CtrlRecursion }[] = [];
const GetCtrlRecursion = (func: string) => {
  let item = _ctrlRecursion.find((x) => x.func == func);
  if (item == null)
    _ctrlRecursion.push(item = { func, ctrlRecursion: new CtrlRecursion(`sendMail->${func}`, 10) });
  //csl(`callApi ctrlRecursion`, _ctrlRecursion.map((x) => `${x.context}: ${x.ctrlRecursion.status()}`));
  return item.ctrlRecursion;
};

// mensagens do App

export async function SendMailASync(sendEmailParams: SendEmailParams, context: string, timeOut?: number, logFn?: LogSentMessagesFn) {
  return await _SendMailASync(sendEmailParams, context, null, timeOut, logFn);
}
export async function SendMailOptionsASync(sendEmailParams: SendEmailParams, context: string, emailConfig: EmailConfig = null) {
  return await _SendMailASync(sendEmailParams, context, emailConfig);
}

let seqMailCtr = 0;

// async..await is not allowed in global scope, must use a wrapper

export const sysEmailSupport = '*support*';

async function _SendMailASync(sendEmailParams: SendEmailParams, context: string, emailConfig: EmailConfig = null, timeOut?: number, logFn?: LogSentMessagesFn) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  // const testAccount = await nodemailer.createTestAccount();
  // // create reusable transporter object using the default SMTP transport
  // const transporter = nodemailer.createTransport({
  //   host: 'smtp.ethereal.email',
  //   port: 587,
  //   secure: false, // true for 465, false for other ports
  //   auth: {
  //     user: testAccount.user, // generated ethereal user
  //     pass: testAccount.pass, // generated ethereal password
  //   },
  // });

  const ctrlRecursion = GetCtrlRecursion('_SendMailASync');
  if (ctrlRecursion.inExceeded(sendEmailParams.subject)) return;

  const dbgE = (level: number, ...params) => dbg({ level, levelScope: ScopeDbg.e, context }, `==> SendMail(${++seqMailCtr})`, ...params);

  const subjectUseMail = (isAmbDevOrQas() ? `(${Env('amb')}/${EnvSvr('plataform')}) ` : '') + sendEmailParams.subject;

  dbgE(1, `subject: ${sendEmailParams.subject}`);

  let resultOk: string = null;
  let resultError: string = null;
  let errorThrow: Error = null;

  //const calcExecTimeFull = new CalcExecTime();

  const calcExecTimeSend = new CalcExecTime();

  try {

    let emailConfigUse: EmailConfig | IEmailConfig = null;
    if (emailConfig != null)
      emailConfigUse = emailConfig;
    else
      emailConfigUse = EnvSvrEmailConfig();

    if (sendEmailParams.forceErrPsw)
      emailConfigUse.auth.pass += 'xx';

    // emailConfigUse = {
    //   host: 'smtp.gmail.com',
    //   port: 465,
    //   auth: { user: 'cdf.autom@gmail.com', pass: 'ypdqasfrjrbewfsv' },
    //   from: { email: 'frommmm@gmail.com', name: 'nome do from' },
    //   replyTo: { email: 'replyyyy@gmail.com', name: 'nome do reply' },
    //   to: { email: 'toooo@gmail.com', name: 'nome do to' },
    // }

    let secure;
    // if (emailConfigUse.secure != null)
    //   secure = emailConfigUse.secure;
    // else {
    if (emailConfigUse.secure != null)
      secure = emailConfigUse.secure;
    else {
      if (emailConfigUse.port == 465)
        secure = true;
      else
        secure = false;
    }
    //}

    const mailOpt: SMTPTransport.Options = {
      host: emailConfigUse.host,
      port: emailConfigUse.port,
      secure,
      auth: emailConfigUse.auth,
    };

    if (sendEmailParams.forceErrTO)
      mailOpt.connectionTimeout = 1;
    if (timeOut != null)
      mailOpt.connectionTimeout = timeOut;
    //logger: true,
    ////debug: true,      
    ////transactionLog: true,
    dbgE(2, { mailOpt });

    //csl(`sending mail ${seqMail} - opt`, mailOpt);

    const transporter = nodemailer.createTransport(mailOpt);
    //csl(`sending mail ${seqMail} - pos createTransport`);

    // send mail with defined transport object
    // const info = await transporter.sendMail({
    //   from: Env(  EMAIL_FROM),
    //   to: emailToUse,
    //   subject: subject, // Subject line
    //   text: bodyText,
    //   html: bodyHtml
    // });

    //const to = sendEmailParams.to === epecialEmailSupport ? (emailConfigUse.to || emailConfigUse.auth.user) : sendEmailParams.to;
    const to = sendEmailParams.to === sysEmailSupport ? Env('emailSupport') : sendEmailParams.to;

    const recipients: Mail.Options = {
      // //from: emailConfigUse.from || emailConfigUse.auth.user,  // o address do 'from' é ignorado (sempre usa o do auth.user, mas é necessário informar!)
      from: { address: emailConfigUse.auth.user, name: emailConfigUse.auth.name },
      to,
      bcc: sendEmailParams.bcc,
      replyTo: sendEmailParams.replyTo,
    };

    dbgE(3, { recipients });

    const sendMailResult: SentMessageInfo = await transporter.sendMail({
      ...recipients,
      subject: subjectUseMail, // Subject line
      text: sendEmailParams.bodyText,
      html: sendEmailParams.bodyHtml
    });
    // .then((x) => ResultOk({ response: x.response }))
    // .catch(ResultErr);
    //.finally(() => csl('finally sendMail'));

    // if (sendMailResult.error)
    //   throw new Error(sendMailResult.error + 'aaa');

    // // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // // Preview only available when sending through an Ethereal account
    // csl('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

    resultOk = sendMailResult.response;
    //result = { response: sendMailResult.response, emailConfigUse, recipients };
    dbgE(1, `sent: in ${calcExecTimeSend.elapsedMs()}ms, response: ${sendMailResult.response}`);
  } catch (error) {
    dbgE(0, `error: in ${calcExecTimeSend.elapsedMs()}ms: ${error.message}`);
    //dbgError(dbgContext, `Erro ao mandar email (${subject}): ${error.message}`);
    //if (logError)
    //SystemError('sendMail', `Erro ao mandar email ${dbgContext} (${subject}): ${error.message}`);

    //result = { errorMessage: error.message };
    resultError = error.message;
    errorThrow = error;
  }

  ctrlRecursion.out();

  // if (errorThrow != null)
  //   throw errorThrow;

  //const elapsed = calcExecTimeFull.elapsedMs();

  if (logFn != null)
    await logFn(resultOk, resultError);

  if (errorThrow != null)
    throw errorThrow;

  return { sendEmailParams, resultOk }; // elapsed, resultError, 
}