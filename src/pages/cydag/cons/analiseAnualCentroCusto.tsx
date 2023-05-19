import React from 'react';
import { useRouter } from 'next/router';

import Box from '@mui/material/Box';
import { Stack, useTheme } from '@mui/material';

import { BinSearchItem, BinSearchProp, compareForBinSearch, ErrorPlus, ForceWait, ObjUpdAllProps } from '../../../libCommon/util';
import { CalcExecTime } from '../../../libCommon/calcExectime';
import { csd, dbgError } from '../../../libCommon/dbg';
import { IGenericObject } from '../../../libCommon/types';
import { PageDef } from '../../../libCommon/endPoints';
import { CallApiCliASync } from '../../../fetcher/fetcherCli';

import { cssTextNoWrapEllipsis } from '../../../libClient/util';

import { AbortProc, SelOption, PopupMsg, SwitchMy, WaitingObs, SnackBarError, fontSizeGrid, fontSizeIconsInGrid, FakeLink } from '../../../components';
import { HierNode } from '../../../components/hier';
import { GridCell } from '../../../components/grid';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../../hooks/useMyForm';

import { configApp } from '../../../app_hub/appConfig';

import { IconApp, IconButtonAppSearch, propsColorHeader, propsColorByTotLevel, SelEntity, SelAno, SelMes, propsColorByCompRealPlan } from '../../../appCydag/components';
import { apisApp, pagesApp } from '../../../appCydag/endPoints';
import { useLoggedUser } from '../../../appCydag/useLoggedUser';
import { amountToStr, percToStr, mesDefault } from '../../../appCydag/util';
import { CentroCusto, ClasseCusto, FatorCusto, ProcessoOrcamentario } from '../../../appCydag/modelTypes';
import { CentroCustoConfigOption, IAnoCentroCustos, ProcCentrosCustoConfig, ValoresAnaliseAnual, ColValsAnaliseAnual } from '../../../appCydag/types';
import { CmdApi_ValoresContas as CmdApi } from '../../api/appCydag/valoresContas/types';
import { configCydag } from '../../../appCydag/configCydag';

enum Phase {
  initiating = 'initiating',
  ready = 'ready',
}

enum NodeType {
  tot = 'tot',
  fatorCusto = 'fatorCusto',
  classeCusto = 'classeCusto',
}

class NodeContent {
  cod: string;
  descr: string;
  vals: ColValsAnaliseAnual;
  constructor(cod: string, descr: string, vals?: ColValsAnaliseAnual) {
    this.cod = cod;
    this.descr = descr;
    this.vals = vals;
  }
  descrComp?(nodeClasseCusto: boolean) {
    if (nodeClasseCusto)
      return (
        <Stack direction='row' alignItems='center' gap={0.5}>
          <Box className='showConta'>{this.cod}</Box>
          <Box className='showConta'>-</Box>
          <Box style={cssTextNoWrapEllipsis}>{this.descr}</Box>
        </Stack>
      );
    else
      return (
        <Box style={cssTextNoWrapEllipsis}>{this.descr}</Box>
      );
  }
}

class FrmFilter {
  ano: string;
  centroCustoArray: string[];
  mes: number;
}
//#endregion

let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync<any>(apisApp.valoresContas.apiPath, parm) };
const pageSelf = pagesApp.analiseAnualRxOCentroCusto;

