import React from 'react';
import { useRouter } from 'next/router';
import * as Papa from 'papaparse';
import { FileRejection, useDropzone } from 'react-dropzone';

//import dynamic from 'next/dynamic';
// const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

import { Box, Modal, Stack, useTheme } from '@mui/material';

import { ErrorPlus, ForceWait, mimeTypes, ObjUpdAllProps } from '../../libCommon/util';
import { CalcExecTime } from '../../libCommon/calcExectime';
import { csd } from '../../libCommon/dbg';
import { PageDef } from '../../libCommon/endPoints';
import { IUploadMessage, UploadFriendlyError, UploadStatus } from '../../libCommon/uploadCsv';
import { IGenericObject } from '../../libCommon/types';

import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { SaveAsXlsx } from '../../libClient/saveAsClient';
import { propsByMessageLevel } from '../../libClient/util';
import { AbortProc, WaitingObs, Btn, BtnLine, LogErrorUnmanaged, PopupMsg, Tx, FakeLink, VisualBlock } from '../../components';
import { DropAreaUpload } from '../../components/dropArea';

import { configApp } from '../../app_hub/appConfig';

//import { SelAno } from '../../appCydag/components';
import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
//import { CtrlInterface } from '../../appCydag/modelTypes';
//import { CmdApi_Crud, IChangedLines } from '../api/appCydag/valoresContas/types';
//import { CmdApi_ProcessoOrcamentario } from '../api/appCydag/processoOrcamentario/types';
import { CmdApi_ValoresContas, colUploadCmd } from '../api/appCydag/valoresContas/types';
//import { InterfaceSapStatus } from '../../appCydag/types';

//#region ok
enum Phase {
  initiating = 'initiating',
  ready = 'ready',
}

// class FrmFilter {
//   ano: string;
// }

//#endregion

