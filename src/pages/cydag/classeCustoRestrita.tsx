import { useRouter } from 'next/router';
import React from 'react';
import { Autocomplete, FormHelperText, TextField, useTheme } from '@mui/material';

import { Box, FormControl, Stack } from '@mui/material';

import { IsErrorManaged, ObjUpdAllProps, ErrorPlus, ObjDiff, ForceWait, BinSearchItem } from '../../libCommon/util';
import { CalcExecTime } from '../../libCommon/calcExectime';
import { IGenericObject } from '../../libCommon/types';
import { PageDef } from '../../libCommon/endPoints';
import { csd } from '../../libCommon/dbg';

import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { AlertMy, FrmSetError, PopupMsg, Tx } from '../../components';
import { Btn, BtnLine, WaitingObs } from '../../components';
import { AbortProc, LogErrorUnmanaged } from '../../components';
import { FrmError, FrmInput } from '../../components';
import { ColGridConfig, TableGrid } from '../../components';
import { FrmDefaultValues, FrmSetValues, NormalizePropsString, useFrm, useWatchMy } from '../../hooks/useMyForm';

import { configApp } from '../../app_hub/appConfig';

import { BtnCrud, IconButtonAppCrud, IconButtonAppSearch } from '../../appCydag/components';
import { pagesApp, apisApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { CentroCusto, ClasseCusto, ClasseCustoRestrita } from '../../appCydag/modelTypes';
import { OrigemClasseCusto } from '../../appCydag/types';
import { CmdApi_CentroCusto } from '../api/appCydag/centroCusto/types';
import { CmdApi_ClasseCusto, SortType_ClasseCusto } from '../api/appCydag/classeCusto/types';
import { Entity_Crud, CmdApi_Crud as CmdApi } from '../api/appCydag/classeCustoRestrita/types';

enum Phase {
  initiating = 'initiating',
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
}
class FrmData {
  classeCusto: string;
  centroCustoArray: string[];
  obs: string;
}
class FrmFilter {
  classeCusto: string;
}
let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync<any>(apisApp.classeCustoRestrita.apiPath, parm) };
const pageSelf = pagesApp.classeCustoRestrita;
export default function PageClasseCustoRestritaCrud() {
  const frmFilter = useFrm<FrmFilter>({
    defaultValues: FrmDefaultValues(new FrmFilter()),
  });
  const frmData = useFrm<FrmData>({ defaultValues: {} });
  const classeCusto = useWatchMy({ control: frmData.control, name: ClasseCustoRestrita.F.classeCusto });
  const centroCustoArray = useWatchMy({ control: frmData.control, name: ClasseCustoRestrita.F.centroCustoArray });

  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    filter?: IGenericObject; filterApplied?: boolean;
    listing?: { searching: boolean, dataRows?: Entity_Crud[], partialResults?: boolean }; data?: Entity_Crud; index?: number;
    classeCustoArray?: ClasseCusto[]; centroCustoArray?: CentroCusto[];
    errorFlds?: { classeCustoError?: string; centroCustoArrayError?: string; };
  }
  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating, classeCustoArray: [], centroCustoArray: [], errorFlds: {} });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  const themePlus = useTheme();

  //#region db access
  const onSubmitList = async (dataForm: FrmFilter) => {
    const filter = NormalizePropsString(dataForm);
    try {
      const calcExecTimeSearch = new CalcExecTime();
      setMainStatesCache({ filterApplied: true, listing: { searching: true } });
      const apiReturn = await apis.crud({ cmd: CmdApi.list, filter });
      const documents = (apiReturn.value.documents as IGenericObject[]).map((data) => Entity_Crud.deserialize(data));
      //csl({apiReturn, documents});
      if (!mount) return;
      setMainStatesCache({ filter });
      await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs);
      setMainStatesCache({ listing: { searching: false, dataRows: documents, partialResults: apiReturn.value.partialResults } });
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-onSubmit`);
      PopupMsg.error(error);
    }
  };
  const checkData = (data: FrmData) => {
    const fldsErro: { mainsStatesError?: boolean, fld: string, msg: string }[] = [];
    if (data.classeCusto == null) fldsErro.push({ mainsStatesError: true, fld: ClasseCustoRestrita.F.classeCusto, msg: 'Informação obrigatória' });
    if (data.centroCustoArray.length == 0) fldsErro.push({ mainsStatesError: true, fld: ClasseCustoRestrita.F.centroCustoArray, msg: 'Informe ao menos algum Centro de Custo' });
    if (fldsErro.length > 0) {
      const mainStatesErrorsFld: any = {};
      fldsErro.forEach((fldErro) => {
        if (fldErro.mainsStatesError) mainStatesErrorsFld[`${fldErro.fld}Error`] = fldErro.msg;
        else FrmSetError(frmData, fldErro.fld as null, fldErro.msg);
      });
      setMainStatesCache({ errorFlds: mainStatesErrorsFld });
      return false;
    }
    return true;
  };
  const onSubmitInsert = async (dataForm: FrmData) => {
    const data = NormalizePropsString(dataForm);
    if (!checkData(data)) return;
    await efetiva(CmdApi.insert, null, null, data);
  };
  const onSubmitUpdate = async (dataForm: FrmData) => {
    if (ObjDiff(dataForm, mainStates.data) == null) return PopupMsg.error('Nada a salvar.');
    const data = NormalizePropsString(dataForm);
    if (!checkData(data)) return;
    await efetiva(CmdApi.update, mainStates.data._id.toString(), mainStates.index, data);
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
    setMainStatesCache({ phase: Phase.list, filter: { classeCusto: '' }, filterApplied: false, listing: { searching: false, dataRows: [] } });
    CallApiCliASync<any>(apisApp.classeCusto.apiPath, {
      cmd: CmdApi_ClasseCusto.list, getAll: true,
      filter: { origemArray: [OrigemClasseCusto.inputada, OrigemClasseCusto.totalImputada] },
      sortType: SortType_ClasseCusto.classeCusto
    })
      .then(async (apiReturn) => {
        const classeCustoArray = (apiReturn.value.documents as IGenericObject[]).map((data) => ClasseCusto.deserialize(data));
        //await SleepMsDevRandom(5000);
        setMainStatesCache({ classeCustoArray });
      })
      .catch((error) => {
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-CmdApi_ClasseCusto.list`);
        PopupMsg.error(error);
      });
    CallApiCliASync<any>(apisApp.centroCusto.apiPath, { cmd: CmdApi_CentroCusto.list, getAll: true })
      .then(async (apiReturn) => {
        const centroCustoArray = (apiReturn.value.documents as IGenericObject[]).map((data) => CentroCusto.deserialize(data));
        setMainStatesCache({ centroCustoArray });
      })
      .catch((error) => {
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-CmdApi_CentroCusto.list`);
        PopupMsg.error(error);
      });
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
        setMainStatesCache({ phase, data, index, errorFlds: {} });
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
        new ColGridConfig(<Tx>Classe de Custo</Tx>, ({ data }: { data: Entity_Crud }) => <Tx>{data.classeCusto}</Tx>),
        new ColGridConfig(<Tx>Centros de Custo Permitidos</Tx>, ({ data }: { data: Entity_Crud }) => <Tx>{data.centroCustoArray.join(', ')}</Tx>, { width: '1fr' }),
      ];

      return (
        <Stack spacing={1} height='100%'>
          <form onSubmit={frmFilter.handleSubmit(onSubmitList)}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <Box flex={1}>
                <FrmInput placeholder='classe de custo' frm={frmFilter} name={Entity_Crud.F.classeCusto} width='100%' autoFocus />
              </Box>
              <IconButtonAppSearch />
            </Stack>
          </form>
          <Box flex={1} overflow='hidden'>
            {mainStates.listing.searching
              ? <WaitingObs text='buscando' />
              : <Stack spacing={1} height='100%'>
                {(mainStates.listing.partialResults) && <AlertMy>Resultados parciais</AlertMy>}
                {(mainStates.filterApplied && mainStates.listing.dataRows.length == 0) && <Tx>Nada encontrado</Tx>}
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

    let classeCustoSelected = null; const optionClasseCustoAppend = [];
    if (classeCusto != '') {
      classeCustoSelected = BinSearchItem(mainStates.classeCustoArray, classeCusto, ClasseCustoRestrita.F.classeCusto);
      if (classeCustoSelected == null) {
        classeCustoSelected = ClasseCusto.fill({ classeCusto, descr: '*** inexistente ou imprópria para essa definição ***' });
        optionClasseCustoAppend.push(classeCustoSelected);
      }
    }

    const centroCustoArraySelected = [], optionCentroCustoAppend = [];
    centroCustoArray.forEach((x) => {
      let centroCustoSelected = BinSearchItem(mainStates.centroCustoArray, x, 'cod');
      if (centroCustoSelected == null) {
        centroCustoSelected = CentroCusto.fill({ cod: x, descr: '*** inexistente ***' });
        optionCentroCustoAppend.push(centroCustoSelected);
      }
      centroCustoArraySelected.push(centroCustoSelected);
    });


    return (
      <Stack spacing={1} height='100%' overflow='auto'>
        <form onSubmit={frmData.handleSubmit(phaseCrud.onSubmit)}>
          <Stack spacing={1}>

            <FormControl>
              <Autocomplete
                sx={{ width: '99.5%' }}
                disabled={!isInsert}
                options={[...optionClasseCustoAppend, ...mainStates.classeCustoArray]}
                getOptionLabel={(option: ClasseCusto) => `${option.classeCusto} - ${option.descr}`}
                value={classeCustoSelected}
                disableClearable
                // isOptionEqualToValue={(option: ClasseCusto, value: ClasseCusto) => { return option.classeCusto === value?.classeCusto; }}
                onChange={(_, value: ClasseCusto) => { frmData.setValue(ClasseCustoRestrita.F.classeCusto, value?.classeCusto || ''); setMainStatesCache({ errorFlds: { ...mainStates.errorFlds, classeCustoError: null } }); }}
                renderInput={(params) => (
                  <TextField {...params} variant={themePlus.themePlusConfig?.inputVariant} label='Classe de Custo' placeholder='Selecione a Classe de Custo' />
                )}
              />
              <FormHelperText error>{mainStates.errorFlds?.classeCustoError}</FormHelperText>
            </FormControl>

            <FormControl >
              <Autocomplete
                sx={{ width: '99.5%' }}
                disabled={isDelete}
                multiple disableCloseOnSelect={true}
                limitTags={10}
                options={[...optionCentroCustoAppend, ...mainStates.centroCustoArray]}
                getOptionLabel={(option: CentroCusto) => `${option.cod} - ${option.descr}`}
                value={centroCustoArraySelected}
                onChange={(_, value: CentroCusto[]) => { frmData.setValue(ClasseCustoRestrita.F.centroCustoArray, value.map((x) => x.cod)); setMainStatesCache({ errorFlds: { ...mainStates.errorFlds, centroCustoArrayError: null } }); }}
                renderInput={(params) => (
                  <TextField {...params} variant={themePlus.themePlusConfig?.inputVariant} label='Centros de Custo Permitidos' placeholder='Selecione os Centros de Custo' />
                )}
              />
              <FormHelperText error>{mainStates.errorFlds?.centroCustoArrayError}</FormHelperText>
            </FormControl>

            <FrmInput label='Obs' frm={frmData} name={Entity_Crud.F.obs} disabled={isDelete} />

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