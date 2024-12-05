import React from 'react';
import { useRouter } from 'next/router';

import dynamic from 'next/dynamic';
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

import { Stack } from '@mui/material';

import { ErrorPlus, ForceWait, ObjUpdAllProps } from '../../libCommon/util';
import { CalcExecTime } from '../../libCommon/calcExectime';
import { csd } from '../../libCommon/dbg';
import { PageDef } from '../../libCommon/endPoints';
import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { AbortProc, WaitingObs, Btn, BtnLine, LogErrorUnmanaged, PopupMsg, Tx } from '../../components';

import { configApp } from '../../app_hub/appConfig';

//import { SelAno } from '../../appCydag/components';
import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
//import { CtrlInterface } from '../../appCydag/modelTypes';
//import { CmdApi_Crud, IChangedLines } from '../api/appCydag/valoresContas/types';
//import { CmdApi_ProcessoOrcamentario } from '../api/appCydag/processoOrcamentario/types';
import { CmdApi_ValoresContas } from '../api/appCydag/valoresContas/types';
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
};
const pageSelf = pagesApp.importRealDireto;
export default function PageImportRealDireto() {
  // const frmFilter = useFrm<FrmFilter>({
  //   defaultValues: FrmDefaultValues(new FrmFilter(), null, [ValoresRealizados.F.ano]),
  // });
  // const ano = useWatchMy({ control: frmFilter.control, name: ValoresRealizados.F.ano });

  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    info?: any;
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
      console.log('apiReturn', apiReturn);
      setMainStatesCache({ importInProgress: false });
      if (apiReturn.value.info != null)
        return { info: apiReturn.value.info };
      else
        return { info: null };
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
        const { info } = result;
        await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs);
        setMainStatesCache({ info });
      })
      .catch((error) => {
        setMainStatesCache({ info: null });
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-interfaceSap`);
        PopupMsg.error(error);
      });
  };

  return (
    <Stack spacing={1} height='100%'>
      <BtnLine left>
        <Btn onClick={() => interfaceSap(CmdApi_ValoresContas.importRealizadoDireto)}>Importar Direto</Btn>
      </BtnLine>

      {mainStates.importInProgress &&
        <Tx>processando</Tx>
      }
      {(mainStates.importInProgress == false && mainStates.info != null) &&
        <>
          {mainStates.info != null &&
            <>
              <Tx>Veja abaixo os detalhes</Tx>
              <Stack spacing={1} height='100%' overflow='auto'>
                <ReactJson src={mainStates.info} name='interfaceStatus' collapsed={false} collapseStringsAfterLength={30}
                displayDataTypes={false} />
              </Stack>
            </>
          }
        </>
      }
    </Stack>
  );
}