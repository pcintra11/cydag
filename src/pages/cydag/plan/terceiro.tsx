import React from 'react';
import { useRouter } from 'next/router';
import _ from 'underscore';

import Box from '@mui/material/Box';
import { Stack, useTheme } from '@mui/material';

import { BinSearchProp, CalcExecTime, ErrorPlus, ForceWait, ObjUpdAllProps } from '../../../libCommon/util';
import { csd, dbgError } from '../../../libCommon/dbg';
import { IGenericObject } from '../../../libCommon/types';
import { PageDef } from '../../../libCommon/endPoints';
import { CallApiCliASync } from '../../../fetcher/fetcherCli';

import { globals } from '../../../libClient/clientGlobals';

import { AbortProc, Btn, BtnLine, SelOption, PopupMsg, WaitingObs, SnackBarError, fontSizeGrid, fontSizeIconsInGrid } from '../../../components';
import { GridCellEdit, GridCell, IFldChange, IGridEditFldCtrl, IGridEditMainCtrl, ValueType } from '../../../components/grid';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../../hooks/useMyForm';
//import { GlobalState, useGlobalState } from '../../hooks/useGlobalState';

import { IconButtonAppCrud, IconButtonAppSearch, propsColorHeader, SelAno, SelEntity, SelRevisao } from '../../../appCydag/components';
import { apisApp, pagesApp } from '../../../appCydag/endPoints';
import { useLoggedUser } from '../../../appCydag/useLoggedUser';
import { amountToStr, mesesFld, mesesHdr } from '../../../appCydag/util';
import { configApp } from '../../../appCydag/config';
import { CentroCusto, FuncaoTerceiro, Funcionario, ProcessoOrcamentario, ProcessoOrcamentarioCentroCusto, Terceiro } from '../../../appCydag/modelTypes';
import { CentroCustoConfigOption, IAnoCentroCustos, ProcCentrosCustoConfig, RevisaoValor, ProcessoOrcamentarioStatusMd, OperInProcessoOrcamentario } from '../../../appCydag/types';

import { CmdApi_Terceiro as CmdApi, IChangedLine, DataEdit, LineState } from '../../api/appCydag/terceiro/types';

enum Phase {
  initiating = 'initiating',
  ready = 'ready',
}

