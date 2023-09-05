// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

import { NotifyAdmASync } from '../../../../libServer/notifyAdm';
import { CloseDbASync, ConnectDbASync, lastCompile } from '../../../../libServer/dbMongo';

import { HoraDebug, FormatDate } from '../../../../libCommon/util';
import { csd, dbg } from '../../../../libCommon/dbg';
import { CategMsgSystem } from '../../../../libCommon/logSystemMsg_cliSvr';
import { CalcExecTime } from '../../../../libCommon/calcExectime';

import { SystemMsgSvrASync } from '../../../../libServer/systemMsgSvr';
import { ResumoApi, GetCtrlApiExec } from '../../../../libServer/util';
import { ApiStatusDataByErrorASync } from '../../../../libServer/apiStatusDataByError';
import { SendMailASync, sysEmailSupport } from '../../../../libServer/sendMail';

//import { GetClientInfo, GetClientInfoVip } from '../../../../techno_whichBrowser/clientInfoSvr';
//import { IClientInfoVip } from '../../../../techno_whichBrowser/types';
import { GetIPinfoASync, GetIPinfoVip } from '../../../../techno_ipInfo/getIpInfoASync';
import { IPinfoVip } from '../../../../techno_ipInfo/types';

// import { UserModel } from '../../../../appVzn/modelsUser';  //@!!!!!!!!!!!! vzn!
// import { UnscrambleApp } from '../../../../appVzn/utilServer';
import { EnvInfoHost } from '../../../../app_base/envs';

//http://localhost:3001/api/tst/monitor?from=aquimesmo&_nivelLog=1

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const ctrlApiExec = GetCtrlApiExec(req, res, null);
  const parm = ctrlApiExec.parm;
  const resumoApi = new ResumoApi(ctrlApiExec);

  // pega infos do IP, grava uma warning e mandar um email, mostra os tempos de processamento de cada processamento
  // SetNivelLog(3, ScopeDbg.d);
  // SetNivelLog(3, ScopeDbg.x);


  try {
    await ConnectDbASync({ ctrlContext: ctrlApiExec.ctrlContext });

    try {
      const from = parm?.from || '???';
      const errorsVet: { mainMsg: string, variableInfo: string }[] = [];

      const result = {
        hora: HoraDebug(),
        from,
        apiHost: EnvInfoHost(), //  ctrlApiExec.apiHost
        //clientInfoVip: null as IClientInfoVip,
        ipInfoVip: null as IPinfoVip,
        ipInfoExec: null as string,

        writeWarningExec: <string>null,
        sendMailExec: <string>null,
        usersDb: <string[]>[],
        //erros: <string>null,
      }; //@@!!!!!!

      // try {
      //   const clientInfo = GetClientInfo(ctrlApiExec);
      //   result.clientInfoVip = GetClientInfoVip(clientInfo);
      // } catch (error) {
      //   errorsVet.push({ mainMsg: 'ClientInfoVip', variableInfo: error.message });
      // }

      const calcExecTimeIPinfo = new CalcExecTime();
      try {
        const ipInfo = await GetIPinfoASync(ctrlApiExec.ip);
        result.ipInfoVip = GetIPinfoVip(ipInfo);
      } catch (error) {
        errorsVet.push({ mainMsg: 'ipInfoVip', variableInfo: error.message });
      }
      result.ipInfoExec = `${calcExecTimeIPinfo.elapsedMs()}`;

      const msg = `${EnvInfoHost()} monit - from ${from} ; comp ${lastCompile} ; hora ${result.hora}`;
      //const text = `CDF-Monitor ${req.headers.host} ${req.url} ${formatDate(result.hora, 'yyyy-MM-dd HH:mm:SS:SSS z')}`;
      //msg += ` ; ip ${result.clientInfoVip.ipv4 || result.clientInfoVip.ipv6}`;

      const calcExecTimeWriteWarning = new CalcExecTime();
      try {
        await SystemMsgSvrASync(CategMsgSystem.warn, '*', msg, ctrlApiExec.ctrlContext);
      } catch (error) {
        errorsVet.push({ mainMsg: 'writeWarning', variableInfo: error.message });
      }
      result.writeWarningExec = `${calcExecTimeWriteWarning.elapsedMs()}`;

      // @@@! incluir alguma query !
      // não deve usar SystemWarning !

      const calcExecTimeSendMail = new CalcExecTime();
      try {
        await SendMailASync({ to: sysEmailSupport, subject: msg }, ctrlApiExec.ctrlContext);
        // , `
        //   <div>
        //     <p>clientInfoVip</p>
        //     ${JsonHtml(result)}
        //   </div>
        // `
        //csl({ sentMail });
      } catch (error) {
        errorsVet.push({ mainMsg: 'sendMail error', variableInfo: error.message });
      }
      result.sendMailExec = `${calcExecTimeSendMail.elapsedMs()}`;

      for (const element of errorsVet)
        await NotifyAdmASync(element.mainMsg, element.variableInfo, ctrlApiExec.ctrlContext);
      //await NotifyAdmASync('monitor', HoraDebug(), ctrlApiExec);

      // const usersDb = await UserModel.find({}).limit(10).lean();
      // result.usersDb = usersDb.map((x) => UnscrambleApp(x.email_messy));

      resumoApi.jsonData({ result, errorsVet }); // @@@@@!! usar padrão value
    } catch (error) {
      const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 1', parm, ctrlApiExec);
      resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
    }

    await CloseDbASync({ ctrlContext: ctrlApiExec.ctrlContext });
  } catch (error) {
    const { httpStatusCode, jsonErrorData } = await ApiStatusDataByErrorASync(error, 'throw 2', parm, ctrlApiExec);
    resumoApi.status(httpStatusCode).jsonData(jsonErrorData);
  }
  resumoApi.json();

  csd(`término ${FormatDate(new Date(), 'HH:mm:ss:sss')}`);
}