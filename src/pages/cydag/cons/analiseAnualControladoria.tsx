import React from 'react';
import { useRouter } from 'next/router';

import Box from '@mui/material/Box';
import { Divider, Stack, useTheme } from '@mui/material';

import { BinSearchItem, compareForBinSearch, ErrorPlus, ForceWait, NumberStrMinLen, ObjUpdAllProps } from '../../../libCommon/util';
import { CalcExecTime } from '../../../libCommon/calcExectime';
import { csd, dbgError } from '../../../libCommon/dbg';
import { IGenericObject } from '../../../libCommon/types';
import { PageDef } from '../../../libCommon/endPoints';
import { CallApiCliASync } from '../../../fetcher/fetcherCli';

import { cssTextNoWrapEllipsis } from '../../../libClient/util';

import { AbortProc, SelOption, PopupMsg, SwitchMy, WaitingObs, fontSizeGrid, fontSizeIconsInGrid, LogErrorUnmanaged, Tx } from '../../../components';
import { HierNode } from '../../../components/hier';
import { GridCell } from '../../../components/grid';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../../hooks/useMyForm';

import { configApp } from '../../../app_hub/appConfig';

import { IconApp, IconButtonAppSearch, propsColorHeader, propsColorByTotLevel, SelAno, SelMes, propsColorByCompRealPlan, TxGridHdr, TxGridCel } from '../../../appCydag/components';
import { apisApp, pagesApp } from '../../../appCydag/endPoints';
import { useLoggedUser } from '../../../appCydag/useLoggedUser';
import { amountToStrApp, percToStrApp, mesDefault } from '../../../appCydag/util';
import { ClasseCusto, Diretoria, FatorCusto, ProcessoOrcamentario, UnidadeNegocio } from '../../../appCydag/modelTypes';
import { ValoresAnaliseAnual, ColValsAnaliseAnual, CategRegional, CategRegionalMd } from '../../../appCydag/types';
import { CmdApi_ValoresContas as CmdApi } from '../../api/appCydag/valoresContas/types';
import { configCydag } from '../../../appCydag/configCydag';

enum Phase {
  initiating = 'initiating',
  ready = 'ready',
}

enum NodeType {
  tot = 'tot',
  categRegional = 'categRegional',
  unidadeNegocio = 'unidadeNegocio',
  diretoria = 'diretoria',
  fatorCusto = 'fatorCusto',
  classeCusto = 'classeCusto',
}

class NodeContent {
  cod: string | null;
  descr: string;
  vals: ColValsAnaliseAnual;
  constructor(cod: string | null, descr: string, vals: ColValsAnaliseAnual) {
    this.cod = cod;
    this.descr = descr;
    this.vals = vals;
  }
  descrComp(nodeClasseCusto: boolean) {
    if (nodeClasseCusto)
      return (
        <Stack direction='row' alignItems='center' spacing={0.5}>
          <Tx className='showConta'>{this.cod}</Tx>
          <Tx className='showConta'>-</Tx>
          <Tx style={cssTextNoWrapEllipsis}>{this.descr}</Tx>
        </Stack>
      );
    else
      return (
        <Tx style={cssTextNoWrapEllipsis}>{this.descr}</Tx>
      );
  }
}

class FrmFilter {
  ano: string;
  mes: number;
}
//#endregion

let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync<any>(apisApp.valoresContas.apiPath, parm) };
const pageSelf = pagesApp.analiseAnualRxOControladoria;

