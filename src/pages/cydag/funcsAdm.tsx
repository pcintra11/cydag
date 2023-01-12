import React from 'react';
import { useRouter } from 'next/router';
import * as Papa from 'papaparse';
import { FileRejection, useDropzone } from 'react-dropzone';
import _ from 'underscore';

import { Box, Divider, Modal, Stack, useTheme } from '@mui/material';

import { CalcExecTime, CtrlCollect, ErrorPlus, HoraDebug, IdByTime, mimeTypes, ObjUpdAllProps } from '../../libCommon/util';
import { PageDef } from '../../libCommon/endPoints';
import { IGenericObject } from '../../libCommon/types';
import { FldCsvDef, IUploadMessage, ToCsvDownload, UploadFriendlyError, UploadStatus } from '../../libCommon/uploadCsv';
import { csd, dbgError } from '../../libCommon/dbg';

import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { globals } from '../../libClient/clientGlobals';
import { propsByMessageLevel } from '../../libClient/util';
import { SaveAsXlsx } from '../../libClient/saveAsClient';

import { Btn, BtnLine, DialogMy, PopupMsg, SnackBarError, VisualBlock, WaitingObs } from '../../components';
import { AbortProc, LogErrorUnmanaged } from '../../components';

import { DropAreaUpload } from '../../appCydag/components';
import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { CmdApi_FuncAdm } from '../api/appCydag/funcsAdm/types';
import { useLoggedUser } from '../../appCydag/useLoggedUser';

import { configApp } from '../../appCydag/config';
import { AgrupPremissas, Diretoria, Gerencia, Empresa, CentroCusto, UnidadeNegocio, Localidade, FatorCusto, ClasseCusto, Premissa, ValoresPremissa, FuncaoTerceiro, Viagem, ValoresLocalidade, ValoresTransfer, ValoresRealizados, User, ValoresImputados, ValoresPlanejadosHistorico } from '../../appCydag/modelTypes';
import { ValoresAnaliseRealPlan } from '../../appCydag/types';

let seqProc = 0;
//const idProcGen = (info: string) => `${++seqProc}${IdByTime()}(${info})`;
const idProcGen = () => `${++seqProc}${IdByTime()}`;

interface Entity<T> {
  deserialize: (values: IGenericObject) => T,
  new(...args: any[]): T,
}

interface CollectionConfig<T> { name: string, entity: Entity<T>, entityStructure: any, fldsCsvDefUpload?: FldCsvDef[] }
const collectionsMdConfig = {
  agrupPremissas: { name: 'AgrupPremissas', entity: AgrupPremissas, entityStructure: new AgrupPremissas(), fldsCsvDefUpload: AgrupPremissas.fldsCsvDefUpload } as CollectionConfig<AgrupPremissas>,
  centroCusto: { name: 'CentroCusto', entity: CentroCusto, entityStructure: new CentroCusto(), fldsCsvDefUpload: CentroCusto.fldsCsvDefUpload } as CollectionConfig<CentroCusto>,
  diretoria: { name: 'Diretoria', entity: Diretoria, entityStructure: new Diretoria(), fldsCsvDefUpload: Diretoria.fldsCsvDefUpload } as CollectionConfig<Diretoria>,
  empresa: { name: 'Empresa', entity: Empresa, entityStructure: new Empresa(), fldsCsvDefUpload: Empresa.fldsCsvDefUpload } as CollectionConfig<Empresa>,
  gerencia: { name: 'Gerencia', entity: Gerencia, entityStructure: new Gerencia(), fldsCsvDefUpload: Gerencia.fldsCsvDefUpload } as CollectionConfig<Gerencia>,
  localidade: { name: 'Localidade', entity: Localidade, entityStructure: new Localidade(), fldsCsvDefUpload: Localidade.fldsCsvDefUpload } as CollectionConfig<Localidade>,
  unidadeNegocio: { name: 'UnidadeNegocio', entity: UnidadeNegocio, entityStructure: new UnidadeNegocio(), fldsCsvDefUpload: UnidadeNegocio.fldsCsvDefUpload } as CollectionConfig<UnidadeNegocio>,

  fatorCusto: { name: 'FatorCusto', entity: FatorCusto, entityStructure: new FatorCusto(), fldsCsvDefUpload: [] } as CollectionConfig<FatorCusto>,
  classeCusto: { name: 'ClasseCusto', entity: ClasseCusto, entityStructure: new ClasseCusto(), fldsCsvDefUpload: ClasseCusto.fldsCsvDefUpload } as CollectionConfig<ClasseCusto>,
  premissa: { name: 'Premissa', entity: Premissa, entityStructure: new Premissa(), fldsCsvDefUpload: Premissa.fldsCsvDefUpload } as CollectionConfig<Premissa>,
  funcTerceiro: { name: 'FuncaoTerceiro', entity: FuncaoTerceiro, entityStructure: new FuncaoTerceiro(), fldsCsvDefUpload: FuncaoTerceiro.fldsCsvDefUpload } as CollectionConfig<FuncaoTerceiro>,
};

