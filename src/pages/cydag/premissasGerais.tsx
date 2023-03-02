import React from 'react';
import { useRouter } from 'next/router';
import _ from 'underscore';

import Box from '@mui/material/Box';
import { Input, Stack, useTheme } from '@mui/material';

import { BinSearchItem, CalcExecTime, compareForBinSearch, ErrorPlus, ForceWait, ObjUpdAllProps } from '../../libCommon/util';
import { csd, dbgError } from '../../libCommon/dbg';
import { IGenericObject } from '../../libCommon/types';
import { BooleanToSN } from '../../libCommon/util';
import { PageDef } from '../../libCommon/endPoints';
import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { globals } from '../../libClient/clientGlobals';
import { cssTextNoWrapEllipsis } from '../../libClient/util';

import { AbortProc, Btn, BtnLine, SelOption, PopupMsg, WaitingObs, SnackBarError, SwitchMy, fontSizeGrid, fontSizeIconsInGrid } from '../../components';
import { HierNode } from '../../components/hier';
import { GridCell } from '../../components/grid';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../hooks/useMyForm';
//import { GlobalState, useGlobalState } from '../../hooks/useGlobalState';

import { IconApp, IconButtonAppCrud, IconButtonAppSearch, propsColorHeader, propsColorByTotLevel, SelRevisao, SelEntity, SelAno } from '../../appCydag/components';
import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { mesesFld, mesesHdr, genValMeses, amountToStr, amountParse } from '../../appCydag/util';
import { configApp } from '../../appCydag/config';
import { OperInProcessoOrcamentario, ProcessoOrcamentarioStatusMd, RevisaoValor, TipoColaboradorMd, TipoSegmCentroCusto } from '../../appCydag/types';
import { AgrupPremissas, Empresa, Premissa, ProcessoOrcamentario, ValoresPremissa, empresaCoringa, agrupPremissasCoringa } from '../../appCydag/modelTypes';
import { CmdApi_PremissaGeral as CmdApi, IChangedLine } from '../api/appCydag/premissasGerais/types';

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
  setChangedLine(idLine: string, key: IGenericObject, ativa: boolean, valMeses: number[]) {
    let sxChangedLine = this.changedLinesCtrl.findIndex((item) => item.idLine === idLine);
    if (sxChangedLine == -1) {
      this.changedLinesCtrl.push({ idLine, changedLine: { key, ativa: undefined, valMeses: new Array(mesesFld.length).fill(undefined) } });
      sxChangedLine = this.changedLinesCtrl.length - 1;
    }
    this.changedLinesCtrl[sxChangedLine].changedLine.ativa = ativa;
    this.changedLinesCtrl[sxChangedLine].changedLine.valMeses = valMeses;
  }
  cellError(id: string, fld: string) { // #!!!!!!! usar o novo protocolo (terceirosCrud, valoresLocalidade)
    const touchedCell = this.touchedCells.find((x) => x.idLine === id && x.fld === fld);
    return touchedCell == null ? false : touchedCell.valueError;
  }
}
export const GlobalCtrlContext = React.createContext<GlobalEditCtrl>(null);

class NodeContent {
  cod: string;
  descr: string;
  editable: boolean;
  keyDb: IGenericObject;  // key para atualização no db
  descrNodesUpp: string;
  decimais?: number;
  ativa: boolean;
  valMeses: number[];
  valMesesStr?: string[];
  constructor(keyDb: IGenericObject, cod: string, descr: string, descrNodesUpp: string, editable: boolean, decimais?: number) { // , ativa?: boolean, valMeses?: number[]
    this.keyDb = keyDb;
    this.cod = cod;
    this.descr = descr;
    this.descrNodesUpp = descrNodesUpp;
    this.editable = editable;
    this.decimais = decimais;
    this.ativa = false;
    this.valMeses = undefined;
  }
  get descrAcum() { // todos os níveis de hierarquia (para melhor msg se houver algum erro ao gravar)
    return this.descrNodesUpp == null ? this.descr : `${this.descrNodesUpp} - ${this.descr}`;
  }
}

class FrmFilter {
  ano: string;
  revisao: RevisaoValor;
  agrupPremissas: string;
  empresa: string;
}

