import React from 'react';
import { useRouter } from 'next/router';
import { Box, Stack } from '@mui/material';

import { IsErrorManaged, ObjUpdAllProps, ErrorPlus, ObjDiff, ForceWait } from '../../../libCommon/util';
import { IGenericObject } from '../../../libCommon/types';
import { CalcExecTime } from '../../../libCommon/calcExectime';
import { PageDef } from '../../../libCommon/endPoints';

import { CallApiCliASync } from '../../../fetcher/fetcherCli';

import { AlertMy, PopupMsg, Tx } from '../../../components';
import { Btn, BtnLine, WaitingObs } from '../../../components';
import { AbortProc, LogErrorUnmanaged } from '../../../components';
import { FrmError, FrmInput } from '../../../components';
import { ColGridConfig, TableGrid } from '../../../components';
import { FrmDefaultValues, FrmSetValues, NormalizePropsString, useFrm } from '../../../hooks/useMyForm';

import { configApp } from '../../../app_hub/appConfig';

import { BtnCrud, IconButtonAppCrud, IconButtonAppSearch } from '../../../appCydag/components';
import { pagesApp, apisApp } from '../../../appCydag/endPoints';
import { useLoggedUser } from '../../../appCydag/useLoggedUser';
import { Entity_Crud, CmdApi_Crud as CmdApi, crudValidations } from '../../api/appCydag/gerencia/types';

