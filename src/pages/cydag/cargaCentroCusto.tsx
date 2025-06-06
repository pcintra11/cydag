import React from 'react';
import { useRouter } from 'next/router';
import * as Papa from 'papaparse';
import { FileRejection, useDropzone } from 'react-dropzone';

import { Stack, useTheme } from '@mui/material';

import { IsErrorManaged, ObjUpdAllProps, ErrorPlus, ForceWait, mimeTypes } from '../../libCommon/util';
import { CalcExecTime } from '../../libCommon/calcExectime';
import { PageDef } from '../../libCommon/endPoints';

import { IUploadMessage, ToCsvDownload, UploadFriendlyError, UploadStatus } from '../../libCommon/uploadCsv';

import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { SaveAsXlsx } from '../../libClient/saveAsClient';
import { propsByMessageLevel } from '../../libClient/util';

import { FakeLink, PopupMsg, Tx } from '../../components';
import { WaitingObs } from '../../components';
import { AbortProc, LogErrorUnmanaged } from '../../components';
import { DropAreaUpload } from '../../components/dropArea';

import { configApp } from '../../app_hub/appConfig';

import { pagesApp, apisApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { CentroCusto } from '../../appCydag/modelTypes';
import { CmdApi_CentroCusto } from '../api/appCydag/centroCusto/types';

enum Phase {
  initiating = 'initiating',
  ready = 'ready',
}

let mount; let mainStatesCache;
const apis = {
  upload: (parm: any) => CallApiCliASync<any>(apisApp.centroCusto.apiPath, { cmd: CmdApi_CentroCusto.upload, ...parm }),
};
const pageSelf = pagesApp.cargaCentroCusto;
export default function PageCargaCentroCusto() {

  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    uploadStatus?: UploadStatus, uploadResult?: { messages: IUploadMessage[], linesOk: number, linesError: number };
  }
  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });
  const agora = new Date();
  const themePlus = useTheme(); // @@!!!!!! criar um componente xxxMY para Select e autocomplete 

  //#region db access

  const upload = async (data: any[]) => {
    const apiReturn = await apis.upload({ data });
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
            const uploadResult = await upload(papaCsv.data);
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
    const amostra = [ToCsvDownload(CentroCusto.fill({ cod: '' }), CentroCusto.fldsCsvDefUploadUser)];
    SaveAsXlsx('modelo_centroCusto_upload', [
      { sheetName: 'dados', data: amostra },
    ]);
  };

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
      setMainStatesCache({ phase: Phase.ready });
    return () => { mount = false; };
  }, [router.isReady, isLoadingUser, loggedUser?.email]);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  if (mainStates.phase == Phase.initiating) return <WaitingObs />;

  try {

    return (
      <Stack spacing={1} height='100%' overflow='auto'>
        <Stack spacing={1}>
          <DropAreaUpload dropZone={dropZone} bgcolor={themePlus.themePlusConfig?.colorBackDroparea} />
          <FakeLink onClick={() => downloadModelo()}>
            Baixe aqui o modelo para o CSV
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