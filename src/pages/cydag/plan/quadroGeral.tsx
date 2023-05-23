import React from 'react';
import { useRouter } from 'next/router';

import Box from '@mui/material/Box';
import { Input, Stack, Tooltip, useTheme } from '@mui/material';

import { BinSearchItem, BinSearchProp, compareForBinSearch, ErrorPlus, ForceWait, FormatDate, ObjUpdAllProps, RoundDecs } from '../../../libCommon/util';
import { csd, dbgError } from '../../../libCommon/dbg';
import { IGenericObject } from '../../../libCommon/types';
import { PageDef } from '../../../libCommon/endPoints';
import { CalcExecTime } from '../../../libCommon/calcExectime';
import { CallApiCliASync } from '../../../fetcher/fetcherCli';

import { cssTextNoWrapEllipsis } from '../../../libClient/util';

import { AbortProc, Btn, BtnLine, IconButtonMy, SelOption, PopupMsg, SwitchMy, WaitingObs, SnackBarError, PageByVariant, fontSizeGrid, fontSizeIconsInGrid, FakeLink } from '../../../components';
import { HierNode } from '../../../components/hier';
import { GridCell } from '../../../components/grid';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../../hooks/useMyForm';
//import { GlobalState, useGlobalState } from '../../hooks/useGlobalState';

import { configApp } from '../../../app_hub/appConfig';

import { IconApp, IconButtonAppCrud, IconButtonAppSearch, propsColorHeader, propsColorByTotLevel, SelRevisao, SelEntity, SelAno } from '../../../appCydag/components';
import { apisApp, pagesApp, quadroPage } from '../../../appCydag/endPoints';
import { useLoggedUser } from '../../../appCydag/useLoggedUser';
import { anoAdd, mesesFld, mesesHdr, genValMeses, sumRound, sumValMeses, amountParse, amountToStr } from '../../../appCydag/util';
import { CentroCusto, ClasseCusto, ClasseCustoRestrita, FatorCusto, ProcessoOrcamentario, ProcessoOrcamentarioCentroCusto } from '../../../appCydag/modelTypes';
import { OperInProcessoOrcamentario, ProcessoOrcamentarioStatusMd, ValoresPlanejadosDetalhes, ValoresTotCentroCustoClasseCusto } from '../../../appCydag/types';
import { CentroCustoConfigOption, IAnoCentroCustos, OrigemClasseCusto, ProcCentrosCustoConfig, RevisaoValor } from '../../../appCydag/types';
import { CmdApi_ValoresContas as CmdApi, IChangedLine } from '../../api/appCydag/valoresContas/types';
import { cydagColors } from '../../../appCydag/themes';
import { configCydag } from '../../../appCydag/configCydag';

//#region ok
// let globalPersonalization: GlobalState = null;
// export const usePersonalization = () => {
//   if (globalPersonalization == null)
//     globalPersonalization = new GlobalState({ defaultValue: { showConta: false } });
//   const { value: personalizationAttrs, setState } = useGlobalState(globalPersonalization);
//   return { personalizationAttrs, setPersonalizationAttrs: setState };
// };

enum Phase {
  initiating = 'initiating',
  ready = 'ready',
}

interface ISxMesVal { sxMes: number, val: number }

const valMesFld = (sxMes: number) => `valMes_${sxMes}`;

export class GlobalEditCtrl {
  changedLinesCtrl: { idLine: string; changedLine: IChangedLine }[];
  touchedCells: { idLine: string, descrLine: string, fld: string, valueError: boolean }[];
  constructor() {
    this.reset();
  }
  reset() {
    this.changedLinesCtrl = [];
    this.touchedCells = [];
  }
  logTouchedCells(idLine: string, descrLine: string, fld: string, valueError: boolean) {
    const touchedCell = this.touchedCells.find((x) => x.idLine === idLine && x.fld === fld);
    if (touchedCell == null)
      this.touchedCells.push({ idLine, descrLine, fld, valueError });
    else
      touchedCell.valueError = valueError;
  }
  setChangedLineVals(idLine: string, key: IGenericObject, valMeses: number[]) {
    let sxChangedLine = this.changedLinesCtrl.findIndex((item) => item.idLine === idLine);
    if (sxChangedLine == -1) {
      this.changedLinesCtrl.push({ idLine, changedLine: { key, descr: null, valMeses: new Array(mesesFld.length).fill(undefined) } });
      sxChangedLine = this.changedLinesCtrl.length - 1;
    }
    // newVals.forEach((x) => { this.changedLines[sxClasseCusto].changedLine.valMeses[x.sxMes] = x.val; });
    this.changedLinesCtrl[sxChangedLine].changedLine.valMeses = valMeses;
  }
  setChangedLineDescr(idLine: string, key: IGenericObject, descr: string) {
    let sxChangedLine = this.changedLinesCtrl.findIndex((item) => item.idLine === idLine);
    if (sxChangedLine == -1) {
      this.changedLinesCtrl.push({ idLine, changedLine: { key, descr: null, valMeses: new Array(mesesFld.length).fill(undefined) } });
      sxChangedLine = this.changedLinesCtrl.length - 1;
    }
    this.changedLinesCtrl[sxChangedLine].changedLine.descr = descr;
  }
  cellError(id: string, fld: string) {
    const touchedCell = this.touchedCells.find((x) => x.idLine === id && x.fld === fld);
    return touchedCell == null ? false : touchedCell.valueError;
  }
}
export const GlobalCtrlContext = React.createContext<GlobalEditCtrl>(null);

enum NodeType {
  tot = 'tot',
  fatorCusto = 'fatorCusto',
  classeCusto = 'classeCusto',
  detClasseCusto = 'detClasseCusto'
}

