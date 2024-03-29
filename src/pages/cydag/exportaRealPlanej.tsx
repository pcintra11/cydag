import React from 'react';
import { useRouter } from 'next/router';

import { Stack } from '@mui/material';

import { BinSearchItem, BinSearchProp, ErrorPlus, ObjUpdAllProps } from '../../libCommon/util';
import { csd, csl } from '../../libCommon/dbg';
import { IGenericObject } from '../../libCommon/types';
import { PageDef } from '../../libCommon/endPoints';
import { CalcExecTime } from '../../libCommon/calcExectime';
import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { SaveAsXlsx } from '../../libClient/saveAsClient';

import { AbortProc, SelOption, PopupMsg, WaitingObs, FakeLink, LogErrorUnmanaged } from '../../components';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../hooks/useMyForm';

import { IconButtonAppDownload, SelAno, SelEntity } from '../../appCydag/components';
import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { CentroCusto, ClasseCusto, Diretoria, Gerencia, ProcessoOrcamentarioCentroCusto, UnidadeNegocio } from '../../appCydag/modelTypes';
import { CentroCustoConfigOption, IAnoCentroCustos, ValoresAnaliseRealPlan, ValoresPlanejadosDetalhes } from '../../appCydag/types';
//import { CmdApi_Crud, IChangedLines } from '../api/appCydag/valoresContas/types';
import { CmdApi_ValoresContas } from '../api/appCydag/valoresContas/types';
import { mesesFld } from '../../appCydag/util';
import { CmdApi_ClasseCusto, SortType_ClasseCusto } from '../api/appCydag/classeCusto/types';

export const classeCustoPessoalArray = [  // #!!!!!! deve ir para o MD !!!!
  '5200201001',
  '5200201002',
  '5200201003',
  '5200202001',
  '5200202002',
  '5200203001',
  '5200203002',
  '5200204001',
  '5200204002',
  '5200205001',
  '5200205002',
  '5200206003',
  '5200206050',
  '5200207001',
  '5200207002',
  '5200208001',
  '5200208002',
  '5200208003',
  '5200208004',
  '5200208005',
  '5200208007',
  '5200208008',
  '5200208009',
  '5200208011',
  '5200208012',
  '5200208013',
  '5200502008',
  '5200504030',
];

//#region ok
enum Phase {
  initiating = 'initiating',
  ready = 'ready',
}

class FrmFilter {
  ano: string;
  centroCustoArray: string[];
}
const fldFrmExtra = {
  centroCustoArray: 'centroCustoArray' as 'centroCustoArray',
};
//#endregion

