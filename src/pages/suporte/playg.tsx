import React from 'react';
import { useRouter } from 'next/router';
import * as yup from 'yup';

import dynamic from 'next/dynamic';
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

import { Box, FormControlLabel, Radio, RadioGroup, Stack } from '@mui/material';

import { HoraDebug, StrNormalize, IdByTime, RandomItem, RandomNumber, HttpStatusCode, FillClassProps, CutUndef } from '../../libCommon/util';
import { IGenericObject } from '../../libCommon/types';
import { dbgError } from '../../libCommon/dbg';
import { CategMsgSystem } from '../../libCommon/logSystemMsg_cliSvr';
import { CalcExecTime } from '../../libCommon/calcExectime';
import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { CookieCli } from '../../libClient/cookiesCli';
import localStorage from '../../libClient/localStorage';
import { SystemMsgCli } from '../../libClient/systemMsgCli';

import { Btn, FakeLink, BtnLine, fullHeightScroll, Tx } from '../../components';
import { FrmSetError, FrmCheckbox, FrmInput } from '../../components';
import { FrmDefaultValues, useFrm, NormalizePropsString } from '../../hooks/useMyForm';

import { apisTst, pagesSuporte } from '../../app_suporte/endPoints';
import { CmdApi_Playg } from '../api/app_suporte/tst/playg_types';

const f = ({
  qtd: 'qtd',

  contentSize: 'contentSize',
  contentSizeVariable: 'contentSizeVariable',
  insertInGroup: 'insertInGroup',
  uniqKeys: 'uniqKeys',

  collection: 'collection',
  useDatabaseTst: 'useDatabaseTst',

  tipoExec: 'tipoExec',
  toDo: 'toDo',
  sleepMs: 'sleepMs',
  forceErrPswMail: 'forceErrPswMail',
  forceErrToutMail: 'forceErrToutMail',
  dontWaitPromise: 'dontWaitPromise',
  serverMsg: 'serverMsg',
});

class FrmDataTestsDb {
  qtd: string;
  contentSize: string;
  contentSizeVariable: boolean;
  insertInGroup: boolean;  // comando unico no mongo com todos inserts
  uniqKeys: boolean;  // gera chaves que nunca serão duplicadas
  collection: string;
  useDatabaseTst: boolean;
  static new() { return new FrmDataTestsDb(); }
  static fill(values: FrmDataTestsDb) { return CutUndef(FillClassProps(FrmDataTestsDb.new(), values)); }
}
class FrmDataApiCalls {
  tipoExec?: string;  // Normal, Promisse, Async (callApi async)
  toDo?: string; // M=mail, D=grava db, MD=ambos
  sleepMs?: string;
  qtd?: string;
  forceErrPswMail?: string; // psw errada (numero da ocorrência para gerar o erro)
  forceErrToutMail?: string; // timeout para nodemailer muito baixo
  dontWaitPromise?: string; // não vai aguardar a execução antes do close/response
  serverMsg?: boolean;
  static new() { return new FrmDataApiCalls(); }
  static fill(values: FrmDataApiCalls) { return CutUndef(FillClassProps(FrmDataApiCalls.new(), values)); }
}

class FrmDataMail { // @!!!!!! tb para os outros
  subject: string;
  toEmail: string;
  toName: string;
  replyToEmail: string;
  replyToName: string;
  emailConfig: string;
}

enum PlayArea {
  email = 'email',
  testsDb = 'testsDb',
  testApiCalls = 'testApiCalls',
  localData = 'localData',
  cookieHttpNormal = 'cookieHttpNormal',
  cookieHttpCrypto = 'cookieHttpCrypto',
  aSyncAndDb = 'aSyncAndDb',
  none = 'none',
}