class NodeContent {
  cod: string;
  descr: string;
  editable: boolean;   // #!!!! editable, keyDb e descrNodesUpp juntos, pois apenas em edição
  keyDb: IGenericObject; // key para atualização no db
  descrNodesUpp: string;
  valMeses: number[];
  valMesesStr?: string[];
  valTotPlanejAnoAnt: number;
  valTotRealAnoAnt: number;
  constructor(cod: string, descr: string, editable: boolean, keyDb: IGenericObject, descrNodesUpp: string, valMeses?: number[]) {
    // constructor(keyDb: IGenericObject, cod: string, descr: string, descrNodesUpp: string, editable: boolean, valMeses?: number[]) {
    this.keyDb = keyDb;
    this.cod = cod;
    this.descr = descr;
    this.descrNodesUpp = descrNodesUpp;
    this.editable = editable;
    this.valMeses = valMeses;
    this.valTotPlanejAnoAnt = 0;
    this.valTotRealAnoAnt = 0;
  }
  descrComp?(nodeClasseCusto: boolean) {
    if (nodeClasseCusto)
      return (
        <Tooltip title={this.descr}>
          <Stack direction='row' alignItems='center' gap={0.5}>
            <Box className='showConta'>{this.cod}</Box>
            <Box className='showConta'>-</Box>
            <Box style={cssTextNoWrapEllipsis}>{this.descr}</Box>
          </Stack>
        </Tooltip>
      );
    else
      return (
        <Tooltip title={this.descr}>
          <Box style={cssTextNoWrapEllipsis}>{this.descr}</Box>
        </Tooltip>
      );
  }
  get descrAcum() { // todos os níveis de hierarquia (para melhor msg se houver algum erro ao gravar)
    return this.descrNodesUpp == null ? this.descr : `${this.descrNodesUpp} - ${this.descr}`;
  }
}

class FrmFilter {
  ano: string;
  revisao: RevisaoValor;
  centroCusto: string;
  centroCustoArray: string[];
}
const fldFrmExtra = {
  centroCustoArray: 'centroCustoArray' as 'centroCustoArray',
};
//#endregion

let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync<any>(apisApp.valoresContas.apiPath, parm) };
let pageSelf = new PageDef('/pathForPageQuadro');

