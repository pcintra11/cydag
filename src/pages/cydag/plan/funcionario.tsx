import React from 'react';
import { useRouter } from 'next/router';
import _ from 'underscore';

import Box from '@mui/material/Box';
import { Stack, useTheme } from '@mui/material';

import { BinSearchProp, CalcExecTime, ErrorPlus, ForceWait, ObjUpdAllProps } from '../../../libCommon/util';
import { csd, dbgError } from '../../../libCommon/dbg';
import { IGenericObject } from '../../../libCommon/types';
import { BooleanToSN } from '../../../libCommon/util';
import { PageDef } from '../../../libCommon/endPoints';
import { isAmbDev } from '../../../libCommon/isAmb';
import { CallApiCliASync } from '../../../fetcher/fetcherCli';

import { globals } from '../../../libClient/clientGlobals';

import { AbortProc, Btn, BtnLine, SelOption, PopupMsg, WaitingObs, SnackBarError, fontSizeGrid, fontSizeIconsInGrid } from '../../../components';
import { GridCell, GridCellEdit, IFldChange, IGridEditFldCtrl, IGridEditMainCtrl, ValueType } from '../../../components/grid';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../../hooks/useMyForm';
//import { GlobalState, useGlobalState } from '../../hooks/useGlobalState';

import { IconButtonApp, IconButtonAppSearch, propsColorHeader, SelAno, SelEntity, SelRevisao } from '../../../appCydag/components';
import { apisApp, pagesApp } from '../../../appCydag/endPoints';
import { useLoggedUser } from '../../../appCydag/useLoggedUser';
import { amountToStr } from '../../../appCydag/util';
import { configApp } from '../../../appCydag/config';
import { CentroCusto, Funcionario, Premissa, ProcessoOrcamentario, ProcessoOrcamentarioCentroCusto } from '../../../appCydag/modelTypes';
import { CentroCustoConfigOption, IAnoCentroCustos, OrigemFunc, OrigemFuncMd, ProcCentrosCustoConfig, RevisaoValor, TipoColaboradorMd, TipoParticipPerOrcamMd, ProcessoOrcamentarioStatusMd, OperInProcessoOrcamentario } from '../../../appCydag/types';

import { CmdApi_Funcionario as CmdApi, FuncionarioClient, IChangedLine, DataEdit, LineState } from '../../api/appCydag/funcionario/types';

enum Phase {
  initiating = 'initiating',
  ready = 'ready',
}

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
  setChangedLine(idLine: string, key: { origem: OrigemFunc, refer: string }, lineState: LineState, dataEdit?: DataEdit, fldEdit?: string) {
    const sxChangedLine = this.changedLinesCtrl.findIndex((item) => item.idLine === idLine);
    if (sxChangedLine == -1) {
      const fldsChanged = fldEdit != null ? [fldEdit] : [];
      this.changedLinesCtrl.push({ idLine, changedLine: { key, lineState, dataEdit, fldsChanged } });
    }
    else {
      this.changedLinesCtrl[sxChangedLine].changedLine.lineState = lineState;
      this.changedLinesCtrl[sxChangedLine].changedLine.dataEdit = { ...this.changedLinesCtrl[sxChangedLine].changedLine.dataEdit, ...dataEdit };
      if (fldEdit != null &&
        !this.changedLinesCtrl[sxChangedLine].changedLine.fldsChanged.includes(fldEdit))
        this.changedLinesCtrl[sxChangedLine].changedLine.fldsChanged.push(fldEdit);
    }
  }
  touchedCellsClear(id: string) {
    this.touchedCells = this.touchedCells.filter((x) => x.idLine !== id);
  }
}
export const GlobalCtrlContext = React.createContext<GlobalEditCtrl>(null);

class FrmFilter {
  ano: string;
  revisao: RevisaoValor;
  centroCusto: string;
}

let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync(apisApp.funcionario.apiPath, globals.windowId, parm) };
const pageSelf = pagesApp.funcionario;