const statesCompsSubord = { setMainStatesData1: null as any, setMainStatesData2: null as any, showConta: false, setShowConta: null as any }; //#!!!!!!
export default function PageAnaliseAnualControladoria() {
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    processoOrcamentarioArray?: ProcessoOrcamentario[];
    unidadeNegocioArray?: UnidadeNegocio[]; diretoriaArray?: Diretoria[];
    fatorCustoArray?: FatorCusto[]; classeCustoArray?: ClasseCusto[];
  }
  interface MainStatesData1 {
    filterApplied?: FrmFilter;
  }
  interface MainStatesData2 {
    dataStructure?: {
      loading: boolean;
      headerInfo?: string;
      nodesCategRegionalFator?: HierNode<NodeContent>[];
      nodesCategRegionalUNFator?: HierNode<NodeContent>[];
      nodesCategRegionalUNDirFator?: HierNode<NodeContent>[];
    };
  }

  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  const themePlus = useTheme();

  //#region db access
  const initialization = async () => {
    const apiReturn = await apis.crud({ cmd: CmdApi.analiseAnualControladoriaInitialization });
    const processoOrcamentarioArray = (apiReturn.value.processoOrcamentarioArray as IGenericObject[]).map((data) => ProcessoOrcamentario.deserialize(data));
    const unidadeNegocioArray = (apiReturn.value.unidadeNegocioArray as IGenericObject[]).map((data) => UnidadeNegocio.deserialize(data));
    const diretoriaArray = (apiReturn.value.diretoriaArray as IGenericObject[]).map((data) => Diretoria.deserialize(data));
    const fatorCustoArray = (apiReturn.value.fatorCustoArray as IGenericObject[]).map((data) => FatorCusto.deserialize(data));
    const classeCustoArray = (apiReturn.value.classeCustoArray as IGenericObject[]).map((data) => ClasseCusto.deserialize(data));
    return { processoOrcamentarioArray, unidadeNegocioArray, diretoriaArray, fatorCustoArray, classeCustoArray };
  };
  const getItens = async (filter: FrmFilter) => {
    try {
      const calcExecTimeSearch = new CalcExecTime();
      statesCompsSubord.setMainStatesData2({ dataStructure: { loading: true } });
      statesCompsSubord.setMainStatesData1({ filterApplied: { ...filter } });
      const headerInfo = null;

      const apiReturn = await apis.crud({ cmd: CmdApi.analiseAnualControladoriaValoresGet, filter });
      const valoresAnaliseAnual = (apiReturn.value.valoresAnaliseAnual as IGenericObject[]).map((data) => ValoresAnaliseAnual.deserialize(data));

      const nodesCategRegionalFator = generateHierNodes(valoresAnaliseAnual, EstrutHier.categRegionalFator);
      const nodesCategRegionalUNFator = generateHierNodes(valoresAnaliseAnual, EstrutHier.categRegionalUNFator);
      const nodesCategRegionalUNDirFator = generateHierNodes(valoresAnaliseAnual, EstrutHier.categRegionalUNDirFator);

      //csl({ hier });
      if (!mount) return;
      await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs);
      statesCompsSubord.setMainStatesData2({
        dataStructure: {
          loading: false,
          //processoOrcamentario,
          headerInfo,
          nodesCategRegionalFator, nodesCategRegionalUNFator, nodesCategRegionalUNDirFator,
        }
      });
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-getItens`);
      PopupMsg.error(error);
    }
  };
  //#endregion

  //#region hierarquia
  const sumHierUp = (valsHierNode: HierNode<NodeContent>[], idPai: string, vals: ColValsAnaliseAnual) => {
    let idPaiSum = idPai;
    while (idPaiSum != null) {
      const nodePai = BinSearchItem(valsHierNode, idPaiSum, 'id');
      if (nodePai == null) {
        dbgError('sumHierUp', `nodePai ${idPaiSum} não encontrada na hierarquia (1)`);
        break;
      }
      if (nodePai.nodeContent.vals == null) {
        dbgError('sumHierUp', 'Valores para nível totalizado não inicializados:', nodePai.id);
        break;
      }
      if (vals != null)
        ColValsAnaliseAnual.sumVals(nodePai.nodeContent.vals, vals); //#!!!!!!! sempre inicializar com zeros e somar, nunca assign
      idPaiSum = nodePai.idPai;
    }
  };
  enum EstrutHier {
    categRegionalFator = 'fator',
    categRegionalUNFator = 'un_fator',
    categRegionalUNDirFator = 'un_dir_fator',
  }
  const setValsInf = (nodes: HierNode<NodeContent>[], valoresArray: ValoresAnaliseAnual[], estrutHier: EstrutHier) => { //##!!!!!!! fora da função
    valoresArray.forEach((valores) => {
      const nodeType = NodeType.classeCusto;
      const keys =
        estrutHier === EstrutHier.categRegionalFator ? [valores.categRegional, valores.fatorCusto, valores.classeCusto] :
          estrutHier === EstrutHier.categRegionalUNFator ? [valores.categRegional, valores.unidadeNegocio, valores.fatorCusto, valores.classeCusto] :
            estrutHier === EstrutHier.categRegionalUNDirFator ? [valores.categRegional, valores.unidadeNegocio, valores.diretoria, valores.fatorCusto, valores.classeCusto] :
              [];
      const id = HierNode.nodeId(nodeType, keys);
      const node = BinSearchItem(nodes, id, 'id');
      if (node == null) dbgError('setValsInf', `${id} não encontrada na hierarquia (setValsInf) (estrut: ${estrutHier})`);
      else if (node.group) dbgError('setValsInf', `${id} está na hierarquia como um agrupamento (estrut: ${estrutHier})`);
      else {
        ColValsAnaliseAnual.sumVals(node.nodeContent.vals, valores); // .vals() #!!!!!!!!
        sumHierUp(nodes, node.idPai, valores);
      }
    });
  };

  const generateHierNodes = (valoresAnaliseAnual: ValoresAnaliseAnual[], estrutHier: EstrutHier) => {
    const nodes: HierNode<NodeContent>[] = [];

    const fatorCustoArray = mainStates.fatorCustoArray != null ? mainStates.fatorCustoArray : [];
    const classeCustoArray = mainStates.classeCustoArray != null ? mainStates.classeCustoArray : [];
    const unidadeNegocioArray = mainStates.unidadeNegocioArray != null ? mainStates.unidadeNegocioArray : [];
    const diretoriaArray = mainStates.diretoriaArray != null ? mainStates.diretoriaArray : [];

    nodes.push(new HierNode<NodeContent>(NodeType.tot, null, null, null, true, '', new NodeContent(null, 'Total', ColValsAnaliseAnual.ValsReset()), true));

    const categRegionais = [CategRegional.principais, CategRegional.outras];
    categRegionais.forEach((categRegional, index) => {
      const openCateg = categRegional === CategRegional.principais;
      nodes.push(new HierNode<NodeContent>(NodeType.categRegional, [categRegional], NodeType.tot, null, true, NumberStrMinLen(index, 2), new NodeContent(categRegional, CategRegionalMd.descr(categRegional), ColValsAnaliseAnual.ValsReset()), openCateg));
      if (estrutHier === EstrutHier.categRegionalFator) {
        fatorCustoArray.forEach((fatorCustoMd) => {
          //if (classeCustoArray.find((classeCusto) => classeCusto.fatorCusto == fatorCusto.fatorCusto) != null) {
          nodes.push(new HierNode<NodeContent>(NodeType.fatorCusto, [categRegional, fatorCustoMd.fatorCusto], NodeType.categRegional, [categRegional], true, fatorCustoMd.fatorCusto, new NodeContent(null, `${fatorCustoMd.descr}`, ColValsAnaliseAnual.ValsReset())));
        });
        classeCustoArray.forEach((classeCustoMd) => {
          nodes.push(new HierNode<NodeContent>(NodeType.classeCusto, [categRegional, classeCustoMd.fatorCusto, classeCustoMd.classeCusto], NodeType.fatorCusto, [categRegional, classeCustoMd.fatorCusto], false, `${String(classeCustoMd.seqApresent).padStart(4, '0')}-${classeCustoMd.classeCusto}`, new NodeContent(classeCustoMd.classeCusto, classeCustoMd.descr, ColValsAnaliseAnual.ValsReset())));
        });
      }
      else if (estrutHier === EstrutHier.categRegionalUNFator) {
        unidadeNegocioArray.filter((x) => x.categRegional === categRegional).forEach((unidadeNegocioMd) => {
          nodes.push(new HierNode<NodeContent>(NodeType.unidadeNegocio, [categRegional, unidadeNegocioMd.cod], NodeType.categRegional, [categRegional], true, unidadeNegocioMd.cod, new NodeContent(null, `${unidadeNegocioMd.descr}`, ColValsAnaliseAnual.ValsReset())));
          fatorCustoArray.forEach((fatorCustoMd) => { // #!!!!!! Md e nome
            nodes.push(new HierNode<NodeContent>(NodeType.fatorCusto, [categRegional, unidadeNegocioMd.cod, fatorCustoMd.fatorCusto], NodeType.unidadeNegocio, [categRegional, unidadeNegocioMd.cod], true, fatorCustoMd.fatorCusto, new NodeContent(null, `${fatorCustoMd.descr}`, ColValsAnaliseAnual.ValsReset())));
          });
          classeCustoArray.forEach((classeCustoMd) => {
            nodes.push(new HierNode<NodeContent>(NodeType.classeCusto, [categRegional, unidadeNegocioMd.cod, classeCustoMd.fatorCusto, classeCustoMd.classeCusto], NodeType.fatorCusto, [categRegional, unidadeNegocioMd.cod, classeCustoMd.fatorCusto], false, `${String(classeCustoMd.seqApresent).padStart(4, '0')}-${classeCustoMd.classeCusto}`, new NodeContent(classeCustoMd.classeCusto, classeCustoMd.descr, ColValsAnaliseAnual.ValsReset())));
          });
        });
      }
      else if (estrutHier === EstrutHier.categRegionalUNDirFator) {
        unidadeNegocioArray.filter((x) => x.categRegional === categRegional).forEach((unidadeNegocioMd) => {
          nodes.push(new HierNode<NodeContent>(NodeType.unidadeNegocio, [categRegional, unidadeNegocioMd.cod], NodeType.categRegional, [categRegional], true, unidadeNegocioMd.cod, new NodeContent(null, `${unidadeNegocioMd.descr}`, ColValsAnaliseAnual.ValsReset())));
          diretoriaArray.forEach((diretoriaMd) => {
            const keyValDir = (categRegional?: string, unidadeNegocio?: string, diretoria?: string) => `${categRegional}-${unidadeNegocio}-${diretoria}`;
            if (valoresAnaliseAnual.find((x) => keyValDir(x.categRegional, x.unidadeNegocio, x.diretoria) === keyValDir(categRegional, unidadeNegocioMd.cod, diretoriaMd.cod)) != null) {
              nodes.push(new HierNode<NodeContent>(NodeType.diretoria, [categRegional, unidadeNegocioMd.cod, diretoriaMd.cod], NodeType.unidadeNegocio, [categRegional, unidadeNegocioMd.cod], true, diretoriaMd.cod, new NodeContent(null, `${diretoriaMd.descr}`, ColValsAnaliseAnual.ValsReset())));
              fatorCustoArray.forEach((fatorCustoMd) => {
                nodes.push(new HierNode<NodeContent>(NodeType.fatorCusto, [categRegional, unidadeNegocioMd.cod, diretoriaMd.cod, fatorCustoMd.fatorCusto], NodeType.diretoria, [categRegional, unidadeNegocioMd.cod, diretoriaMd.cod], true, fatorCustoMd.fatorCusto, new NodeContent(null, `${fatorCustoMd.descr}`, ColValsAnaliseAnual.ValsReset())));
              });
              classeCustoArray.forEach((classeCustoMd) => {
                nodes.push(new HierNode<NodeContent>(NodeType.classeCusto, [categRegional, unidadeNegocioMd.cod, diretoriaMd.cod, classeCustoMd.fatorCusto, classeCustoMd.classeCusto], NodeType.fatorCusto, [categRegional, unidadeNegocioMd.cod, diretoriaMd.cod, classeCustoMd.fatorCusto], false, `${String(classeCustoMd.seqApresent).padStart(4, '0')}-${classeCustoMd.classeCusto}`, new NodeContent(classeCustoMd.classeCusto, classeCustoMd.descr, ColValsAnaliseAnual.ValsReset())));
              });
            }
          });
        });
      }
    });

    nodes.sort((a, b) => compareForBinSearch(a.id, b.id));
    const filterVals =
      estrutHier === EstrutHier.categRegionalFator ? (x: ValoresAnaliseAnual) => x.categRegional != null :
        estrutHier === EstrutHier.categRegionalUNFator ? (x: ValoresAnaliseAnual) => x.categRegional != null && x.unidadeNegocio != null :
          estrutHier === EstrutHier.categRegionalUNDirFator ? (x: ValoresAnaliseAnual) => x.categRegional != null && x.unidadeNegocio != null && x.diretoria != null :
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (dummy: ValoresAnaliseAnual) => false;
    setValsInf(nodes, valoresAnaliseAnual.filter(filterVals), estrutHier);

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
        const { processoOrcamentarioArray, unidadeNegocioArray, diretoriaArray, fatorCustoArray, classeCustoArray } = result;
        setMainStatesCache({ phase: Phase.ready, processoOrcamentarioArray, unidadeNegocioArray, diretoriaArray, fatorCustoArray, classeCustoArray });
      })
      .catch((error) => {
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-initialization`);
        PopupMsg.error(error);
      });
    return () => { mount = false; };
  }, [router?.asPath]);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  if (mainStates.phase == Phase.initiating) return <WaitingObs />;

  //csl('renderMain', mainStates);

  const FilterComp = () => {
    const frmFilter = useFrm<FrmFilter>({
      defaultValues: FrmDefaultValues(new FrmFilter(), { mes: mesDefault() }),
    });
    const ano = useWatchMy({ control: frmFilter.control, name: ValoresAnaliseAnual.F.ano });
    const mes = useWatchMy({ control: frmFilter.control, name: ValoresAnaliseAnual.F.mes });

    React.useEffect(() => {
      const ano = (mainStates.processoOrcamentarioArray != null && mainStates.processoOrcamentarioArray.length != 0) ? mainStates.processoOrcamentarioArray[0].ano : '';
      frmFilter.setValue(ValoresAnaliseAnual.F.ano, ano);
    }, []);

    const getItensSubmit = async (dataForm: FrmFilter) => {
      const filter = NormalizePropsString(dataForm);
      if (filter.ano == null) return PopupMsg.error('Informe o Ano.');
      if (filter.mes == null) return PopupMsg.error('Informe o Mês.');
      getItens(filter);
    };

    const processoOrcamentarioArray = mainStates.processoOrcamentarioArray != null ? mainStates.processoOrcamentarioArray : [];
    return (
      <form onSubmit={frmFilter.handleSubmit(getItensSubmit)}>
        <Stack direction='row' alignItems='center' spacing={1}>
          <SelAno value={ano} onChange={(newValue) => frmFilter.setValue(ValoresAnaliseAnual.F.ano, newValue || '')}
            options={processoOrcamentarioArray.map((x) => new SelOption(x.ano, x.ano))}
          />
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
      const comps: string[] = [];
      if (dataStructure.headerInfo != null)
        comps.push(dataStructure.headerInfo);
      if (comps.length > 0) return (<Tx style={cssTextNoWrapEllipsis}>{comps.join(' ')}</Tx>);
      else return (<></>);
    };

    const propsColorsHdr = propsColorHeader();
    const HeaderComp = () => {
      //const { personalizationAttrs, setPersonalizationAttrs } = usePersonalization();
      const [showConta, setShowConta] = React.useState(statesCompsSubord.showConta);
      return (
        <>
          <GridCell sticky textAlign='center' columnSpan={1} {...propsColorsHdr}><TxGridHdr></TxGridHdr></GridCell>
          <GridCell sticky textAlign='center' columnSpan={4} {...propsColorsHdr}><TxGridHdr>Meta</TxGridHdr></GridCell>
          <GridCell sticky textAlign='center' columnSpan={4} {...propsColorsHdr}><TxGridHdr>YTD</TxGridHdr></GridCell>
          <GridCell sticky textAlign='center' columnSpan={4} {...propsColorsHdr}><TxGridHdr>Mês</TxGridHdr></GridCell>

          <GridCell sticky {...propsColorsHdr}>
            <Stack direction='row' alignItems='center' spacing={3}>
              <TxGridHdr>Conta</TxGridHdr>
              <SwitchMy size='small' label={<TxGridHdr sx={{ color: propsColorsHdr.color, fontSize: 'small' }}>código</TxGridHdr>} checked={showConta}
                onChange={(ev) => { setShowConta(ev.target.checked); statesCompsSubord.setShowConta(ev.target.checked); }} />
            </Stack>
          </GridCell>

          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Meta Ano</TxGridHdr></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Real+Orç. Ano</TxGridHdr></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Var. Proj.</TxGridHdr></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>R/O %</TxGridHdr></GridCell>

          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Meta YTD</TxGridHdr></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Real+Orç. YTD</TxGridHdr></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Var. YTD</TxGridHdr></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>R/O %</TxGridHdr></GridCell>

          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Meta Mês</TxGridHdr></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Real Mês</TxGridHdr></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Var. Mês</TxGridHdr></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>R/O %</TxGridHdr></GridCell>
        </>
      );
    };

    const ValoresNodeComp = ({ node, nodes, level }: { nodes: HierNode<NodeContent>[], node: HierNode<NodeContent>, level: number }) => { //##!!!!!! nodes como parâmetro
      //if (node.stateOpen == null) node.stateOpen = true;

      const [open, setOpen] = React.useState(node.stateOpen);
      const [, forceRefresh] = React.useState<any>({});
      const setOpenRetain = (open: boolean) => {
        node.stateOpen = open;
        setOpen(open);
      };

      if (node.group && !node.nodesFilhoLoad) {
        node.nodesFilho = nodes.filter(x => x.idPai == node.id).sort((x, y) => compareForBinSearch(x.sortKey, y.sortKey));
        node.nodesFilhoLoad = true;
      }

      const LineShowComp = ({ level, stateOpen, setStateOpen }: { level: number, stateOpen?: boolean, setStateOpen?: any, forceRefreshUpp?: any }) => {
        const descrUse =
          <>
            {node.group
              ? <Stack direction='row' alignItems='center' spacing={1} sx={{ cursor: 'pointer' }} onClick={() => setStateOpen(!stateOpen)}>
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

          <GridCell textAlign='right'><TxGridCel>{amountToStrApp(node.nodeContent.vals.planTot, configCydag.decimalsValsCons)}</TxGridCel></GridCell>
          <GridCell textAlign='right'><TxGridCel>{amountToStrApp(realProj, configCydag.decimalsValsCons)}</TxGridCel></GridCell>
          <GridCell textAlign='right' {...propsColorVarRealProj}><TxGridCel>{amountToStrApp(varRealProjAbs, configCydag.decimalsValsCons)}</TxGridCel></GridCell>
          <GridCell textAlign='right'><TxGridCel>{percToStrApp(varRealProjPerc)}</TxGridCel></GridCell>

          <GridCell textAlign='right'><TxGridCel>{amountToStrApp(node.nodeContent.vals.planYTD, configCydag.decimalsValsCons)}</TxGridCel></GridCell>
          <GridCell textAlign='right'><TxGridCel>{amountToStrApp(node.nodeContent.vals.realYTD, configCydag.decimalsValsCons)}</TxGridCel></GridCell>
          <GridCell textAlign='right' {...propsColorVarYTD}><TxGridCel>{amountToStrApp(varYTDAbs, configCydag.decimalsValsCons)}</TxGridCel></GridCell>
          <GridCell textAlign='right'><TxGridCel>{percToStrApp(varYTDPerc)}</TxGridCel></GridCell>

          <GridCell textAlign='right'><TxGridCel>{amountToStrApp(node.nodeContent.vals.planMes, configCydag.decimalsValsCons)}</TxGridCel></GridCell>
          <GridCell textAlign='right'><TxGridCel>{amountToStrApp(node.nodeContent.vals.realMes, configCydag.decimalsValsCons)}</TxGridCel></GridCell>
          <GridCell textAlign='right' {...propsColorVarMes}><TxGridCel>{amountToStrApp(varMesAbs, configCydag.decimalsValsCons)}</TxGridCel></GridCell>
          <GridCell textAlign='right'><TxGridCel>{percToStrApp(varMesPerc)}</TxGridCel></GridCell>
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
                    <ValoresNodeComp key={index} nodes={nodes} node={nodeFilho} level={level + 1} />
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

    const nrCols = 13;
    const CompShowHier = ({ nodes, title }: { nodes: HierNode<NodeContent>[], title: string }) => //##!!!!!!
      <>
        <GridCell columnSpan={nrCols} {...propsColorsHdr} textAlign='center'><TxGridHdr>{title}</TxGridHdr></GridCell>
        {nodes.filter((node) => node.idPai == null).map((node, index) =>
          <ValoresNodeComp key={index} nodes={nodes} node={node} level={0} />
        )}
      </>;

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

          <CompShowHier title='Por Grupo de Classe de Custo' nodes={dataStructure.nodesCategRegionalFator} />

          <GridCell columnSpan={nrCols}><Divider /></GridCell>
          <CompShowHier title='Por Regional' nodes={dataStructure.nodesCategRegionalUNFator} />

          <GridCell columnSpan={nrCols}><Divider /></GridCell>
          <CompShowHier title='Por Diretoria' nodes={dataStructure.nodesCategRegionalUNDirFator} />
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
      <Stack spacing={1} height='100%'>
        <FilterComp />
        <DataComp />
      </Stack>
      <LocalCssComp />
    </>
  );
}