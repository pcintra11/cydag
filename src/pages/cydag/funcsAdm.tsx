import React from 'react';
import { useRouter } from 'next/router';
import * as Papa from 'papaparse';
import { FileRejection, useDropzone } from 'react-dropzone';

import { Box, Divider, Modal, Stack, useTheme } from '@mui/material';

import { CtrlCollect, ErrorPlus, HoraDebug, IdByTime, mimeTypes, ObjUpdAllProps } from '../../libCommon/util';
import { PageDef } from '../../libCommon/endPoints';
import { CalcExecTime } from '../../libCommon/calcExectime';
import { IGenericObject } from '../../libCommon/types';
import { FldCsvDef, IUploadMessage, ToCsvDownload, UploadFriendlyError, UploadStatus } from '../../libCommon/uploadCsv';
import { csd, dbgError } from '../../libCommon/dbg';

import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { propsByMessageLevel } from '../../libClient/util';
import { SaveAsXlsx } from '../../libClient/saveAsClient';

import { Btn, BtnLine, DialogMy, FakeLink, FrmCheckbox, PopupMsg, SnackBarError, VisualBlock, WaitingObs } from '../../components';
import { AbortProc, LogErrorUnmanaged } from '../../components';
import { DropAreaUpload } from '../../components/dropArea';

import { configApp } from '../../app_hub/appConfig';

import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { CmdApi_FuncAdm } from '../api/appCydag/funcsAdm/types';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { AgrupPremissas, Diretoria, Gerencia, Empresa, CentroCusto, UnidadeNegocio, Localidade, FatorCusto, ClasseCusto, Premissa, ValoresPremissa, FuncaoTerceiro, Viagem, ValoresLocalidade, ValoresTransfer, ValoresRealizados, User, ValoresImputados, ValoresPlanejadosHistorico, Terceiro } from '../../appCydag/modelTypes';
import { ValoresAnaliseRealPlan } from '../../appCydag/types';

let seqProc = 0;
//const idProcGen = (info: string) => `${++seqProc}${IdByTime()}(${info})`;
const idProcGen = () => `${++seqProc}${IdByTime()}`;

interface IEntity<T> {
  deserialize: (values: IGenericObject) => T,
  new(...args: any[]): T,
}

interface ICollectionConfig<T> { name: string, entity: IEntity<T>, entityStructure: any, fldsCsvDefUpload?: FldCsvDef[] }
const collectionsMdConfig = {
  agrupPremissas: { name: 'AgrupPremissas', entity: AgrupPremissas, entityStructure: AgrupPremissas.new(), fldsCsvDefUpload: AgrupPremissas.fldsCsvDefUpload } as ICollectionConfig<AgrupPremissas>,
  centroCusto: { name: 'CentroCusto', entity: CentroCusto, entityStructure: CentroCusto.new(), fldsCsvDefUpload: CentroCusto.fldsCsvDefUpload } as ICollectionConfig<CentroCusto>,
  diretoria: { name: 'Diretoria', entity: Diretoria, entityStructure: Diretoria.new(), fldsCsvDefUpload: Diretoria.fldsCsvDefUpload } as ICollectionConfig<Diretoria>,
  empresa: { name: 'Empresa', entity: Empresa, entityStructure: Empresa.new(), fldsCsvDefUpload: Empresa.fldsCsvDefUpload } as ICollectionConfig<Empresa>,
  gerencia: { name: 'Gerencia', entity: Gerencia, entityStructure: Gerencia.new(), fldsCsvDefUpload: Gerencia.fldsCsvDefUpload } as ICollectionConfig<Gerencia>,
  localidade: { name: 'Localidade', entity: Localidade, entityStructure: Localidade.new(), fldsCsvDefUpload: Localidade.fldsCsvDefUpload } as ICollectionConfig<Localidade>,
  unidadeNegocio: { name: 'UnidadeNegocio', entity: UnidadeNegocio, entityStructure: UnidadeNegocio.new(), fldsCsvDefUpload: UnidadeNegocio.fldsCsvDefUpload } as ICollectionConfig<UnidadeNegocio>,

  fatorCusto: { name: 'FatorCusto', entity: FatorCusto, entityStructure: FatorCusto.new(), fldsCsvDefUpload: [] } as ICollectionConfig<FatorCusto>,
  classeCusto: { name: 'ClasseCusto', entity: ClasseCusto, entityStructure: ClasseCusto.new(), fldsCsvDefUpload: ClasseCusto.fldsCsvDefUpload } as ICollectionConfig<ClasseCusto>,
  premissa: { name: 'Premissa', entity: Premissa, entityStructure: Premissa.new(), fldsCsvDefUpload: Premissa.fldsCsvDefUpload } as ICollectionConfig<Premissa>,
  funcTerceiro: { name: 'FuncaoTerceiro', entity: FuncaoTerceiro, entityStructure: FuncaoTerceiro.new(), fldsCsvDefUpload: FuncaoTerceiro.fldsCsvDefUpload } as ICollectionConfig<FuncaoTerceiro>,
};