const statesCompsSubord = { setMainStatesFilter: null, setMainStatesData1: null, setMainStatesData2: null, showConta: false, setShowConta: null };
export default function PageAnaliseAnualCentroCusto() {
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    anoCentroCustosArray?: IAnoCentroCustos[];
    fatorCustoArray?: FatorCusto[]; classeCustoArray?: ClasseCusto[];
  }
  interface MainStatesFilter {
    centroCustoOptions?: CentroCustoConfigOption[];
    permiteTodosCCs?: boolean;
  }
  interface MainStatesData1 {
    filterApplied?: FrmFilter;
  }
  interface MainStatesData2 {
    dataStructure?: {
      loading: boolean;
      headerInfo?: string;
      processoOrcamentario?: ProcessoOrcamentario;
      nodes?: HierNode<NodeContent>[];
    };
  }

  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  const themePlus = useTheme();

  //#region db access
  const initialization = async () => {
    const apiReturn = await apis.crud({ cmd: CmdApi.analiseAnualCentroCustoInitialization });
    const procsCentrosCustoConfigAllYears = (apiReturn.value.procsCentrosCustoConfigAllYears as IGenericObject[]).map((data) => ProcCentrosCustoConfig.deserialize(data));
    const centroCustoArray = (apiReturn.value.centroCustoArray as IGenericObject[]).map((data) => CentroCusto.deserialize(data));
    const fatorCustoArray = (apiReturn.value.fatorCustoArray as IGenericObject[]).map((data) => FatorCusto.deserialize(data));
    const classeCustoArray = (apiReturn.value.classeCustoArray as IGenericObject[]).map((data) => ClasseCusto.deserialize(data));
    return { procsCentrosCustoConfigAllYears, centroCustoArray, fatorCustoArray, classeCustoArray };
  };
  const getItens = async (filter: FrmFilter) => {
    //csd('getItens'); // chamando 2x??
    try {
      const calcExecTimeSearch = new CalcExecTime();
      statesCompsSubord.setMainStatesData2({ dataStructure: { loading: true } });
      statesCompsSubord.setMainStatesData1({ filterApplied: { ...filter } });
      //setMainStatesCache({ phase: Phase.editing });
      let headerInfo = null;
      if (filter.centroCustoArray.length == 0)
        headerInfo = 'Todos os Centros de Custo autorizados';
      else
        headerInfo = `Centros de Custo: ${filter.centroCustoArray.join(', ')}`;

      const apiReturn = await apis.crud({ cmd: CmdApi.analiseAnualCentroCustoValoresGet, filter });
      //const processoOrcamentario = ProcessoOrcamentario.deserialize(apiReturn.value.processoOrcamentario);
      const valoresAnaliseAnual = (apiReturn.value.valoresAnaliseAnual as IGenericObject[]).map((data) => ValoresAnaliseAnual.deserialize(data));

      const nodes = generateHierNodes(valoresAnaliseAnual);

      //csl({ hier });
      if (!mount) return;
      await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs);
      statesCompsSubord.setMainStatesData2({
        dataStructure: {
          loading: false,
          //processoOrcamentario,
          headerInfo,
          nodes,
        }
      });
    } catch (error) {
      SnackBarError(error, `${pageSelf.pagePath}-getItens`);
    }
  };
  //#endregion

  //#region hierarquia
  const generateHierNodes = (valoresAnaliseAnual: ValoresAnaliseAnual[]) => {
    const nodes: HierNode<NodeContent>[] = [];

    const fatorCustoArray = mainStates.fatorCustoArray;
    const classeCustoArray = mainStates.classeCustoArray;

    nodes.push(
      new HierNode<NodeContent>(NodeType.tot, [''], null, null, true, '', new NodeContent(null, 'Total', ColValsAnaliseAnual.ValsReset()), true)
    );

    fatorCustoArray.forEach((fatorCusto) => {
      if (classeCustoArray.find((classeCusto) => classeCusto.fatorCusto == fatorCusto.fatorCusto) != null) {
        nodes.push(
          new HierNode<NodeContent>(NodeType.fatorCusto, [fatorCusto.fatorCusto], NodeType.tot, [''], true, fatorCusto.fatorCusto, new NodeContent(null, `${fatorCusto.descr}`, ColValsAnaliseAnual.ValsReset()))
        );
      }
    });

    classeCustoArray.forEach((x) => {
      nodes.push(
        new HierNode<NodeContent>(NodeType.classeCusto, [x.fatorCusto, x.classeCusto], NodeType.fatorCusto, [x.fatorCusto], false, `${String(x.seqApresent).padStart(4, '0')}-${x.classeCusto}`, new NodeContent(x.classeCusto, x.descr, ColValsAnaliseAnual.ValsReset()))
      );
    });

    const sumHierUp = (valsHierNode: HierNode<NodeContent>[], idPai: string, vals: ColValsAnaliseAnual) => {
      let idPaiSum = idPai;
      while (idPaiSum != null) {
        const nodePai = BinSearchItem(valsHierNode, idPaiSum, 'id');
        if (nodePai == null) {
          dbgError('sumHierUp', `nodePai ${idPaiSum} não encontrada na hierarquia (1)`);
          break;
        }
        if (nodePai.nodeContent.vals == null) {
          dbgError('sumHierUp', 'Valores para nível totalizado não inicializados:', nodePai.id); // #!!!!!
          break;
        }
        if (vals != null)
          ColValsAnaliseAnual.sumVals(nodePai.nodeContent.vals, vals);
        idPaiSum = nodePai.idPai;
      }
    };
    const setValsInf = (valoresArray: ValoresAnaliseAnual[]) => {
      valoresArray.forEach((valores) => {
        const nodeType = NodeType.classeCusto;
        const keys = [valores.fatorCusto, valores.classeCusto];
        const id = HierNode.nodeId(nodeType, keys);
        const node = BinSearchItem(nodes, id, 'id');
        if (node == null) dbgError('setValsInf', `${id} não encontrada na hierarquia (setValsInf)`);
        else if (node.group) dbgError('setValsInf', `${id} está na hierarquia como um agrupamento`);
        else {
          ColValsAnaliseAnual.sumVals(node.nodeContent.vals, valores); // .vals()
          sumHierUp(nodes, node.idPai, valores);
        }
      });
    };
    nodes.sort((a, b) => compareForBinSearch(a.id, b.id));
    setValsInf(valoresAnaliseAnual);

    return nodes;
  };
  //#endregion

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
    initialization()
      .then((result) => {
        if (!mount) return;
        const { procsCentrosCustoConfigAllYears, centroCustoArray, fatorCustoArray, classeCustoArray } = result;
        const anoCentroCustosArray: IAnoCentroCustos[] = [];
        procsCentrosCustoConfigAllYears.forEach((x) => {
          anoCentroCustosArray.push({
            ano: x.ano,
            centroCustoConfigOptions: x.centroCustoConfig.map((ccConfig) => ({ cod: ccConfig.centroCusto, descr: BinSearchProp(centroCustoArray, ccConfig.centroCusto, 'descr', 'cod'), ccConfig })),
          });
        });
        setMainStatesCache({ phase: Phase.ready, anoCentroCustosArray, fatorCustoArray, classeCustoArray });
      })
      .catch((error) => {
        SnackBarError(error, `${pageSelf.pagePath}-initialization`);
      });
    return () => { mount = false; };
  }, [router?.asPath]);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  if (mainStates.phase == Phase.initiating) return <WaitingObs />;

  //csl('renderMain', mainStates);

  const FilterComp = () => {
    const frmFilter = useFrm<FrmFilter>({
      defaultValues: FrmDefaultValues(new FrmFilter(), { mes: mesDefault(), centroCustoArray: [] }),
    });
    const ano = useWatchMy({ control: frmFilter.control, name: ValoresAnaliseAnual.F.ano });
    const centroCustoArray = useWatchMy({ control: frmFilter.control, name: ValoresAnaliseAnual.F.centroCustoArray });
    const mes = useWatchMy({ control: frmFilter.control, name: ValoresAnaliseAnual.F.mes });

    const [mainStatesFilter, setMainStatesFilter] = React.useState<MainStatesFilter>({});
    statesCompsSubord.setMainStatesFilter = setMainStatesFilter;

    const mountOptionsCC = (ano: string, initialization = false) => {
      let centroCustoOptions: CentroCustoConfigOption[] = [];
      let centroCustoUnique = null as string;
      const centroCustosSelected = frmFilter.getValues(ValoresAnaliseAnual.F.centroCustoArray);
      let permiteTodosCCs = false;
      if (ano != null) {
        const anoCentroCustos = mainStates.anoCentroCustosArray.find((x) => x.ano == ano);
        centroCustoOptions = anoCentroCustos.centroCustoConfigOptions;
        if (anoCentroCustos.centroCustoConfigOptions.length == 1)
          centroCustoUnique = anoCentroCustos.centroCustoConfigOptions[0].cod;
        else if (anoCentroCustos.centroCustoConfigOptions.length <= 20)
          permiteTodosCCs = true;
      }
      setMainStatesFilter({ centroCustoOptions, permiteTodosCCs });
      if (centroCustoUnique != null) {
        frmFilter.setValue(ValoresAnaliseAnual.F.centroCustoArray, [centroCustoUnique]);
        initialization && getItens(frmFilter.getValues());
      }
      else {
        if (centroCustosSelected.length === 1 &&
          centroCustoOptions.findIndex((x) => x.cod === centroCustosSelected[0]) !== -1)
          frmFilter.setValue(ValoresAnaliseAnual.F.centroCustoArray, [centroCustosSelected[0]]);
        else
          frmFilter.setValue(ValoresAnaliseAnual.F.centroCustoArray, []);
      }
    };

    React.useEffect(() => {
      const ano = mainStates.anoCentroCustosArray.length != 0 ? mainStates.anoCentroCustosArray[0].ano : '';
      frmFilter.setValue(ValoresAnaliseAnual.F.ano, ano);
      mountOptionsCC(ano, true);
    }, []);

    const getItensSubmit = async (dataForm: FrmFilter) => {
      const filter = NormalizePropsString(dataForm);
      if (filter.ano == null) return PopupMsg.error('Informe o Ano.');
      if (!mainStatesFilter.permiteTodosCCs &&
        filter.centroCustoArray.length === 0)
        return PopupMsg.error('Informe algum Centro de Custo.');
      if (filter.mes == null) return PopupMsg.error('Informe o Mês.');
      getItens(filter);
    };

    const centroCustoOptions = mainStatesFilter.centroCustoOptions == null ? null : mainStatesFilter.centroCustoOptions.map((x) => new SelOption(x.cod, x.descr));
    return (
      <form onSubmit={frmFilter.handleSubmit(getItensSubmit)}>
        <Stack direction='row' alignItems='center' gap={1}>
          <SelAno value={ano} onChange={(newValue) => { frmFilter.setValue(ValoresAnaliseAnual.F.ano, newValue || ''); mountOptionsCC(newValue); }}
            options={mainStates.anoCentroCustosArray.map((x) => new SelOption(x.ano, x.ano))}
          />
          {centroCustoOptions != null &&
            <>
              <SelEntity value={centroCustoArray} onChange={(newValue: string[]) => frmFilter.setValue(ValoresAnaliseAnual.F.centroCustoArray, newValue)}
                multiple limitTags={1}
                options={centroCustoOptions} name={CentroCusto.Name} withCod width='550px' />
              {/* disableClearable={!mainStatesFilter.permiteTodosCCs}  */}
              <FakeLink onClick={() => frmFilter.setValue(ValoresAnaliseAnual.F.centroCustoArray, mainStatesFilter.centroCustoOptions.map((x) => x.cod))}>(Sel. Todos)</FakeLink>
            </>
          }
          <SelMes value={mes} onChange={(newValue) => frmFilter.setValue(ValoresAnaliseAnual.F.mes, newValue || 0)} />

          <IconButtonAppSearch />
        </Stack>
      </form>
    );
  };

  const DataComp = () => {
    const [mainStatesData1, setMainStatesData1] = React.useState<MainStatesData1>({});
    const [mainStatesData2, setMainStatesData2] = React.useState<MainStatesData2>({});
    statesCompsSubord.setMainStatesData1 = setMainStatesData1;
    statesCompsSubord.setMainStatesData2 = setMainStatesData2;

    if (mainStatesData1.filterApplied == null || mainStatesData2.dataStructure == null) return <></>;
    const dataStructure = mainStatesData2.dataStructure;
    if (dataStructure.loading) return <WaitingObs text='carregando' />;

    const InfoComp = () => {
      const comps = [];
      if (dataStructure.headerInfo != null)
        comps.push(`${dataStructure.headerInfo}`);
      if (comps.length > 0) return (<Box style={cssTextNoWrapEllipsis}>{comps.join(' ')}</Box>);
      else return (<></>);
    };

    const propsColorsHdr = propsColorHeader(themePlus);
    const HeaderComp = () => {
      //const { personalizationAttrs, setPersonalizationAttrs } = usePersonalization();
      const [showConta, setShowConta] = React.useState(statesCompsSubord.showConta);
      return (
        <>
          <GridCell sticky textAlign='center' columnSpan={1} {...propsColorsHdr}><Box></Box></GridCell>
          <GridCell sticky textAlign='center' columnSpan={4} {...propsColorsHdr}><Box>Meta</Box></GridCell>
          <GridCell sticky textAlign='center' columnSpan={4} {...propsColorsHdr}><Box>YTD</Box></GridCell>
          <GridCell sticky textAlign='center' columnSpan={4} {...propsColorsHdr}><Box>Mês</Box></GridCell>

          <GridCell sticky {...propsColorsHdr}>
            <Stack direction='row' alignItems='center' gap={3}>
              <Box>Conta</Box>
              <SwitchMy size='small' label={<Box sx={{ color: propsColorsHdr.color, fontSize: 'small' }}>código</Box>} checked={showConta}
                onChange={(ev) => { setShowConta(ev.target.checked); statesCompsSubord.setShowConta(ev.target.checked); }} />
            </Stack>
          </GridCell>

          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Meta Ano</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Real+Orç. Ano</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Var. Proj.</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>R/O %</Box></GridCell>

          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Meta YTD</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Real+Orç. YTD</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Var. YTD</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>R/O %</Box></GridCell>

          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Meta Mês</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Real Mês</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Var. Mês</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>R/O %</Box></GridCell>
        </>
      );
    };

    const ValoresNodeComp = ({ node, level }: { node: HierNode<NodeContent>, level: number }) => {
      //if (node.stateOpen == null) node.stateOpen = true;

      const [open, setOpen] = React.useState(node.stateOpen);
      const [, forceRefresh] = React.useState<any>({});
      const setOpenRetain = (open: boolean) => {
        node.stateOpen = open;
        setOpen(open);
      };

      if (node.group && !node.nodesFilhoLoad) {
        node.nodesFilho = dataStructure.nodes.filter(x => x.idPai == node.id).sort((x, y) => compareForBinSearch(x.sortKey, y.sortKey));
        node.nodesFilhoLoad = true;
      }

      const LineShowComp = ({ level, stateOpen, setStateOpen }: { level: number, stateOpen?: boolean, setStateOpen?: any, forceRefreshUpp?: any }) => {
        const descrUse =
          <>
            {node.group
              ? <Stack direction='row' alignItems='center' gap={1} sx={{ cursor: 'pointer' }} onClick={() => setStateOpen(!stateOpen)}>
                <IconApp icon={stateOpen ? 'colapse' : 'expand'} fontSize={fontSizeIconsInGrid} />
                {node.nodeContent.descrComp(node.nodeType === NodeType.classeCusto)}
              </Stack>
              : <Box>
                {node.nodeContent.descrComp(node.nodeType === NodeType.classeCusto)}
              </Box>
            }
          </>;
        const paddingLeft = 0.8 * level;
        const propsColorLevel = node.group ? propsColorByTotLevel(themePlus, level + 1) : {};

        const realProj = (node.nodeContent.vals.realYTD + node.nodeContent.vals.planComplReal);

        const varRealProjAbs = (realProj - node.nodeContent.vals.planTot);
        const varRealProjPerc = node.nodeContent.vals.planTot == 0 ? null : (varRealProjAbs) / node.nodeContent.vals.planTot;
        const propsColorVarRealProj = propsColorByCompRealPlan(themePlus, varRealProjAbs);

        const varYTDAbs = node.nodeContent.vals.realYTD - node.nodeContent.vals.planYTD;
        const varYTDPerc = node.nodeContent.vals.planYTD == 0 ? null : (varYTDAbs) / node.nodeContent.vals.planYTD;
        const propsColorVarYTD = propsColorByCompRealPlan(themePlus, varYTDAbs);

        const varMesAbs = node.nodeContent.vals.realMes - node.nodeContent.vals.planMes;
        const varMesPerc = node.nodeContent.vals.planMes == 0 ? null : (varMesAbs) / node.nodeContent.vals.planMes;
        const propsColorVarMes = propsColorByCompRealPlan(themePlus, varMesAbs);

        return (<>
          <GridCell {...propsColorLevel}><Box pl={paddingLeft}>{descrUse}</Box></GridCell>

          <GridCell textAlign='right'>{amountToStr(node.nodeContent.vals.planTot, configCydag.decimalsValsCons)}</GridCell>
          <GridCell textAlign='right'>{amountToStr(realProj, configCydag.decimalsValsCons)}</GridCell>
          <GridCell textAlign='right' {...propsColorVarRealProj}>{amountToStr(varRealProjAbs, configCydag.decimalsValsCons)}</GridCell>
          <GridCell textAlign='right'>{percToStr(varRealProjPerc)}</GridCell>

          <GridCell textAlign='right'>{amountToStr(node.nodeContent.vals.planYTD, configCydag.decimalsValsCons)}</GridCell>
          <GridCell textAlign='right'>{amountToStr(node.nodeContent.vals.realYTD, configCydag.decimalsValsCons)}</GridCell>
          <GridCell textAlign='right' {...propsColorVarYTD}>{amountToStr(varYTDAbs, configCydag.decimalsValsCons)}</GridCell>
          <GridCell textAlign='right'>{percToStr(varYTDPerc)}</GridCell>

          <GridCell textAlign='right'>{amountToStr(node.nodeContent.vals.planMes, configCydag.decimalsValsCons)}</GridCell>
          <GridCell textAlign='right'>{amountToStr(node.nodeContent.vals.realMes, configCydag.decimalsValsCons)}</GridCell>
          <GridCell textAlign='right' {...propsColorVarMes}>{amountToStr(varMesAbs, configCydag.decimalsValsCons)}</GridCell>
          <GridCell textAlign='right'>{percToStr(varMesPerc)}</GridCell>
        </>);
      };

      return (
        <>
          {node.group
            ? <>
              <LineShowComp level={level} stateOpen={open} setStateOpen={setOpenRetain} forceRefreshUpp={forceRefresh} />
              {open &&
                <>
                  {node.nodesFilho.map((nodeFilho, index) =>
                    <ValoresNodeComp key={index} node={nodeFilho} level={level + 1} />
                  )}
                </>
              }
            </>
            : <>
              <LineShowComp level={level} />
            </>
          }
        </>
      );
    };

    return (
      <>
        <InfoComp />

        <Box display='grid' gap={0.2} flex={1} overflow='auto'
          gridTemplateColumns={'minmax(80px,4fr) repeat(12, 1fr)'}
          gridAutoRows='auto' gridAutoColumns='auto'
          justifyItems='stretch' alignItems='stretch'
          justifyContent='start' alignContent='start'
          fontSize={fontSizeGrid}
        >
          <HeaderComp />

          {dataStructure.nodes.filter((node) => node.idPai == null).map((node, index) =>
            <ValoresNodeComp key={index} node={node} level={0} />
          )}
        </Box>
      </>
    );
  };

  const LocalCssComp = () => {
    const [showConta, setShowConta] = React.useState(statesCompsSubord.showConta);
    statesCompsSubord.setShowConta = setShowConta;
    statesCompsSubord.showConta = showConta;
    return (
      <style jsx global>{`
        .showConta { display: ${showConta ? '' : 'none'} };
      `}</style>
    );
  };

  return (
    <>
      <Stack gap={1} height='100%'>
        <FilterComp />
        <DataComp />
      </Stack>
      <LocalCssComp />
    </>
  );
}