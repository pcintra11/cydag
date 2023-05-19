import React from 'react';
import { useRouter } from 'next/router';
import * as Papa from 'papaparse';
import { FileRejection, useDropzone } from 'react-dropzone';

import { Box, Stack, useTheme } from '@mui/material';

import { ObjUpdAllProps, ErrorPlus, ForceWait, mimeTypes } from '../../libCommon/util';
import { IGenericObject } from '../../libCommon/types';
import { PageDef } from '../../libCommon/endPoints';
import { CalcExecTime } from '../../libCommon/calcExectime';
import { csd, csl, dbgError } from '../../libCommon/dbg';

import { IUploadMessage, UploadFriendlyError, UploadStatus, UploadStateClear, ToCsvDownload } from '../../libCommon/uploadCsv';

import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { SaveAsXlsx } from '../../libClient/saveAsClient';
import { propsByMessageLevel } from '../../libClient/util';

import { DialogMy, FakeLink, PopupMsg, SnackBarError } from '../../components';
import { Btn, BtnLine, WaitingObs } from '../../components';
import { AbortProc, LogErrorUnmanaged } from '../../components';
import { FrmInput } from '../../components';
import { ColGridConfig, TableGrid } from '../../components';
import { DropAreaUpload } from '../../components/dropArea';

import { configApp } from '../../app_hub/appConfig';