const collectionsOthersConfig = {
  user: { name: 'User', entity: User, entityStructure: User.new(), fldsCsvDefUpload: User.fldsCsvDefUpload } as ICollectionConfig<User>,

  valoresRealizados: { name: 'ValoresRealizados', entity: ValoresRealizados, entityStructure: ValoresRealizados.new(), fldsCsvDefUpload: ValoresRealizados.fldsCsvDefUpload } as ICollectionConfig<ValoresRealizados>,
  valoresImputados: { name: 'ValoresImputados', entity: ValoresImputados, entityStructure: ValoresImputados.new(), fldsCsvDefUpload: ValoresImputados.fldsCsvDefUpload } as ICollectionConfig<ValoresImputados>,
  valoresPlanejadosHistorico: { name: 'valoresPlanejadosHistorico', entity: ValoresPlanejadosHistorico, entityStructure: ValoresPlanejadosHistorico.new(), fldsCsvDefUpload: ValoresPlanejadosHistorico.fldsCsvDefUpload } as ICollectionConfig<ValoresPlanejadosHistorico>,

  valoresPremissa: { name: 'ValoresPremissa', entity: ValoresPremissa, entityStructure: ValoresPremissa.new(), fldsCsvDefUpload: ValoresPremissa.fldsCsvDefUpload } as ICollectionConfig<ValoresPremissa>,
  valoresLocalid: { name: 'ValoresLocalid', entity: ValoresLocalidade, entityStructure: ValoresLocalidade.new(), fldsCsvDefUpload: ValoresLocalidade.fldsCsvDefUpload } as ICollectionConfig<ValoresLocalidade>,
  valoresTransfer: { name: 'ValoresTransfer', entity: ValoresTransfer, entityStructure: ValoresTransfer.new(), fldsCsvDefUpload: ValoresTransfer.fldsCsvDefUpload } as ICollectionConfig<ValoresTransfer>,

  viagens: { name: 'Viagem', entity: Viagem, entityStructure: Viagem.new(), fldsCsvDefUpload: Viagem.fldsCsvDefUpload } as ICollectionConfig<Viagem>,
  terceiros: { name: 'Terceiro', entity: Terceiro, entityStructure: Terceiro.new(), fldsCsvDefUpload: Terceiro.fldsCsvDefUpload } as ICollectionConfig<Terceiro>,
};

let msgsAcum: string[] = [];

class MainStates {
  preparing?: 'initiating';
  error?: Error | ErrorPlus;
  collectionCtrl?: { open: boolean, collectionConfig?: ICollectionConfig<any> };
  downloadAmostra?: boolean;
  uploadEach?: boolean; //#!!!!!!!!
  downloading?: boolean;
  uploadStatus?: UploadStatus;
  file?: File;
  uploadResult?: { linesProc: number, linesOk: number, linesError: number, linesErrorNotIdenf: number, messages: IUploadMessage[] };
  blocos?: { div?: boolean, cols?: boolean, dataTest?: boolean };
  constructor() {
    this.preparing = 'initiating';
    this.downloadAmostra = false;
    this.uploadEach = false;
    this.blocos = {};
  }
}
let mount = false; let mainStatesCache: MainStates = null;