let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync<any>(apisApp.premissasGerais.apiPath, globals.windowId, parm) };
const pageSelf = pagesApp.premissasGerais;
const statesCompsSubord = { setMainStatesData1: null, setMainStatesData2: null, setMainStatesCss: null };

export default function PagePremissasGerais() {
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    processoOrcamentarioArray?: ProcessoOrcamentario[]; premissaArray?: Premissa[]; agrupPremissasArray?: AgrupPremissas[]; empresaArray?: Empresa[];
  }
  interface MainStatesData1 {
    filterApplied?: FrmFilter;
  }
  interface MainStatesData2 {
    dataStructure?: {
      loading: boolean;
      headerInfo?: string; canEdit?: boolean;
      processoOrcamentario?: ProcessoOrcamentario;
      nodes?: HierNode<NodeContent>[];
    };
  }
  // interface MainStatesCss {
  //   setNodeIds?: any;
  //   setSomeId?: any;
  // }

  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  const themePlus = useTheme();

  //#region db access
  const initialization = async () => {
    const apiReturn = await apis.crud({ cmd: CmdApi.initialization });
    const processoOrcamentarioArray = (apiReturn.value.processoOrcamentarioArray as IGenericObject[]).map((data) => ProcessoOrcamentario.deserialize(data));
    const premissaArray = (apiReturn.value.premissaArray as IGenericObject[]).map((data) => Premissa.deserialize(data));
    const agrupPremissasArray = (apiReturn.value.agrupPremissasArray as IGenericObject[]).map((data) => AgrupPremissas.deserialize(data));
    const empresaArray = (apiReturn.value.empresaArray as IGenericObject[]).map((data) => Empresa.deserialize(data));
    return { processoOrcamentarioArray, premissaArray, agrupPremissasArray, empresaArray };
  };
  const getItens = async (filter: FrmFilter) => {
    try {
      const calcExecTimeSearch = new CalcExecTime();
      statesCompsSubord.setMainStatesData2({ dataStructure: { loading: true } });
      statesCompsSubord.setMainStatesData1({ filterApplied: { ...filter } });
      //setMainStatesCache({ phase: Phase.editing });
      const apiReturn = await apis.crud({ cmd: CmdApi.valoresGet, filter });
      const processoOrcamentario = ProcessoOrcamentario.deserialize(apiReturn.value.processoOrcamentario);
      const valoresPremissa = (apiReturn.value.valoresPremissa as IGenericObject[]).map((data) => ValoresPremissa.deserialize(data));

      let canEdit = false;
      if (filter.revisao === RevisaoValor.atual &&
        ProcessoOrcamentarioStatusMd.blockOper(OperInProcessoOrcamentario.altPremissas, processoOrcamentario.status) == null)
        canEdit = true;

      const nodes = generateHierNodes(filter, canEdit, valoresPremissa);
      const cssNodesId = nodes.filter(x => x.group).map(x => ({ id: x.id, open: x.stateOpen }));

      if (!mount) return;
      await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs);
      statesCompsSubord.setMainStatesCss.setNodeIds(cssNodesId); // #!!!!!! usar classes
      statesCompsSubord.setMainStatesData2({
        dataStructure: {
          loading: false,
          processoOrcamentario,
          headerInfo: null, canEdit,
          nodes,
        }
      });
    } catch (error) {
      SnackBarError(error, `${pageSelf.pagePath}-getItens`);
    }
  };
  const setItens = async (filter: FrmFilter, changedLines: IChangedLine[]) => {
    try {
      await apis.crud({ cmd: CmdApi.valoresSet, filter: _.pick(filter, [ValoresPremissa.F.ano, ValoresPremissa.F.revisao]), data: { changedLines } });
      PopupMsg.success(`Valores gravados para ${filter.ano}.`);
    } catch (error) {
      SnackBarError(error, `${pageSelf.pagePath}-setItens`);
    }
  };
  //#endregion

  //#region hierarquia
  const generateHierNodes = (filter: FrmFilter, editableGlobal: boolean, valoresPremissa: ValoresPremissa[]) => {
    const nodes: HierNode<NodeContent>[] = [];

    const premissaArray = mainStates.premissaArray.filter((x) => x.anoIni <= filter.ano && x.anoFim >= filter.ano);
    const agrupPremissasArray = [new AgrupPremissas().Fill(agrupPremissasCoringa), ...mainStates.agrupPremissasArray];
    const empresaArray = [new Empresa().Fill(empresaCoringa), ...mainStates.empresaArray];

    // if (filter.empresa == null &&
    //   filter.agrupPremissas == null)
    // premissaArray.filter((x) => x.tipoSegmCentroCusto == TipoSegmCentroCusto.nenhum && !x.segmTipoClb).forEach((premissa) => {
    //   nodes.push(
    //     new HierNode('premissa', [premissa.cod], null, null, false, `0-${String(premissa.seqApresent).padStart(4, '0')}`, new NodeContent({ premissa: premissa.cod }, premissa.cod, `${premissa.descr} (${premissa.obsValor})`, editableGlobal, premissa.decimais))
    //   );
    // });

    const premissasPorAgrupPremissasAll = premissaArray.filter((x) => x.tipoSegmCentroCusto == TipoSegmCentroCusto.agrupPremissas);
    if (premissasPorAgrupPremissasAll.length > 0) {

      const premissasPorAgrupPremissasNormal = premissasPorAgrupPremissasAll.filter((premissa) => !premissa.segmTipoClb);
      const premissasPorAgrupPremissasTipoClb = premissasPorAgrupPremissasAll.filter((premissa) => premissa.segmTipoClb);

      agrupPremissasArray.filter((x) => x.cod == filter.agrupPremissas).forEach((agrupPremissas) => {
        nodes.push(
          new HierNode<NodeContent>('agrupPremissas', [agrupPremissas.cod], null, null, true, `2-${agrupPremissas.cod}`, new NodeContent(null, agrupPremissas.cod, `Agrupamento de Premissas: ${agrupPremissas.descr}`, null, false), true)
        );
        if (premissasPorAgrupPremissasNormal.length > 0) {
          nodes.push(
            new HierNode<NodeContent>('agrupPremissas-normais', [agrupPremissas.cod], 'agrupPremissas', [agrupPremissas.cod], true, '1-', new NodeContent(null, null, 'Premissas gerais (todos tipos de colaborador)', null, false))
          );
          premissasPorAgrupPremissasNormal.forEach((premissa) => {
            const descrNodesUpp = 'Agrupamento de Premissas - Premissas Gerais';
            nodes.push(
              new HierNode<NodeContent>('premissa-agrupPremissas', [premissa.cod, agrupPremissas.cod], 'agrupPremissas-normais', [agrupPremissas.cod], false, `0-${String(premissa.seqApresent).padStart(4, '0')}`, new NodeContent({ premissa: premissa.cod, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false, agrupPremissas: agrupPremissas.cod }, premissa.cod, `${premissa.descr} (${premissa.obsValor})`, descrNodesUpp, editableGlobal, premissa.decimais))
            );
          });
        }

        premissasPorAgrupPremissasTipoClb.forEach((premissa) => {
          nodes.push(
            new HierNode<NodeContent>('agrupPremissas-premissa', [agrupPremissas.cod, premissa.cod], 'agrupPremissas', [agrupPremissas.cod], true, `2-${String(premissa.seqApresent).padStart(4, '0')}`, new NodeContent(null, premissa.cod, `${premissa.descr} (${premissa.obsValor})`, null, false))
          );
          TipoColaboradorMd.all.forEach((tipoColaborador) => {
            const descrNodesUpp = `Agrupamento de Premissas - ${premissa.descr}`;
            nodes.push(
              new HierNode<NodeContent>('premissa-agrupPremissas-tipoColaborador', [premissa.cod, agrupPremissas.cod, tipoColaborador.cod], 'agrupPremissas-premissa', [agrupPremissas.cod, premissa.cod], false, tipoColaborador.cod, new NodeContent({ premissa: premissa.cod, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrupPremissas.cod, tipoColaborador: tipoColaborador.cod }, tipoColaborador.cod, tipoColaborador.descr, descrNodesUpp, editableGlobal, premissa.decimais))
            );
          });
        });
      });
    }

    const premissasPorEmpresaAll = premissaArray.filter((x) => x.tipoSegmCentroCusto == TipoSegmCentroCusto.empresa);
    if (premissasPorEmpresaAll.length > 0) {
      // nodes.push(
      //   new HierNode('empresa-all', null, null, null, true, '1-', new NodeContent(null, null, 'Empresas', false))
      // );

      const premissasPorEmpresaNormal = premissasPorEmpresaAll.filter((premissa) => !premissa.segmTipoClb);
      const premissasPorEmpresaTipoClb = premissasPorEmpresaAll.filter((premissa) => premissa.segmTipoClb);

      empresaArray.filter((x) => x.cod == filter.empresa).forEach((empresa) => {
        nodes.push(
          new HierNode<NodeContent>('empresa', [empresa.cod], null, null, true, `1-${empresa.cod}`, new NodeContent(null, empresa.cod, `Empresa: ${empresa.descr}`, null, false), true)
        );
        if (premissasPorEmpresaNormal.length > 0) {
          nodes.push(
            new HierNode<NodeContent>('empresa-normais', [empresa.cod], 'empresa', [empresa.cod], true, '1-', new NodeContent(null, null, 'Premissas gerais (todos tipos de colaborador)', null, false))
          );
          premissasPorEmpresaNormal.forEach((premissa) => {
            const descrNodesUpp = 'Empresa - Premissas Gerais';
            nodes.push(
              new HierNode<NodeContent>('premissa-empresa', [premissa.cod, empresa.cod], 'empresa-normais', [empresa.cod], false, `0-${String(premissa.seqApresent).padStart(4, '0')}`, new NodeContent({ premissa: premissa.cod, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: false, empresa: empresa.cod }, premissa.cod, `${premissa.descr} (${premissa.obsValor})`, descrNodesUpp, editableGlobal, premissa.decimais))
            );
          });
        }

        premissasPorEmpresaTipoClb.forEach((premissa) => {
          nodes.push(
            new HierNode<NodeContent>('empresa-premissa', [empresa.cod, premissa.cod], 'empresa', [empresa.cod], true, `2-${String(premissa.seqApresent).padStart(4, '0')}`, new NodeContent(null, premissa.cod, `${premissa.descr} (${premissa.obsValor})`, null, false))
          );
          TipoColaboradorMd.all.forEach((tipoColaborador) => {
            const descrNodesUpp = `Empresa - ${premissa.descr}`;
            nodes.push(
              new HierNode<NodeContent>('premissa-empresa-tipoColaborador', [premissa.cod, empresa.cod, tipoColaborador.cod], 'empresa-premissa', [empresa.cod, premissa.cod], false, tipoColaborador.cod, new NodeContent({ premissa: premissa.cod, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empresa.cod, tipoColaborador: tipoColaborador.cod }, tipoColaborador.cod, tipoColaborador.descr, descrNodesUpp, editableGlobal, premissa.decimais))
            );
          });
        });
      });
    }

    nodes.sort((a, b) => compareForBinSearch(a.id, b.id));
    const setValsInf = (valoresArray: ValoresPremissa[]) => {
      valoresArray.forEach((valores) => {
        const premissa = mainStates.premissaArray.find((x) => x.cod == valores.premissa);
        if (premissa == null)
          dbgError(`premissa ${valores.premissa} não encontrada`);
        else {
          let nodeType = 'premissa';
          const keys = [valores.premissa];
          if (premissa.tipoSegmCentroCusto == TipoSegmCentroCusto.agrupPremissas) {
            nodeType += '-agrupPremissas';
            keys.push(valores.agrupPremissas);
          }
          else if (premissa.tipoSegmCentroCusto == TipoSegmCentroCusto.empresa) {
            nodeType += '-empresa';
            keys.push(valores.empresa);
          }
          if (premissa.segmTipoClb) {
            nodeType += '-tipoColaborador';
            keys.push(valores.tipoColaborador);
          }
          const id = HierNode.nodeId(nodeType, keys);
          const node = BinSearchItem(nodes, id, 'id');
          if (node == null) dbgError(`${id} não encontrada na hierarquia (setValsInf)`, valores);
          else if (node.group) dbgError(`${id} está na hierarquia como um agrupamento`);
          else {
            node.nodeContent.ativa = valores.ativa;
            node.nodeContent.valMeses = valores.valMeses;
          }
        }
      });
    };
    setValsInf(valoresPremissa);

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
        const { processoOrcamentarioArray, premissaArray, agrupPremissasArray, empresaArray } = result;
        setMainStatesCache({ phase: Phase.ready, processoOrcamentarioArray, premissaArray, agrupPremissasArray, empresaArray });
      })
      .catch((error) => {
        SnackBarError(error, `${pageSelf.pagePath}-initialization`);
      });
    return () => { mount = false; };
  }, []);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  if (mainStates.phase == Phase.initiating) return <WaitingObs />;

  const FilterComp = () => {
    const frmFilter = useFrm<FrmFilter>({
      defaultValues: FrmDefaultValues(new FrmFilter(), { revisao: RevisaoValor.atual, agrupPremissas: agrupPremissasCoringa.cod, empresa: empresaCoringa.cod }),
    });
    const ano = useWatchMy({ control: frmFilter.control, name: ValoresPremissa.F.ano });
    const revisao = useWatchMy({ control: frmFilter.control, name: ValoresPremissa.F.revisao });
    const agrupPremissas = useWatchMy({ control: frmFilter.control, name: ValoresPremissa.F.agrupPremissas });
    const empresa = useWatchMy({ control: frmFilter.control, name: ValoresPremissa.F.empresa });

    React.useEffect(() => {
      const ano = mainStates.processoOrcamentarioArray.length != 0 ? mainStates.processoOrcamentarioArray[0].ano : '';
      frmFilter.setValue(ValoresPremissa.F.ano, ano);
    }, []);

    const getItensSubmit = async (dataForm: FrmFilter) => {
      const filter = NormalizePropsString(dataForm);
      if (filter.ano == null) return PopupMsg.error('Informe o Ano.');
      if (filter.revisao == null) return PopupMsg.error('Informe a Revisão.');
      getItens(filter);
    };

    const agrupPremissasOptions = [new AgrupPremissas().Fill(agrupPremissasCoringa), ...mainStates.agrupPremissasArray].map((x) => new SelOption(x.cod, x.descr));
    const empresaOptions = [new Empresa().Fill(empresaCoringa), ...mainStates.empresaArray].map((x) => new SelOption(x.cod, x.descr));
    return (
      <form onSubmit={frmFilter.handleSubmit(getItensSubmit)}>
        <Stack direction='row' alignItems='center' gap={1}>
          {/* <SelectMy width='80px'
            value={ano || ''}
            onChange={(ev) => { frmFilter.setValue(ValoresPremissa.F.ano, ev.target.value); }}
            displayEmpty
            placeHolder='Ano'
            options={[new SelOption('Ano', 'Ano', true), ...mainStates.processoOrcamentarioArray.map((x) => new SelOption(x.ano, x.ano))]}
          /> */}
          <SelAno value={ano} onChange={(newValue) => frmFilter.setValue(ValoresPremissa.F.ano, newValue || '')}
            options={mainStates.processoOrcamentarioArray.map((x) => new SelOption(x.ano, x.ano))}
          />
          <SelRevisao value={revisao} onChange={(newValue: RevisaoValor) => frmFilter.setValue(ValoresPremissa.F.revisao, newValue)} />
          <SelEntity value={agrupPremissas} onChange={(newValue: string) => frmFilter.setValue(ValoresPremissa.F.agrupPremissas, newValue || '')}
            options={agrupPremissasOptions} name={AgrupPremissas.Name} disableClearable />
          <SelEntity value={empresa} onChange={(newValue: string) => frmFilter.setValue(ValoresPremissa.F.empresa, newValue || '')}
            options={empresaOptions} name={Empresa.Name} disableClearable />
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

    const globalCtrl = React.useContext(GlobalCtrlContext);

    React.useEffect(() => {
      globalCtrl.reset();
    }, [mainStatesData1.filterApplied]);

    if (mainStatesData1.filterApplied == null || mainStatesData2.dataStructure == null) return <></>;
    const dataStructure = mainStatesData2.dataStructure;
    if (dataStructure.loading) return <WaitingObs text='carregando' />;

    const InfoComp = () => {
      const comps = [];
      if (dataStructure.headerInfo != null)
        comps.push(`${dataStructure.headerInfo}`);
      if (comps.length > 0) return (<Box>{comps.join(' ')}</Box>);
      else return (<></>);
    };

    const propsColorsHdr = propsColorHeader(themePlus);
    const HeaderComp = () => {
      return (
        <>
          <GridCell sticky {...propsColorsHdr}><Box>Premissa</Box></GridCell>
          <GridCell sticky textAlign='center' {...propsColorsHdr}><Box>Ativa</Box></GridCell>
          {mesesHdr.map((mes, index) =>
            <GridCell key={index} sticky textAlign='right' {...propsColorsHdr}>
              <Box>{mes}</Box>
            </GridCell>
          )}
        </>
      );
    };

    const ValoresNodeComp = ({ node, level }: { node: HierNode<NodeContent>, level: number }) => {
      //if (node.stateOpen == null) node.stateOpen = (level == 0) ? true : false;

      const [open, setOpen] = React.useState(node.stateOpen);
      //const [, forceRefresh] = React.useState<any>({});
      const setOpenRetain = (open: boolean) => {
        node.stateOpen = open;
        setOpen(open);
        statesCompsSubord.setMainStatesCss.setSomeId(node.id, open);
      };

      if (!node.group &&
        node.nodeContent.valMeses == null)
        node.nodeContent.valMeses = genValMeses(null);

      if (node.group && !node.nodesFilhoLoad) {
        node.nodesFilho = dataStructure.nodes.filter(x => x.idPai == node.id).sort((x, y) => compareForBinSearch(x.sortKey, y.sortKey));
        node.nodesFilhoLoad = true;
      }

      //const globalCtrl = React.useContext(GlobalCtrlContext);

      const LineEditComp = ({ level }: { level: number }) => {
        if (node.nodeContent.valMesesStr == null)
          node.nodeContent.valMesesStr = node.nodeContent.valMeses.map((x) => amountToStr(x, node.nodeContent.decimais));
        const [, forceRefresh] = React.useState<any>({});
        const changeAtiva = (val: boolean) => {
          globalCtrl.logTouchedCells(node.id, node.nodeContent.descrAcum, 'ativa', false);
          node.nodeContent.ativa = val;
          globalCtrl.setChangedLine(node.id, node.nodeContent.keyDb, node.nodeContent.ativa, node.nodeContent.valMeses);
          forceRefresh({});
        };

        const changeValMes = (sxMes: number, valStr) => {
          try {
            amountParse(valStr, node.nodeContent.decimais);
            globalCtrl.logTouchedCells(node.id, node.nodeContent.descrAcum, valMesFld(sxMes), false);
          }
          catch (error) {
            globalCtrl.logTouchedCells(node.id, node.nodeContent.descrAcum, valMesFld(sxMes), true);
          }
          node.nodeContent.valMesesStr[sxMes] = valStr;
          forceRefresh({});
        };
        const blurValMes = (sxMes: number, valStr) => {
          try {
            const val = amountParse(valStr, node.nodeContent.decimais);
            chgValMeses('setMes', sxMes, val);
            atuValsEdit([{ sxMes, val }]);
          }
          catch (error) {
          }
        };

        const atuValsEdit = (alts: ISxMesVal[]) => {
          alts.forEach((x) => {
            node.nodeContent.valMesesStr[x.sxMes] = amountToStr(x.val, node.nodeContent.decimais);
            globalCtrl.logTouchedCells(node.id, node.nodeContent.descrAcum, valMesFld(x.sxMes), false);
          });
          forceRefresh({});
        };

        const chgValMeses = (cmd: 'clear' | 'repeat' | 'setMes', sxMesChange?: number, valueChanged?: number) => {
          let someChange = false;
          const newVals: ISxMesVal[] = [];
          if (cmd == 'clear') {
            mesesFld.forEach((_, sxMes) => {
              const val = null;
              if (node.nodeContent.valMeses[sxMes] != val) { // #!!!!!!!! não limpa se tiver erro !!!!
                someChange = true;
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
                  node.nodeContent.valMeses[sxMes] != lastValue) {
                  const val = lastValue;
                  someChange = true;
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
              someChange = true;
              node.nodeContent.valMeses[sxMes] = val;
              newVals.push({ sxMes, val });
            }
          }
          if (someChange) {
            atuValsEdit(newVals);
            globalCtrl.setChangedLine(node.id, node.nodeContent.keyDb, node.nodeContent.ativa, node.nodeContent.valMeses);
          }
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
            <Box style={cssTextNoWrapEllipsis}>{node.nodeContent.descr}</Box>
          </Stack>;

        const paddingLeft = 0.8 * level;
        const propsColorDescr = {};
        return (<>
          <GridCell {...propsColorDescr}><Box pl={paddingLeft}>{descrUse}</Box></GridCell>
          <GridCell>
            <SwitchMy checked={node.nodeContent.ativa} onChange={(ev) => changeAtiva(ev.target.checked)} />
          </GridCell>

          {mesesFld.map((_, sxMes) =>
            <GridCell key={sxMes}>
              <Input value={node.nodeContent.valMesesStr[sxMes]}
                // error={globalCtrl.touchedCells[`${node.id}/${valMesFld(sxMes)}`] == 'error'}
                error={globalCtrl.cellError(node.id, valMesFld(sxMes))}
                onChange={(ev) => changeValMes(sxMes, ev.target.value)}
                onBlur={(ev) => blurValMes(sxMes, ev.target.value)}
                inputProps={{ style: { padding: 0, textAlign: 'right', fontSize: fontSizeGrid } }}
                onKeyDown={(ev) => handleKeyDownInput(node.id, sxMes, ev)}
              />
            </GridCell>
          )}
        </>);
      };

      const LineShowComp = ({ level, stateOpen, setStateOpen }: { level: number, stateOpen?: boolean, setStateOpen?: any }) => {
        const [, forceRefresh] = React.useState({});

        React.useEffect(() => {
          if (node.group) node.stateForceRefreshTot = forceRefresh;
        }, []);

        const descrUse =
          <>
            {node.group
              ? <Stack direction='row' alignItems='center' gap={1} sx={{ cursor: 'pointer' }} onClick={() => setStateOpen(!stateOpen)}>
                <IconApp icon={stateOpen ? 'colapse' : 'expand'} fontSize={fontSizeIconsInGrid} />
                <Box style={cssTextNoWrapEllipsis}>{node.nodeContent.descr}</Box>
              </Stack>
              : <Box style={cssTextNoWrapEllipsis}>{node.nodeContent.descr}</Box>
            }
          </>;

        const paddingLeft = 0.8 * level;
        const propsColorLevel = node.group ? propsColorByTotLevel(themePlus, level + 1) : {};
        const propsColorDescr = propsColorLevel;
        if (node.group)
          return (<>
            <GridCell columnSpan={mesesFld.length + 2} {...propsColorDescr}><Box pl={paddingLeft}>{descrUse}</Box></GridCell>
          </>);
        else {
          return (<>
            <GridCell {...propsColorDescr}><Box pl={paddingLeft}>{descrUse}</Box></GridCell>
            <GridCell textAlign='center' {...propsColorLevel}>{BooleanToSN(node.nodeContent.ativa)}</GridCell>
            {mesesFld.map((_, index) => <GridCell key={index} textAlign='right' {...propsColorLevel}>{amountToStr(node.nodeContent.valMeses[index], node.nodeContent.decimais)}</GridCell>)}
          </>);
        }
      };

      return (
        <>
          {node.group
            ? <>
              <LineShowComp level={level} stateOpen={open} setStateOpen={setOpenRetain} />
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
      const changedLinesToSend = globalCtrl.changedLinesCtrl
        .map((x) => x.changedLine);
      if (changedLinesToSend.length == 0)
        return PopupMsg.error('Nada a salvar.');
      setItens(mainStatesData1.filterApplied, changedLinesToSend);
    };

    const Botoes = () => {
      const globalCtrl = React.useContext(GlobalCtrlContext);
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
          gridTemplateColumns={`minmax(120px,1.5fr) 55px repeat(${mesesFld.length}, 1fr)`}
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

        {dataStructure.canEdit &&
          <Botoes />
        }
      </>
    );
  };


  const LocalCssComp = () => {
    const [nodeIds, setNodeIds] = React.useState([]);
    const setSomeId = (id: string, open: boolean) => {
      const nodeIdsNew = [...nodeIds];
      const itemId = nodeIdsNew.find(x => x.id == id);
      if (itemId == null)
        dbgError(`id ${id} não encontrado (setClassOpenClose)`);
      else {
        itemId.open = open;
        setNodeIds(nodeIdsNew);
      }
    };
    statesCompsSubord.setMainStatesCss = { setNodeIds, setSomeId };
    const allClasses = nodeIds.map(x => `.nodeId_${x.id} { display: ${x.open ? '' : 'none'};}`).join(' \n ');
    return (
      <style jsx global>{`
        ${allClasses}
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