import React from 'react';
import { useRouter } from 'next/router';

import { Box, FormControl, FormControlLabel, FormHelperText, FormLabel, MenuItem, Radio, RadioGroup, Stack, TextField, useTheme } from '@mui/material';

import { IsErrorManaged, ObjUpdAllProps, ErrorPlus, ObjDiff, CalcExecTime, ForceWait } from '../../../libCommon/util';
import { IGenericObject } from '../../../libCommon/types';
import { PageDef } from '../../../libCommon/endPoints';

import { CallApiCliASync } from '../../../fetcher/fetcherCli';

import { globals } from '../../../libClient/clientGlobals';

import { AlertMy, FrmSetError, PopupMsg, SnackBarError } from '../../../components';
import { Btn, BtnLine, WaitingObs } from '../../../components';
import { AbortProc, LogErrorUnmanaged } from '../../../components';
import { FrmError, FrmInput } from '../../../components';
import { ColGridConfig, TableGrid } from '../../../components';
import { FrmDefaultValues, FrmSetValues, NormalizePropsString, useFrm, useWatchMy } from '../../../hooks/useMyForm';

import { configApp } from '../../../appCydag/config';
import { BtnCrud, IconButtonAppCrud, IconButtonAppSearch } from '../../../appCydag/components';
import { pagesApp, apisApp } from '../../../appCydag/endPoints';
import { useLoggedUser } from '../../../appCydag/useLoggedUser';

import { Entity_Crud, CmdApi_Crud as CmdApi, crudValidations } from '../../api/appCydag/classeCusto/types';
import { ClasseCusto, FatorCusto } from '../../../appCydag/modelTypes';
import { OrigemClasseCusto, OrigemClasseCustoMd } from '../../../appCydag/types';
import { CmdApi_Diversos } from '../../api/appCydag/diversos/types';