enum Phase {
  initiating = 'initiating',
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
}
class FrmData {
  cod: string;
  descr: string;
}
class FrmFilter {
  searchTerms: string;
}
let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync<any>(apisApp.gerencia.apiPath, parm) };
const pageSelf = pagesApp.gerencia;
export default function PageGerenciaCrud() {
  const frmFilter = useFrm<FrmFilter>({
    defaultValues: FrmDefaultValues(new FrmFilter()),
  });
  const frmData = useFrm<FrmData>({ defaultValues: {}, schema: crudValidations });
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    filter?: IGenericObject; filterApplyed?: boolean;
    listing?: { searching: boolean, dataRows?: Entity_Crud[], partialResults?: boolean };
    data?: Entity_Crud; index?: number;
  }
  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  //#region db access
  const onSubmitList = async (dataForm: FrmFilter) => {
    const filter = NormalizePropsString(dataForm);
    try {
      const calcExecTimeSearch = new CalcExecTime();
      setMainStatesCache({ filterApplyed: true, listing: { searching: true } });
      const apiReturn = await apis.crud({ cmd: CmdApi.list, filter });
      const documents = (apiReturn.value.documents as IGenericObject[]).map((data) => Entity_Crud.deserialize(data));
      if (!mount) return;
      setMainStatesCache({ filter });
      await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs);
      setMainStatesCache({ listing: { searching: false, dataRows: documents, partialResults: apiReturn.value.partialResults } });
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-onSubmit`);
      PopupMsg.error(error);
    }
  };
  const onSubmitInsert = async (dataForm) => {
    await efetiva(CmdApi.insert, null, null, NormalizePropsString(dataForm));
  };
  const onSubmitUpdate = async (dataForm: FrmData) => {
    if (ObjDiff(dataForm, mainStates.data) == null) return PopupMsg.error('Nada a salvar.');
    await efetiva(CmdApi.update, mainStates.data._id.toString(), mainStates.index, NormalizePropsString(dataForm));
  };
  const onSubmitDelete = async () => {
    efetiva(CmdApi.delete, mainStates.data._id.toString(), mainStates.index);
  };
  const efetiva = async (cmdApi: CmdApi, _id: string, index?: number, data?: FrmData) => {
    try {
      let dataRowsRefresh = [...mainStates.listing.dataRows];
      if (cmdApi == CmdApi.insert) {
        const apiReturn = await apis.crud({ cmd: cmdApi, data });
        dataRowsRefresh = [...dataRowsRefresh, Entity_Crud.deserialize(apiReturn.value)];
      }
      else if (cmdApi == CmdApi.update) {
        const apiReturn = await apis.crud({ cmd: cmdApi, _id, data });
        dataRowsRefresh[index] = Entity_Crud.deserialize(apiReturn.value);
      }
      else if (cmdApi == CmdApi.delete) {
        await apis.crud({ cmd: cmdApi, _id });
        dataRowsRefresh.splice(index, 1);
      }
      setMainStatesCache({ phase: Phase.list, listing: { ...mainStates.listing, dataRows: dataRowsRefresh }, data: null, index: null });
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-efetiva-${cmdApi}`);
      if (!IsErrorManaged(error)) {
        setMainStatesCache({ error });
        return;
      }
      FrmError(frmData, error);
    }
  };
  //#endregion

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
    setMainStatesCache({ phase: Phase.list, filter: { searchTerms: '' }, filterApplyed: false, listing: { searching: false, dataRows: [] } });
    return () => { mount = false; };
  }, [router.isReady, isLoadingUser, loggedUser?.email]);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  if (mainStates.phase == Phase.initiating) return <WaitingObs />;

  const setPhase = async (phase: Phase, index?: number) => {
    try {
      if (phase == Phase.list)
        setMainStatesCache({ phase: Phase.list, data: null, index: null });
      else {
        const data = phase === Phase.insert ? Entity_Crud.new(true) : mainStates.listing.dataRows[index];
        FrmSetValues(frmData, FrmDefaultValues(new FrmData(), data));
        setMainStatesCache({ phase, data, index });
      }
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-${phase}`);
      setMainStatesCache({ error });
    }
  };

  try {
    if (mainStates.phase == Phase.list) {
      const colsGridConfig = [
        new ColGridConfig(
          <Stack direction='row' alignItems='center' spacing={1} justifyContent='center'>
            <IconButtonAppCrud icon='create' onClick={() => setPhase(Phase.insert)} />
          </Stack>,
          ({ index }: { index: number }) => (
            <Stack direction='row' alignItems='center' spacing={1}>
              <IconButtonAppCrud icon='edit' onClick={() => setPhase(Phase.update, index)} />
              <IconButtonAppCrud icon='delete' onClick={() => setPhase(Phase.delete, index)} />
            </Stack>
          )
        ),
        new ColGridConfig(<Tx>Código</Tx>, ({ data }: { data: Entity_Crud }) => <Tx>{data.cod}</Tx>),
        new ColGridConfig(<Tx>Descrição</Tx>, ({ data }: { data: Entity_Crud }) => <Tx>{data.descr}</Tx>, { width: '1fr' }),
      ];

      return (
        <Stack spacing={1} height='100%'>
          <form onSubmit={frmFilter.handleSubmit(onSubmitList)}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <Box flex={1}>
                <FrmInput placeholder='termos de busca' frm={frmFilter} name={Entity_Crud.F.searchTerms} width='100%' autoFocus />
              </Box>
              <IconButtonAppSearch />
            </Stack>
          </form>
          <Box flex={1} overflow='hidden'>
            {mainStates.listing.searching
              ? <WaitingObs text='buscando' />
              : <Stack spacing={1} height='100%'>
                {(mainStates.listing.partialResults) && <AlertMy>Resultados parciais</AlertMy>}
                {(mainStates.filterApplyed && mainStates.listing.dataRows.length == 0) && <Tx>Nada encontrado</Tx>}
                <TableGrid fullHeightScroll
                  colsGridConfig={colsGridConfig}
                  dataRows={mainStates.listing.dataRows}
                />
              </Stack>
            }
          </Box>
        </Stack>
      );
    }
    let phaseCrud: { onSubmit?: (data: any) => void, button: ReturnType<typeof BtnCrud> };
    if (mainStates.phase == Phase.insert)
      phaseCrud = { onSubmit: onSubmitInsert, button: <BtnCrud action='insert' /> };
    else if (mainStates.phase == Phase.update)
      phaseCrud = { onSubmit: onSubmitUpdate, button: <BtnCrud action='update' /> };
    else if (mainStates.phase == Phase.delete)
      phaseCrud = { button: <BtnCrud action='delete' onClick={onSubmitDelete} /> };
    else
      throw new Error(`fase ${mainStates.phase} inválida`);

    const isInsert = mainStates.phase == Phase.insert;
    const isDelete = mainStates.phase == Phase.delete;

    return (
      <Stack spacing={1} height='100%' overflow='auto'>
        <form onSubmit={frmData.handleSubmit(phaseCrud.onSubmit)}>
          <Stack spacing={1}>
            <FrmInput label='Código' frm={frmData} name={Entity_Crud.F.cod} autoFocus={isInsert} disabled={!isInsert} />
            <FrmInput label='Descrição' frm={frmData} name={Entity_Crud.F.descr} autoFocus={!isInsert} disabled={isDelete} />
            <BtnLine>
              {phaseCrud.button}
              <Btn onClick={() => setPhase(Phase.list)}>Cancelar</Btn>
            </BtnLine>
          </Stack>
        </form>
      </Stack>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />);
  }
}