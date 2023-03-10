import React from 'react';
import { useRouter } from 'next/router';
import _ from 'underscore';

import { Box, Stack } from '@mui/material';

import { CalcExecTime, DateDisp, ErrorPlus, ForceWait, ObjUpdAllProps } from '../../libCommon/util';
import { csd, dbgError } from '../../libCommon/dbg';
import { PageDef } from '../../libCommon/endPoints';
import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { globals } from '../../libClient/clientGlobals';

import { AbortProc, WaitingObs, SnackBarError, Btn, BtnLine } from '../../components';
import { JsonShow } from '../../components/jsonShow';

//import { SelAno } from '../../appCydag/components';
import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { CtrlInterface } from '../../appCydag/modelTypes';
//import { CmdApi_Crud, IChangedLines } from '../api/appCydag/valoresContas/types';
//import { CmdApi_ProcessoOrcamentario } from '../api/appCydag/processoOrcamentario/types';
import { CmdApi_ValoresContas } from '../api/appCydag/valoresContas/types';
import { InterfaceSapStatus } from '../../appCydag/types';
import { configApp } from '../../appCydag/config';

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
  interfaceRealizado: (cmd: CmdApi_ValoresContas) => CallApiCliASync<any>(apisApp.valoresContas.apiPath, globals.windowId, { cmd }),
};
const pageSelf = pagesApp.importReal;
export default function PageImportReal() {
  // const frmFilter = useFrm<FrmFilter>({
  //   defaultValues: FrmDefaultValues(new FrmFilter(), null, [ValoresRealizados.F.ano]),
  // });
  // const ano = useWatchMy({ control: frmFilter.control, name: ValoresRealizados.F.ano });

  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    ctrlInterfaceMd?: CtrlInterface;
    importInProgress?: boolean; resultProc?: string[];
  }

  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating, importInProgress: false });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  //#region db access
  const apiInterfaceCall = async (cmd: CmdApi_ValoresContas) => {
    //const apiReturn1 = await apis.getProcsOrc();
    //const processoOrcamentarioArray = (apiReturn1.value.documents as IGenericObject[]).map((data) => ProcessoOrcamentario.deserialize(data));
    setMainStatesCache({ importInProgress: true });
    try {
      const apiReturn = await apis.interfaceRealizado(cmd);
      setMainStatesCache({ importInProgress: false });
      if (apiReturn.value.ctrlInterfaceMd != null)
        return { ctrlInterfaceMd: CtrlInterface.deserialize(apiReturn.value.ctrlInterfaceMd) };
      else
        return { ctrlInterfaceMd: null };
    }
    catch (error) {
      setMainStatesCache({ importInProgress: false });
      throw error;
    }
  };
  //#endregion

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('N??o autorizado.');
    apiInterfaceCall(CmdApi_ValoresContas.importRealizadoCheck)
      .then((result) => {
        if (!mount) return;
        const { ctrlInterfaceMd } = result;
        //const ano = processoOrcamentarioArray.length != 0 ? processoOrcamentarioArray[0].ano : null;
        //frmFilter.setValue(ValoresRealizados.F.ano, ano);
        setMainStatesCache({ phase: Phase.ready, ctrlInterfaceMd });
      })
      .catch((error) => {
        setMainStatesCache({ ctrlInterfaceMd: null });
        SnackBarError(error, `${pageSelf.pagePath}-initialization`);
      });
    return () => { mount = false; };
  }, []);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  if (mainStates.phase == Phase.initiating) return <WaitingObs />;

  const interfaceSap = async (cmd: CmdApi_ValoresContas) => {
    const calcExecTimeSearch = new CalcExecTime();
    apiInterfaceCall(cmd)
      .then(async (result) => {
        if (!mount) return;
        const { ctrlInterfaceMd } = result;
        await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs);
        setMainStatesCache({ ctrlInterfaceMd });
      })
      .catch((error) => {
        setMainStatesCache({ ctrlInterfaceMd: null });
        SnackBarError(error, `${pageSelf.pagePath}-interfaceSap`);
      });
  };

  return (
    <Stack gap={1} height='100%'>
      <BtnLine left>
        {(mainStates.ctrlInterfaceMd != null && (mainStates.ctrlInterfaceMd.status === InterfaceSapStatus.queued || mainStates.ctrlInterfaceMd.status === InterfaceSapStatus.running))
          ? <Btn onClick={() => interfaceSap(CmdApi_ValoresContas.importRealizadoCheck)}>Checar status</Btn>
          : <Btn onClick={() => interfaceSap(CmdApi_ValoresContas.importRealizadoStart)}>Iniciar novo processo de extra????o</Btn>
        }
      </BtnLine>

      {/* <Btn onClick={() => interfaceImport(frmFilter.getValues(), true)}>Importa e limpa a ??rea de interface com o Sap</Btn>
        <Btn onClick={() => interfaceImport(frmFilter.getValues(), false)}>Apenas limpa</Btn> */}

      {mainStates.importInProgress &&
        <Box>processando</Box>
      }
      {(mainStates.importInProgress == false && mainStates.ctrlInterfaceMd != null) &&
        <>
          {(mainStates.ctrlInterfaceMd.status === InterfaceSapStatus.queued || mainStates.ctrlInterfaceMd.status === InterfaceSapStatus.running)
            ? <Box>Processo em andamento</Box>
            : <Box>??ltimo Processo de Extra????o</Box>
          }
          <Box>Id: {mainStates.ctrlInterfaceMd.dag_run_id}</Box>
          <Stack direction='row' gap={2}>
            <Box>Inicio: {DateDisp(mainStates.ctrlInterfaceMd.started, 'dmyhm')}</Box>
            <Box>Status: {mainStates.ctrlInterfaceMd.status}</Box>
            {(mainStates.ctrlInterfaceMd.status === InterfaceSapStatus.queued || mainStates.ctrlInterfaceMd.status === InterfaceSapStatus.running) &&
              <Box>??ltima checagem: {DateDisp(mainStates.ctrlInterfaceMd.lastChecked, 'dmyhms')}</Box>
            }
          </Stack>
          {mainStates.ctrlInterfaceMd.info != null &&
            <>
              {/* <Box>Ano processado: {mainStates.ctrlInterfaceMd.info.ano}</Box>
             {(mainStates.ctrlInterfaceMd.info.msgs as string[]).map((x, index) => <Box key={index}>{x}</Box>)} */}
              <Box>Veja abaixo os detalhes</Box>
              <Stack gap={1} height='100%' overflow='auto'>
                <JsonShow data={mainStates.ctrlInterfaceMd.info} />
              </Stack>
            </>
          }
        </>
      }
    </Stack>
  );
}