const collectionsOthersConfig = {
  user: { name: 'User', entity: User, entityStructure: new User(), fldsCsvDefUpload: User.fldsCsvDefUpload } as CollectionConfig<User>,

  valoresRealizados: { name: 'ValoresRealizados', entity: ValoresRealizados, entityStructure: new ValoresRealizados(), fldsCsvDefUpload: ValoresRealizados.fldsCsvDefUpload } as CollectionConfig<ValoresRealizados>,
  valoresImputados: { name: 'ValoresImputados', entity: ValoresImputados, entityStructure: new ValoresImputados(), fldsCsvDefUpload: ValoresImputados.fldsCsvDefUpload } as CollectionConfig<ValoresImputados>,
  valoresPlanejadosHistorico: { name: 'valoresPlanejadosHistorico', entity: ValoresPlanejadosHistorico, entityStructure: new ValoresPlanejadosHistorico(), fldsCsvDefUpload: ValoresPlanejadosHistorico.fldsCsvDefUpload } as CollectionConfig<ValoresPlanejadosHistorico>,

  valoresPremissa: { name: 'ValoresPremissa', entity: ValoresPremissa, entityStructure: new ValoresPremissa(), fldsCsvDefUpload: ValoresPremissa.fldsCsvDefUpload } as CollectionConfig<ValoresPremissa>,
  valoresLocalid: { name: 'ValoresLocalid', entity: ValoresLocalidade, entityStructure: new ValoresLocalidade(), fldsCsvDefUpload: ValoresLocalidade.fldsCsvDefUpload } as CollectionConfig<ValoresLocalidade>,
  valoresTransfer: { name: 'ValoresTransfer', entity: ValoresTransfer, entityStructure: new ValoresTransfer(), fldsCsvDefUpload: ValoresTransfer.fldsCsvDefUpload } as CollectionConfig<ValoresTransfer>,

  viagens: { name: 'Viagem', entity: Viagem, entityStructure: new Viagem(), fldsCsvDefUpload: Viagem.fldsCsvDefUpload } as CollectionConfig<Viagem>,
};