import { IconButtonAppCrud } from '../../appCydag/components';
import { pagesApp, apisApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { AgrupPremissas, Diretoria, CentroCusto, Gerencia, Localidade, ProcessoOrcamentario, ProcessoOrcamentarioCentroCusto, UnidadeNegocio, User } from '../../appCydag/modelTypes';
import { OperInProcessoOrcamentario, ProcessoOrcamentarioStatus, ProcessoOrcamentarioStatusMd } from '../../appCydag/types';
import { CmdApi_Crud as CmdApi } from '../api/appCydag/processoOrcamentario/types';

class Entity extends ProcessoOrcamentario { }

enum Phase {
  initiating = 'initiating',
  list = 'list',
  configCCs = 'configCCs',
}
let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync<any>(apisApp.processoOrcamentario.apiPath, parm) };
const pageSelf = pagesApp.processoOrcamentario;
export default function PageProcessoOrcamentario() {
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    listing?: { dataRows?: Entity[] };
    data?: Entity; index?: number;
    downloading?: boolean, uploadStatus?: UploadStatus, uploadResult?: { messages: IUploadMessage[], linesOk: number, linesError: number };
  }
  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });
  const agora = new Date();
  const themePlus = useTheme();

  //#region db access
  const insert = async () => {
    const data = {
      ano: (Number(mainStates.listing.dataRows[0].ano) + 1).toString(),
      status: ProcessoOrcamentarioStatus.preparacao,
    };
    await efetiva(CmdApi.insert, null, null, data);
  };
  const setProcessoOrcamentarioStatus = async (index: number, status: ProcessoOrcamentarioStatus) => {
    const data = mainStates.listing.dataRows[index];
    if (status == ProcessoOrcamentarioStatus.encerrado) {
      const resposta = 'ENCERRA';
      DialogMy({
        body: 'Esse ano será totalmente encerrado e não poderá ser reaberto para ajustes. Os dados serão mantido para consulta.',
        dialogInputs: [
          { label: `Digite ${resposta} para confirmar o procedimento` },
        ],
        buttons: [
          { text: 'Cancela' },
          {
            text: 'Efetivar',
            fnCheck: (inputResponses: string[]) => inputResponses[0].trim().toUpperCase() !== resposta ? 'Resposta inválida' : null,
            onClick: () => { efetiva(CmdApi.update, data._id.toString(), index, { status }); }
          },
        ]
      });
    }
    else
      await efetiva(CmdApi.update, data._id.toString(), index, { status });
  };
  const cmdNoData = async (index: number, cmd: CmdApi) => {
    const data = mainStates.listing.dataRows[index];
    await efetiva(cmd, data._id.toString(), index);
  };
  const efetiva = async (cmdApi: CmdApi, _id: string, index?: number, data?: any) => {
    try {
      let dataRowsRefresh = [...mainStates.listing.dataRows];
      if (cmdApi == CmdApi.insert) {
        const apiReturn = await apis.crud({ cmd: cmdApi, data });
        dataRowsRefresh = [Entity.deserialize(apiReturn.value), ...dataRowsRefresh];
      }
      else if (cmdApi == CmdApi.update) {
        const apiReturn = await apis.crud({ cmd: cmdApi, _id, data });
        dataRowsRefresh[index] = Entity.deserialize(apiReturn.value);
        if (data.status === ProcessoOrcamentarioStatus.preCalculado)
          PopupMsg.success('Processo concluído.');
      }
      else if (cmdApi == CmdApi.geraRevisaoValores) {
        const apiReturn = await apis.crud({ cmd: cmdApi, _id });
        dataRowsRefresh[index] = Entity.deserialize(apiReturn.value);
        PopupMsg.success('Processo concluído.');
      }
      else
        throw new Error(`cmd ${cmdApi} inválido`);
      setMainStatesCache({ phase: Phase.list, listing: { ...mainStates.listing, dataRows: dataRowsRefresh }, data: null, index: null });
    } catch (error) {
      SnackBarError(error, `${pageSelf.pagePath}-efetiva-${cmdApi}`);
    }
  };
  const downloadConfigCCsAndRefs = () => {
    setMainStatesCache({ downloading: true });
    let ponto = 0;
    apis.crud({ cmd: CmdApi.downloadConfigCCs, ano: mainStates.data.ano })
      .then((apiReturn) => {
        ponto++;
        const configCCs = (apiReturn.value.configCCsDb as IGenericObject[]).map((data) => ToCsvDownload(ProcessoOrcamentarioCentroCusto.deserialize(data), ProcessoOrcamentarioCentroCusto.fldsCsvDefCrud));
        if (configCCs.length == 0)
          //configCCs.push(ProcessoOrcamentarioCentroCusto.Generate({ centroCusto: configApp.csvTextNoData }).toCsvCrud());
          configCCs.push(ToCsvDownload(ProcessoOrcamentarioCentroCusto.fill({ centroCusto: configApp.csvTextNoData }), ProcessoOrcamentarioCentroCusto.fldsCsvDefCrud));

        //const csvStr = Papa.unparse(configCCs, { delimiter: configApp.csvDelimiter, header: true });
        // const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8' });
        // FileSaver.saveAs(blob, `${downloadFilename}.csv`);

        // const downloadRef = (name: string, docs: any[]) => {
        //   const csvCCsStr = Papa.unparse(docs, { delimiter: configApp.csvDelimiter, header: true });
        //   const blob = new Blob([Portuguese.RemoveAccentuation(csvCCsStr)], { type: 'text/csv;charset=utf-8' });
        //   FileSaver.saveAs(blob, `${downloadFilenameRefPrefixCsv}_${name}.csv`);
        // };

        ponto++;
        const documentsCentroCusto = (apiReturn.value.documentsCentroCusto as IGenericObject[]).map((data) => CentroCusto.deserialize(data).toCsv());
        if (documentsCentroCusto.length == 0) documentsCentroCusto.push(CentroCusto.fill({ cod: configApp.csvTextNoData }).toCsv());

        ponto++;
        const documentsUser = (apiReturn.value.documentsUser as IGenericObject[]).map((data) => User.deserialize(data).toCsv());
        if (documentsUser.length == 0) documentsUser.push(User.fill({ email: configApp.csvTextNoData }).toCsv());

        ponto++;
        const documentsAgrupPremissas = (apiReturn.value.documentsAgrupPremissas as IGenericObject[]).map((data) => AgrupPremissas.deserialize(data).toCsv());
        if (documentsAgrupPremissas.length == 0) documentsAgrupPremissas.push(AgrupPremissas.fill({ cod: configApp.csvTextNoData }).toCsv());

        ponto++;
        const documentsLocalidade = (apiReturn.value.documentsLocalidade as IGenericObject[]).map((data) => Localidade.deserialize(data).toCsv());
        if (documentsLocalidade.length == 0) documentsLocalidade.push(Localidade.fill({ cod: configApp.csvTextNoData }).toCsv());

        ponto++;
        const documentsUnidadeNegocio = (apiReturn.value.documentsUnidadeNegocio as IGenericObject[]).map((data) => UnidadeNegocio.deserialize(data).toCsv());
        if (documentsUnidadeNegocio.length == 0) documentsUnidadeNegocio.push(UnidadeNegocio.fill({ cod: configApp.csvTextNoData }).toCsv());

        ponto++;
        const documentsDiretoria = (apiReturn.value.documentsDiretoria as IGenericObject[]).map((data) => Diretoria.deserialize(data).toCsv());
        if (documentsDiretoria.length == 0) documentsDiretoria.push(Diretoria.fill({ cod: configApp.csvTextNoData }).toCsv());

        ponto++;
        const documentsGerencia = (apiReturn.value.documentsGerencia as IGenericObject[]).map((data) => Gerencia.deserialize(data).toCsv());
        if (documentsGerencia.length == 0) documentsGerencia.push(Gerencia.fill({ cod: configApp.csvTextNoData }).toCsv());

        // ponto++;
        // const documentsDepto = (apiReturn.value.documentsDepto as IGenericObject[]).map((data) => Depto.deserialize(data).toCsv());
        // if (documentsDepto.length == 0) documentsDepto.push(new Depto().Fill({ cod: configApp.csvTextNoData }).toCsv());

        ponto++;
        const orientacoes = [
          { 'Orientações': '' },
          { 'Orientações': `Para anular alguma coluna use esse valor: ${configApp.csvStrForNull}` },
          { 'Orientações': '' },
          { 'Orientações': 'emailConsulta: separe os emails por vírgula' },
          { 'Orientações': '' },
          { 'Orientações': 'Salve a planilha que deverá ser importada (a primeira) como CSV UTF-8' },
        ];

        ponto++;
        SaveAsXlsx(`download_centro_custo_config_${mainStates.data.ano}`, [
          { sheetName: 'dados', data: configCCs },
          { sheetName: 'centroCusto', data: documentsCentroCusto },
          { sheetName: 'emailUsuarios', data: documentsUser },
          { sheetName: 'agrupPremissas', data: documentsAgrupPremissas },
          { sheetName: 'localidade', data: documentsLocalidade },
          { sheetName: 'unidadeNegocio', data: documentsUnidadeNegocio },
          { sheetName: 'diretoria', data: documentsDiretoria },
          { sheetName: 'gerencia', data: documentsGerencia },
          //{ sheetName: 'depto', data: documentsDepto },
          { sheetName: 'orientacoes', data: orientacoes },
        ]);
      })
      .catch((error) => {
        dbgError(`ponto ${ponto}`, 'erro downloadConfigCCsAndRefs', error);
      })
      .finally(() => {
        setMainStatesCache({ downloading: false });
      });
  };
  const setConfigCCs = async (ano: string, data: any[]) => {
    csl('conectando com o servidor');
    const calcExecTime = new CalcExecTime();
    const apiReturn = await apis.crud({ cmd: CmdApi.uploadConfigCCs, ano, data });
    const uploadResult = { messages: apiReturn.value.messages as IUploadMessage[], linesOk: apiReturn.value.linesOk, linesError: apiReturn.value.linesError };
    csl(`tempo total de resposta do servidor ${calcExecTime.elapsedMs()}ms`);
    return uploadResult;
    //setMainStatesCache({ phase: Phase.list, listing: { ...mainStates.listing, dataRows: dataRowsRefresh }, data: null, index: null });
  };
  //#endregion

  //#region drop file
  function onDrop(acceptedFiles: File[], fileRejections: FileRejection[]) {
    //csl('onDrop', { acceptedFiles, fileRejections, ev });
    if (acceptedFiles.length !== 1)
      //setMainStatesCache({ uploadStatus: UploadStatus.done, uploadLinesResult: ['Número inválido de arquivos'] });
      PopupMsg.error('Número inválido de arquivos.');
    else if (fileRejections.length > 0) {
      const errorsAll = fileRejections.map(({ file, errors }) => {
        const msgErro = errors.reduce((acum, curr) => [...acum, UploadFriendlyError(curr)], []).join(', ');
        return `arquivo ${file.name} rejeitado: ${msgErro}`;
      }).join('; ');
      //setMainStatesCache({ uploadStatus: UploadStatus.done, uploadLinesResult: errorsAll });
      PopupMsg.error(errorsAll);
    }
    else {
      const file = acceptedFiles[0];
      setMainStatesCache({ uploadStatus: UploadStatus.loading, uploadResult: null });
      const calcExecTimeSearch = new CalcExecTime();
      file.text()
        .then(async (csvString) => {
          //csl(file.name, csvString);
          try {
            const papaCsv = Papa.parse(csvString, { delimiter: configApp.csvDelimiter });
            if (papaCsv.errors.length != 0) {
              SnackBarError('Erro ao interpretar o arquivo csv', `${pageSelf.pagePath}-Papa.parse`);
              setMainStatesCache({ uploadStatus: UploadStatus.none });
              return;
            }
            // if (papaCsv.data.length == 0 ||
            //   !(papaCsv.data[0] as string[]).includes(configApp.csvColumnCmd)) {
            //   SnackBarError(`O arquivo deve ter a coluna "${configApp.csvColumnCmd}"`);
            //   setMainStatesCache({ uploadStatus: UploadStatus.done });
            //   return;
            // }
            const uploadResult = await setConfigCCs(mainStates.data.ano, papaCsv.data);
            await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs * 3);
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

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
    (async () => {
      try {
        const apiReturn = await apis.crud({ cmd: CmdApi.list });
        const documents = (apiReturn.value.documents as IGenericObject[]).map((data) => Entity.deserialize(data));
        if (!mount) return;
        setMainStatesCache({ phase: Phase.list, listing: { dataRows: documents } });
      } catch (error) {
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-init`);
        setMainStatesCache({ error });
      }
    })();
    return () => { mount = false; };
  }, [router.isReady, isLoadingUser, loggedUser?.email, router?.asPath]);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  if (mainStates.phase == Phase.initiating) return <WaitingObs />;

  const setPhase = (phase: Phase, index?: number) => {
    try {
      if (phase == Phase.list) {
        setMainStatesCache({ phase: Phase.list, data: null, index: null, uploadStatus: UploadStatus.none });
        //UploadStateClear(dropZone.acceptedFiles, dropZone.fileRejections, dropZone.inputRef);
        UploadStateClear(dropZone);
      }
      else if (phase == Phase.configCCs) {
        const data = mainStates.listing.dataRows[index];
        //FrmSetValues(frmData, FrmDefaultValues(new FrmData(), data));
        setMainStatesCache({ phase, data, index });
      }
      else
        throw new Error(`phase '${phase}' inválida`);
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-${phase}`);
      setMainStatesCache({ error });
    }
  };

  const Cmd = ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => {
    return (
      <Btn small sx={{ textTransform: 'none' }} onClick={onClick}>
        {children}
      </Btn>
    );
  };

  try {
    if (mainStates.phase == Phase.list) {
      const allowInsert = mainStates.listing?.dataRows?.length > 0 &&
        (agora.getFullYear() > Number(mainStates.listing.dataRows[0].ano) ||
          (agora.getFullYear() == Number(mainStates.listing.dataRows[0].ano) &&
            agora.getMonth() > 6));
      const colsGridConfig = [
        new ColGridConfig(
          allowInsert
            ? <Stack direction='row' alignItems='center' gap={1} justifyContent='center'>
              <IconButtonAppCrud icon='create' onClick={() => insert()} />
            </Stack>
            : '',
          ({ data, index }: { data: Entity, index: number }) => {
            let statusRetroage: { text: string, status: ProcessoOrcamentarioStatus } = null;
            let statusAvanca: { text: string, status: ProcessoOrcamentarioStatus } = null;
            if (data.status === ProcessoOrcamentarioStatus.preparacao)
              statusAvanca = { text: 'Input Planej.', status: ProcessoOrcamentarioStatus.inputPlanej };
            else if (data.status === ProcessoOrcamentarioStatus.inputPlanej) {
              statusRetroage = { text: 'Preparação', status: ProcessoOrcamentarioStatus.preparacao };
              statusAvanca = { text: 'Bloqueia', status: ProcessoOrcamentarioStatus.bloqueado };
            }
            else if (data.status === ProcessoOrcamentarioStatus.bloqueado) {
              statusRetroage = { text: 'Input Planej.', status: ProcessoOrcamentarioStatus.inputPlanej };
              statusAvanca = { text: 'Pré Calcula', status: ProcessoOrcamentarioStatus.preCalculado };
            }
            else if (data.status === ProcessoOrcamentarioStatus.preCalculado) {
              statusRetroage = { text: 'Input Planej.', status: ProcessoOrcamentarioStatus.inputPlanej };
              statusAvanca = { text: 'Encerra', status: ProcessoOrcamentarioStatus.encerrado };
            }
            // else if (data.status === ProcessoOrcamentarioStatus.encerrado)
            //   statusRetroage = { text: 'Reabre', status: ProcessoOrcamentarioStatus.bloqueado };
            return (
              <Stack direction='row' alignItems='center' gap={2}>
                {statusRetroage != null &&
                  <Cmd onClick={() => setProcessoOrcamentarioStatus(index, statusRetroage.status)}>
                    {'<='} {statusRetroage.text}
                  </Cmd>
                }
                {statusAvanca != null &&
                  <Cmd onClick={() => setProcessoOrcamentarioStatus(index, statusAvanca.status)}>
                    {statusAvanca.text} {'=>'}
                  </Cmd>
                }
                {(data.status === ProcessoOrcamentarioStatus.preCalculado &&
                  (data.horaRevisaoAnterior == null || data.horaRevisaoAnterior.getTime() !== data.horaPreCalcValoresPlanejados.getTime())) &&
                  <Cmd onClick={() => cmdNoData(index, CmdApi.geraRevisaoValores)}>
                    Gera Revisão do Orçamento
                  </Cmd>
                }
                {ProcessoOrcamentarioStatusMd.blockOper(OperInProcessoOrcamentario.altConfigCCs, data.status) == null &&
                  <Cmd onClick={() => setPhase(Phase.configCCs, index)}>
                    Config CCs
                  </Cmd>
                }
              </Stack>
            );
          }
        ),
        new ColGridConfig('Ano', ({ data }: { data: Entity }) => data.ano),
        new ColGridConfig('Status', ({ data }: { data: Entity }) => ProcessoOrcamentarioStatusMd.descr(data.status)),
        new ColGridConfig('Obs', ({ data }: { data: Entity }) => data.obsArray().map((x, index) => <Box key={index}>{x}</Box>), { width: '1fr' }),
        //new ColGridConfig('Perc. Limite Alerta', ({ data }: { data: Entity }) => data.percLimiteFarois, { width: '1fr' }),
      ];

      return (
        <Stack gap={1} height='100%'>
          <Box flex={1} overflow='hidden'>
            <Stack gap={1} height='100%'>
              <TableGrid
                colsGridConfig={colsGridConfig}
                dataRows={mainStates.listing.dataRows}
              />
            </Stack>
          </Box>
        </Stack>
      );
    }

    else if (mainStates.phase == Phase.configCCs) {

      return (
        <Stack gap={1} height='100%' overflow='auto'>
          <Stack gap={1}>
            <FrmInput label='Ano' value={mainStates.data.ano} disabled />
            <FakeLink onClick={() => downloadConfigCCsAndRefs()}>
              Baixe aqui os arquivos de suporte para essa atualização
            </FakeLink>
            {mainStates.downloading == true && <WaitingObs text='Preparando para baixar' />}

            <DropAreaUpload dropZone={dropZone} bgcolor={themePlus.themePlusConfig?.colorBackDroparea} />

            {mainStates.uploadStatus == UploadStatus.loading && <WaitingObs text='Carregando' />}
            {mainStates.uploadStatus == UploadStatus.done &&
              <Stack gap={0.2}>
                {(mainStates.uploadResult.linesOk + mainStates.uploadResult.linesError) !== 0 &&
                  <Box>
                    Linhas processadas: com sucesso {mainStates.uploadResult.linesOk} ;
                    com erro {mainStates.uploadResult.linesError}
                  </Box>
                }
                {mainStates.uploadResult.messages.map((x, index) =>
                  <Box key={index} sx={propsByMessageLevel(themePlus, x.level)}>{x.message}</Box>
                )}
              </Stack>
            }
            <BtnLine>
              <Btn onClick={() => setPhase(Phase.list)}>Voltar</Btn>
            </BtnLine>
          </Stack>
        </Stack>
      );
    }

    else
      throw new Error(`fase ${mainStates.phase} inválida`);
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />);
  }
}