const statesCompsSubord = { setMainStatesFilter: null, setMainStatesData1: null, setMainStatesData2: null, setStatePreReservedItens: null };
export default function PageFuncionarioCrud() {
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    anoCentroCustosArray?: IAnoCentroCustos[];
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
      premissaDespRecorrArray?: Premissa[];
      funcionariosClient?: FuncionarioClient[];
    };
  }

  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  const themePlus = useTheme();

  //#region db access
  const initialization = async () => {
    const apiReturn = await apis.crud({ cmd: CmdApi.crudInitialization });
    const procsCentrosCustoConfigAllYears = (apiReturn.value.procsCentrosCustoConfigAllYears as IGenericObject[]).map((data) => ProcCentrosCustoConfig.deserialize(data));
    const centroCustoArray = (apiReturn.value.centroCustoArray as IGenericObject[]).map((data) => CentroCusto.deserialize(data));
    return { procsCentrosCustoConfigAllYears, centroCustoArray };
  };
  const getItens = async (filter: FrmFilter) => {
    try {
      const calcExecTimeSearch = new CalcExecTime();
      statesCompsSubord.setMainStatesData2({ dataStructure: { loading: true } });
      statesCompsSubord.setMainStatesData1({ filterApplied: { ...filter } });
      const apiReturn = await apis.crud({ cmd: CmdApi.itensGet, filter });
      const processoOrcamentario = ProcessoOrcamentario.deserialize(apiReturn.value.processoOrcamentario);
      const processoOrcamentarioCentroCusto = ProcessoOrcamentarioCentroCusto.deserialize(apiReturn.value.processoOrcamentarioCentroCusto);
      const funcionariosClient = (apiReturn.value.funcionariosClient as IGenericObject[]).map((data) => FuncionarioClient.deserialize(data));
      const premissaDespRecorrArray = (apiReturn.value.premissaDespRecorrArray as IGenericObject[]).map((data) => Premissa.deserialize(data));
      const userCanWrite = apiReturn.value.userCanWrite;

      let headerInfo = null, canEdit = false;
      if (filter.revisao === RevisaoValor.atual &&
        ProcessoOrcamentarioStatusMd.blockOper(OperInProcessoOrcamentario.altValoresPlanejados, processoOrcamentario.status) == null &&
        userCanWrite) {
        if (processoOrcamentarioCentroCusto.planejamentoEmAberto != true)
          headerInfo = 'Centro de Custo está bloqueado para planejamento.';
        else
          canEdit = true;
      }

      if (!mount) return;
      await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs);
      statesCompsSubord.setMainStatesData2({
        dataStructure: {
          loading: false,
          processoOrcamentario,
          processoOrcamentarioCentroCusto,
          premissaDespRecorrArray,
          headerInfo, canEdit,
          funcionariosClient,
        }
      });
    } catch (error) {
      SnackBarError(error, `${pageSelf.pagePath}-getItens`);
    }
  };
  const setItens = async (filter: FrmFilter, changedLines: IChangedLine[]) => {
    try {
      await apis.crud({ cmd: CmdApi.itensSet, filter, data: { changedLines } });
      PopupMsg.success(`Dados gravados para ${filter.ano} / ${filter.centroCusto}.`);
      getItens(filter);
    } catch (error) {
      SnackBarError(error, `${pageSelf.pagePath}-setItens`);
    }
  };
  //#endregion

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
    initialization()
      .then((result) => {
        if (!mount) return;
        const { procsCentrosCustoConfigAllYears, centroCustoArray } = result;
        const anoCentroCustosArray: IAnoCentroCustos[] = [];
        procsCentrosCustoConfigAllYears.forEach((x) => {
          anoCentroCustosArray.push({
            ano: x.ano,
            centroCustoConfigOptions: x.centroCustoConfig.map((ccConfig) => ({ cod: ccConfig.centroCusto, descr: BinSearchProp(centroCustoArray, ccConfig.centroCusto, 'descr', 'cod'), ccConfig })),
          });
        });
        setMainStatesCache({ phase: Phase.ready, anoCentroCustosArray });
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
      defaultValues: FrmDefaultValues(new FrmFilter(), { revisao: RevisaoValor.atual }, [Funcionario.F.ano, Funcionario.F.revisao, Funcionario.F.centroCusto]),
    });
    const ano = useWatchMy({ control: frmFilter.control, name: Funcionario.F.ano });
    const revisao = useWatchMy({ control: frmFilter.control, name: Funcionario.F.revisao });
    const centroCusto = useWatchMy({ control: frmFilter.control, name: Funcionario.F.centroCusto });

    const [mainStatesFilter, setMainStatesFilter] = React.useState<MainStatesFilter>({});
    statesCompsSubord.setMainStatesFilter = setMainStatesFilter;

    const mountOptionsCC = (ano: string, initialization = false) => {
      let centroCustoOptions: CentroCustoConfigOption[] = [];
      let centroCustoUnique = null as string;
      const centroCustoSelected = frmFilter.getValues(Funcionario.F.centroCusto);
      if (ano != null) {
        const anoCentroCustos = mainStates.anoCentroCustosArray.find((x) => x.ano == ano);
        centroCustoOptions = anoCentroCustos.centroCustoConfigOptions;
        if (anoCentroCustos.centroCustoConfigOptions.length == 1)
          centroCustoUnique = anoCentroCustos.centroCustoConfigOptions[0].cod;
      }
      setMainStatesFilter({ centroCustoOptions });
      if (centroCustoUnique != null) {
        frmFilter.setValue(Funcionario.F.centroCusto, centroCustoUnique);
        initialization && getItens(frmFilter.getValues());
      }
      else if (centroCustoSelected != null &&
        centroCustoOptions.findIndex((x) => x.cod === centroCustoSelected) !== -1)
        frmFilter.setValue(Funcionario.F.centroCusto, centroCustoSelected);
      else
        frmFilter.setValue(Funcionario.F.centroCusto, null);
    };

    React.useEffect(() => {
      const ano = mainStates.anoCentroCustosArray.length != 0 ? mainStates.anoCentroCustosArray[0].ano : null;
      frmFilter.setValue(Funcionario.F.ano, ano);
      mountOptionsCC(ano, true);
    }, []);

    const getItensSubmit = async (dataForm: FrmFilter) => {
      const filter = NormalizePropsString(dataForm);
      if (filter.ano == null) return PopupMsg.error('Informe o Ano.');
      if (filter.centroCusto == null) return PopupMsg.error('Informe o Centro de Custo.');
      getItens(filter);
    };

    const centroCustoOptions = mainStatesFilter.centroCustoOptions == null ? null : mainStatesFilter.centroCustoOptions.map((x) => new SelOption(x.cod, x.descr));
    return (
      <form onSubmit={frmFilter.handleSubmit(getItensSubmit)}>
        <Stack direction='row' alignItems='center' gap={1}>
          {/* <SelectMy width='80px'
            value={ano || ''}
            onChange={
              (ev) => {
                frmFilter.setValue(Funcionario.F.ano, ev.target.value);
                mountOptionsCC(ev.target.value);
              }
            }
            displayEmpty
            placeHolder='Ano'
            options={[new SelOption('Ano', 'Ano', true), ...mainStates.anoCentroCustosArray.map((x) => new SelOption(x.ano, x.ano))]}
          /> */}
          <SelAno value={ano} onChange={(value) => { frmFilter.setValue(Funcionario.F.ano, value); mountOptionsCC(value); }}
            options={mainStates.anoCentroCustosArray.map((x) => new SelOption(x.ano, x.ano))}
          />
          <SelRevisao value={revisao} onChange={(newValue: RevisaoValor) => frmFilter.setValue(Funcionario.F.revisao, newValue)} />

          {centroCustoOptions != null &&
            <SelEntity value={centroCusto} onChange={(newValue: string) => frmFilter.setValue(Funcionario.F.centroCusto, newValue)}
              options={centroCustoOptions} name={CentroCusto.Name} withCod width='550px' disableClearable />
          }

          <IconButtonAppSearch />
        </Stack>
      </form>
    );
  };

  const itensPreReserve = 20;
  const DataComp = () => {
    const [mainStatesData1, setMainStatesData1] = React.useState<MainStatesData1>({});
    const [mainStatesData2, setMainStatesData2] = React.useState<MainStatesData2>({});
    statesCompsSubord.setMainStatesData1 = setMainStatesData1;
    statesCompsSubord.setMainStatesData2 = setMainStatesData2;
    statesCompsSubord.setStatePreReservedItens = new Array(itensPreReserve).fill(undefined);
    //csl('renderData', mainStatesData1, mainStatesData2);

    //const ready = mainStatesData1.filterApplied != null && !mainStatesData2.dataStructure.loading;
    const premissaDespRecorrArray = []; // ready ? mainStatesData2.dataStructure.premissaDespRecorrArray : [];

    const fields = 15;
    const cols = 1 + fields + premissaDespRecorrArray.length;

    const globalCtrl = React.useContext(GlobalCtrlContext);

    React.useEffect(() => {
      globalCtrl.reset();
    }, [mainStatesData1.filterApplied]);

    if (mainStatesData1.filterApplied == null || mainStatesData2.dataStructure == null) return <></>;
    const dataStructure = mainStatesData2.dataStructure;
    if (dataStructure.loading) return <WaitingObs text='carregando' />;

    let itenPreReserveNext = 0;
    const newLine = () => {
      //csd('newLine', itenPreReserveNext);
      if (itenPreReserveNext > (itensPreReserve - 1))
        return PopupMsg.error('O máximo de itens incluídos e não salvos foi atingido. Favor salvar os dados para incluir mais itens.');
      statesCompsSubord.setStatePreReservedItens[itenPreReserveNext++](LineState.inserted);
    };
    const FuncId = (funcionario: Funcionario) => `${funcionario.origem}/${funcionario.refer}`;

    const InfoComp = () => {
      const comps = [];
      if (dataStructure.headerInfo != null)
        comps.push(`${dataStructure.headerInfo}`);
      if (comps.length > 0) return (<Box>{comps.join(' ')}</Box>);
      else return (<></>);
    };

    const showPromo = isAmbDev();
    const colsPromo = showPromo ? 3 : 0;

    const propsColorsHdr = propsColorHeader(themePlus);
    const HeaderComp = () => {
      const permiteNovos = dataStructure.processoOrcamentarioCentroCusto.permiteNovosClb;
      return (
        <>
          <GridCell textAlign='center' columnSpan={8} rowSpan={2} {...propsColorsHdr}><Box>Informações Gerais</Box></GridCell>

          <GridCell textAlign='center' columnSpan={8 + colsPromo + premissaDespRecorrArray.length} {...propsColorsHdr}><Box>Participação no Orçamento</Box></GridCell>

          <GridCell textAlign='center' columnSpan={1} {...propsColorsHdr}><Box></Box></GridCell>
          <GridCell textAlign='center' columnSpan={2} {...propsColorsHdr}><Box>Início</Box></GridCell>
          <GridCell textAlign='center' columnSpan={2} {...propsColorsHdr}><Box>Fim</Box></GridCell>
          <GridCell textAlign='center' columnSpan={3} {...propsColorsHdr}><Box>Valores</Box></GridCell>
          {showPromo &&
            <GridCell textAlign='center' columnSpan={colsPromo} {...propsColorsHdr}><Box>Promoção</Box></GridCell>
          }
          <GridCell textAlign='center' columnSpan={premissaDespRecorrArray.length} {...propsColorsHdr} ><Box>Outros</Box></GridCell>

          <GridCell sticky textAlign='center' {...propsColorsHdr}>
            {permiteNovos
              ? <Stack direction='row' alignItems='center' gap={1} justifyContent='center'>
                <IconButtonApp icon='create' colorSx={propsColorsHdr.color} onClick={() => newLine()} />
              </Stack>
              : <></>
            }
          </GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Origem</Box></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Refer</Box></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Nome</Box></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Id Vaga</Box></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Tipo Clb.</Box></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Função</Box></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Salário (legado)</Box></GridCell>

          <GridCell sticky textAlign='center' {...propsColorsHdr}><Box>Ativo</Box></GridCell>
          <GridCell sticky textAlign='center' {...propsColorsHdr}><Box>Tipo</Box></GridCell>
          <GridCell sticky textAlign='center' {...propsColorsHdr}><Box>Mês</Box></GridCell>
          <GridCell sticky textAlign='center' {...propsColorsHdr}><Box>Tipo</Box></GridCell>
          <GridCell sticky textAlign='center' {...propsColorsHdr}><Box>Mês</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Salário</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Deps</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Vale Transp.</Box></GridCell>
          {
            showPromo &&
            <>
              <GridCell sticky textAlign='center' {...propsColorsHdr}><Box>Mês</Box></GridCell>
              <GridCell sticky textAlign='center' {...propsColorsHdr}><Box>Tipo Clb.</Box></GridCell>
              <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Salário</Box></GridCell>
            </>
          }

          {
            premissaDespRecorrArray.map((x, index) =>
              <GridCell key={index} sticky textAlign='center' {...propsColorsHdr}><Box>{x.descrDespRecorrFunc}</Box></GridCell>
            )
          }
        </>
      );
    };

    //   const isDescrInvalid = (val) => {
    //     return val.trim().length < 5;
    //   };

    const LineComp = ({ funcionarioClient, indexPreReserve, canEdit }: { funcionarioClient?: FuncionarioClient, indexPreReserve?: number, canEdit: boolean }) => {
      //csl(`render LinVals ${node.id}`);
      //const [, forceRefresh] = React.useState({});
      const [lineState, setLineState] = React.useState(funcionarioClient != null ? LineState.original : LineState.reserved);

      if (indexPreReserve != null)
        statesCompsSubord.setStatePreReservedItens[indexPreReserve] = setLineState;

      if (lineState === LineState.reserved) return (<></>);

      //if (line.dataEdit == null) line.dataEdit = {};

      const dataOriginal = funcionarioClient != null ? funcionarioClient : (new FuncionarioClient()).Fill({ origem: OrigemFunc.local, refer: `incl. ${indexPreReserve + 1}` });

      const funcId = FuncId(dataOriginal);

      const idLine = funcId;

      const dataEdit = new DataEdit();

      const changeLineState = (lineState: LineState) => {
        setLineState(lineState);
        if (lineState === LineState.deleted ||
          lineState === LineState.aborted) {
          globalCtrl.setChangedLine(idLine, { origem: dataOriginal.origem, refer: dataOriginal.refer }, lineState);
          globalCtrl.touchedCellsClear(funcId);
        }
      };

      //#region controle para GridCellEdit
      const fldNewValue = (fldChange: IFldChange) => {
        const { fld, index, value, valueError, initiating } = fldChange;
        //if (!valueError)
        dataEdit[fld] = value;
        globalCtrl.logTouchedCells(funcId, `refer ${dataOriginal.refer}`, fld, valueError);
        if (!initiating)
          globalCtrl.setChangedLine(idLine, { origem: dataOriginal.origem, refer: dataOriginal.refer }, lineState, dataEdit, fld);
      };
      const mainCtrl: IGridEditMainCtrl = { dataOriginal: dataOriginal, fldNewValue, fontSizeGrid };
      const fldsCtrl = {
        nome: { fld: 'nome', mandatory: true } as IGridEditFldCtrl,
        idVaga: { fld: 'idVaga' } as IGridEditFldCtrl,
        tipoColaborador: { fld: 'tipoColaborador', valueType: ValueType.options, options: TipoColaboradorMd.all.map((x) => new SelOption(x.cod, x.descr)), mandatory: true } as IGridEditFldCtrl,
        funcao: { fld: 'funcao' } as IGridEditFldCtrl,

        ativo: { fld: 'ativo', valueType: ValueType.boolean } as IGridEditFldCtrl,
        tipoIni: { fld: 'tipoIni', valueType: ValueType.options, options: TipoParticipPerOrcamMd.all.filter((x) => x.plus.ini).map((x) => new SelOption(x.cod, x.descr)), mandatory: true } as IGridEditFldCtrl,
        mesIni: { fld: 'mesIni', valueType: ValueType.number, mandatory: true } as IGridEditFldCtrl,
        tipoFim: { fld: 'tipoFim', valueType: ValueType.options, options: [new SelOption('', 'sem'), ...TipoParticipPerOrcamMd.all.filter((x) => x.plus.fim).map((x) => new SelOption(x.cod, x.descr))] } as IGridEditFldCtrl,
        mesFim: { fld: 'mesFim', valueType: ValueType.number } as IGridEditFldCtrl,
        salario: { fld: 'salario', valueType: ValueType.amount, decimals: configApp.decimalsValsInput, mandatory: true } as IGridEditFldCtrl,
        dependentes: { fld: 'dependentes', valueType: ValueType.number } as IGridEditFldCtrl,
        valeTransp: { fld: 'valeTransp', valueType: ValueType.amount, decimals: configApp.decimalsValsInput } as IGridEditFldCtrl,
        mesPromo: { fld: 'mesPromo', valueType: ValueType.number } as IGridEditFldCtrl,
        tipoColaboradorPromo: { fld: 'tipoColaboradorPromo', valueType: ValueType.options, options: [new SelOption('', 'sem'), ...TipoColaboradorMd.all.map((x) => new SelOption(x.cod, x.descr))] } as IGridEditFldCtrl,
        salarioPromo: { fld: 'salarioPromo', valueType: ValueType.amount, decimals: configApp.decimalsValsInput } as IGridEditFldCtrl,
      };
      //#endregion

      let iconsCmd: React.ReactNode = null;
      if (canEdit) {
        if (lineState == LineState.original) {
          iconsCmd = <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
            <IconButtonApp icon='edit' onClick={() => changeLineState(LineState.updated)} fontSize={fontSizeIconsInGrid} />
            <IconButtonApp icon='delete' onClick={() => changeLineState(LineState.deleted)} fontSize={fontSizeIconsInGrid} />
          </Stack>;
        }
        else if (lineState == LineState.deleted)
          iconsCmd = <Box>excl.</Box>;
        // else if (lineState == LineState.insertedAndDeleted)
        //   iconsCmd = <IconButtonCrud icon='restoreDelete' onClick={() => changeLineState(LineState.inserted, funcId)} fontSize={fontSizeIconsInGrid} />;
        else if (lineState == LineState.aborted)
          iconsCmd = <Box>cancel.</Box>;
        else if (lineState == LineState.updated)
          iconsCmd = <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
            <IconButtonApp icon='delete' onClick={() => changeLineState(LineState.deleted)} fontSize={fontSizeIconsInGrid} />
          </Stack>;
        else if (lineState == LineState.inserted)
          iconsCmd = <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
            <IconButtonApp icon='delete' onClick={() => changeLineState(LineState.aborted)} fontSize={fontSizeIconsInGrid} />
          </Stack>;
      }


      if (lineState == LineState.inserted ||
        lineState == LineState.updated) {

        return (
          <>
            <GridCell alignSelf='end'>{iconsCmd}</GridCell>

            <GridCell alignSelf='end'><Box>{OrigemFuncMd.descr(dataOriginal.origem)}</Box></GridCell>
            <GridCell alignSelf='end'><Box>{dataOriginal.refer}</Box></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.nome} /></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.idVaga} /></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.tipoColaborador} /></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.funcao} /></GridCell>
            <GridCell alignSelf='end'><Box>{amountToStr(dataOriginal.salarioLegado, configApp.decimalsValsInput)}</Box></GridCell>

            <GridCell alignSelf='end' textAlign='center'>
              <GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.ativo} />
              {/* não está centralizando #!!!!!!! */}
            </GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.tipoIni} /></GridCell>
            <GridCell alignSelf='end' textAlign='right'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.mesIni} /></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.tipoFim} /></GridCell>
            <GridCell alignSelf='end' textAlign='right'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.mesFim} /></GridCell>
            <GridCell alignSelf='end' textAlign='right'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.salario} /></GridCell>
            <GridCell alignSelf='end' textAlign='right'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.dependentes} /></GridCell>
            <GridCell alignSelf='end' textAlign='right'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.valeTransp} /></GridCell>
            {showPromo &&
              <>
                <GridCell alignSelf='end' textAlign='right'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.mesPromo} /></GridCell>
                <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.tipoColaboradorPromo} /></GridCell>
                <GridCell alignSelf='end' textAlign='right'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.salarioPromo} /></GridCell>
              </>
            }

            {premissaDespRecorrArray.map((_, index) => <GridCell alignSelf='end' key={index}>s</GridCell>)}
          </>
        );
      }
      else
        return (<>
          <GridCell textAlign='center'>{iconsCmd}</GridCell>

          <GridCell textAlign='left'><Box>{OrigemFuncMd.descr(dataOriginal.origem)}</Box></GridCell>
          <GridCell textAlign='left'><Box>{dataOriginal.refer}</Box></GridCell>
          <GridCell textAlign='left'><Box>{dataOriginal.nome}</Box></GridCell>
          <GridCell textAlign='left'><Box>{dataOriginal.idVaga}</Box></GridCell>
          <GridCell textAlign='left'><Box>{TipoColaboradorMd.descr(dataOriginal.tipoColaborador)}</Box></GridCell>
          <GridCell textAlign='left'><Box>{dataOriginal.funcao}</Box></GridCell>
          <GridCell textAlign='right'><Box>{amountToStr(dataOriginal.salarioLegado, configApp.decimalsValsInput)}</Box></GridCell>

          <GridCell textAlign='center'><Box>{BooleanToSN(dataOriginal.ativo)}</Box></GridCell>
          <GridCell textAlign='center'><Box>{TipoParticipPerOrcamMd.descr(dataOriginal.tipoIni)}</Box></GridCell>
          <GridCell textAlign='right'><Box>{dataOriginal.mesIni}</Box></GridCell>
          <GridCell textAlign='center'><Box>{TipoParticipPerOrcamMd.descr(dataOriginal.tipoFim)}</Box></GridCell>
          <GridCell textAlign='right'><Box>{dataOriginal.mesFim}</Box></GridCell>
          <GridCell textAlign='right'><Box>{amountToStr(dataOriginal.salario, configApp.decimalsValsInput)}</Box></GridCell>
          <GridCell textAlign='right'><Box>{dataOriginal.dependentes}</Box></GridCell>
          <GridCell textAlign='right'><Box>{amountToStr(dataOriginal.valeTransp, configApp.decimalsValsInput)}</Box></GridCell>
          {showPromo &&
            <>
              <GridCell textAlign='center'><Box>{dataOriginal.mesPromo}</Box></GridCell>
              <GridCell textAlign='center'><Box>{TipoColaboradorMd.descr(dataOriginal.tipoColaboradorPromo)}</Box></GridCell>
              <GridCell textAlign='right'><Box>{amountToStr(dataOriginal.salarioPromo, configApp.decimalsValsInput)}</Box></GridCell>
            </>
          }
          {premissaDespRecorrArray.map((_, index) => <GridCell key={index} textAlign='center'>s</GridCell>)}
        </>);
    };

    const salvar = (globalCtrl: GlobalEditCtrl) => {
      const cellError = globalCtrl.touchedCells.find((x) => x.valueError);
      if (cellError != null)
        return PopupMsg.error(`Favor corrigir os campos sinalizados com erro: linha ${cellError.descrLine}`);
      const changedLinesToSend = globalCtrl.changedLinesCtrl
        .filter((x) => x.changedLine.lineState === LineState.inserted ||
          x.changedLine.lineState === LineState.updated ||
          x.changedLine.lineState === LineState.deleted)
        .map((x) => ({ ...x.changedLine, dataEdit: NormalizePropsString(x.changedLine.dataEdit) }));
      if (changedLinesToSend.length == 0)
        return PopupMsg.error('Nada a salvar.');
      for (let index = 0; index < changedLinesToSend.length; index++) {
        const changedLine = changedLinesToSend[index];
        try {
          if (changedLine.lineState !== LineState.deleted)
            DataEdit.check(changedLine.dataEdit);
        }
        catch (error) {
          return PopupMsg.error(`Refer ${changedLine.key.refer} - ${error.message}.`);
        }
      }
      //csl({ linesToSend: changedLinesToSend });
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
          gridTemplateColumns={`auto auto auto minmax(100px,3fr) auto auto minmax(100px,2fr) repeat(${(cols + colsPromo) - 7}, minmax(60px, auto))`}
          gridAutoRows='auto' gridAutoColumns='auto'
          justifyItems='stretch' alignItems='stretch'
          justifyContent='start' alignContent='start'
          fontSize={fontSizeGrid}
        >
          <HeaderComp />
          {dataStructure.funcionariosClient.map((funcionarioClient, index) =>
            <LineComp key={index} funcionarioClient={funcionarioClient} canEdit={dataStructure.canEdit} />
          )}
          {dataStructure.canEdit &&
            <>
              {new Array(itensPreReserve).fill(undefined).map((_, index) =>
                <LineComp key={index} indexPreReserve={index} canEdit={true} />
              )}
            </>
          }
        </Box>

        {dataStructure.canEdit &&
          <Botoes />
        }
      </>
    );
  };

  return (
    <GlobalCtrlContext.Provider value={new GlobalEditCtrl()}>
      <Stack gap={1} height='100%'>
        <FilterComp />
        <DataComp />
      </Stack>
    </GlobalCtrlContext.Provider>
  );
}