let msgsAcum: string[] = [];
let mount; let mainStatesCache;
const apis = { adm: (parm) => CallApiCliASync(apisApp.funcsAdm.apiPath, globals.windowId, parm) };
const pageSelf = pagesApp.funcsAdm;
export default function PageFuncsAdm() {
  interface MainStates {
    error?: Error | ErrorPlus;
    collectionCtrl?: { open: boolean, collectionConfig?: CollectionConfig<any> },
    downloading?: boolean, uploadStatus?: UploadStatus, file?: File, uploadResult?: { linesProc: number, linesOk: number, linesError: number, linesErrorNotIdenf: number, messages: IUploadMessage[] };
  }
  const [mainStates, setMainStates] = React.useState<MainStates>({});
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  const [resultAcum, setResultAcum] = React.useState<React.ReactNode>(null);
  //const [qtdMailsDialog, setQtdMailsDialog] = React.useState<number>(3);

  const openCollectionModal = (collectionConfig: CollectionConfig<any>) => {
    setMainStatesCache({ collectionCtrl: { open: true, collectionConfig }, downloading: false, uploadStatus: null, file: null, uploadResult: null });
  };
  const closeCollectionModal = () => setMainStatesCache({ collectionCtrl: { open: false } });

  const agora = new Date();
  const themePlus = useTheme();

  const appendResults = (id: string, msgs: string[] = [''], withHourAndId = true) => {
    const hourAndId = withHourAndId ? `${HoraDebug()} - ${id} - ` : '';
    msgsAcum = [...msgsAcum, ...msgs.map((x) => `${hourAndId}${x}`)];
    //console.log({ msgs });
    //setResult(<div><p>1:{msgs.length}</p><p>2:{msgs.length}</p></div>);
    setResultAcum(<div>{msgsAcum.map((x, i) => <p key={i}>{x}</p>)}</div>);
  };

  const resetResults = () => {
    msgsAcum = [];
    setResultAcum(null);
  };

  //#region drop file
  function onDrop(acceptedFiles: File[], fileRejections: FileRejection[]) {
    //csl('onDrop', { acceptedFiles, fileRejections, ev });
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
      setMainStatesCache({ uploadStatus: UploadStatus.loading, file, uploadResult: null });
      file.text()
        .then(async (csvString) => {
          try {
            const papaCsv = Papa.parse(csvString, { delimiter: configApp.csvDelimiter });
            if (papaCsv.errors.length != 0) {
              SnackBarError('Erro ao interpretar o arquivo csv', `${pageSelf.pagePath}-Papa.parse`);
              setMainStatesCache({ uploadStatus: UploadStatus.none });
              return;
            }
            const apiReturn = await apis.adm({ cmd: CmdApi_FuncAdm.collectionUpload, collection: mainStates.collectionCtrl.collectionConfig.name, data: papaCsv.data });
            const uploadResult = { linesProc: apiReturn.value.linesProc, linesOk: apiReturn.value.linesOk, linesError: apiReturn.value.linesError, linesErrorNotIdenf: apiReturn.value.linesErrorNotIdenf, messages: apiReturn.value.messages as IUploadMessage[] };
            setMainStatesCache({ uploadStatus: UploadStatus.done, uploadResult });
          } catch (error) {
            SnackBarError(error, `${pageSelf.pagePath}-onDrop`);
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
    //validator: (file) => UploadFileNameValidator(file, { suffix: uploadFilenameSuffix }),
    onError: (error) => SnackBarError(error, 'useDropzone'),
    onDrop,
  });
  //#endregion

  const downloadCollection = React.useCallback((collectionConfig: CollectionConfig<any>) => {
    setMainStatesCache({ downloading: true });
    apis.adm({ cmd: CmdApi_FuncAdm.collectionDownload, collection: collectionConfig.name })
      .then(async (apiReturn) => {
        const documents = (apiReturn.value.documents as IGenericObject[]).map((data) => ToCsvDownload(collectionConfig.entity.deserialize(data), collectionConfig.fldsCsvDefUpload));
        if (documents.length == 0) documents.push(ToCsvDownload(new collectionConfig.entity(), collectionConfig.fldsCsvDefUpload));
        SaveAsXlsx(`download_${collectionConfig.name}`, [{ sheetName: 'dados', data: documents }]);
      })
      .catch((error) => {
        SnackBarError(new Error(`erro no downloadCollection para ${collectionConfig.name}: ${error.message}`), `${pageSelf.pagePath}-downloadCollection`);
      })
      .finally(() => {
        setMainStatesCache({ downloading: false });
      });
  }, []);
  const resetCollection = React.useCallback((collectionConfig: CollectionConfig<any>) => {
    const efetiva = () => {
      setMainStatesCache({ uploadStatus: UploadStatus.reseting });
      apis.adm({ cmd: CmdApi_FuncAdm.collectionReset, collection: collectionConfig.name })
        .then(() => {
          PopupMsg.success(`Coleção ${collectionConfig.name} resetada.`);
        })
        .catch((error) => {
          PopupMsg.error(error.message);
          dbgError(`erro no resetCollection para ${collectionConfig.name}`, error);
        })
        .finally(() => {
          setMainStatesCache({ uploadStatus: UploadStatus.none });
        });
    };
    const resposta = collectionConfig.name.toUpperCase();
    DialogMy({
      body: `A coleção ${collectionConfig.name} será excluída com todos os dados`,
      dialogInputs: [
        { label: `Digite ${resposta} para confirmar o reset` },
      ],
      buttons: [
        { text: 'Cancela' },
        {
          text: 'Efetivar',
          fnCheck: (inputResponses: string[]) => inputResponses[0].trim().toUpperCase() !== resposta ? 'Resposta inválida' : null,
          onClick: () => { efetiva(); }
        },
      ]
    });

  }, []);

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
    msgsAcum = [];
    return () => { mount = false; };
  }, []);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} />;

  //#region funções
  const CmdNoParm = async (cmd: string, extraParm: IGenericObject = {}) => {
    const idProc = idProcGen();
    const calcExecTime = new CalcExecTime();
    appendResults(`${idProc}-ini (${cmd})`);
    try {
      const apiReturn = await apis.adm({ idProc, cmd, ...extraParm });
      const msgsProc = apiReturn.value as string[];
      if (!mount) return;
      appendResults(`${idProc}-fim ${calcExecTime.elapsedMs()}ms`, msgsProc);
    } catch (error) {
      appendResults(`${idProc}-fim (error) ${calcExecTime.elapsedMs()}ms`, [error.message]);
    }
  };
  const clearResults = () => {
    resetResults();
  };
  const TestCode = () => {
    const ctrlCollect = new CtrlCollect<ValoresAnaliseRealPlan>(['centroCusto', 'classeCusto'],
      { fldsSum: [{ fld: 'valMesesPlan', arrayLen: 3 }, { fld: 'valMesesReal', arrayLen: 4 }] });
    [
      { centroCusto: 'cc1', classeCusto: 'classe1', valMesesPlan: [1, 2, 3], valMesesRealx: [10, 20, 30, 40] },
      { centroCusto: 'cc1', classeCusto: 'classe2', valMesesPlanx: [1, 2, 3], valMesesReal: [10, 20, 30, 40] },
      { centroCusto: 'cc1', classeCusto: 'classe3', valMesesPlan: [1, 2, 3], valMesesReal: [10, 20, 30, 40] },
    ].forEach(val => ctrlCollect.newItem(val));
    const vals = ctrlCollect.getArray();
    csd({ vals });
  };
  //#endregion

  const BtnS = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => <Btn small sx={{ textTransform: 'none' }} onClick={onClick}>{children}</Btn>;

  try {
    return (
      <Stack gap={1} height='100%' overflow='auto'>
        <BtnLine left>
          <BtnS onClick={() => CmdNoParm(CmdApi_FuncAdm.ensureIndexes)}>ensureIndexes</BtnS>
          <BtnS onClick={() => CmdNoParm(CmdApi_FuncAdm.checkIndexes)}>checkIndexes</BtnS>
          <BtnS onClick={() => CmdNoParm(CmdApi_FuncAdm.clearLogsToDelete)}>Limpar Logs a Deletar</BtnS>
          <BtnS onClick={() => CmdNoParm(CmdApi_FuncAdm.clearOldLogs)}>Limpar Logs Velhos</BtnS>
        </BtnLine>

        {mainStates.collectionCtrl != null &&
          <div>
            <Modal
              open={mainStates.collectionCtrl.open}
              onClose={closeCollectionModal}
            // aria-labelledby="modal-modal-title"
            // aria-describedby="modal-modal-description"
            >
              <Stack gap={1} overflow='hidden'
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

                {mainStates.collectionCtrl.collectionConfig?.name}

                <Stack direction='row' alignItems='center' gap={1}>
                  <Box>
                    <BtnS onClick={() => downloadCollection(mainStates.collectionCtrl.collectionConfig)} >
                      Download
                    </BtnS>
                  </Box>
                  <Box>
                    <BtnS onClick={() => resetCollection(mainStates.collectionCtrl.collectionConfig)} >
                      Reset
                    </BtnS>
                  </Box>
                </Stack>
                {mainStates.downloading == true && <WaitingObs text='Preparando para baixar' />}
                <DropAreaUpload dropZone={dropZone} />

                {mainStates.uploadStatus == UploadStatus.reseting && <WaitingObs text='Resetando' />}
                {mainStates.uploadStatus == UploadStatus.loading && <WaitingObs text={`Carregando ${mainStates.file.name}`} />}
                {mainStates.uploadStatus == UploadStatus.done &&
                  <Stack gap={0.2} overflow='auto'>
                    <Box>Carga de {mainStates.file.name}</Box>
                    <Box>Linhas com sucesso: {mainStates.uploadResult.linesOk}</Box>
                    {mainStates.uploadResult.linesError > 0 &&
                      <Box color='red'>Linhas com erro identificado: {mainStates.uploadResult.linesError}</Box>
                    }
                    {mainStates.uploadResult.linesErrorNotIdenf > 0 &&
                      <Box color='red'>Linhas com erro não identificado: {mainStates.uploadResult.linesErrorNotIdenf}</Box>
                    }
                    {/* Linhas processadas {mainStates.uploadResult.linesProc} ;
                      ok {mainStates.uploadResult.linesOk} ;
                      com erro identificado {mainStates.uploadResult.messagesError.length} ;
                      com erro não identificado {(mainStates.uploadResult.linesProc - (mainStates.uploadResult.linesOk + mainStates.uploadResult.messagesError.length))} ; */}
                    {mainStates.uploadResult.messages.map((x, index) =>
                      <Box key={index} sx={propsByMessageLevel(themePlus, x.level)}>{x.message}</Box>
                    )}
                  </Stack>
                }
              </Stack>
            </Modal>
          </div>
        }

        <VisualBlock>
          <Box>Coleções Md</Box>
          <BtnLine left>
            {Object.keys(collectionsMdConfig).map((x, i) =>
              <BtnS key={i} onClick={() => openCollectionModal(collectionsMdConfig[x])}>{collectionsMdConfig[x].name}</BtnS>
            )}
          </BtnLine>
        </VisualBlock>

        <VisualBlock>
          <Box>Coleções Outros</Box>
          <BtnLine left>
            {Object.keys(collectionsOthersConfig).map((x, i) =>
              <BtnS key={i} onClick={() => openCollectionModal(collectionsOthersConfig[x])}>{collectionsOthersConfig[x].name}</BtnS>
            )}
          </BtnLine>
        </VisualBlock>

        <BtnLine left>
          {/* <BtnS onClick={() => CmdNoParm(CmdApi_FuncAdm.loadUser)}>loadUser</BtnS> */}
          <BtnS onClick={() => CmdNoParm(CmdApi_FuncAdm.setTesteDataPlan)}>setTesteDataPlan</BtnS>
          <BtnS onClick={() => CmdNoParm(CmdApi_FuncAdm.setTesteDataInterfaceSap)}>setTesteDataInterfaceSap</BtnS>
          <BtnS onClick={() => TestCode()}>TestCode</BtnS>
        </BtnLine>

        <BtnLine left>
          <BtnS onClick={clearResults}>Clear results</BtnS>
        </BtnLine>
        <Divider />
        <Box>
          {resultAcum}
        </Box>
      </Stack>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} />);
  }
}