const apis = {
  adm: async (parm: IGenericObject) => {
    const apiReturn = await CallApiCliASync<{ value: { msgsProc: string[] } }>(apisApp.funcsAdm.apiPath, parm);
    return { ...apiReturn.value };
  },
  admUpload: async (parm: IGenericObject) => {
    const apiReturn = await CallApiCliASync<{ value: { messages: IUploadMessage[], linesProc: number, linesOk: number, linesError: number, linesErrorNotIdenf: number } }>(apisApp.funcsAdm.apiPath,
      { cmd: CmdApi_FuncAdm.collectionUpload, ...parm });
    return { ...apiReturn.value };
  },
  admDownload: async (collection: string, downloadAmostra: boolean) => {
    const apiReturn = await CallApiCliASync<{ value: { documentArray: IGenericObject[] } }>(apisApp.funcsAdm.apiPath,
      { cmd: CmdApi_FuncAdm.collectionDownload, collection, downloadAmostra });
    return { ...apiReturn.value };
  },
  admReset: async (collection: string) => {
    await CallApiCliASync(apisApp.funcsAdm.apiPath,
      { cmd: CmdApi_FuncAdm.collectionReset, collection });
    return;
  },
};
const pageSelf = pagesApp.funcsAdm;
export default function PageFuncsAdm() {
  const [mainStates, setMainStates] = React.useState(new MainStates());
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  const [resultAcum, setResultAcum] = React.useState<React.ReactNode>(null);
  //const [qtdMailsDialog, setQtdMailsDialog] = React.useState<number>(3);

  const openCollectionModal = (collectionConfig: ICollectionConfig<any>) => {
    setMainStatesCache({ collectionCtrl: { open: true, collectionConfig }, downloading: false, uploadStatus: null, file: null, uploadResult: null });
  };
  const closeCollectionModal = () => setMainStatesCache({ collectionCtrl: { open: false } });

  const agora = new Date();
  const themePlus = useTheme();

  const appendResults = (id: string, msgs: string[] = [''], withHourAndId = true) => {
    const hourAndId = withHourAndId ? `${HoraDebug()} - ${id} - ` : '';
    msgsAcum = [...msgsAcum, ...msgs.map((x) => `${hourAndId}${x}`)];
    //csl({ msgs });
    //setResult(<div><p>1:{msgs.length}</p><p>2:{msgs.length}</p></div>);
    setResultAcum(<Box>{msgsAcum.map((x, i) => <p key={i}>{x}</p>)}</Box>);
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
            //const apiReturn = await apis.admUpload({ collection: mainStates.collectionCtrl.collectionConfig.name, data: papaCsv.data });
            const { messages, linesProc, linesOk, linesError, linesErrorNotIdenf } = await apis.admUpload({ collection: mainStates.collectionCtrl.collectionConfig.name, data: papaCsv.data, uploadEach: mainStatesCache.uploadEach });

            const uploadResult = { linesProc, linesOk, linesError, linesErrorNotIdenf, messages };
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

  const downloadCollection = React.useCallback((collectionConfig: ICollectionConfig<any>) => {
    setMainStatesCache({ downloading: true });
    apis.admDownload(collectionConfig.name, mainStatesCache.downloadAmostra)
      .then(async ({ documentArray }) => {
        const documents = documentArray.map((data) => ToCsvDownload(collectionConfig.entity.deserialize(data), collectionConfig.fldsCsvDefUpload));
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
  const resetCollection = React.useCallback((collectionConfig: ICollectionConfig<any>) => {
    const efetiva = () => {
      setMainStatesCache({ uploadStatus: UploadStatus.reseting });
      apis.admReset(collectionConfig.name)
        .then(() => {
          PopupMsg.success(`Coleção ${collectionConfig.name} resetada.`);
        })
        .catch((error) => {
          PopupMsg.error(error.message);
          dbgError('resetCollection', collectionConfig.name, error);
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
    setMainStatesCache(new MainStates());
    return () => { mount = false; };
  }, [router?.asPath]);

  React.useEffect(() => {
    if (!router.isReady || isLoadingUser) return;
    try {
      if (mainStates.preparing === 'initiating') {
        if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
        msgsAcum = [];
        setMainStatesCache({ preparing: null });
      }
    }
    catch (error) {
      setMainStatesCache({ error });
    }
  }, [mainStates.preparing]);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} />;

  //#region funções
  const CmdNoParm = async (cmd: string, extraParm: IGenericObject = {}) => {
    const idProc = idProcGen();
    const calcExecTime = new CalcExecTime();
    appendResults(`${idProc}-ini (${cmd})`);
    try {
      const { msgsProc } = await apis.adm({ idProc, cmd, ...extraParm });
      if (!mount) return;
      appendResults(`${idProc}-fim ${calcExecTime.elapsedMs()}ms`, msgsProc);
    } catch (error) {
      appendResults(`${idProc}-fim (error) ${calcExecTime.elapsedMs()}ms`, [error.message]);
    }
  };
  const clearResults = () => {
    resetResults();
  };
  const TesteCodeClient = () => {
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

  const Fkl = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) =>
    <React.Fragment>
      <FakeLink onClick={onClick} mr={2}>{children}</FakeLink>
      {' '}
    </React.Fragment>;

  try {
    return (
      <Stack gap={1} height='100%' overflow='auto'>
        <Stack direction='row' alignItems='center' gap={3}>
          <BtnLine left>
            <BtnS onClick={clearResults}>Clear results</BtnS>
          </BtnLine>
          <Box>
            <Fkl onClick={() => setMainStatesCache({ blocos: { ...mainStatesCache.blocos, div: !mainStatesCache.blocos.div } })}>Diversos</Fkl>
            <Fkl onClick={() => setMainStatesCache({ blocos: { ...mainStatesCache.blocos, cols: !mainStatesCache.blocos.cols } })}>Coleções</Fkl>
            <Fkl onClick={() => setMainStatesCache({ blocos: { ...mainStatesCache.blocos, dataTest: !mainStatesCache.blocos.dataTest } })}>Dados Teste</Fkl>
          </Box>
        </Stack>

        {mainStatesCache.blocos.div === true &&
          <>
            <Box>
              <Fkl onClick={() => CmdNoParm(CmdApi_FuncAdm.ensureIndexes)}>ensureIndexes</Fkl>
              <Fkl onClick={() => CmdNoParm(CmdApi_FuncAdm.checkIndexes)}>checkIndexes</Fkl>
              <Fkl onClick={() => CmdNoParm(CmdApi_FuncAdm.clearLogsToDelete)}>Limpar Logs a Deletar</Fkl>
              <Fkl onClick={() => CmdNoParm(CmdApi_FuncAdm.clearOldLogs)}>Limpar Logs Velhos</Fkl>
            </Box>
          </>
        }

        {mainStates.collectionCtrl != null &&
          <Box>
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
                <DropAreaUpload dropZone={dropZone} bgcolor={themePlus.themePlusConfig?.colorBackDroparea} />

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
          </Box>
        }

        {mainStatesCache.blocos.cols === true &&
          <>
            <VisualBlock>
              <Box>Coleções Md</Box>
              <Box>
                {Object.keys(collectionsMdConfig).map((x, i) =>
                  <Fkl key={i} onClick={() => openCollectionModal(collectionsMdConfig[x])}>{collectionsMdConfig[x].name}</Fkl>
                )}
              </Box>
            </VisualBlock>

            <VisualBlock>
              <Box>Coleções Outros</Box>
              <Box>
                {Object.keys(collectionsOthersConfig).map((x, i) =>
                  <Fkl key={i} onClick={() => openCollectionModal(collectionsOthersConfig[x])}>{collectionsOthersConfig[x].name}</Fkl>
                )}
              </Box>
            </VisualBlock>

            <Stack direction='row' alignItems='center' gap={1}>
              <FrmCheckbox value={mainStates.downloadAmostra} label='Download amostra' onChange={(ev) => setMainStatesCache({ downloadAmostra: ev.target.checked })} />
              <FrmCheckbox value={mainStates.uploadEach} label='Upload trata cada registro' onChange={(ev) => setMainStatesCache({ uploadEach: ev.target.checked })} />
            </Stack>
          </>
        }

        {mainStatesCache.blocos.dataTest === true &&
          <Box>
            <Fkl onClick={() => CmdNoParm(CmdApi_FuncAdm.setTesteDataPlan)}>setTesteDataPlan</Fkl>
            <Fkl onClick={() => CmdNoParm(CmdApi_FuncAdm.setTesteDataInterfaceSap)}>setTesteDataInterfaceSap</Fkl>
            <Fkl onClick={() => CmdNoParm(CmdApi_FuncAdm.getMainAmbs)}>getMainAmbs</Fkl>
            <Fkl onClick={() => CmdNoParm(CmdApi_FuncAdm.testeCodeServer)}>testeCodeServer</Fkl>
            <Fkl onClick={() => TesteCodeClient()}>testeCodeClient</Fkl>
          </Box>
        }

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