enum Phase {
  initiating = 'initiating',
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
}
class FrmData {
  classeCusto: string;
  descr: string;
  fatorCusto: string;
  origem: OrigemClasseCusto;
  seqApresent: number;
}
class FrmFilter {
  searchTerms: string;
}
let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync<any>(apisApp.classeCusto.apiPath, globals.windowId, parm) };
const pageSelf = pagesApp.classeCusto;
export default function PageClasseCustoCrud() {
  const frmFilter = useFrm<FrmFilter>({
    defaultValues: FrmDefaultValues(new FrmFilter()),
  });
  const frmData = useFrm<FrmData>({ defaultValues: {}, schema: crudValidations });
  const fatorCusto = useWatchMy({ control: frmData.control, name: ClasseCusto.F.fatorCusto });
  const origem = useWatchMy({ control: frmData.control, name: ClasseCusto.F.origem });

  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    filter?: IGenericObject; filterApplyed?: boolean;
    listing?: { searching: boolean, dataRows?: Entity_Crud[], partialResults?: boolean };
    data?: Entity_Crud; index?: number;
    fatorCustoArray?: FatorCusto[];
    errorFlds?: { fatorCustoError?: string; origemError?: string; };
  }
  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating, fatorCustoArray: [], errorFlds: {} });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  const themePlus = useTheme();

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
      SnackBarError(error, `${pageSelf.pagePath}-onSubmit`);
    }
  };
  const checkData = (data: FrmData) => {
    const fldsErro: { mainsStatesError?: boolean, fld: string, msg: string }[] = [];
    if (data.fatorCusto == null) fldsErro.push({ mainsStatesError: true, fld: 'fatorCusto', msg: 'Informação obrigatória' });
    if (data.origem == null) fldsErro.push({ mainsStatesError: true, fld: 'origem', msg: 'Informação obrigatória' });
    if (fldsErro.length > 0) {
      const mainStatesErrorsFld: any = {};
      fldsErro.forEach((fldErro) => {
        if (fldErro.mainsStatesError) mainStatesErrorsFld[`${fldErro.fld}Error`] = fldErro.msg;
        else FrmSetError(frmData, fldErro.fld as null, fldErro.msg); //#!!!!!! ?
      });
      setMainStatesCache({ errorFlds: mainStatesErrorsFld });
      return false;
    }
    return true;
  };
  const onSubmitInsert = async (dataForm) => {
    const data = NormalizePropsString(dataForm);
    if (!checkData(data)) return;
    await efetiva(CmdApi.insert, null, null, data);
  };
  const onSubmitUpdate = async (dataForm: FrmData) => {
    const data = NormalizePropsString(dataForm);
    if (!checkData(data)) return;
    if (ObjDiff(data, mainStates.data) == null) return PopupMsg.error('Nada a salvar.');
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
    setMainStatesCache({ phase: Phase.list, filter: { searchTerms: '' }, filterApplyed: false, listing: { searching: false, dataRows: [] } });
    CallApiCliASync<any>(apisApp.diversos.apiPath, globals.windowId, { cmd: CmdApi_Diversos.listFatorCusto })
      .then(async (apiReturn) => {
        const fatorCustoArray = (apiReturn.value.documents as IGenericObject[]).map((data) => FatorCusto.deserialize(data));
        setMainStatesCache({ fatorCustoArray });
      })
      .catch((error) => {
        SnackBarError(error, `${pageSelf.pagePath}-listFatorCusto`);
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
        const data = phase === Phase.insert ? new Entity_Crud() : mainStates.listing.dataRows[index];
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
          <Stack direction='row' alignItems='center' gap={1} justifyContent='center'>
            <IconButtonAppCrud icon='create' onClick={() => setPhase(Phase.insert)} />
          </Stack>,
          ({ index }: { index: number }) => (
            <Stack direction='row' alignItems='center' gap={1}>
              <IconButtonAppCrud icon='edit' onClick={() => setPhase(Phase.update, index)} />
              <IconButtonAppCrud icon='delete' onClick={() => setPhase(Phase.delete, index)} />
            </Stack>
          )
        ),
        new ColGridConfig('Classe Custo', ({ data }: { data: Entity_Crud }) => data.classeCusto),
        new ColGridConfig('Linha de Custo', ({ data }: { data: Entity_Crud }) => FatorCusto.descrFator(data.fatorCusto, mainStates.fatorCustoArray, 15)),
        new ColGridConfig('Seq', ({ data }: { data: Entity_Crud }) => data.seqApresent),
        new ColGridConfig('Origem', ({ data }: { data: Entity_Crud }) => OrigemClasseCustoMd.descr(data.origem)),
        new ColGridConfig('Descrição', ({ data }: { data: Entity_Crud }) => data.descr, { width: '1fr' }),
      ];

      return (
        <Stack gap={1} height='100%'>
          <form onSubmit={frmFilter.handleSubmit(onSubmitList)}>
            <Stack direction='row' alignItems='center' gap={1}>
              <Box flex={1}>
                <FrmInput placeholder='termos de busca' frm={frmFilter} name={Entity_Crud.F.searchTerms} width='100%' autoFocus />
              </Box>
              <IconButtonAppSearch />
            </Stack>
          </form>
          <Box flex={1} overflow='hidden'>
            {mainStates.listing.searching
              ? <WaitingObs text='buscando' />
              : <Stack gap={1} height='100%'>
                {(mainStates.listing.partialResults) && <AlertMy>Resultados parciais</AlertMy>}
                {(mainStates.filterApplyed && mainStates.listing.dataRows.length == 0) && <Box>Nada encontrado</Box>}
                <TableGrid
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

    // //import { makeStyles } from "@material-ui/core/styles";
    // // const usePlaceholderStyles = makeStyles(theme => ({
    // //   placeholder: {
    // //     color: "#aaa"
    // //   }
    // // }));   
    // const Placeholder = ({ children }: { children: React.ReactNode }) => {
    //   //const classes = usePlaceholderStyles(); 
    //   //return <div className={classes.placeholder}>{children}</div>;
    //   return <div>{children}</div>;
    // };

    return (
      <Stack gap={1} height='100%' overflow='auto'>
        <form onSubmit={frmData.handleSubmit(phaseCrud.onSubmit)}>
          <Stack gap={1}>
            <FrmInput label='Classe Custo' frm={frmData} name={Entity_Crud.F.classeCusto} autoFocus={isInsert} disabled={!isInsert} />
            <FrmInput label='Descrição' frm={frmData} name={Entity_Crud.F.descr} autoFocus={!isInsert} disabled={isDelete} />

            <TextField select label='Linha de Custo' variant={themePlus.themePlusConfig?.inputVariant}
              value={fatorCusto || ''}
              onChange={(ev) => {
                const value = ev.target.value === '' ? null : ev.target.value;
                frmData.setValue(Entity_Crud.F.fatorCusto, value);
                setMainStatesCache({ errorFlds: { ...mainStates.errorFlds, fatorCustoError: null } });
              }}
              error={mainStates.errorFlds?.fatorCustoError != null}
              helperText={mainStates.errorFlds?.fatorCustoError}
              disabled={isDelete}
            >
              {mainStates.fatorCustoArray.map((x, index) => <MenuItem key={index} value={x.fatorCusto}>{x.descr}</MenuItem>)}
            </TextField>
            {/* <FormControl>
              <Select variant={themePlus.themePlusConfig?.inputVariant}
                value={fatorCusto || ''}
                onChange={(ev) => {
                  const value = ev.target.value === '' ? null : ev.target.value;
                  frmData.setValue(Entity_Crud.F.fatorCusto, value);
                  setMainStatesCache({ errorFlds: { ...mainStates.errorFlds, fatorCustoError: null } });
                }}
                renderValue={fatorCusto !== '' ? undefined : () => <Placeholder>Linha de Custo</Placeholder>}
                displayEmpty
              >
                {[
                  // <MenuItem key='' value={''}>Linha de Custo</MenuItem>,
                  ...mainStates.fatorCustoArray.map((x, index) => <MenuItem key={index} value={x.fatorCusto}>{x.descr}</MenuItem>)
                ]}
              </Select>
              <FormHelperText error>{mainStates.errorFlds?.fatorCustoError}</FormHelperText>
            </FormControl> */}

            <FormControl>
              <FormLabel id='demo-row-radio-buttons-group-label'>Origem</FormLabel>
              <RadioGroup row
                aria-labelledby='demo-row-radio-buttons-group-label'
                name='row-radio-buttons-group'
                value={origem}
                onChange={(ev) => {
                  const value = ev.target.value; // === '' ? null : ev.target.value;
                  frmData.setValue(Entity_Crud.F.origem, value as OrigemClasseCusto);
                  setMainStatesCache({ errorFlds: { ...mainStates.errorFlds, origemError: null } });
                }}
              // preparar como  em FrmInput
              >
                <FormControlLabel value={OrigemClasseCusto.inputada} disabled={!isInsert} control={<Radio />} label={OrigemClasseCustoMd.descr(OrigemClasseCusto.inputada)} />
                <FormControlLabel value={OrigemClasseCusto.totalImputada} disabled={!isInsert} control={<Radio />} label={OrigemClasseCustoMd.descr(OrigemClasseCusto.totalImputada)} />
                <FormControlLabel value={OrigemClasseCusto.calculada} disabled control={<Radio />} label={OrigemClasseCustoMd.descr(OrigemClasseCusto.calculada)} />
                <FormControlLabel value={OrigemClasseCusto.totalCalculada} disabled control={<Radio />} label={OrigemClasseCustoMd.descr(OrigemClasseCusto.totalCalculada)} />
              </RadioGroup>
              <FormHelperText error>{mainStates.errorFlds?.origemError}</FormHelperText>
            </FormControl>

            <FrmInput label='Sequencia de Apresentação' frm={frmData} name={Entity_Crud.F.seqApresent} autoFocus={!isInsert} disabled={isDelete} />

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