let mount = false; //let mainStatesCache;
const apiCorresp1 = apisTst.playg;
const apiCorresp2 = apisTst.playg_async;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const pageSelf = pagesSuporte.playg;
export default function PagePlayg() {
  //#region 
  const router = useRouter();
  const [playArea, setPlayArea] = React.useState(PlayArea.none as string);
  //const agora = new Date();

  const [resultAcum, setResultAcum] = React.useState<{ id: string, result: any }[]>([]);

  let seqProc = 0;
  const idProcGen = () => `${++seqProc}${IdByTime()}`;

  React.useEffect(() => {
    mount = true;
    //msgsAcum = []; //@!!!!
    setResultAcum([]);
    setPlayArea(PlayArea.none);
    return () => { mount = false; };
  }, [router?.asPath]);

  //#region 
  const appendResults = (id: string, result?: any, withHourAndId = true) => {
    const hourAndId = withHourAndId ? `${HoraDebug()} - ${id} - ` : '';
    //msgsAcum = [...msgsAcum, ...msgs.map((x) => `${hourAndId}${x}`)];
    //csl({ msgs });
    //setResult(<div><p>1:{msgs.length}</p><p>2:{msgs.length}</p></div>);
    setResultAcum((acum) => [...acum, { id: hourAndId, result }]);
  };

  const apiUse = (apiPath) => {
    //const dataCtrl = frmCtrl.getValues();
    // if (dataCtrl.remoteApi) {
    //   const apiUrlOther = Env('apiUrl');
    //   if (apiUrlOther == null)
    //     throw new Error('Env apiUrl não definida');
    //   return `${apiUrlOther}/${apiPath}`;
    // }
    // else
    return apiPath;
  };

  // const parmNivelLog = () => {
  //   const dataCtrl = frmCtrl.getValues();
  //   if (dataCtrl.nivelLog != '')
  //     return { _nivelLog: Number(dataCtrl.nivelLog) };
  //   else
  //     return {};
  // };
  //#endregion 

  // const CmdNoParm = async (cmd: string) => {
  //   const idProc = idProcGen();
  //   const calcExecTime = new CalcExecTime();
  //   //appendResults(`${idProc}-ini (${cmd})`);
  //   try {
  //     const apiReturn = await CallApiCliASync(apiUse(apiCorresp1.apiPath),, { idProc, cmd });
  //     if (!mount) return;
  //     appendResults(`${cmd}-fim ${calcExecTime.elapsedMs()}ms`, apiReturn.value);
  //   } catch (error) {
  //     appendResults(`${cmd}-fim (error) ${calcExecTime.elapsedMs()}ms`, error.message);
  //   }
  // };

  async function SubEnvs() {
    //const horaStart = HoraDebug();
    try {
      const apiReturn = await CallApiCliASync<any>(apiUse(apiCorresp1.apiPath), {
        cmd: CmdApi_Playg.envs,  //...parmNivelLog()
      });
      appendResults('SubEnvs', apiReturn.value);
    } catch (error) {
      appendResults('SubEnvs (error)', error.message);
    }
  }

  const frmTestsDb = useFrm<FrmDataTestsDb>({
    defaultValues: FrmDataTestsDb.fill({
      qtd: '100', contentSize: '1024', contentSizeVariable: false, insertInGroup: true, uniqKeys: true,
      collection: 'base_db_tests', useDatabaseTst: false,
    })
  });
  const frmApiCalls = useFrm<FrmDataApiCalls>({
    defaultValues: FrmDataApiCalls.fill({
      tipoExec: 'n', toDo: 'md', qtd: '1', sleepMs: '4000', serverMsg: false
    }),
  });

  const frmEmail = useFrm<FrmDataMail>({
    defaultValues: FrmDefaultValues(new FrmDataMail()),
    schema: yup.object().shape({
      toEmail: yup.string().email('email inválido'),
      // subject: yup.string().required('assunto do email deve ser informado'),
      // ok: yup.boolean().required('ok deve ser informado'),
      // estado: yup.string().required('estado deve ser informado'),
    })
  });
  const setSampleConfig = (frm) => {
    const config =
    {
      host: 'smtps.uhserver.com', port: 465, 'secure': true,
      auth: { user: 'nome@dominio.com.br', pass: 'xxx', name: 'Nome Sender' }
    };
    frm.setValue('emailConfig', JSON.stringify(config, null, 1));
  };
  const SubMail = async (dataForm: FrmDataMail) => {
    const parm = NormalizePropsString(dataForm);
    //const horaStart = HoraDebug();
    try {
      //setResultMail({ horaStart, horaEnd: '......', dataApi: resultMail.dataApi });
      const apiReturn = await CallApiCliASync<any>(apiUse(apiCorresp1.apiPath), { ...parm, cmd: CmdApi_Playg.mail });
      appendResults('SubMail', apiReturn.value);
    } catch (error) {
      appendResults('SubMail (error)', error.message);
      //setResultMail({ horaStart, horaEnd: HoraDebug(), error: error.message });
    }
  };
  const TestDbWrite = async () => {
    const parm = frmTestsDb.getValues();
    const idProc = idProcGen();
    const calcExecTime = new CalcExecTime();
    appendResults(`${idProc}-ini (params)`, [JSON.stringify(parm)]);
    try {
      const apiReturn = await CallApiCliASync<any>(apiCorresp1.apiPath, { ...parm, idProc, cmd: CmdApi_Playg.testDbWrite });
      if (!mount) return;
      appendResults(`${idProc}-fim ${calcExecTime.elapsedMs()}ms`, apiReturn.value);
    } catch (error) {
      appendResults(`${idProc}-fim (error) ${calcExecTime.elapsedMs()}ms`, [error.message]);
    }
  };
  const TestDbRead = async () => {
    const parm = frmTestsDb.getValues();
    const idProc = idProcGen();
    const calcExecTime = new CalcExecTime();
    appendResults(`${idProc}-ini (params)`, [JSON.stringify(parm)]);
    try {
      const apiReturn = await CallApiCliASync<any>(apiCorresp1.apiPath, { ...parm, idProc, cmd: CmdApi_Playg.testDbRead });
      if (!mount) return;
      appendResults(`${idProc}-fim ${calcExecTime.elapsedMs()}ms`, apiReturn.value);
    } catch (error) {
      appendResults(`${idProc}-fim (error) ${calcExecTime.elapsedMs()}ms`, [error.message]);
    }
  };
  const TestDbReset = async () => {
    const parm = frmTestsDb.getValues();
    try {
      const apiReturn = await CallApiCliASync<any>(apiCorresp1.apiPath, { ...parm, cmd: CmdApi_Playg.testDbReset });
      if (!mount) return;
      appendResults('TestDbReset', apiReturn.value);
    } catch (error) {
      appendResults('TestDbReset (error)', [error.message]);
    }
  };
  const TestApiCalls = async () => {
    const parm = frmApiCalls.getValues();
    //csl(parm);
    const idProc = idProcGen();
    const calcExecTime = new CalcExecTime();
    appendResults(`${idProc}-ini (params)`, [JSON.stringify(parm)]);
    try {
      const apiReturn = await CallApiCliASync<any>(apiCorresp1.apiPath, { ...parm, idProc, cmd: CmdApi_Playg.testApiCalls });
      if (!mount) return;
      appendResults(`${idProc}-fim ${calcExecTime.elapsedMs()}ms`, apiReturn.value);
    } catch (error) {
      appendResults(`${idProc}-fim (error) ${calcExecTime.elapsedMs()}ms`, [error.message]);
    }
  };

  const frmLocalData = useFrm({ mode: 'onChange' });
  async function SubLocalData(cmdCookie) {
    const frm = frmLocalData;
    const dataForm = frm.getValues();
    dataForm.name = StrNormalize(dataForm.name);
    if (cmdCookie != 'getall' &&
      !dataForm.name)
      return FrmSetError(frm, 'name', 'Informação obrigatória');
    //const horaStart = HoraDebug();
    if (cmdCookie == 'set') {
      CookieCli.set(dataForm.name, dataForm.value);
      localStorage.set(dataForm.name, dataForm.value);
      appendResults('SubLocalData', { cmdCookie });
    }
    else if (cmdCookie == 'get') {
      const valueCookie = CookieCli.get(dataForm.name);
      const valueLocalStorage = localStorage.get(dataForm.name);
      appendResults('SubLocalData', { cmdCookie, valueCookie, valueLocalStorage });
    }
    else if (cmdCookie == 'getall') {
      const valueCookie = CookieCli.getAll();
      const valueLocalStorage = localStorage.getAll();
      appendResults('SubLocalData', { cmdCookie, valueCookie, valueLocalStorage });
    }
    else if (cmdCookie == 'remove') {
      CookieCli.remove(dataForm.name);
      localStorage.remove(dataForm.name);
      appendResults('SubLocalData', { cmdCookie });
    }
  }

  function onSubmitDummy(ev: React.FormEvent) {
    ev.preventDefault();
  }
  class FrmDataCookieHttpNormal { //@@@@!!! padronizar os outros
    name: string;
    value: string;
  }
  const frmCookieHttpNormal = useFrm<FrmDataCookieHttpNormal>({ defaultValues: FrmDefaultValues(new FrmDataCookieHttpNormal()), mode: 'onChange' });
  async function SubCookieHttpNormal(cmdCookie) {
    const frm = frmCookieHttpNormal;
    const dataForm = frm.getValues();
    dataForm.name = StrNormalize(dataForm.name);
    if (cmdCookie != 'getall' &&
      !dataForm.name)
      return FrmSetError(frm, 'name', 'Informação obrigatória');
    //const horaStart = HoraDebug();
    try {
      const apiReturn = await CallApiCliASync<any>(apiUse(apiCorresp1.apiPath), {
        cmd: CmdApi_Playg.cookieHttpNormal, cmdCookie, ...dataForm, // ...parmNivelLog()
      }, { withCredentials: true });
      appendResults('SubCookieHttpNormal', apiReturn.value);
    } catch (error) {
      appendResults('SubCookieHttpNormal (error)', error.message);
    }
  }

  class FrmDataCookieHttpCrypto {
    name: string;
    value: string;
    psw: string;
  }
  const frmCookieHttpCrypto = useFrm<FrmDataCookieHttpCrypto>({ defaultValues: FrmDefaultValues(new FrmDataCookieHttpCrypto(), { psw: '123456789012345678901234567890ab' }), mode: 'onChange' });
  async function SubCookieHttpCrypto(cmdCookie) {
    const frm = frmCookieHttpCrypto;
    const dataForm = frm.getValues();
    dataForm.name = StrNormalize(dataForm.name);
    if (cmdCookie != 'getall' &&
      !dataForm.name)
      return FrmSetError(frm, 'name', 'Informação obrigatória');
    //const horaStart = HoraDebug();
    try {
      const apiReturn = await CallApiCliASync<any>(apiUse(apiCorresp1.apiPath), {
        cmd: CmdApi_Playg.cookieHttpCrypto, cmdCookie, ...dataForm,
      }, { withCredentials: true });
      appendResults('SubCookieHttpCrypto', apiReturn.value);
    } catch (error) {
      appendResults('SubCookieHttpCrypto (error)', error.message);
    }
  }

  const frmASyncAndDb = useFrm(
    {
      schema: yup.object().shape({
        qtdCalls: yup.number(),
        interv: yup.number(),
        waitApiMax: yup.number(),
        sleepRotina: yup.number(),
      }),
      defaultValues: {
        callId: IdByTime(),
        qtdCalls: 1,
        interv: 0,
        waitApiMax: 0,
        sleepRotina: 0,
        variant: 4
      }
    });
  function SubASyncAndDb(dataForm) {
    const { callId, qtdCalls, mixCalls, interv, waitApiMax, variant: variantInf, ...parmAdic } = dataForm;
    const calls = [];
    const header = { horaStartMain: HoraDebug(), dataForm };
    //setResultASyncAndDb({ header, calls });
    for (let count = 0; count < qtdCalls; count++) {
      setTimeout(() => {
        const callInfo = {
          callId: `${callId}-${count}`,
          waitApi: Math.round(Math.random() * waitApiMax),
          variant: undefined,
        };
        let parm: IGenericObject = { _callId: callInfo.callId, _waitApiMs: callInfo.waitApi };
        const api = mixCalls ? RandomItem([apiCorresp2.apiPath, apiCorresp1.apiPath]) : apiCorresp2.apiPath;
        if (api === apiCorresp2.apiPath) {
          callInfo.variant = variantInf !== 0 ? variantInf : RandomNumber(1, 4);
          parm = { ...parm, variant: callInfo.variant, ...parmAdic };
        }
        else
          parm = { ...parm, cmd: CmdApi_Playg.wait };
        const horaStart = HoraDebug();
        CallApiCliASync<any>(apiUse(api), parm)
          .then(apiReturn => {
            calls.push({ horaStart, api, callInfo, apiReturn });
            appendResults('SubASyncAndDb', { header, calls });
          })
          .catch((error) => {
            calls.push({ horaStart, api, callInfo, error: error.message });
            appendResults('SubASyncAndDb (error)', { error: error.message, header, calls });
          });
      }, interv * count);
    }
  }
  //#endregion

  const ForceHttpStatus = async (httpStatus: number, isAsync: boolean) => {
    const idProc = idProcGen();
    const calcExecTime = new CalcExecTime();
    appendResults(`${idProc}-ini (status ${httpStatus} async: ${isAsync})`);
    try {
      const apiReturn = await CallApiCliASync<any>(apiCorresp1.apiPath, { idProc, cmd: CmdApi_Playg.forceHttpStatus, httpStatus, isAsync });
      //const msgsProc = apiReturn.value as string[];
      if (!mount) return;
      appendResults(`${idProc}-fim ${calcExecTime.elapsedMs()}ms`, apiReturn.value);
    } catch (error) {
      appendResults(`${idProc}-fim (error) ${calcExecTime.elapsedMs()}ms`, error.message);
    }
  };

  // <Btn fun={() => CmdNoParm(CmdApi_Playg.parallelNotify)}>Notifies Paralelo</Btn>
  // <Btn fun={() => CmdNoParm(CmdApi_Playg.switchForceCloseDb)}>Sw Force Close</Btn>
  // <Btn fun={() => CmdNoParm(CmdApi_Playg.switchForceCloseDb)}>Sw Force Close</Btn>

  const BtnS = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => <Btn small sx={{ textTransform: 'none' }} onClick={onClick}>{children}</Btn>;

  //@!!!!!!! usar a mesma interface de funcsAdm
  try {
    return (
      <Stack spacing={1} height='100%'>

        <BtnLine left>
          <BtnS onClick={() => setResultAcum([])}>Clear results</BtnS>
        </BtnLine>

        <BtnLine left>
          <BtnS onClick={() => SubEnvs()}>Envs</BtnS>
          <BtnS onClick={() => SystemMsgCli(CategMsgSystem.error, 'testeCli', `erro cli ${HoraDebug(new Date())}`)}>cli error</BtnS>
          <BtnS onClick={() => SystemMsgCli(CategMsgSystem.alert, 'testeCli', `alert cli ${HoraDebug(new Date())}`)}>cli alert</BtnS>
          <BtnS onClick={() => SystemMsgCli(CategMsgSystem.warn, 'testeCli', `warn cli ${HoraDebug(new Date())}`)}>cli warn</BtnS>
        </BtnLine>
        <BtnLine left>
          <BtnS onClick={() => ForceHttpStatus(HttpStatusCode.ok, false)}>st {HttpStatusCode.ok}</BtnS>
          <BtnS onClick={() => ForceHttpStatus(HttpStatusCode.notFound, false)}>{HttpStatusCode.notFound}</BtnS>
          <BtnS onClick={() => ForceHttpStatus(HttpStatusCode.unexpectedError, false)}>{HttpStatusCode.unexpectedError}</BtnS>
          <BtnS onClick={() => ForceHttpStatus(HttpStatusCode.ok, true)}>st {HttpStatusCode.ok} async</BtnS>
          <BtnS onClick={() => ForceHttpStatus(HttpStatusCode.notFound, true)}>{HttpStatusCode.notFound} async</BtnS>
          <BtnS onClick={() => ForceHttpStatus(HttpStatusCode.unexpectedError, true)}>{HttpStatusCode.unexpectedError} async</BtnS>
        </BtnLine>

        <RadioGroup row
          value={playArea}
          onChange={(ev) => setPlayArea(ev.target.value)}
        >
          <FormControlLabel value={PlayArea.email} control={<Radio />} label='email' />
          <FormControlLabel value={PlayArea.testsDb} control={<Radio />} label='testsDb' />
          <FormControlLabel value={PlayArea.testApiCalls} control={<Radio />} label='testApiCalls' />
          <FormControlLabel value={PlayArea.localData} control={<Radio />} label='localData' />
          <FormControlLabel value={PlayArea.cookieHttpNormal} control={<Radio />} label='cookieHttpNormal' />
          <FormControlLabel value={PlayArea.cookieHttpCrypto} control={<Radio />} label='cookieHttpCrypto' />
          {apiCorresp2 &&
            <FormControlLabel value={PlayArea.aSyncAndDb} control={<Radio />} label='aSyncAndDb' />
          }
          <FormControlLabel value={PlayArea.none} control={<Radio />} label='none' />
        </RadioGroup>

        {playArea == PlayArea.email &&
          <form onSubmit={frmEmail.handleSubmit(SubMail)}>
            <Stack spacing={0.5}>
              <Box>
                <FrmInput label='Subject' name='subject' frm={frmEmail} />
              </Box>
              <Stack direction='row' spacing={1}>
                <FrmInput label='To(email)' name='toEmail' width='15rem' frm={frmEmail} />
                <FrmInput label='To(name)' name='toName' width='10rem' frm={frmEmail} />
                <FrmInput label='ReplyTo(email)' name='replyToEmail' width='15rem' frm={frmEmail} />
                <FrmInput label='ReplyTo(name)' name='replyToName' width='10rem' frm={frmEmail} />
              </Stack>
              <Box>
                <FakeLink onClick={() => setSampleConfig(frmEmail)}>config</FakeLink>
                <FrmInput name='emailConfig' frm={frmEmail} multiline maxRows={3} />
              </Box>
              <BtnLine left>
                <Btn submit>Exec</Btn>
              </BtnLine>
            </Stack>
          </form>
        }

        {playArea == PlayArea.testsDb &&
          <form onSubmit={(ev) => ev.preventDefault()}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <FrmInput label='qtd' name={f.qtd} width='8rem' frm={frmTestsDb} />
              <FrmInput label='contentSize' name={f.contentSize} width='8rem' frm={frmTestsDb} />
              <FrmCheckbox label='contentSizeVariable' name={f.contentSizeVariable} frm={frmTestsDb} />
              <FrmCheckbox label='insertInGroup' name={f.insertInGroup} frm={frmTestsDb} />
              <FrmCheckbox label='uniqKeys' name={f.uniqKeys} frm={frmTestsDb} />
            </Stack>
            <Stack direction='row' alignItems='center' spacing={1}>
              <FrmInput label='collection' name={f.collection} width='15rem' frm={frmTestsDb} />
              <FrmCheckbox label='useDatabaseTst' name={f.useDatabaseTst} frm={frmTestsDb} />
            </Stack>
            <BtnLine left>
              <BtnS onClick={TestDbWrite}>testDbWrite</BtnS>
              <BtnS onClick={TestDbRead}>testDbRead</BtnS>
              <BtnS onClick={TestDbReset}>testDbReset</BtnS>
            </BtnLine>
          </form>
        }

        {playArea == PlayArea.testApiCalls &&
          <form onSubmit={(ev) => ev.preventDefault()}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <FrmInput label='(Norm/Prom/Async)' name={f.tipoExec} width='8rem' frm={frmApiCalls} />
              <FrmInput label='(M=mail/D=db/MD=ambos)' name={f.toDo} width='7rem' frm={frmApiCalls} />
              <FrmInput label='sleepMs' name={f.sleepMs} width='3rem' frm={frmApiCalls} />
              <FrmInput label='qtd' name={f.qtd} width='2rem' frm={frmApiCalls} />
              <FrmInput label='errPswMail' name={f.forceErrPswMail} width='5rem' frm={frmApiCalls} />
              <FrmInput label='errToutMail' name={f.forceErrToutMail} width='5rem' frm={frmApiCalls} />
              <FrmInput label='dontWaitPr' name={f.dontWaitPromise} width='5rem' frm={frmApiCalls} />
              <FrmCheckbox label='sMsg' name={f.serverMsg} frm={frmApiCalls} />
              <BtnLine left>
                <BtnS onClick={TestApiCalls}>Submit</BtnS>
              </BtnLine>
            </Stack>
          </form>
        }

        {playArea == PlayArea.localData &&
          // <HorizontalRule width='100%' />
          <form onSubmit={onSubmitDummy}>
            <Stack direction='row' spacing={1}>
              <FrmInput label='Name' name='name' width='10rem' frm={frmLocalData} />
              <FrmInput label='Value' name='value' width='10rem' frm={frmLocalData} />
              <BtnS onClick={() => SubLocalData('set')}>set</BtnS>
              <BtnS onClick={() => SubLocalData('get')}>get</BtnS>
              <BtnS onClick={() => SubLocalData('remove')}>remove</BtnS>
              <BtnS onClick={() => SubLocalData('getall')}>getall</BtnS>
            </Stack>
          </form>
        }

        {playArea == PlayArea.cookieHttpNormal &&
          <form onSubmit={onSubmitDummy}>
            <Stack direction='row' spacing={1}>
              <FrmInput label='Name' name='name' width='10rem' frm={frmCookieHttpNormal} />
              <FrmInput label='Value' name='value' width='10rem' frm={frmCookieHttpNormal} />
              <BtnS onClick={() => SubCookieHttpNormal('set')}>set</BtnS>
              <BtnS onClick={() => SubCookieHttpNormal('get')}>get</BtnS>
              <BtnS onClick={() => SubCookieHttpNormal('remove')}>remove</BtnS>
              <BtnS onClick={() => SubCookieHttpNormal('getall')}>getall</BtnS>
            </Stack>
          </form>
        }

        {playArea == PlayArea.cookieHttpCrypto &&
          <form onSubmit={onSubmitDummy}>
            <Stack direction='row' spacing={1}>
              <FrmInput label='Name' name='name' width='10rem' frm={frmCookieHttpCrypto} />
              <FrmInput label='Value' name='value' width='10rem' frm={frmCookieHttpCrypto} />
              <FrmInput label='Psw' name='psw' width='10rem' frm={frmCookieHttpCrypto} />
              <BtnS onClick={() => SubCookieHttpCrypto('set')}>set</BtnS>
              <BtnS onClick={() => SubCookieHttpCrypto('get')}>get</BtnS>
              <BtnS onClick={() => SubCookieHttpCrypto('remove')}>remove</BtnS>
            </Stack>
          </form>
        }

        {playArea == PlayArea.aSyncAndDb &&
          <form onSubmit={frmASyncAndDb.handleSubmit(SubASyncAndDb)} >
            <Stack spacing={1}>
              <Stack direction='row' spacing={1}>
                <FrmInput label='Id' name='callId' width='2rem' frm={frmASyncAndDb} />
                <FrmInput label='Calls' name='qtdCalls' width='2rem' frm={frmASyncAndDb} />
                <FrmCheckbox label='Mix' name='mixCalls' frm={frmASyncAndDb} />
                <FrmInput label='Interv' name='interv' width='3rem' frm={frmASyncAndDb} />
                <FrmInput label='WaitApiMax' name='waitApiMax' width='3rem' frm={frmASyncAndDb} />
                <FrmInput label='Var' name='variant' width='2rem' frm={frmASyncAndDb} />
                <FrmInput label='SleepProc' name='sleepRotina' width='3rem' frm={frmASyncAndDb} />
                <FrmInput label='ErrorForced' name='errorForced' width='3rem' frm={frmASyncAndDb} />
                <FrmCheckbox label='NoClose' name='noClose' frm={frmASyncAndDb} />
              </Stack>
              <BtnLine left>
                <Btn submit>Exec</Btn>
              </BtnLine>
            </Stack>

          </form>
        }

        <Box flex={1} {...fullHeightScroll}>
          <Stack spacing='20px'>
            {resultAcum.map((x, i) =>
              <Box key={i}>
                {/* <Box>{x.id}</Box> */}
                {x.result != undefined &&
                  //  <pre>{JSON.stringify(x, null, 2)}</pre>
                  <ReactJson src={x} name='result' collapsed collapseStringsAfterLength={30} />
                }
                {/* <Divider /> */}
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    );
  } catch (error) {
    dbgError(pageSelf.pagePath, error.message);
    return (<Tx>Erro: {error.message}</Tx>);
  }
}