import React from 'react';
import { useRouter } from 'next/router';
import _ from 'underscore';

import { Stack } from '@mui/material';

import { BinSearchItem, CalcExecTime, ErrorPlus, ObjUpdAllProps } from '../../libCommon/util';
import { csd, csl, dbgError } from '../../libCommon/dbg';
import { IGenericObject } from '../../libCommon/types';
import { PageDef } from '../../libCommon/endPoints';
import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { globals } from '../../libClient/clientGlobals';
import { SaveAsXlsx } from '../../libClient/saveAsClient';

import { AbortProc, SelOption, PopupMsg, WaitingObs, SnackBarError, SwitchMy, FakeLink } from '../../components';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../hooks/useMyForm';

import { devFeature, IconButtonAppDownload, SelAno, SelEntity, SelRevisao } from '../../appCydag/components';
import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { CentroCusto, ClasseCusto, ProcessoOrcamentario } from '../../appCydag/modelTypes';
import { OrigemClasseCustoMd, RevisaoValor, RevisaoValorMd, ValoresPlanejadosDetalhes } from '../../appCydag/types';
//import { CmdApi_Crud, IChangedLines } from '../api/appCydag/valoresContas/types';
import { CmdApi_ProcessoOrcamentario } from '../api/appCydag/processoOrcamentario/types';
import { CmdApi_ValoresContas } from '../api/appCydag/valoresContas/types';
import { mesesFld } from '../../appCydag/util';
import { CmdApi_ClasseCusto, SortType_ClasseCusto } from '../api/appCydag/classeCusto/types';
import { CmdApi_CentroCusto } from '../api/appCydag/centroCusto/types';

//#region ok
enum Phase {
  initiating = 'initiating',
  ready = 'ready',
}

class FrmFilter {
  ano: string;
  revisao: RevisaoValor;
  centroCustoArray: string[];
  withDetails: boolean;
  showCalc: boolean;
}
const fldFrmExtra = {
  centroCustoArray: 'centroCustoArray' as 'centroCustoArray',
  withDetails: 'withDetails' as 'withDetails',
  showCalc: 'showCalc' as 'showCalc',
};
//#endregion