export class GlobalEditCtrl {
  changedLinesCtrl: { idLine: string; changedLine: IChangedLine }[];
  touchedCells: { idLine: string, descrLine: string, fld: string, index: number, valueError: boolean }[];
  constructor() {
    this.reset();
  }
  reset() {
    this.changedLinesCtrl = [];
    this.touchedCells = [];
  }
  logTouchedCells(idLine: string, descrLine: string, fld: string, index: number | null, valueError: boolean) {
    const touchedCell = this.touchedCells.find((x) => x.idLine === idLine && x.fld === fld && x.index === index);
    if (touchedCell == null)
      this.touchedCells.push({ idLine, descrLine, fld, index, valueError });
    else
      touchedCell.valueError = valueError;
  }
  setChangedLine(idLine: string, key: { refer: string }, lineState: LineState, dataEdit?: DataEdit) {
    const sxChangedLine = this.changedLinesCtrl.findIndex((item) => item.idLine === idLine);
    if (sxChangedLine == -1)
      this.changedLinesCtrl.push({ idLine, changedLine: { key, lineState, dataEdit } });
    else {
      this.changedLinesCtrl[sxChangedLine].changedLine.lineState = lineState;
      if (dataEdit != null)
        this.changedLinesCtrl[sxChangedLine].changedLine.dataEdit = { ...this.changedLinesCtrl[sxChangedLine].changedLine.dataEdit, ...dataEdit };
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
const apis = { crud: (parm) => CallApiCliASync(apisApp.terceiro.apiPath, globals.windowId, parm) };
const pageSelf = pagesApp.terceiro;

const statesCompsSubord = { setMainStatesFilter: null, setMainStatesData1: null, setMainStatesData2: null, setStatePreReservedItens: null };
export default function PageTerceiroCrud() {
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    anoCentroCustosArray?: IAnoCentroCustos[]; funcaoTerceirosArray?: FuncaoTerceiro[];
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
      terceiroItens?: Terceiro[];
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
    const funcaoTerceirosArray = (apiReturn.value.funcaoTerceirosArray as IGenericObject[]).map((data) => FuncaoTerceiro.deserialize(data));
    return { procsCentrosCustoConfigAllYears, centroCustoArray, funcaoTerceirosArray };
  };
  const getItens = async (filter: FrmFilter) => {
    try {
      const calcExecTimeSearch = new CalcExecTime();
      statesCompsSubord.setMainStatesData2({ dataStructure: { loading: true } });
      statesCompsSubord.setMainStatesData1({ filterApplied: { ...filter } });
      const apiReturn = await apis.crud({ cmd: CmdApi.itensGet, filter });
      const processoOrcamentario = ProcessoOrcamentario.deserialize(apiReturn.value.processoOrcamentario);
      const processoOrcamentarioCentroCusto = ProcessoOrcamentarioCentroCusto.deserialize(apiReturn.value.processoOrcamentarioCentroCusto);
      const terceiroItens = (apiReturn.value.terceiroItens as IGenericObject[]).map((data) => Terceiro.deserialize(data));
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
          headerInfo, canEdit,
          terceiroItens,
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
        const { procsCentrosCustoConfigAllYears, centroCustoArray, funcaoTerceirosArray } = result;
        const anoCentroCustosArray: IAnoCentroCustos[] = [];
        procsCentrosCustoConfigAllYears.forEach((x) => {
          anoCentroCustosArray.push({
            ano: x.ano,
            centroCustoConfigOptions: x.centroCustoConfig.map((ccConfig) => ({ cod: ccConfig.centroCusto, descr: BinSearchProp(centroCustoArray, ccConfig.centroCusto, 'descr', 'cod'), ccConfig })),
          });
        });
        setMainStatesCache({ phase: Phase.ready, anoCentroCustosArray, funcaoTerceirosArray });
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

    // const fields = 4;
    // const cols = 1 + fields + 1;

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
    const FuncId = (funcionario: Funcionario) => `${funcionario.refer}`;

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
          <GridCell sticky textAlign='center' {...propsColorsHdr}>
            <Stack direction='row' alignItems='center' gap={1} justifyContent='center'>
              <IconButtonAppCrud icon='create' colorSx={propsColorsHdr.color} onClick={() => newLine()} />
            </Stack>
          </GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Refer</Box></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Nome</Box></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Fornecedor</Box></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Função</Box></GridCell>

          {mesesHdr.map((mes, index) =>
            <GridCell key={index} sticky textAlign='right' {...propsColorsHdr}>
              <Box>{mes}</Box>
            </GridCell>
          )}
        </>
      );
    };

    const LineComp = ({ terceiro, indexPreReserve, canEdit }: { terceiro?: Terceiro, indexPreReserve?: number, canEdit: boolean }) => {
      //csl(`render LinVals ${node.id}`);
      //const [, forceRefresh] = React.useState({});
      const [lineState, setLineState] = React.useState(terceiro != null ? LineState.original : LineState.reserved);

      if (indexPreReserve != null)
        statesCompsSubord.setStatePreReservedItens[indexPreReserve] = setLineState;

      if (lineState === LineState.reserved) return (<></>);

      const dataOriginal = terceiro != null ? terceiro : (new Terceiro()).Fill({
        refer: `incl. ${indexPreReserve + 1}`,
        valMeses: new Array(mesesFld.length).fill(undefined),
      });

      const funcId = FuncId(dataOriginal);

      const idLine = `${funcId}`;

      const dataEdit = new DataEdit();

      const changeLineState = (lineState: LineState) => {
        setLineState(lineState);
        if (lineState === LineState.deleted ||
          lineState === LineState.aborted) {
          globalCtrl.setChangedLine(idLine, { refer: dataOriginal.refer }, lineState);
          globalCtrl.touchedCellsClear(funcId);
        }
      };

      //#region controle para GridCellEdit
      const fldNewValue = (fldChange: IFldChange) => {
        const { fld, index, value, valueError, initiating } = fldChange;
        if (index == null)
          dataEdit[fld] = value;
        else
          dataEdit[fld][index] = value;
        globalCtrl.logTouchedCells(funcId, `refer ${dataOriginal.refer}`, fld, index, valueError);
        if (!initiating)
          globalCtrl.setChangedLine(idLine, { refer: dataOriginal.refer }, lineState, dataEdit);
      };
      const mainCtrl: IGridEditMainCtrl = { dataOriginal: dataOriginal, fldNewValue, fontSizeGrid };
      const fldsCtrl = {
        nome: { fld: 'nome', mandatory: true } as IGridEditFldCtrl,
        fornecedor: { fld: 'fornecedor', mandatory: true } as IGridEditFldCtrl,
        funcaoTerceiros: { fld: 'funcaoTerceiros', valueType: ValueType.options, options: mainStates.funcaoTerceirosArray.map((x) => new SelOption(x.cod, x.descr)), mandatory: true } as IGridEditFldCtrl,
        valMeses: { fld: 'valMeses', valueType: ValueType.amount, decimals: configApp.decimalsValsInput, arrayItens: mesesFld.length } as IGridEditFldCtrl,
      };
      //#endregion

      const chgValMeses = (cmd: 'clear' | 'repeat') => {
        const valueEmpty = '';
        if (cmd == 'clear') {
          mesesFld.forEach((_, index) => {
            // const fldCtrl = setStateSubords.find((x) => x.fld === 'valMeses' && x.index == index);
            // if (fldCtrl != null) fldCtrl.atuVal(valueEmpty);
            fldsCtrl.valMeses.atuVal[index](valueEmpty);
          });
        }
        else if (cmd == 'repeat') {
          let lastValue = valueEmpty;
          mesesFld.forEach((_, index) => {
            // const fldCtrl = setStateSubords.find((x) => x.fld === 'valMeses' && x.index == index);
            // if (fldCtrl != null) {
            const value = dataEdit.valMeses[index];
            if (value != valueEmpty)
              lastValue = value;
            else {
              if (lastValue != valueEmpty &&
                value == valueEmpty)
                fldsCtrl.valMeses.atuVal[index](lastValue);
            }
            //}
          });
        }
      };

      let iconsCmd: React.ReactNode = null;
      if (canEdit) {
        if (lineState == LineState.original) {
          iconsCmd = <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
            <IconButtonAppCrud icon='edit' onClick={() => changeLineState(LineState.updated)} fontSize={fontSizeIconsInGrid} />
            <IconButtonAppCrud icon='delete' onClick={() => changeLineState(LineState.deleted)} fontSize={fontSizeIconsInGrid} />
          </Stack>;
        }
        else if (lineState == LineState.deleted)
          iconsCmd = <Box>excl.</Box>;
        else if (lineState == LineState.aborted)
          iconsCmd = <Box>cancel.</Box>;
        else if (lineState == LineState.updated)
          iconsCmd = <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
            <IconButtonAppCrud icon='delete' onClick={() => changeLineState(LineState.deleted)} fontSize={fontSizeIconsInGrid} />
            <IconButtonAppCrud icon='clear' onClick={() => chgValMeses('clear')} fontSize={fontSizeIconsInGrid} />
            <IconButtonAppCrud icon='redo' onClick={() => chgValMeses('repeat')} fontSize={fontSizeIconsInGrid} />
          </Stack>;
        else if (lineState == LineState.inserted)
          iconsCmd = <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
            <IconButtonAppCrud icon='delete' onClick={() => changeLineState(LineState.aborted)} fontSize={fontSizeIconsInGrid} />
            <IconButtonAppCrud icon='clear' onClick={() => chgValMeses('clear')} fontSize={fontSizeIconsInGrid} />
            <IconButtonAppCrud icon='redo' title='Replicar valores' onClick={() => chgValMeses('repeat')} fontSize={fontSizeIconsInGrid} />
          </Stack>;
      }

      if (lineState == LineState.inserted ||
        lineState == LineState.updated) {

        return (
          <>
            <GridCell alignSelf='end'>{iconsCmd}</GridCell>

            <GridCell alignSelf='end'><Box>{dataOriginal.refer}</Box></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.nome} /></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.fornecedor} /></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.funcaoTerceiros} /></GridCell>

            {mesesFld.map((_, index) => <GridCell alignSelf='end' key={index} textAlign='right'>
              <GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.valMeses} index={index} />
            </GridCell>)}
          </>
        );
      }
      else
        return (<>
          <GridCell textAlign='center'>{iconsCmd}</GridCell>

          <GridCell textAlign='left'><Box>{dataOriginal.refer}</Box></GridCell>
          <GridCell textAlign='left'><Box>{dataOriginal.nome}</Box></GridCell>
          <GridCell textAlign='left'><Box>{dataOriginal.fornecedor}</Box></GridCell>
          <GridCell textAlign='left'><Box>{BinSearchProp(mainStates.funcaoTerceirosArray, dataOriginal.funcaoTerceiros, 'descr', 'cod')}</Box></GridCell>

          {mesesFld.map((_, index) => <GridCell key={index} textAlign='right'>
            {amountToStr(dataOriginal.valMeses[index], configApp.decimalsValsInput)}
          </GridCell>)
          }
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
      // for (let index = 0; index < changedLinesToSend.length; index++) {
      //   const changedLine = changedLinesToSend[index];
      //   try {
      //     if (changedLine.lineState !== LineState.deleted)
      //       DataEdit.check(changedLine.dataEdit);
      //   }
      //   catch (error) {
      //     return PopupMsg.error(`Refer ${changedLine.key.refer} - ${error.message}.`);
      //   }
      // }
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
          gridTemplateColumns={`auto auto minmax(50px,1fr) minmax(50px,1fr) auto repeat(${mesesFld.length}, 60px)`}
          gridAutoRows='auto' gridAutoColumns='auto'
          justifyItems='stretch' alignItems='stretch'
          justifyContent='start' alignContent='start'
          fontSize={fontSizeGrid}
        >
          <HeaderComp />
          {dataStructure.terceiroItens.map((terceiro, index) =>
            <LineComp key={index} terceiro={terceiro} canEdit={dataStructure.canEdit} />
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