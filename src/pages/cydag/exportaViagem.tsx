import React from 'react';
import { useRouter } from 'next/router';

import { Stack } from '@mui/material';

import { ErrorPlus, ObjUpdAllProps } from '../../libCommon/util';
import { CalcExecTime } from '../../libCommon/calcExectime';
import { csl } from '../../libCommon/dbg';
import { IGenericObject } from '../../libCommon/types';
import { PageDef } from '../../libCommon/endPoints';
import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { SaveAsXlsx } from '../../libClient/saveAsClient';

import { AbortProc, SelOption, PopupMsg, WaitingObs, LogErrorUnmanaged } from '../../components';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../hooks/useMyForm';

import { IconButtonAppDownload, SelAno } from '../../appCydag/components';
import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { Viagem } from '../../appCydag/modelTypes';
import { CmdApi_Viagem, ViagemClient } from '../api/appCydag/viagem/types';

//#region ok
enum Phase {
  initiating = 'initiating',
  ready = 'ready',
}

class FrmFilter {
  ano: string;
}
//#endregion

let mount; let mainStatesCache;
const apis = {
  getProcsOrc: () => CallApiCliASync<any>(apisApp.viagem.apiPath, { cmd: CmdApi_Viagem.exportInitialization }),
  getItens: (filter: FrmFilter) => CallApiCliASync<any>(apisApp.viagem.apiPath, { cmd: CmdApi_Viagem.export, filter }),
};
const pageSelf = pagesApp.exportaViagem;
export default function PageExportPlanej() {
  const frmFilter = useFrm<FrmFilter>({
    defaultValues: FrmDefaultValues(new FrmFilter()),
  });
  const ano = useWatchMy({ control: frmFilter.control, name: Viagem.F.ano });

  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    anoArray?: string[]; 
    downloadInProgress?: boolean;
  }

  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  //#region db access
  const initialization = async () => {
    const apiReturn = await apis.getProcsOrc();
    const anoArray = apiReturn.value.procsCentrosCustoConfigAllYears.map((x) => x.ano);
    return { anoArray };
  };
  //#endregion

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
    initialization()
      .then((result) => {
        if (!mount) return;
        const { anoArray } = result;
        const ano = anoArray.length != 0 ? anoArray[0] : '';
        setMainStatesCache({ phase: Phase.ready, anoArray });
        frmFilter.setValue(Viagem.F.ano, ano);
      })
      .catch((error) => {
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-initialization`);
        PopupMsg.error(error);
      });
    return () => { mount = false; };
  }, []);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  if (mainStates.phase == Phase.initiating) return <WaitingObs />;

  const download = (dataForm: FrmFilter) => {
    setMainStatesCache({ downloadInProgress: true });
    const filter = NormalizePropsString(dataForm);
    if (filter.ano == null) return PopupMsg.error('Informe o Ano.');
    csl('conectando com o servidor');
    const calcExecTime = new CalcExecTime();
    apis.getItens(filter)
      .then((apiReturn) => {
        csl(`tempo total de resposta do servidor ${calcExecTime.lapMs()}ms`);
        const itemArray = (apiReturn.value.viagensClient as IGenericObject[]).map((data) => ViagemClient.deserialize(data));
        let itensExport;
        if (itemArray.length == 0)
          itensExport = [{ resultadoDaSelecao: 'nada encontrado' }];
        else
          itensExport = itemArray;
        const fileName = `download_viagens_${filter.ano}`;
        const sheets: { sheetName: string, data: any }[] = [];
        sheets.push({ sheetName: 'dados', data: itensExport });
        SaveAsXlsx(fileName, sheets);
        setMainStatesCache({ downloadInProgress: false });
        csl(`tempo total preparação client ${calcExecTime.lapMs()}ms`);
      })
      .catch((error) => {
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-getItens`);
        PopupMsg.error(error);
        setMainStatesCache({ downloadInProgress: false });
      });
  };

  return (
    <Stack spacing={1} height='100%'>
      <Stack direction='row' alignItems='center' spacing={1}>
        <SelAno value={ano} onChange={(newValue) => { frmFilter.setValue(Viagem.F.ano, newValue || ''); }}
          options={mainStates.anoArray.map((x) => new SelOption(x, x))}
        />
        <IconButtonAppDownload downloadInProgress={mainStates.downloadInProgress} onClick={() => download(frmFilter.getValues())} />
      </Stack>
    </Stack>
  );
}