let mount; let mainStatesCache;
const apis = {
  //getProcsOrc: () => CallApiCliASync(apisApp.processoOrcamentario.apiPath, globals.windowId, { cmd: CmdApi_ProcessoOrcamentario.list }),
  interfaceRealizado: (cmd: CmdApi_ValoresContas) => CallApiCliASync<any>(apisApp.valoresContas.apiPath, { cmd }),
  entityDesprDownload: async (entity: string) => {
    const apiReturn = await CallApiCliASync<{ value: { documentArray: IGenericObject[] } }>(apisApp.valoresContas.apiPath,
      { cmd: CmdApi_ValoresContas.entityDesprDownload, entity });
    return { ...apiReturn.value };
  },
  entityDesprUpload: async (entity: string, data: IGenericObject[]) => {
    const apiReturn = await CallApiCliASync<{ value: { messages: IUploadMessage[], linesProcOk: number } }>(apisApp.valoresContas.apiPath,
      { cmd: CmdApi_ValoresContas.entityDesprUpload, entity, data });
    return { ...apiReturn.value };
  },
};
const pageSelf = pagesApp.importRealDireto;
export default function PageImportRealDireto() {
  // const frmFilter = useFrm<FrmFilter>({
  //   defaultValues: FrmDefaultValues(new FrmFilter(), null, [ValoresRealizados.F.ano]),
  // });
  // const ano = useWatchMy({ control: frmFilter.control, name: ValoresRealizados.F.ano });

  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    importInProgress?: boolean;
    info?: {
      ano: number,
      registrosSap: number,
      inseridos: number,
      ignorados: number,
      erros: number,
      mensagens: string[],
    };
    centroCustoSemCadastroArray?: string[];
    classeCustoSemCadastroArray?: string[];

    entityDesprCtrl?: { open: boolean, entity?: string, descr?: string }; file?: File;
    uploadStatusEntityDespr?: UploadStatus, uploadResultEntityDespr?: { messages: IUploadMessage[], linesProcOk: number };
  }

  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating, importInProgress: false });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  const themePlus = useTheme();

  //#region db access
  const apiInterfaceCall = async (cmd: CmdApi_ValoresContas) => {
    //const apiReturn1 = await apis.getProcsOrc();
    //const processoOrcamentarioArray = (apiReturn1.value.documents as IGenericObject[]).map((data) => ProcessoOrcamentario.deserialize(data));
    setMainStatesCache({ importInProgress: true });
    try {
      const apiReturn = await apis.interfaceRealizado(cmd);
      //console.log('apiReturn', apiReturn);
      setMainStatesCache({ importInProgress: false });
      //if (apiReturn.value.info != null)
      return {
        info: apiReturn.value.info,
        centroCustoSemCadastroArray: apiReturn.value.centroCustoSemCadastroArray,
        classeCustoSemCadastroArray: apiReturn.value.classeCustoSemCadastroArray,
      };
      // else
      //   return { info: null };
    }
    catch (error) {
      setMainStatesCache({ importInProgress: false });
      throw error;
    }
  };
  //#endregion

  const downloadCentroCustoSemCadastro = () => {
    const centroCustoDownload: any[] = [];
    const classeCustoDownload: any[] = [];
    for (const centroCustoSemCadastro of mainStates.centroCustoSemCadastroArray!)
      centroCustoDownload.push({ [colUploadCmd]: '', centroCusto: centroCustoSemCadastro });
    for (const classeCustoSemCadastro of mainStates.classeCustoSemCadastroArray!)
      classeCustoDownload.push({ [colUploadCmd]: '', classeCusto: classeCustoSemCadastro });
    SaveAsXlsx('download_inferface_sap_sem_cadastro', [
      { sheetName: 'centroCusto', data: centroCustoDownload },
      { sheetName: 'classeCusto', data: classeCustoDownload },
    ]);
  };

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
      setMainStatesCache({ uploadStatusEntityDespr: UploadStatus.loading, file, uploadResultEntityDespr: null });
      const calcExecTimeSearch = new CalcExecTime();
      file.text()
        .then(async (csvString) => {
          try {
            const papaCsv = Papa.parse(csvString, { delimiter: configApp.csvDelimiter });
            if (papaCsv.errors.length != 0) {
              PopupMsg.error('Erro ao interpretar o arquivo csv');
              setMainStatesCache({ uploadStatusEntityDespr: UploadStatus.none });
              return;
            }
            const uploadResult = await apis.entityDesprUpload(mainStates.entityDesprCtrl.entity!, papaCsv.data);
            await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs * 1);
            setMainStatesCache({ uploadStatusEntityDespr: UploadStatus.done, uploadResultEntityDespr: uploadResult });
          } catch (error) {
            LogErrorUnmanaged(error, `${pageSelf.pagePath}-onDrop`);
            PopupMsg.error(error);
            setMainStatesCache({ uploadStatusEntityDespr: UploadStatus.error });
          }
        });
    }
  }
  const dropZone = useDropzone({
    accept: { [mimeTypes.csv.dropZoneType]: [`.${mimeTypes.csv.ext.csv}`] },
    maxFiles: 1,
    maxSize: 5000000,
    multiple: true,
    //validator: (file) => UploadFileNameValidator(file, { suffix: uploadFilenameSuffix }),
    onError: (error) => {
      LogErrorUnmanaged(error, 'useDropzone');
      PopupMsg.error(error);
    },
    onDrop,
  });
  //#endregion

  const openCollectionModal = (entity: 'centroCusto' | 'classeCusto') => {
    const entityDescr = entity === 'centroCusto' ? 'Centros de Custo' : 'Classes de Custo';
    setMainStatesCache({ entityDesprCtrl: { open: true, entity, descr: entityDescr }, file: null, uploadStatusEntityDespr: null, uploadResultEntityDespr: null });
  };
  const closeCollectionModal = () => setMainStatesCache({ entityDesprCtrl: { open: false } });

  const downloadCollection = React.useCallback((entity: string) => {
    apis.entityDesprDownload(entity)
      .then(async ({ documentArray }) => {
        const colKey = entity === 'centroCusto' ? 'centroCusto' : 'classeCusto';
        const documents = documentArray.map((key) => ({
          [colUploadCmd]: '',
          [colKey]: key,
        }));
        if (documents.length == 0) documents.push({
          [colUploadCmd]: '',
          [colKey]: '',
        });
        SaveAsXlsx(`download_${entity}_ignore`, [{ sheetName: entity, data: documents }]);
      })
      .catch((error) => {
        const errorUse = new Error(`erro no downloadCollection para ${entity}: ${error.message}`);
        LogErrorUnmanaged(errorUse, `${pageSelf.pagePath}-downloadCollection`);
        PopupMsg.error(errorUse);
      });
  }, []);

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
    setMainStatesCache({ phase: Phase.ready, info: null });
    return () => { mount = false; };
  }, []);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  if (mainStates.phase == Phase.initiating) return <WaitingObs />;

  const interfaceSap = async (cmd: CmdApi_ValoresContas) => {
    const calcExecTimeSearch = new CalcExecTime();
    apiInterfaceCall(cmd)
      .then(async (result) => {
        if (!mount) return;
        const { info, centroCustoSemCadastroArray, classeCustoSemCadastroArray } = result;
        await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs);
        setMainStatesCache({ info, centroCustoSemCadastroArray, classeCustoSemCadastroArray });
      })
      .catch((error) => {
        setMainStatesCache({ info: null });
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-interfaceSap`);
        PopupMsg.error(error);
      });
  };

  return (
    <Stack spacing={1.5} height='100%'>
      <BtnLine left>
        <Btn onClick={() => interfaceSap(CmdApi_ValoresContas.importRealizadoDireto)}>Importar</Btn>
      </BtnLine>

      {mainStates.importInProgress &&
        <Tx>processando...</Tx>
      }
      {(mainStates.importInProgress == false) &&
        <>
          {(mainStates.info != null) &&
            <>
              {mainStates.info != null &&
                <VisualBlock>
                  <Stack spacing={1}>
                    <Tx>Carga concluída, veja abaixo os detalhes</Tx>
                    <Tx>Ano: {mainStates.info.ano}</Tx>
                    <Tx>Registros sap: {mainStates.info.registrosSap}</Tx>
                    <Tx>Ignorados: {mainStates.info.ignorados}</Tx>
                    <Tx>Erros: {mainStates.info.erros}</Tx>
                    <Tx>Inseridos: {mainStates.info.inseridos}</Tx>
                    {mainStates.info.mensagens.length > 0 &&
                      <Box>
                        <Tx>Erros:</Tx>
                        {mainStates.info.mensagens.map((x, i) =>
                          <Tx key={i}>- {x}</Tx>
                        )}
                      </Box>
                    }
                    {mainStates.centroCustoSemCadastroArray.length > 0 &&
                      <FakeLink onClick={() => downloadCentroCustoSemCadastro()}>
                        Baixe aqui os centros de custo e classes de custo sem cadastro que foram identificados nesta carga
                      </FakeLink>
                    }
                  </Stack>
                </VisualBlock>
              }
            </>
          }

          <FakeLink onClick={() => openCollectionModal('centroCusto')}>Controle de Centros de Custo a ignorar</FakeLink>
          <FakeLink onClick={() => openCollectionModal('classeCusto')}>Controle de Classes de Custo a ignorar</FakeLink>
        </>
      }

      {mainStates.entityDesprCtrl != null &&
        <Box>
          <Modal
            open={mainStates.entityDesprCtrl.open}
            onClose={closeCollectionModal}
          >
            <Stack spacing={1} overflow='hidden'
              sx={{
                position: 'absolute' as 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80vw',
                height: '90vh',
                bgcolor: 'background.paper',
                border: '2px solid #000',
                boxShadow: 24,
                p: 4,
              }}>

              <Tx>{mainStates.entityDesprCtrl.descr} a ignorar</Tx>

              <Stack direction='row' alignItems='center' spacing={1}>
                <Box>
                  <Btn small sx={{ textTransform: 'none' }} onClick={() => downloadCollection(mainStates.entityDesprCtrl.entity)}>Download</Btn>
                </Box>
              </Stack>
              <DropAreaUpload dropZone={dropZone} bgcolor={themePlus.themePlusConfig?.colorBackDroparea} />

              {mainStates.uploadStatusEntityDespr == UploadStatus.loading &&
                <Tx>processando...</Tx>
              }
              {mainStates.uploadStatusEntityDespr == UploadStatus.done &&
                <Stack spacing={0.2} overflow='auto'>
                  <Tx>Carga de {mainStates.file.name}</Tx>
                  <Tx>Linhas processadas com sucesso: {mainStates.uploadResultEntityDespr.linesProcOk}</Tx>
                  {mainStates.uploadResultEntityDespr.messages.map((x, index) =>
                    <Tx key={index} sx={propsByMessageLevel(themePlus, x.level)}>{x.message}</Tx>
                  )}
                </Stack>
              }
            </Stack>
          </Modal>
        </Box>
      }

    </Stack>
  );
}