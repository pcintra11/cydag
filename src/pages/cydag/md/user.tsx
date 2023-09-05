import { useRouter } from 'next/router';
import React from 'react';
import _ from 'underscore';

import { Box, Stack } from '@mui/material';

import { IsErrorManaged, ObjUpdAllProps, ErrorPlus, ForceWait } from '../../../libCommon/util';
import { IGenericObject } from '../../../libCommon/types';
import { PageDef } from '../../../libCommon/endPoints';
import { CalcExecTime } from '../../../libCommon/calcExectime';
import { csd } from '../../../libCommon/dbg';

import { CallApiCliASync } from '../../../fetcher/fetcherCli';

import { SaveAsXlsx } from '../../../libClient/saveAsClient';

import { AlertMy, FrmCheckbox, PopupMsg, Tx, VisualBlock } from '../../../components';
import { Btn, BtnLine, WaitingObs } from '../../../components';
import { AbortProc, LogErrorUnmanaged } from '../../../components';
import { FrmError, FrmInput } from '../../../components';
import { ColGridConfig, TableGrid } from '../../../components';
import { FrmDefaultValues, FrmSetValues, NormalizePropsString, useFrm } from '../../../hooks/useMyForm';

import { configApp } from '../../../app_hub/appConfig';

import { BtnCrud, IconButtonAppCrud, IconButtonAppDownload, IconButtonAppSearch } from '../../../appCydag/components';
import { pagesApp, apisApp, rolesApp } from '../../../appCydag/endPoints';
import { useLoggedUser } from '../../../appCydag/useLoggedUser';

import { Entity_Crud, CmdApi_UserCrud as CmdApi, crudValidations } from '../../api/appCydag/user/types';


