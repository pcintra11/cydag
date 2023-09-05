import React from 'react';
import { useRouter } from 'next/router';
import * as Papa from 'papaparse';
import { FileRejection, useDropzone } from 'react-dropzone';

import { Stack, useTheme } from '@mui/material';

import { IsErrorManaged, ObjUpdAllProps, ErrorPlus, ForceWait, mimeTypes } from '../../libCommon/util';
import { CalcExecTime } from '../../libCommon/calcExectime';
import { IGenericObject } from '../../libCommon/types';
import { PageDef } from '../../libCommon/endPoints';

import { IUploadMessage, ToCsvDownload, UploadFriendlyError, UploadStatus } from '../../libCommon/uploadCsv';

import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { SaveAsXlsx } from '../../libClient/saveAsClient';
import { propsByMessageLevel } from '../../libClient/util';
import { FrmDefaultValues, useFrm, useWatchMy } from '../../hooks/useMyForm';

import { FakeLink, SelOption, PopupMsg, SwitchMy, Tx } from '../../components';
import { WaitingObs } from '../../components';
import { AbortProc, LogErrorUnmanaged } from '../../components';
import { DropAreaUpload } from '../../components/dropArea';

import { configApp } from '../../app_hub/appConfig';

import { pagesApp, apisApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { Funcionario, ProcessoOrcamentario } from '../../appCydag/modelTypes';
import { ProcessoOrcamentarioStatus, TipoColaboradorMd, TipoParticipPerOrcamMd } from '../../appCydag/types';
import { CmdApi_ProcessoOrcamentario } from '../api/appCydag/processoOrcamentario/types';
import { CmdApi_Funcionario } from '../api/appCydag/funcionario/types';
import { SelAno } from '../../appCydag/components';

enum Phase {
  initiating = 'initiating',
  ready = 'ready',
}
class FrmFilter {
  ano: string;
}

let mount; let mainStatesCache;
const apis = {
  getAnoAllowed: () => CallApiCliASync<any>(apisApp.processoOrcamentario.apiPath, { cmd: CmdApi_ProcessoOrcamentario.list, filter: { status: ProcessoOrcamentarioStatus.preparacao } }),
  upload: (parm: any) => CallApiCliASync<any>(apisApp.funcionario.apiPath, { cmd: CmdApi_Funcionario.upload, ...parm })
};
const pageSelf = pagesApp.cargaFuncionario;
export default function PageCargaFuncionario() {
  const frmFilter = useFrm<FrmFilter>({
    defaultValues: FrmDefaultValues(new FrmFilter()),
  });
  const ano = useWatchMy({ control: frmFilter.control, name: ProcessoOrcamentario.F.ano });

  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    processoOrcamentarioArray?: ProcessoOrcamentario[];
    uploadStatus?: UploadStatus, uploadResult?: { messages: IUploadMessage[], linesOk: number, linesError: number };
    deleteAllBefore?: boolean;
  }
  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating, deleteAllBefore: true });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });
  const agora = new Date();
  const themePlus = useTheme(); // @@!!!!!! criar um componente xxxMY para Select e autocomplete 

  //#region db access
  const initialization = async () => {
    const apiReturn = await apis.getAnoAllowed();
    const processoOrcamentarioArray = (apiReturn.value.documents as IGenericObject[]).map((data) => ProcessoOrcamentario.deserialize(data));
    return { processoOrcamentarioArray };
  };

  const upload = async (ano: string, data: any[]) => {
    const apiReturn = await apis.upload({ ano, data, deleteAllBefore: mainStates.deleteAllBefore });
    const uploadResult = { messages: apiReturn.value.messages as IUploadMessage[], linesOk: apiReturn.value.linesOk, linesError: apiReturn.value.linesError };
    return uploadResult;
  };
  //#endregion

  //#region drop file
  function onDrop(acceptedFiles: File[], fileRejections: FileRejection[]) {
    if (acceptedFiles.length !== 1)
      PopupMsg.error('Número inválido de arquivos.');
    else if (fileRejections.length > 0) {
      const errorsAll = fileRejections.map(({ file, errors }) => {
        const msgErro = errors.reduce((acum, curr) => [...acum, UploadFriendlyError(curr)], []).join(', ');
        return `arquivo ${file.name} rejeitado: ${msgErro}`;
      }).join('; ');
      PopupMsg.error(errorsAll);
    }
    else {
      const file = acceptedFiles[0];
      setMainStatesCache({ uploadStatus: UploadStatus.loading, uploadResult: null });
      const calcExecTimeSearch = new CalcExecTime();
      file.text()
        .then(async (csvString) => {
          try {
            const papaCsv = Papa.parse(csvString, { delimiter: configApp.csvDelimiter });
            if (papaCsv.errors.length != 0) {
              PopupMsg.error('Erro ao interpretar o arquivo csv');
              setMainStatesCache({ uploadStatus: UploadStatus.none });
              return;
            }
            const uploadResult = await upload(ano, papaCsv.data);
            await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs * 3);
            setMainStatesCache({ uploadStatus: UploadStatus.done, uploadResult });
          } catch (error) {
            LogErrorUnmanaged(error, `${pageSelf.pagePath}-onDrop`);
            if (!IsErrorManaged(error)) {
              setMainStatesCache({ error });
              return;
            }
            PopupMsg.error(error);
            setMainStatesCache({ uploadStatus: UploadStatus.error });
          }
        });
    }
  }
  const dropZone = useDropzone({
    accept: { [mimeTypes.csv.dropZoneType]: [`.${mimeTypes.csv.ext.csv}`] },
    maxFiles: 1,
    maxSize: 5000000,
    multiple: true,
    onError: (error) => {
      LogErrorUnmanaged(error, 'useDropzone');
      PopupMsg.error(error);
    },
    onDrop,
  });
  //#endregion

  const downloadModelo = () => {
    const amostra = [ToCsvDownload(Funcionario.fill({ centroCusto: '' }), Funcionario.fldsCsvDefUpload)];
    const orientacoes = [
      { 'Orientações': '' },
      { 'Orientações': 'Preenchimento' },
      { 'Orientações': `TipoColaborador: ${TipoColaboradorMd.all.map((x) => `${x.cod}=${x.descr}`).join('; ')} ` },
      { 'Orientações': `tipoIni: ${TipoParticipPerOrcamMd.all.filter((x) => x.plus.ini).map((x) => `${x.cod}=${x.descr}`).join('; ')} ` },
      { 'Orientações': `tipoFim: ${TipoParticipPerOrcamMd.all.filter((x) => x.plus.fim).map((x) => `${x.cod}=${x.descr}`).join('; ')} ` },
      { 'Orientações': '' },
      { 'Orientações': 'Salve a planilha que deverá ser importada (a primeira) como CSV UTF-8' },
    ];
    SaveAsXlsx('modelo_funcionarios_upload', [
      { sheetName: 'dados', data: amostra },
      { sheetName: 'orientacoes', data: orientacoes },
    ]);
  };

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
    initialization()
      .then((result) => {
        if (!mount) return;
        const { processoOrcamentarioArray } = result;
        if (processoOrcamentarioArray.length > 0)
          frmFilter.setValue(ProcessoOrcamentario.F.ano, processoOrcamentarioArray[0].ano);
        setMainStatesCache({ phase: Phase.ready, processoOrcamentarioArray });
      })
      .catch((error) => {
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-initialization`);
        PopupMsg.error(error);
      });
    return () => { mount = false; };
  }, [router.isReady, isLoadingUser, loggedUser?.email]);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  if (mainStates.phase == Phase.initiating) return <WaitingObs />;

  try {

    return (
      <Stack spacing={1} height='100%' overflow='auto'>
        <Stack spacing={1}>
          {/* <SelectMy width='80px'
            value={ano || ''}
            onChange={(ev) => { frmFilter.setValue(ProcessoOrcamentario.F.ano, ev.target.value); }}
            displayEmpty
            placeHolder='Ano'
            options={[new SelOption('Ano', 'Ano', true), ...mainStates.processoOrcamentarioArray.map((x) => new SelOption(x.ano, x.ano))]}
          /> */}
          <SelAno value={ano} onChange={(newValue) => frmFilter.setValue(ProcessoOrcamentario.F.ano, newValue || '')}
            options={mainStates.processoOrcamentarioArray.map((x) => new SelOption(x.ano, x.ano))}
          />
          {ano != null &&
            <>
              {/* infoAdic='Atenção: os dados anteriores serão removidos antes da carga' */}
              <DropAreaUpload dropZone={dropZone} bgcolor={themePlus.themePlusConfig?.colorBackDroparea} />
              <SwitchMy checked={mainStates.deleteAllBefore} label='Remove os dados antes de carregar (desative se for uma carga incremental)' onChange={(ev) => setMainStatesCache({ deleteAllBefore: ev.target.checked })} />
            </>
          }
          <FakeLink onClick={() => downloadModelo()}>
            Baixe aqui o modelo para o CSV e as orientações
          </FakeLink>
          {mainStates.uploadStatus == UploadStatus.loading && <WaitingObs text='Carregando' />}
          {mainStates.uploadStatus == UploadStatus.done &&
            <Stack spacing={0.2}>
              {(mainStates.uploadResult.linesOk + mainStates.uploadResult.linesError) !== 0 &&
                <Tx>
                  Linhas processadas: com sucesso {mainStates.uploadResult.linesOk} ;
                  com erro {mainStates.uploadResult.linesError}
                </Tx>
              }
              {mainStates.uploadResult.messages.map((x, index) =>
                <Tx key={index} sx={propsByMessageLevel(themePlus, x.level)}>{x.message}</Tx>
              )}
            </Stack>
          }
        </Stack>
      </Stack>
    );

  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />);
  }
}