const statesCompsSubord = { setMainStatesFilter: null, setMainStatesData1: null, setMainStatesData2: null, setBgColorsHier: null, showConta: false, setShowConta: null };
export default function PageQuadroGeral() {
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    anoCentroCustosArray?: IAnoCentroCustos[];
    classeCustoRestritaArray?: ClasseCustoRestrita[]; fatorCustoArray?: FatorCusto[]; classeCustoArray?: ClasseCusto[];
  }
  interface MainStatesFilter {
    centroCustoOptions?: CentroCustoConfigOption[];
  }
  interface MainStatesData1 {
    filterApplied?: FrmFilter;
  }
  interface MainStatesData2 {
    dataStructure?: {
      loading: boolean;
      headerInfo?: string; canEdit?: boolean;
      processoOrcamentario?: ProcessoOrcamentario; processoOrcamentarioCentroCusto?: ProcessoOrcamentarioCentroCusto;
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
    const apiReturn = await apis.crud({ cmd: CmdApi.quadroInitialization, variant: pageSelf.options.variant });
    const procsCentrosCustoConfigAllYears = (apiReturn.value.procsCentrosCustoConfigAllYears as IGenericObject[]).map((data) => ProcCentrosCustoConfig.deserialize(data));
    const centroCustoArray = (apiReturn.value.centroCustoArray as IGenericObject[]).map((data) => CentroCusto.deserialize(data));
    const classeCustoRestritaArray = (apiReturn.value.classeCustoRestritaArray as IGenericObject[]).map((data) => ClasseCustoRestrita.deserialize(data));
    const fatorCustoArray = (apiReturn.value.fatorCustoArray as IGenericObject[]).map((data) => FatorCusto.deserialize(data));
    //fatorCustoArray = fatorCustoArray.filter((x) => x.fatorCusto <= 'a');
    const classeCustoArray = (apiReturn.value.classeCustoArray as IGenericObject[]).map((data) => ClasseCusto.deserialize(data));
    return { procsCentrosCustoConfigAllYears, centroCustoArray, classeCustoRestritaArray, fatorCustoArray, classeCustoArray };
  };
  const getItens = async (filter: FrmFilter, bgColorsHier: string[]) => {
    //csd('getItens'); // chamando 2x??
    try {
      const calcExecTimeSearch = new CalcExecTime();
      statesCompsSubord.setBgColorsHier(bgColorsHier);
      statesCompsSubord.setMainStatesData2({ dataStructure: { loading: true } });
      statesCompsSubord.setMainStatesData1({ filterApplied: { ...filter } });
      //setMainStatesCache({ phase: Phase.editing });
      let processoOrcamentario, processoOrcamentarioCentroCusto, valoresPlanejados, valoresPlanejadosAnoAnt, valoresRealizadosAnoAnt;
      let headerInfo = null, canEdit = false;

      if (pageSelf.options.variant === quadroPage.variant.input) {
        const apiReturn = await apis.crud({ cmd: CmdApi.quadroInputItensGet, filter });
        processoOrcamentario = ProcessoOrcamentario.deserialize(apiReturn.value.processoOrcamentario);
        processoOrcamentarioCentroCusto = ProcessoOrcamentarioCentroCusto.deserialize(apiReturn.value.processoOrcamentarioCentroCusto);
        valoresPlanejados = (apiReturn.value.valoresPlanejados as IGenericObject[]).map((data) => ValoresPlanejadosDetalhes.deserialize(data));
        valoresPlanejadosAnoAnt = (apiReturn.value.valoresPlanejadosAnoAnt as IGenericObject[]).map((data) => ValoresTotCentroCustoClasseCusto.deserialize(data));
        valoresRealizadosAnoAnt = (apiReturn.value.valoresRealizadosAnoAnt as IGenericObject[]).map((data) => ValoresTotCentroCustoClasseCusto.deserialize(data));
        const userCanWrite = apiReturn.value.userCanWrite;
        if (filter.revisao === RevisaoValor.atual &&
          ProcessoOrcamentarioStatusMd.blockOper(OperInProcessoOrcamentario.altValoresPlanejados, processoOrcamentario.status) == null &&
          userCanWrite) {
          if (processoOrcamentarioCentroCusto.planejamentoEmAberto != true)
            headerInfo = 'Centro de Custo está bloqueado para planejamento.';
          else
            canEdit = true;
        }
      }
      else {
        const apiReturn = await apis.crud({ cmd: CmdApi.quadroConsValoresGet, filter });
        processoOrcamentario = ProcessoOrcamentario.deserialize(apiReturn.value.processoOrcamentario);
        processoOrcamentarioCentroCusto = null;
        valoresPlanejados = (apiReturn.value.valoresPlanejados as IGenericObject[]).map((data) => ValoresPlanejadosDetalhes.deserialize(data));
        valoresPlanejadosAnoAnt = (apiReturn.value.valoresPlanejadosAnoAnt as IGenericObject[]).map((data) => ValoresTotCentroCustoClasseCusto.deserialize(data));
        valoresRealizadosAnoAnt = (apiReturn.value.valoresRealizadosAnoAnt as IGenericObject[]).map((data) => ValoresTotCentroCustoClasseCusto.deserialize(data));
        if (filter.centroCustoArray.length == 0)
          headerInfo = 'Todos os Centros de Custo autorizados';
        else
          headerInfo = `Centros de Custo: ${filter.centroCustoArray.join(', ')}`;
      }

      const nodes = generateHierNodes(filter, canEdit, valoresPlanejados, valoresPlanejadosAnoAnt, valoresRealizadosAnoAnt);

      //csl({ hier });
      if (!mount) return;
      await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs);
      statesCompsSubord.setMainStatesData2({
        dataStructure: {
          loading: false,
          processoOrcamentario,
          processoOrcamentarioCentroCusto,
          headerInfo, canEdit,
          nodes,
        }
      });
    } catch (error) {
      statesCompsSubord.setMainStatesData2({ dataStructure: null });
      SnackBarError(error, `${pageSelf.pagePath}-getItens`);
    }
  };
  const setItens = async (filter: FrmFilter, changedLines: IChangedLine[]) => {
    try {
      await apis.crud({ cmd: CmdApi.quadroInputItensSet, filter, data: { changedLines } });
      PopupMsg.success(`Valores gravados para ${filter.ano} / ${filter.centroCusto}`);
    } catch (error) {
      SnackBarError(error, `${pageSelf.pagePath}-setItens`);
    }
  };
  //#endregion

  //#region hierarquia
  const nodeDetalheClasseCusto = (descrNodesUpp: string, classeCusto: string, idDetalhe: string, descr: string, editableGlobal: boolean) => {
    return new HierNode<NodeContent>(NodeType.detClasseCusto, [classeCusto, idDetalhe], NodeType.classeCusto, [classeCusto], false, idDetalhe, new NodeContent(null, descr, editableGlobal, { classeCusto, idDetalhe }, descrNodesUpp, null));
  };

  const generateHierNodes = (filter: FrmFilter, canEdit: boolean,
    valoresPlanejados: ValoresPlanejadosDetalhes[], valoresPlanejadosAnoAnt: ValoresTotCentroCustoClasseCusto[], valoresRealizadosAnoAnt: ValoresTotCentroCustoClasseCusto[]) => {
    const nodes: HierNode<NodeContent>[] = [];
    const valMesesZerados = genValMeses(0);

    const fatorCustoArray = mainStates.fatorCustoArray;
    const classeCustoArray = mainStates.classeCustoArray;

    nodes.push(
      new HierNode<NodeContent>(NodeType.tot, [''], null, null, true, '', new NodeContent(null, 'Total', false, null, null, [...valMesesZerados]), true)
    );

    fatorCustoArray.forEach((fatorCusto) => {
      if (classeCustoArray.find((classeCusto) => classeCusto.fatorCusto == fatorCusto.fatorCusto) != null) {
        nodes.push(
          new HierNode<NodeContent>(NodeType.fatorCusto, [fatorCusto.fatorCusto], NodeType.tot, [''], true, fatorCusto.fatorCusto, new NodeContent(null, `${fatorCusto.descr}`, false, null, null, [...valMesesZerados]), true)
        );
      }
    });

    const allowClasseCustoRestrita = (classeCusto: string) => {
      const classeCustoRestrita = BinSearchItem(mainStates.classeCustoRestritaArray, classeCusto, 'classeCusto');
      if (classeCustoRestrita != null &&
        !classeCustoRestrita.centroCustoArray.includes(filter.centroCustoArray[0]))
        return false;
      else
        return true;
    };

    classeCustoArray.forEach((x) => {
      const group = x.origem == OrigemClasseCusto.totalImputada || x.origem == OrigemClasseCusto.totalCalculada;
      const editable = canEdit && allowClasseCustoRestrita(x.classeCusto);
      const descrNodesUpp = null; //`Fator de Custo (${x.fatorCusto})`;
      nodes.push(
        new HierNode<NodeContent>(NodeType.classeCusto, [x.classeCusto], NodeType.fatorCusto, [x.fatorCusto], group, `${String(x.seqApresent).padStart(4, '0')}-${x.classeCusto}`, new NodeContent(x.classeCusto, x.descr, editable, { classeCusto: x.classeCusto }, descrNodesUpp, group ? [...valMesesZerados] : null))
      );
    });

    valoresPlanejados.forEach((valores) => {
      //  valoresPlanejados.filter((x) => x.idDetalhe != null).forEach((valores) => {
      const classeCustoDef = BinSearchItem(classeCustoArray, valores.classeCusto, 'classeCusto');
      if (classeCustoDef.origem == OrigemClasseCusto.totalImputada || classeCustoDef.origem == OrigemClasseCusto.totalCalculada) {
        const editable = canEdit && allowClasseCustoRestrita(valores.classeCusto);
        const descrNodesUpp = classeCustoDef.descr; // `Fator de Custo ${classeCustoDef?.fatorCusto} - Conta ${valores.classeCusto}`;
        nodes.push(nodeDetalheClasseCusto(descrNodesUpp, valores.classeCusto, valores.idDetalhe || '', valores.descr || '', editable));
      }
    });

    const sumHierUp = (valsHierNode: HierNode<NodeContent>[], idPai: string, valMeses: number[], valTotPlanejAnoAnt: number, valTotRealAnoAnt: number) => {
      let idPaiSum = idPai;
      while (idPaiSum != null) {
        const nodePai = BinSearchItem(valsHierNode, idPaiSum, 'id');
        if (nodePai == null) {
          dbgError('sumHierUp', `nodePai ${idPaiSum} não encontrada na hierarquia (1)`);
          break;
        }
        if (nodePai.nodeContent.valMeses == null) {
          dbgError('sumHierUp', 'Valores para nível totalizado não inicializados:', nodePai.id); // #!!!!!
          break;
        }
        if (valMeses != null)
          sumValMeses(nodePai.nodeContent.valMeses, valMeses);
        if (valTotPlanejAnoAnt != null)
          nodePai.nodeContent.valTotPlanejAnoAnt = sumRound(nodePai.nodeContent.valTotPlanejAnoAnt, valTotPlanejAnoAnt);
        if (valTotRealAnoAnt != null)
          nodePai.nodeContent.valTotRealAnoAnt = sumRound(nodePai.nodeContent.valTotRealAnoAnt, valTotRealAnoAnt);
        idPaiSum = nodePai.idPai;
      }
    };
    const setValsInf = (valoresArray: ValoresPlanejadosDetalhes[]) => {
      valoresArray.forEach((valores) => {
        let nodeType: string;
        let keys: any[];
        const classeCustoDef = BinSearchItem(classeCustoArray, valores.classeCusto, 'classeCusto');
        //csd(valores.classeCusto, { classeCustoDef });
        if (classeCustoDef.origem == OrigemClasseCusto.totalImputada || classeCustoDef.origem == OrigemClasseCusto.totalCalculada) {
          nodeType = NodeType.detClasseCusto;
          keys = [valores.classeCusto, valores.idDetalhe || ''];
        }
        else {
          nodeType = NodeType.classeCusto;
          keys = [valores.classeCusto];
        }
        const id = HierNode.nodeId(nodeType, keys);
        const node = BinSearchItem(nodes, id, 'id');
        if (node == null) dbgError('setValsInf', `${id} não encontrada na hierarquia (setValsInf)`);
        else if (node.group) dbgError('setValsInf', `${id} está na hierarquia como um agrupamento`);
        else {
          node.nodeContent.valMeses = valores.valMeses;
          sumHierUp(nodes, node.idPai, valores.valMeses, null, null);
        }
      });
    };
    const setValTot = (valoresArray: ValoresTotCentroCustoClasseCusto[], tipo: 'planejAnt' | 'realAnt') => {
      valoresArray.forEach((valores) => {
        const nodeType = NodeType.classeCusto;
        const id = HierNode.nodeId(nodeType, [valores.classeCusto]);
        const node = BinSearchItem(nodes, id, 'id');
        if (node == null) dbgError('setValTot', `${id} não encontrada na hierarquia ${tipo}`);
        else {
          if (tipo === 'planejAnt') {
            node.nodeContent.valTotPlanejAnoAnt = valores.tot;
            sumHierUp(nodes, node.idPai, null, valores.tot, null);
          }
          else {
            node.nodeContent.valTotRealAnoAnt = valores.tot;
            sumHierUp(nodes, node.idPai, null, null, valores.tot);
          }
        }
      });
    };
    nodes.sort((a, b) => compareForBinSearch(a.id, b.id));
    setValsInf(valoresPlanejados);
    setValTot(valoresPlanejadosAnoAnt, 'planejAnt');
    setValTot(valoresRealizadosAnoAnt, 'realAnt');

    return nodes;
  };
  //#endregion

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    pageSelf = PageByVariant([pagesApp.inputValoresContas, pagesApp.quadroGeral], router);
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
    initialization()
      .then((result) => {
        if (!mount) return;
        const { procsCentrosCustoConfigAllYears, centroCustoArray, classeCustoRestritaArray, fatorCustoArray, classeCustoArray } = result;
        const anoCentroCustosArray: IAnoCentroCustos[] = [];
        procsCentrosCustoConfigAllYears.forEach((x) => {
          anoCentroCustosArray.push({
            ano: x.ano,
            centroCustoConfigOptions: x.centroCustoConfig.map((ccConfig) => ({ cod: ccConfig.centroCusto, descr: BinSearchProp(centroCustoArray, ccConfig.centroCusto, 'descr', 'cod'), ccConfig })),
          });
        });
        setMainStatesCache({ phase: Phase.ready, anoCentroCustosArray, classeCustoRestritaArray, fatorCustoArray, classeCustoArray });
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
      defaultValues: FrmDefaultValues(new FrmFilter(), { revisao: RevisaoValor.atual, centroCustoArray: [] }),
    });
    const ano = useWatchMy({ control: frmFilter.control, name: ValoresPlanejadosDetalhes.F.ano });
    const revisao = useWatchMy({ control: frmFilter.control, name: ValoresPlanejadosDetalhes.F.revisao });
    const centroCusto = useWatchMy({ control: frmFilter.control, name: ValoresPlanejadosDetalhes.F.centroCusto });
    const centroCustoArray = useWatchMy({ control: frmFilter.control, name: fldFrmExtra.centroCustoArray });

    const [mainStatesFilter, setMainStatesFilter] = React.useState<MainStatesFilter>({});
    //const [bgColorsHier] = React.useState(['#ce171f', '#999999', '#cccccc', '#eeeeee']);
    statesCompsSubord.setMainStatesFilter = setMainStatesFilter;
    //csl('renderFilter', mainStatesFilter);

    const bgColorsHier = cydagColors.colorsBackHier;

    const mountOptionsCC = (ano: string, initialization = false) => {
      let centroCustoOptions: CentroCustoConfigOption[] = [];
      let centroCustoUnique = null as string;
      let centroCustoSelected = null, centroCustosSelected: string[] = [];
      if (pageSelf.options.variant == quadroPage.variant.input)
        centroCustoSelected = frmFilter.getValues(ValoresPlanejadosDetalhes.F.centroCusto);
      else
        centroCustosSelected = frmFilter.getValues(fldFrmExtra.centroCustoArray);
      if (ano != null) {
        const anoCentroCustos = mainStates.anoCentroCustosArray.find((x) => x.ano == ano);
        centroCustoOptions = anoCentroCustos.centroCustoConfigOptions;
        if (anoCentroCustos.centroCustoConfigOptions.length == 1)
          centroCustoUnique = anoCentroCustos.centroCustoConfigOptions[0].cod;
      }
      setMainStatesFilter({ centroCustoOptions });
      if (centroCustoUnique != null) {
        if (pageSelf.options.variant == quadroPage.variant.input)
          frmFilter.setValue(ValoresPlanejadosDetalhes.F.centroCusto, centroCustoUnique);
        else
          frmFilter.setValue(fldFrmExtra.centroCustoArray, [centroCustoUnique]);
        initialization && getItens(frmFilter.getValues(), bgColorsHier);
      }
      else {
        if (pageSelf.options.variant == quadroPage.variant.input) {
          if (centroCustoSelected != null &&
            centroCustoOptions.findIndex((x) => x.cod === centroCustoSelected) !== -1)
            frmFilter.setValue(ValoresPlanejadosDetalhes.F.centroCusto, centroCustoSelected);
          else
            frmFilter.setValue(ValoresPlanejadosDetalhes.F.centroCusto, '');
        }
        else {
          if (centroCustosSelected.length === 1 &&
            centroCustoOptions.findIndex((x) => x.cod === centroCustosSelected[0]) !== -1)
            frmFilter.setValue(fldFrmExtra.centroCustoArray, [centroCustosSelected[0]]);
          else
            frmFilter.setValue(fldFrmExtra.centroCustoArray, []);
        }
      }
    };

    React.useEffect(() => {
      const ano = mainStates.anoCentroCustosArray.length != 0 ? mainStates.anoCentroCustosArray[0].ano : '';
      frmFilter.setValue(ValoresPlanejadosDetalhes.F.ano, ano);
      mountOptionsCC(ano, true);
    }, []);

    const getItensSubmit = async (dataForm: FrmFilter) => {
      const filter = NormalizePropsString(dataForm);
      if (filter.ano == null) return PopupMsg.error('Informe o Ano.');
      if (pageSelf.options.variant == quadroPage.variant.input) {
        if (filter.centroCusto == null) return PopupMsg.error('Informe o Centro de Custo.');
      }
      else {
        if (filter.centroCustoArray.length === 0) return PopupMsg.error('Informe algum Centro de Custo.');
      }
      getItens(filter, bgColorsHier);
    };

    const centroCustoOptions = mainStatesFilter.centroCustoOptions == null ? null : mainStatesFilter.centroCustoOptions.map((x) => new SelOption(x.cod, x.descr));
    return (
      <form onSubmit={frmFilter.handleSubmit(getItensSubmit)}>
        <Stack direction='row' alignItems='center' gap={1}>
          {/* <SelectMy width='80px'
            value={ano || ''}
            onChange={
              (ev) => {
                frmFilter.setValue(ValoresPlanejados.F.ano, ev.target.value);
                mountOptionsCC(ev.target.value);
              }
            }
            displayEmpty
            placeHolder='Ano'
            options={[new SelOption('Ano', 'Ano', true), ...mainStates.anoCentroCustosArray.map((x) => new SelOption(x.ano, x.ano))]}
          /> */}
          <SelAno value={ano} onChange={(newValue) => { frmFilter.setValue(ValoresPlanejadosDetalhes.F.ano, newValue || ''); mountOptionsCC(newValue); }}
            options={mainStates.anoCentroCustosArray.map((x) => new SelOption(x.ano, x.ano))}
          />
          <SelRevisao value={revisao} onChange={(newValue: RevisaoValor) => frmFilter.setValue(ValoresPlanejadosDetalhes.F.revisao, newValue)} />
          {centroCustoOptions != null &&
            <>
              {pageSelf.options.variant === quadroPage.variant.input
                ? <SelEntity value={centroCusto} onChange={(newValue: string) => frmFilter.setValue(ValoresPlanejadosDetalhes.F.centroCusto, newValue || '')}
                  options={centroCustoOptions} name={CentroCusto.Name} withCod width='550px' disableClearable />
                : <>
                  <SelEntity value={centroCustoArray} onChange={(newValue: string[]) => frmFilter.setValue(fldFrmExtra.centroCustoArray, newValue)}
                    multiple limitTags={1}
                    options={centroCustoOptions} name={CentroCusto.Name} withCod width='550px' />
                  <FakeLink onClick={() => frmFilter.setValue(fldFrmExtra.centroCustoArray, centroCustoOptions.map((x) => x.cod))}>(Sel. Todos)</FakeLink>
                </>
              }
            </>
          }

          {/* <Box>Cores:</Box>
          <FrmInput width='85px' placeholder='header' value={bgcolors[0]} onChange={(ev) => { bgcolors[0] = ev.target.value; setBgcolors([...bgcolors]); }} />
          <FrmInput width='85px' placeholder='niv1' value={bgcolors[1]} onChange={(ev) => { bgcolors[1] = ev.target.value; setBgcolors([...bgcolors]); }} />
          <FrmInput width='85px' placeholder='niv2' value={bgcolors[2]} onChange={(ev) => { bgcolors[2] = ev.target.value; setBgcolors([...bgcolors]); }} />
          <FrmInput width='85px' placeholder='niv3' value={bgcolors[3]} onChange={(ev) => { bgcolors[3] = ev.target.value; setBgcolors([...bgcolors]); }} /> */}
          <IconButtonAppSearch />
        </Stack>
      </form>
    );
  };

  const DataComp = () => {
    const [mainStatesData1, setMainStatesData1] = React.useState<MainStatesData1>({});
    const [mainStatesData2, setMainStatesData2] = React.useState<MainStatesData2>({});
    const [, setBgColorsHier] = React.useState([]);
    statesCompsSubord.setMainStatesData1 = setMainStatesData1;
    statesCompsSubord.setMainStatesData2 = setMainStatesData2;
    statesCompsSubord.setBgColorsHier = setBgColorsHier;
    //csl('renderData', mainStatesData1, mainStatesData2);

    const globalCtrl = React.useContext(GlobalCtrlContext);

    React.useEffect(() => {
      globalCtrl.reset();
    }, [mainStatesData1.filterApplied]);

    if (mainStatesData1.filterApplied == null || mainStatesData2.dataStructure == null) return <></>;
    const dataStructure = mainStatesData2.dataStructure;
    if (dataStructure.loading) return <WaitingObs text='carregando' />;

    //#region níveis acima e outros contextos
    const adustHierUp = (node: HierNode<NodeContent>, deltas: ISxMesVal[]) => {
      let idPaiSum = node.idPai;
      while (idPaiSum != null) {
        const nodePai = BinSearchItem(dataStructure.nodes, idPaiSum, 'id');
        if (nodePai == null) {
          dbgError('adustHierUp', `nodePai ${idPaiSum} não encontrada na hierarquia (2)`);
          break;
        }
        if (nodePai.stateForceRefreshTot == null) {
          dbgError('adustHierUp', `nodePai ${idPaiSum} sem stateForceRefreshTot`);
          break;
        }
        deltas.forEach(x => { nodePai.nodeContent.valMeses[x.sxMes] = RoundDecs(nodePai.nodeContent.valMeses[x.sxMes] + x.val, configCydag.decimalsValsCalc); });
        nodePai.stateForceRefreshTot({});
        idPaiSum = nodePai.idPai;
      }
    };
    //#endregion   

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
      const anoAbrev = dataStructure.processoOrcamentario.ano.substring(2, 4);
      const anoAntAbrev = anoAdd(dataStructure.processoOrcamentario.ano, -1).substring(2, 4);
      return (
        <>
          <GridCell sticky {...propsColorsHdr}>
            <Stack direction='row' alignItems='center' gap={3}>
              <Box>Conta</Box>
              <SwitchMy size='small' label={<Box sx={{ color: propsColorsHdr.color, fontSize: 'small' }}>código</Box>} checked={showConta}
                onChange={(ev) => { setShowConta(ev.target.checked); statesCompsSubord.setShowConta(ev.target.checked); }} />
            </Stack>
          </GridCell>
          {mesesHdr.map((mes, index) =>
            <GridCell key={index} sticky textAlign='right' {...propsColorsHdr}>
              <Box>{mes}</Box>
            </GridCell>
          )}
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Orç.{anoAbrev}</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Orç.{anoAntAbrev}</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Real.{anoAntAbrev}</Box></GridCell>
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

      if (node.nodeContent.valMeses == null)
        node.nodeContent.valMeses = genValMeses(null);

      if (node.group && !node.nodesFilhoLoad) {
        node.nodesFilho = dataStructure.nodes.filter(x => x.idPai == node.id).sort((x, y) => compareForBinSearch(x.sortKey, y.sortKey));
        node.nodesFilhoLoad = true;
      }

      //const globalCtrl = React.useContext(GlobalCtrlContext);

      const LineEditComp = ({ level }: { level: number }) => {
        //const { personalizationAttrs } = usePersonalization();

        if (node.nodeContent.valMesesStr == null)
          node.nodeContent.valMesesStr = node.nodeContent.valMeses.map((x) => amountToStr(x, configCydag.decimalsValsInput));
        const [, forceRefresh] = React.useState<any>({});
        const changeValMes = (sxMes: number, valStr) => {
          try {
            amountParse(valStr, configCydag.decimalsValsInput);
            globalCtrl.logTouchedCells(node.id, node.nodeContent.descrAcum, valMesFld(sxMes), false);
          }
          catch (error) {
            globalCtrl.logTouchedCells(node.id, node.nodeContent.descrAcum, valMesFld(sxMes), true);
          }
          if (node.nodeType == 'detClasseCusto')
            chgDescr();
          //csl('chg', { sxMes, newValStr, newVal}, fldsTouch[fldTouch] );
          node.nodeContent.valMesesStr[sxMes] = valStr;
          forceRefresh({});
        };
        const blurValMes = (sxMes: number, valStr) => {
          try {
            const val = amountParse(valStr, configCydag.decimalsValsInput);
            //if (!isNaN(val)) {
            chgValMeses('setMes', sxMes, val);
            atuValsEdit([{ sxMes, val }]);
            //}
          }
          catch (error) {
          }
        };

        const isDescrInvalid = (val) => {
          return val.trim().length < 5;
        };
        const changeDescr = (val) => {
          globalCtrl.logTouchedCells(node.id, node.nodeContent.descrAcum, 'descr', isDescrInvalid(val));
          node.nodeContent.descr = val;
          forceRefresh({});
          chgDescr();
          //globalCtrl.setChangedLineVals(node.nodeContent.key, node.nodeContent.valMeses);
        };

        const atuValsEdit = (alts: ISxMesVal[]) => {
          alts.forEach((x) => {
            node.nodeContent.valMesesStr[x.sxMes] = amountToStr(x.val, configCydag.decimalsValsInput);
            globalCtrl.logTouchedCells(node.id, node.nodeContent.descrAcum, valMesFld(x.sxMes), false);
          });
          forceRefresh({});
        };

        const valTotAno = mesesFld.reduce((prev, _, sxMes) => node.nodeContent.valMeses[sxMes] != null ? prev + node.nodeContent.valMeses[sxMes] : prev, 0);

        const chgValMeses = (cmd: 'clear' | 'repeat' | 'setMes', sxMesChange?: number, valueChanged?: number) => {
          //csl('chgRow', cmd);

          // const setChangedLines = (type: LineChangeable, key: string, newVals: ISxMesVal[]) => {
          //   // let sxClasseCusto = changedLines.findIndex((item) => item.type === type && item.key === key);
          //   // if (sxClasseCusto == -1) {
          //   //   changedLines.push({ type, key, valMeses: new Array(meses.length).fill(undefined) });
          //   //   sxClasseCusto = changedLines.length - 1;
          //   // }
          //   // newVals.forEach((x) => { changedLines[sxClasseCusto].valMeses[x.sxMes] = x.newVal; });
          //   // globalCtrl.setChangedLine(type,key, newVals);
          //   globalCtrl.setChangedLine(type, key, newVals);
          // };
          const deltaMes = (sxMes: number, val: number) => {
            return (val || 0) - (node.nodeContent.valMeses[sxMes] || 0);
          };

          const deltas: ISxMesVal[] = [];
          const newVals: ISxMesVal[] = [];
          if (cmd == 'clear') {
            mesesFld.forEach((_, sxMes) => {
              const val = null;
              if (node.nodeContent.valMeses[sxMes] != val) {
                const delta = deltaMes(sxMes, val);
                deltas.push({ sxMes, val: delta });
                node.nodeContent.valMeses[sxMes] = val;
                newVals.push({ sxMes, val });
              }
            });
          }
          else if (cmd == 'repeat') {
            let lastValue = null;
            mesesFld.forEach((_, sxMes) => {
              if (node.nodeContent.valMeses[sxMes] != null)
                lastValue = node.nodeContent.valMeses[sxMes];
              else {
                if (lastValue != null &&
                  node.nodeContent.valMeses[sxMes] != lastValue) { // #!!!!!!!
                  const val = lastValue;
                  const delta = deltaMes(sxMes, val);
                  deltas.push({ sxMes, val: delta });
                  node.nodeContent.valMeses[sxMes] = val;
                  newVals.push({ sxMes, val });
                }
              }
            });
          }
          else if (cmd == 'setMes') {
            const sxMes = sxMesChange;
            const val = valueChanged;
            if (node.nodeContent.valMeses[sxMes] != val) {
              const delta = deltaMes(sxMes, val);
              deltas.push({ sxMes, val: delta });
              node.nodeContent.valMeses[sxMes] = val;
              newVals.push({ sxMes, val });
            }
          }
          // else if (cmd == 'addMes') {
          //   const sxMes = sxMesChange;
          //   const val = (node.nodeContent.valMeses[sxMes] || 0) + valueChanged;
          //   const delta = deltaMes(sxMes, val);
          //   deltas.push({ sxMes, val: delta });
          //   node.nodeContent.valMeses[sxMes] = val;
          //   newVals.push({ sxMes, val });
          // }
          if (deltas.length != 0) {
            atuValsEdit(newVals);
            adustHierUp(node, deltas);
            globalCtrl.setChangedLineVals(node.id, node.nodeContent.keyDb, node.nodeContent.valMeses);
          }
        };

        const chgDescr = () => {
          globalCtrl.setChangedLineDescr(node.id, node.nodeContent.keyDb, node.nodeContent.descr);
        };

        const handleKeyDownInput = (id, sxMes, ev) => {
          if (ev.keyCode === 27) {
            ev.preventDefault();
            atuValsEdit([{ sxMes, val: node.nodeContent.valMeses[sxMes] }]);
          }
          else if (ev.keyCode === 13) {
            ev.preventDefault();
            blurValMes(sxMes, node.nodeContent.valMesesStr[sxMes]);
          }
        };

        const descrUse =
          <Stack direction='row' alignItems='center' gap={1}>
            <IconButtonAppCrud icon='clear' onClick={() => chgValMeses('clear')} fontSize={fontSizeIconsInGrid} />
            <IconButtonAppCrud icon='redo' onClick={() => chgValMeses('repeat')} fontSize={fontSizeIconsInGrid} />
            {node.nodeType == 'detClasseCusto'
              ? <Input value={node.nodeContent.descr}
                error={globalCtrl.cellError(node.id, 'descr')}
                onChange={(ev) => changeDescr(ev.target.value)}
                inputProps={{ style: { padding: 0, fontSize: fontSizeGrid } }}
                fullWidth
              />
              : <>{node.nodeContent.descrComp(node.nodeType === NodeType.classeCusto)}</>
            }
            {/* <FakeLink onClick={() => chgVals('setMes', 1, 150)}>fev=150</FakeLink>
          <FakeLink onClick={() => chgVals('addMes', 1, 200)}>fev+200</FakeLink> */}
          </Stack>;

        const paddingLeft = 0.8 * (node.nodeType == 'detClasseCusto' ? level - 1 : level);
        const propsColorDescr = node.nodeType == 'detClasseCusto' ? propsColorByTotLevel(themePlus, level) : {};

        return (<>
          <GridCell {...propsColorDescr}><Box pl={paddingLeft}>{descrUse}</Box></GridCell>
          {mesesFld.map((_, sxMes) =>
            <GridCell key={sxMes} textAlign='right'>
              <Input value={node.nodeContent.valMesesStr[sxMes]}
                error={globalCtrl.cellError(node.id, valMesFld(sxMes))}
                onChange={(ev) => changeValMes(sxMes, ev.target.value)}
                onBlur={(ev) => blurValMes(sxMes, ev.target.value)}
                inputProps={{ style: { padding: 0, textAlign: 'right', fontSize: fontSizeGrid } }}
                onKeyDown={(ev) => handleKeyDownInput(node.id, sxMes, ev)}
              />
              {/* <Box>
              {node.nodeContent.valMesesEdit[sxMes]}
            </Box> */}
            </GridCell>
          )}
          <GridCell textAlign='right'>{amountToStr(valTotAno, configCydag.decimalsValsInput)}</GridCell>
          <GridCell textAlign='right'>{amountToStr(node.nodeContent.valTotPlanejAnoAnt, configCydag.decimalsValsInput)}</GridCell>
          <GridCell textAlign='right'>{amountToStr(node.nodeContent.valTotRealAnoAnt, configCydag.decimalsValsInput)}</GridCell>
        </>);
      };

      const LineShowComp = ({ level, stateOpen, setStateOpen, forceRefreshUpp }: { level: number, stateOpen?: boolean, setStateOpen?: any, forceRefreshUpp?: any }) => {
        //csl(`render LinVals ${node.id}`);
        const [, forceRefresh] = React.useState({});

        React.useEffect(() => {
          if (node.group) node.stateForceRefreshTot = forceRefresh;
        }, []);
        const valorTotAno = mesesFld.reduce((prev, _, sxMes) => node.nodeContent.valMeses[sxMes] != null ? prev + node.nodeContent.valMeses[sxMes] : prev, 0);


        // aqui tá muito lento qdo tem muitos itens - criar uma área de reserva para inclusões e dar refresh apenas nessa área @!!!!!
        const newDetClasseCusto = () => {
          const nodeDetIns = nodeDetalheClasseCusto(node.nodeContent.descr, node.nodeContent.keyDb.classeCusto, FormatDate(new Date(), 'yyyyMMdd-HHmmssS'), '', true);
          //csl({ nodeDetIns });
          globalCtrl.logTouchedCells(nodeDetIns.id, node.nodeContent.descrAcum, 'descr', true);
          node.nodesFilho.push(nodeDetIns);
          setStateOpen(true);
          forceRefreshUpp({});
        };

        const descrUse =
          <Stack direction='row' alignItems='center' gap={1}>
            {(node.group && node.nodeType == NodeType.classeCusto && node.nodeContent.editable && dataStructure.canEdit) &&
              <IconButtonMy padding={0} onClick={() => newDetClasseCusto()}>
                <IconApp icon='create' fontSize={fontSizeIconsInGrid} />
              </IconButtonMy>
            }
            {node.group
              ? <Stack direction='row' alignItems='center' gap={1} sx={{ cursor: 'pointer' }} onClick={() => setStateOpen(!stateOpen)}>
                <IconApp icon={stateOpen ? 'colapse' : 'expand'} fontSize={fontSizeIconsInGrid} />
                {node.nodeContent.descrComp(node.nodeType === NodeType.classeCusto)}
              </Stack>
              : <Box>
                {node.nodeContent.descrComp(node.nodeType === NodeType.classeCusto)}
              </Box>
            }
          </Stack>;

        const paddingLeft = 0.8 * (node.nodeType == 'detClasseCusto' ? level - 1 : level);
        const propsColorLevel = node.group ? propsColorByTotLevel(themePlus, level + 1) : {};
        const propsColorDescr = node.nodeType == 'detClasseCusto' ? propsColorByTotLevel(themePlus, level) : propsColorLevel;
        return (<>
          <GridCell {...propsColorDescr}><Box pl={paddingLeft}>{descrUse}</Box></GridCell>
          {mesesFld.map((_, index) => <GridCell key={index} textAlign='right' {...propsColorLevel}>{amountToStr(node.nodeContent.valMeses[index], configCydag.decimalsValsInput)}</GridCell>)}
          <GridCell textAlign='right' {...propsColorLevel}>{amountToStr(valorTotAno, configCydag.decimalsValsInput)}</GridCell>
          <GridCell textAlign='right' {...propsColorLevel}>{amountToStr(node.nodeContent.valTotPlanejAnoAnt, configCydag.decimalsValsInput)}</GridCell>
          <GridCell textAlign='right' {...propsColorLevel}>{amountToStr(node.nodeContent.valTotRealAnoAnt, configCydag.decimalsValsInput)}</GridCell>
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
              {node.nodeContent.editable
                ? <LineEditComp level={level} />
                : <LineShowComp level={level} />
              }
            </>
          }
        </>
      );
    };

    const salvar = (globalCtrl: GlobalEditCtrl) => {
      const cellError = globalCtrl.touchedCells.find((x) => x.valueError);
      if (cellError != null)
        return PopupMsg.error(`Favor corrigir os campos sinalizados com erro: linha ${cellError.descrLine}`);
      //csl({ globalCtrl, camposInválidos });
      // if (mainStates.filter.ano != frmFilter.getValues('ano') ||
      //   mainStates.filter.centroCusto != frmFilter.getValues(ValoresPlanejados.F.centroCusto)) {
      //   PopupMsg.error(`Os dados apresentados (${mainStates.filter.ano}/${mainStates.filter.centroCusto}) não se referem ao filtro atual`);
      //   return;
      // }
      const changedLinesToSend = globalCtrl.changedLinesCtrl
        .map((x) => x.changedLine);
      if (changedLinesToSend.length == 0)
        return PopupMsg.error('Nada a salvar.');
      //csl(globalCtrl.changedLines);
      setItens(mainStatesData1.filterApplied, changedLinesToSend);
    };

    const Botoes = () => {
      const globalCtrl = React.useContext(GlobalCtrlContext);
      // return (
      //   <Box display flex flexDirection='row' gap={1}>
      //     <Button variant='contained' onClick={() => generateHier(1)}>Refresh1</Button>
      //     <Button variant='contained' onClick={() => generateHier(3)}>Refresh3x</Button>
      //     <Button variant='contained' onClick={() => generateHier(150)}>Refresh150x</Button>
      //     <Button variant='contained' onClick={() => save(globalCtrl)}>Valores alterados</Button>
      //   </Box>
      // );
      return (
        <BtnLine>
          <Btn onClick={() => salvar(globalCtrl)}>Salvar</Btn>
        </BtnLine>
      );
    };

    return (
      <>
        <InfoComp />

        <Box display='grid' gap={0.2} flex={1} overflow='auto'
          // gridTemplateColumns={`minmax(200px,1fr) repeat(${mesesFld.length + 3}, 62px)`}
          gridTemplateColumns={`minmax(120px,3fr) repeat(${mesesFld.length + 3}, 1fr)`}
          //gridTemplateColumns={`2fr repeat(${meses.length + 1}, minmax(1fr,150px))`}
          // gridTemplateRows='80px'
          gridAutoRows='auto' gridAutoColumns='auto'
          justifyItems='stretch' alignItems='stretch'
          justifyContent='start' alignContent='start'
          fontSize={fontSizeGrid}
        >
          <HeaderComp />

          {/* <GridCell columnSpan={meses.length + 2} align='center'>toda a linha centralizada  xxxxxxxxxxxx xxxxxxxxxxxx xxxxxxxxxxxx xxxxxxxxxxxx xxxxxxxxxxxx </GridCell> */}

          {dataStructure.nodes.filter((node) => node.idPai == null).map((node, index) =>
            <ValoresNodeComp key={index} node={node} level={0} />
          )}
        </Box>

        {dataStructure.canEdit &&
          <Botoes />
        }
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
    <GlobalCtrlContext.Provider value={new GlobalEditCtrl()}>
      <Stack gap={1} height='100%'>
        <FilterComp />
        <DataComp />
      </Stack>
      <LocalCssComp />
    </GlobalCtrlContext.Provider>
  );
}