let mount; let mainStatesCache;
const apis = {
  getProcsOrcCCsAuth: () => CallApiCliASync<any>(apisApp.valoresContas.apiPath, { cmd: CmdApi_ValoresContas.getProcsOrcCCsAuthQuadroCons }),
  getContas: () => CallApiCliASync<any>(apisApp.classeCusto.apiPath, { cmd: CmdApi_ClasseCusto.list, sortType: SortType_ClasseCusto.classeCusto }),
  getItens: (filter: FrmFilter) => CallApiCliASync<any>(apisApp.valoresContas.apiPath, { cmd: CmdApi_ValoresContas.exportRealPlanValoresGet, filter }),
};
const pageSelf = pagesApp.exportaRealPlanej;
export default function PageExportPlanej() {
  const frmFilter = useFrm<FrmFilter>({
    defaultValues: FrmDefaultValues(new FrmFilter(), { centroCustoArray: [] }),
  });
  const ano = useWatchMy({ control: frmFilter.control, name: ValoresPlanejadosDetalhes.F.ano });
  const centroCustoArray = useWatchMy({ control: frmFilter.control, name: fldFrmExtra.centroCustoArray });

  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    anoCentroCustosArray?: IAnoCentroCustos[]; centroCustoOptions?: CentroCustoConfigOption[]; centroCustoArray?: CentroCusto[];
    downloadInProgress?: boolean;
  }

  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  //#region db access
  const initialization = async () => {
    const apiReturn1 = await apis.getProcsOrcCCsAuth();
    const centroCustoArray = (apiReturn1.value.centroCustoArray as IGenericObject[]).map((data) => CentroCusto.deserialize(data));
    const anoCentroCustosArray: IAnoCentroCustos[] = [];
    apiReturn1.value.procsCentrosCustoConfigAllYears.forEach((x) => {
      anoCentroCustosArray.push({
        ano: x.ano,
        centroCustoConfigOptions: x.centroCustoConfig.map((ccConfig) => ({ cod: ccConfig.centroCusto, descr: BinSearchProp(centroCustoArray, ccConfig.centroCusto, 'descr', 'cod'), ccConfig })),
      });
    });
    return { anoCentroCustosArray, centroCustoArray };
  };
  //#endregion

  const mountOptionsCC = (ano: string) => {
    let centroCustoOptions: CentroCustoConfigOption[] = [];
    let centroCustoUnique = null as string;
    if (ano != null) {
      const anoCentroCustos = mainStatesCache.anoCentroCustosArray.find((x) => x.ano == ano);
      centroCustoOptions = anoCentroCustos.centroCustoConfigOptions;
      if (anoCentroCustos.centroCustoConfigOptions.length == 1)
        centroCustoUnique = anoCentroCustos.centroCustoConfigOptions[0].cod;
    }
    setMainStatesCache({ centroCustoOptions });
    if (centroCustoUnique != null)
      frmFilter.setValue(fldFrmExtra.centroCustoArray, [centroCustoUnique]);
  };

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
    initialization()
      .then((result) => {
        if (!mount) return;
        const { anoCentroCustosArray, centroCustoArray } = result;
        const ano = anoCentroCustosArray.length != 0 ? anoCentroCustosArray[0].ano : '';
        setMainStatesCache({ phase: Phase.ready, anoCentroCustosArray, centroCustoArray });
        frmFilter.setValue(ValoresPlanejadosDetalhes.F.ano, ano);
        mountOptionsCC(ano);
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
        const centroCustoConfigMdArray = (apiReturn.value.centroCustoConfigMdArray as IGenericObject[]).map((data) => ProcessoOrcamentarioCentroCusto.deserialize(data));
        const unidadeNegocioMdArray = (apiReturn.value.unidadeNegocioMdArray as IGenericObject[]).map((data) => UnidadeNegocio.deserialize(data));
        const diretoriaMdArray = (apiReturn.value.diretoriaMdArray as IGenericObject[]).map((data) => Diretoria.deserialize(data));
        const gerenciaMdArray = (apiReturn.value.gerenciaMdArray as IGenericObject[]).map((data) => Gerencia.deserialize(data));
        const classeCustoMdArray = (apiReturn.value.classeCustoMdArray as IGenericObject[]).map((data) => ClasseCusto.deserialize(data));
        const itemArray = (apiReturn.value.vals as IGenericObject[]).map((data) => ValoresAnaliseRealPlan.deserialize(data));
        let itensExport;
        if (itemArray.length == 0)
          itensExport = [{ resultadoDaSelecao: 'nada encontrado' }];
        else {
          let lastCC = null;
          const dataCC: any = {};
          itensExport = itemArray.map((valores) => {
            if (valores.centroCusto != lastCC) {
              dataCC.centroCustoMd = BinSearchItem(mainStates.centroCustoArray, valores.centroCusto, 'cod', false);
              dataCC.centroCustoConfigMd = BinSearchItem(centroCustoConfigMdArray, valores.centroCusto, 'centroCusto', false);
              dataCC.unidadeNegocioMd = BinSearchItem(unidadeNegocioMdArray, dataCC.centroCustoConfigMd?.unidadeNegocio, 'cod', false);
              dataCC.diretoriaMd = BinSearchItem(diretoriaMdArray, dataCC.centroCustoConfigMd?.diretoria, 'cod', false);
              dataCC.gerenciaMd = BinSearchItem(gerenciaMdArray, dataCC.centroCustoConfigMd?.gerencia, 'cod', false);
              lastCC = valores.centroCusto;
            }
            const classeCusto = BinSearchItem(classeCustoMdArray, valores.classeCusto, 'classeCusto', true);
            const descrClasseCusto = classeCusto.descr;
            const categ = classeCustoPessoalArray.includes(valores.classeCusto) ? 'pessoas' : 'despesas';
            return {
              centroCusto: valores.centroCusto,
              descrCentroCusto: dataCC.centroCustoMd?.descr,
              classeCusto: valores.classeCusto,
              descrClasseCusto,
              categ,
              unidadeNegocio: dataCC.centroCustoConfigMd?.unidadeNegocio,
              descrUnidadeNegocio: dataCC.unidadeNegocioMd?.descr,
              diretoria: dataCC.centroCustoConfigMd?.diretoria,
              descrDiretoria: dataCC.diretoriaMd?.descr,
              gerencia: dataCC.centroCustoConfigMd?.gerencia,
              descrGerencia: dataCC.gerenciaMd?.descr,
              ...mesesFld.reduce((prev, curr, index) => ({ ...prev, [`${curr} real`]: valores.valMesesReal[index], [`${curr} plan`]: valores.valMesesPlan[index] }), {}),
            };
          });
        }
        const fileName = `download_valores_realXplan_${filter.ano}`;
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

  const centroCustoOptions = mainStates.centroCustoOptions == null ? null : mainStates.centroCustoOptions.map((x) => new SelOption(x.cod, x.descr));
  return (
    <Stack spacing={1} height='100%'>
      <Stack direction='row' alignItems='center' spacing={1}>
        <SelAno value={ano} onChange={(newValue) => { frmFilter.setValue(ValoresPlanejadosDetalhes.F.ano, newValue || ''); mountOptionsCC(newValue); }}
          options={mainStates.anoCentroCustosArray.map((x) => new SelOption(x.ano, x.ano))}
        />
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
    </Stack>
  );
}