enum Phase {
  initiating = 'initiating',
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
}
const FormField = {
  roleGestorContr: 'roleGestorContr',
  roleOperContr: 'roleOperContr',
  roleAcessaSalarios: 'roleAcessaSalarios',
  roleConsTodosCCs: 'roleConsTodosCCs',
  roleCargaFunc: 'roleCargaFunc',
};
class FrmData {
  email: string;
  nome: string;
  ativo: boolean;
  roleGestorContr: boolean;
  roleOperContr: boolean;
  roleAcessaSalarios: boolean;
  roleConsTodosCCs: boolean;
  roleCargaFunc: boolean;
}
class FrmFilter {
  searchTerms: string;
}
let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync<any>(apisApp.user.apiPath, parm) };
const pageSelf = pagesApp.user;
export default function PageUserCrud() {
  const frmFilter = useFrm<FrmFilter>({
    defaultValues: FrmDefaultValues(new FrmFilter()),
  });
  const frmData = useFrm<FrmData>({ defaultValues: {}, schema: crudValidations });
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    filter?: IGenericObject; filterApplyed?: boolean;
    listing?: { searching: boolean, dataRows?: Entity_Crud[], partialResults?: boolean }; data?: Entity_Crud; index?: number;
    downloadInProgress?: boolean;
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
  const onSubmitInsert = async (dataForm: FrmData) => {
    await efetiva(CmdApi.insert, null, null, formToDb(NormalizePropsString(dataForm)));
  };
  const onSubmitUpdate = async (dataForm: FrmData) => {
    //if (ObjDiff(dataForm, mainStates.data) == null) return PopupMsg.error('Nada a salvar.'); não checa os perfis!
    await efetiva(CmdApi.update, mainStates.data._id.toString(), mainStates.index, formToDb(NormalizePropsString(dataForm)));
  };
  const onSubmitDelete = async () => {
    // DialogMy({
    //   body: 'Esse usuário e tudo o que estiver relacionado a ele serão excluídos',
    //   // dialogInputs: [
    //   //   { label: `Digite ${mainStates.data.email} para confirmar a exclusão` },
    //   // ],
    //   buttons: [
    //     { text: 'Cancela' },
    //     {
    //       text: 'Confirma',
    //       //fnCheck: (inputResponses: string[]) => inputResponses[0].trim().toUpperCase() != mainStates.data.email.toUpperCase() ? 'Resposta inválida' : null,
    //       onClick: () => efetiva(CmdApi.delete, mainStates.data._id.toString(), mainStates.index),
    //     },
    //   ]
    // });
    efetiva(CmdApi.delete, mainStates.data._id.toString(), mainStates.index);
  };
  const efetiva = async (cmdApi: CmdApi, _idStr: string, index?: number, data?: any) => {
    try {
      let dataRowsRefresh = [...mainStates.listing.dataRows];
      if (cmdApi == CmdApi.insert) {
        const apiReturn = await apis.crud({ cmd: cmdApi, data });
        dataRowsRefresh = [...dataRowsRefresh, Entity_Crud.deserialize(apiReturn.value)];
      }
      else if (cmdApi == CmdApi.update) {
        const apiReturn = await apis.crud({ cmd: cmdApi, _idStr, data });
        dataRowsRefresh[index] = Entity_Crud.deserialize(apiReturn.value);
      }
      else if (cmdApi == CmdApi.delete) {
        await apis.crud({ cmd: cmdApi, _idStr });
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
  const download = (dataForm: FrmFilter) => {
    setMainStatesCache({ downloadInProgress: true });
    const filter = NormalizePropsString(dataForm);
    apis.crud({ cmd: CmdApi.list, filter, getAll: true })
      .then((apiReturn) => {
        const documentsDownload = (apiReturn.value.documents as IGenericObject[]).map((data) => Entity_Crud.deserialize(data).toCsvCrud());
        // const csvStr = Papa.unparse(documentsDownload, { delimiter: ';', header: true });
        // const blobRefs = new Blob([Portuguese.RemoveAccentuation(csvStr)], { type: 'text/csv;charset=utf-8' });
        // FileSaver.saveAs(blobRefs, `${downloadFilename}.csv`);
        SaveAsXlsx('download_usuarios', [{ sheetName: 'dados', data: documentsDownload }]);
        setMainStatesCache({ downloadInProgress: false });
      })
      .catch((error) => {
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-download`);
        PopupMsg.error(error);
        setMainStatesCache({ downloadInProgress: false });
      });
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
        FrmSetValues(frmData, FrmDefaultValues(new FrmData(), dbToForm(data)));
        setMainStatesCache({ phase, data, index });
      }
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-${phase}`);
      setMainStatesCache({ error });
    }
  };

  const dbToForm = (dataDb: Entity_Crud) => {
    const dataForm = _.omit(dataDb, 'roles') as FrmData;
    dataForm.roleGestorContr = dataDb.roles.includes(rolesApp.gestorContr);
    dataForm.roleOperContr = dataDb.roles.includes(rolesApp.operContr);
    dataForm.roleAcessaSalarios = dataDb.roles.includes(rolesApp.acessaSalarios);
    dataForm.roleConsTodosCCs = dataDb.roles.includes(rolesApp.consTodosCCs);
    dataForm.roleCargaFunc = dataDb.roles.includes(rolesApp.cargaFunc);
    //csl('dbToForm', { dataDb, dataForm });
    return dataForm;
  };
  const formToDb = (dataForm: FrmData) => {
    const dataDb: Entity_Crud = _.omit(dataForm, (_, key) => key.startsWith('role'));
    dataDb.roles = [];
    dataForm.roleGestorContr == true && dataDb.roles.push(rolesApp.gestorContr);
    dataForm.roleOperContr == true && dataDb.roles.push(rolesApp.operContr);
    dataForm.roleAcessaSalarios == true && dataDb.roles.push(rolesApp.acessaSalarios);
    dataForm.roleConsTodosCCs == true && dataDb.roles.push(rolesApp.consTodosCCs);
    dataForm.roleCargaFunc == true && dataDb.roles.push(rolesApp.cargaFunc);
    //csl('formToDb', { dataForm, dataDb });
    return dataDb;
  };

  try {
    if (mainStates.phase == Phase.list) {
      const colsGridConfig = [
        new ColGridConfig(
          <Stack direction='row' alignItems='center' spacing={1} justifyContent='center'>
            <IconButtonAppCrud icon='create' onClick={() => setPhase(Phase.insert)} />
          </Stack>,
          ({ data, index }: { data: Entity_Crud, index: number }) => (
            <Stack direction='row' alignItems='center' spacing={1}>
              <IconButtonAppCrud icon='edit' onClick={() => setPhase(Phase.update, index)} />
              <IconButtonAppCrud icon='delete' onClick={() => setPhase(Phase.delete, index)} disabled={data.email == loggedUser.email} />
            </Stack>
          )
        ),
        new ColGridConfig(<Tx>Email</Tx>, ({ data }: { data: Entity_Crud }) => <Tx>{data.email}</Tx>),
        new ColGridConfig(<Tx>Nome</Tx>, ({ data }: { data: Entity_Crud }) => <Tx>{data.nome}</Tx>, { width: '1fr' }),
      ];

      return (
        <Stack spacing={1} height='100%'>
          <form onSubmit={frmFilter.handleSubmit(onSubmitList)}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <Box flex={1}>
                <FrmInput placeholder='termos de busca' frm={frmFilter} name={Entity_Crud.F.searchTerms} width='100%' autoFocus />
              </Box>
              <IconButtonAppSearch />
              <IconButtonAppDownload downloadInProgress={mainStates.downloadInProgress} onClick={() => download(frmFilter.getValues())} />
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
            <FrmInput label='Email' frm={frmData} name={Entity_Crud.F.email} autoFocus={isInsert} disabled={!isInsert} />
            <FrmInput label='Nome' frm={frmData} name={Entity_Crud.F.nome} autoFocus={!isInsert} disabled={isDelete} />
            <FrmCheckbox label='Ativo' frm={frmData} name={Entity_Crud.F.ativo} disabled={isDelete || mainStates.data.email == loggedUser.email} />
            <VisualBlock>
              <Tx>Perfis</Tx>
              <FrmCheckbox label='Gestor de Controladoria' frm={frmData} name={FormField.roleGestorContr} disabled={isDelete || mainStates.data.email == loggedUser.email} />
              <FrmCheckbox label='Operacional de Controladoria' frm={frmData} name={FormField.roleOperContr} disabled={isDelete} />
              <FrmCheckbox label='Acessa Salários' frm={frmData} name={FormField.roleAcessaSalarios} disabled={isDelete} />
              <FrmCheckbox label='Consulta Todos Centros de Custo' frm={frmData} name={FormField.roleConsTodosCCs} disabled={isDelete} />
              <FrmCheckbox label='Carga de Funcionários' frm={frmData} name={FormField.roleCargaFunc} disabled={isDelete} />
            </VisualBlock>
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