let mount; let mainStatesCache;
const apis = { // cdm sempre aqui?? #!!!!!!
  // #!!!!! agrupar e executar em paralelo (await all)
  getProcsOrc: () => CallApiCliASync(apisApp.processoOrcamentario.apiPath, globals.windowId, { cmd: CmdApi_ProcessoOrcamentario.list }),
  getContas: () => CallApiCliASync(apisApp.classeCusto.apiPath, globals.windowId, { cmd: CmdApi_ClasseCusto.list, sortType: SortType_ClasseCusto.classeCusto }),
  getCentrosCusto: () => CallApiCliASync(apisApp.centroCusto.apiPath, globals.windowId, { cmd: CmdApi_CentroCusto.list, getAll: true }),
  getValores: (filter: FrmFilter) => CallApiCliASync(apisApp.valoresContas.apiPath, globals.windowId, { cmd: CmdApi_ValoresContas.exportPlanejValoresGet, filter }),
};
const pageSelf = pagesApp.exportaPlanej;
export default function PageExportPlanej() {
  const frmFilter = useFrm<FrmFilter>({
    defaultValues: FrmDefaultValues(new FrmFilter(), { revisao: RevisaoValor.atual, centroCustoArray: [], withDetails: false, showCalc: false }, [ValoresPlanejadosDetalhes.F.ano, ValoresPlanejadosDetalhes.F.revisao, fldFrmExtra.centroCustoArray]),
  });
  const ano = useWatchMy({ control: frmFilter.control, name: ValoresPlanejadosDetalhes.F.ano });
  const revisao = useWatchMy({ control: frmFilter.control, name: ValoresPlanejadosDetalhes.F.revisao });
  const centroCustoArray = useWatchMy({ control: frmFilter.control, name: fldFrmExtra.centroCustoArray });
  const withDetails = useWatchMy({ control: frmFilter.control, name: fldFrmExtra.withDetails });
  const showCalc = useWatchMy({ control: frmFilter.control, name: fldFrmExtra.showCalc });

  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    processoOrcamentarioArray?: ProcessoOrcamentario[]; classeCustoArray?: ClasseCusto[]; centroCustoArray?: CentroCusto[];
    downloadInProgress?: boolean;
  }

  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  //#region db access
  const initialization = async () => {
    const apiReturn1 = await apis.getProcsOrc();
    const processoOrcamentarioArray = (apiReturn1.value.documents as IGenericObject[]).map((data) => ProcessoOrcamentario.deserialize(data));
    const apiReturn2 = await apis.getContas();
    const classeCustoArray = (apiReturn2.value.documents as IGenericObject[]).map((data) => ClasseCusto.deserialize(data));
    const apiReturn3 = await apis.getCentrosCusto();
    const centroCustoArray = (apiReturn3.value.documents as IGenericObject[]).map((data) => CentroCusto.deserialize(data));
    return { processoOrcamentarioArray, classeCustoArray, centroCustoArray };
  };
  //#endregion

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
    initialization()
      .then((result) => {
        if (!mount) return;
        const { processoOrcamentarioArray, classeCustoArray, centroCustoArray } = result;
        const ano = processoOrcamentarioArray.length != 0 ? processoOrcamentarioArray[0].ano : null;
        frmFilter.setValue(ValoresPlanejadosDetalhes.F.ano, ano);
        setMainStatesCache({ phase: Phase.ready, processoOrcamentarioArray, classeCustoArray, centroCustoArray });
      })
      .catch((error) => {
        SnackBarError(error, `${pageSelf.pagePath}-initialization`);
      });
    return () => { mount = false; };
  }, []);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  if (mainStates.phase == Phase.initiating) return <WaitingObs />;

  const download = (dataForm: FrmFilter) => {
    setMainStatesCache({ downloadInProgress: true });
    const filter = NormalizePropsString(dataForm);
    if (filter.ano == null) return PopupMsg.error('Informe o Ano.');
    if (filter.revisao == null) return PopupMsg.error('Informe a Revisão.');
    csl('conectando com o servidor');
    const calcExecTime = new CalcExecTime();
    apis.getValores(filter)
      .then((apiReturn) => {
        csl(`tempo total de resposta do servidor ${calcExecTime.lapMs()}ms`);
        const valsArray = (apiReturn.value.vals as IGenericObject[]).map((data) => ValoresPlanejadosDetalhes.deserialize(data));
        if (valsArray.length == 0) valsArray.push(new ValoresPlanejadosDetalhes().Fill({ centroCusto: 'nada encontrado' }));
        const valsExport = valsArray.map((valores) => {
          //const tot = mesesFld.reduce((prev, curr) => prev + valores[curr], 0);
          let descrClasseCusto = null, origemValor = null;
          if (valores.classeCusto != null) {
            const classeCusto = BinSearchItem(mainStates.classeCustoArray, valores.classeCusto, 'classeCusto', true);
            origemValor = OrigemClasseCustoMd.descr(classeCusto.origem);
            descrClasseCusto = classeCusto.descr;
          }
          const tot = valores.valMeses.reduce((prev, curr) => curr != null ? prev + curr : prev, 0);
          const fldsKey1 = ['centroCusto', 'classeCusto'];
          const fldsKey2 = filter.withDetails ? ['idDetalhe', 'descr'] : [];
          return {
            ..._.pick(valores, fldsKey1),
            descrClasseCusto,
            origemValor,
            ..._.pick(valores, fldsKey2),
            //...mesesFld.reduce((prev, curr) => ({ ...prev, [curr]: valores[curr] }), {}),
            ...mesesFld.reduce((prev, curr, index) => ({ ...prev, [curr]: valores.valMeses[index] }), {}),
            tot,
          };
        });
        const fileName = `download_valores_planejados_${filter.ano}` +
          (filter.revisao !== RevisaoValor.atual ? `_${RevisaoValorMd.descr(filter.revisao).toLowerCase()}` : '') +
          (filter.withDetails ? '_dets' : '') +
          (filter.showCalc ? '_showCalcs' : '');
        const sheets: { sheetName: string, data: any }[] = [];
        sheets.push({ sheetName: 'dados', data: valsExport });
        if (filter.showCalc) {
          const memoriaCalc = JSON.stringify(apiReturn.value.memoriaCalc, null, 2).split('\n').map((line) => ({ calc: line }));
          if (memoriaCalc.length == 0) memoriaCalc.push({ calc: 'sem detalhes' });
          sheets.push({ sheetName: 'memoria_calc', data: memoriaCalc });
        }
        SaveAsXlsx(fileName, sheets);
        setMainStatesCache({ downloadInProgress: false });
        csl(`tempo total preparação client ${calcExecTime.lapMs()}ms`);
      })
      .catch((error) => {
        SnackBarError(error, `${pageSelf.pagePath}-getValores`);
        setMainStatesCache({ downloadInProgress: false });
      });
  };

  const centroCustoOptions = mainStates.centroCustoArray == null ? null : mainStates.centroCustoArray.map((x) => new SelOption(x.cod, x.descr));
  return (
    // <form onSubmit={frmFilter.handleSubmit(getValoresPlanejadosSubmit)}> #!!!!!! eliminar todos submit ?
    <Stack gap={1} height='100%'>
      <Stack direction='row' alignItems='center' gap={1}>
        {/* <SelectMy width='80px'
          value={ano || ''}
          onChange={(ev) => { frmFilter.setValue(ValoresPlanejados.F.ano, ev.target.value); }}
          displayEmpty
          placeHolder='Ano'
          options={[new SelOption('Ano', 'Ano', true), ...mainStates.processoOrcamentarioArray.map((x) => new SelOption(x.ano, x.ano))]}
        /> */}
        <SelAno value={ano} onChange={(value) => frmFilter.setValue(ValoresPlanejadosDetalhes.F.ano, value)}
          options={mainStates.processoOrcamentarioArray.map((x) => new SelOption(x.ano, x.ano))}
        />
        <SelRevisao value={revisao} onChange={(newValue: RevisaoValor) => frmFilter.setValue(ValoresPlanejadosDetalhes.F.revisao, newValue)} />
        {centroCustoOptions != null &&
          <>
            <SelEntity value={centroCustoArray} onChange={(newValue: string[]) => frmFilter.setValue(fldFrmExtra.centroCustoArray, newValue)}
              multiple limitTags={1}
              options={centroCustoOptions} name={CentroCusto.Name} withCod width='550px' />
            <FakeLink onClick={() => frmFilter.setValue(fldFrmExtra.centroCustoArray, centroCustoOptions.map((x) => x.cod))}>(Sel. Todos)</FakeLink>
          </>
        }
        <IconButtonAppDownload downloadInProgress={mainStates.downloadInProgress} onClick={() => download(frmFilter.getValues())} />
      </Stack>
      {revisao === RevisaoValor.atual &&
        <>
          <SwitchMy checked={withDetails} label='Com detalhes para as contas' onChange={(ev) => frmFilter.setValue(fldFrmExtra.withDetails, ev.target.checked)} />
          {devFeature() &&
            <SwitchMy checked={showCalc} label='Mostra cálculos' onChange={(ev) => frmFilter.setValue(fldFrmExtra.showCalc, ev.target.checked)} />
          }
        </>
      }
    </Stack>
  );
}