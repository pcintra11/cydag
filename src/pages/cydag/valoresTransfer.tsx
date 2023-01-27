import React from 'react';
import { useRouter } from 'next/router';
import _ from 'underscore';

import Box from '@mui/material/Box';
import { Stack, useTheme } from '@mui/material';

import { BinSearchItem, CalcExecTime, ErrorPlus, ForceWait, ObjUpdAllProps } from '../../libCommon/util';
import { csd, dbgError } from '../../libCommon/dbg';
import { IGenericObject } from '../../libCommon/types';
import { PageDef } from '../../libCommon/endPoints';
import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { globals } from '../../libClient/clientGlobals';
import { cssTextNoWrapEllipsis } from '../../libClient/util';

import { AbortProc, Btn, BtnLine, SelOption, PopupMsg, WaitingObs, SnackBarError, fontSizeGrid, fontSizeIconsInGrid } from '../../components';
import { GridCell, GridCellEdit, IFldChange, IGridEditFldCtrl, IGridEditMainCtrl, ValueType } from '../../components/grid';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../hooks/useMyForm';
//import { GlobalState, useGlobalState } from '../../hooks/useGlobalState';

import { IconButtonApp, IconButtonAppSearch, propsColorHeader, SelAno, SelEntity, SelRevisao } from '../../appCydag/components';
import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { mesesFld, mesesHdr, genValMeses, amountToStr } from '../../appCydag/util';
import { configApp } from '../../appCydag/config';
import { OperInProcessoOrcamentario, ProcessoOrcamentarioStatusMd, RevisaoValor } from '../../appCydag/types';
import { ProcessoOrcamentario, ValoresTransfer, Localidade } from '../../appCydag/modelTypes';
import { CmdApi_ValoresTransfer as CmdApi, IChangedLine, DataEdit } from '../api/appCydag/valoresTransfer/types';

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
  setChangedLine(idLine: string, key: { localidadeDestino: string }, dataEdit?: DataEdit) {
    const sxChangedLine = this.changedLinesCtrl.findIndex((item) => item.idLine === idLine);
    if (sxChangedLine == -1)
      this.changedLinesCtrl.push({ idLine, changedLine: { key, dataEdit } });
    else {
      if (dataEdit != null)
        this.changedLinesCtrl[sxChangedLine].changedLine.dataEdit = dataEdit;
    }
  }
}
export const GlobalCtrlContext = React.createContext<GlobalEditCtrl>(null);

class FrmFilter {
  ano: string;
  revisao: RevisaoValor;
  localidadeOrigem: string;
}

let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync(apisApp.valoresTransfer.apiPath, globals.windowId, parm) };
const pageSelf = pagesApp.valoresTransfer;
const statesCompsSubord = { setMainStatesData1: null, setMainStatesData2: null };

export default function PageValoresTransfer() {
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
    processoOrcamentarioArray?: ProcessoOrcamentario[]; localidadeArray?: Localidade[];
  }
  interface MainStatesData1 {
    filterApplied?: FrmFilter;
  }
  interface MainStatesData2 {
    dataStructure?: {
      loading: boolean;
      headerInfo?: string; canEdit?: boolean;
      processoOrcamentario?: ProcessoOrcamentario;
      valoresTransfer?: ValoresTransfer[];  // ##!!!!!! xxxItens
    };
  }

  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  const themePlus = useTheme();

  //#region db access
  const initialization = async () => {
    const apiReturn = await apis.crud({ cmd: CmdApi.initialization });
    const processoOrcamentarioArray = (apiReturn.value.processoOrcamentarioArray as IGenericObject[]).map((data) => ProcessoOrcamentario.deserialize(data));
    const localidadeArray = (apiReturn.value.localidadeArray as IGenericObject[]).map((data) => Localidade.deserialize(data));
    return { processoOrcamentarioArray, localidadeArray };
  };
  const getItens = async (filter: FrmFilter) => {
    try {
      const calcExecTimeSearch = new CalcExecTime();
      statesCompsSubord.setMainStatesData2({ dataStructure: { loading: true } });
      statesCompsSubord.setMainStatesData1({ filterApplied: { ...filter } });
      const apiReturn = await apis.crud({ cmd: CmdApi.valoresGet, filter });
      const processoOrcamentario = ProcessoOrcamentario.deserialize(apiReturn.value.processoOrcamentario);
      const valoresTransfer = (apiReturn.value.valoresTransfer as IGenericObject[]).map((data) => ValoresTransfer.deserialize(data));

      let canEdit = false;
      if (filter.revisao === RevisaoValor.atual &&
        ProcessoOrcamentarioStatusMd.blockOper(OperInProcessoOrcamentario.altPremissas, processoOrcamentario.status) == null)
        canEdit = true;

      if (!mount) return;
      await ForceWait(calcExecTimeSearch.elapsedMs(), configApp.forceWaitMinimumMs);
      statesCompsSubord.setMainStatesData2({
        dataStructure: {
          loading: false,
          processoOrcamentario,
          headerInfo: null, canEdit,
          valoresTransfer,
        }
      });
    } catch (error) {
      SnackBarError(error, `${pageSelf.pagePath}-getItens`);
    }
  };
  const setItens = async (filter: FrmFilter, changedLines: IChangedLine[]) => {
    try {
      await apis.crud({ cmd: CmdApi.valoresSet, filter, data: { changedLines } });
      PopupMsg.success(`Valores gravados para ${filter.ano} / ${filter.localidadeOrigem}.`);
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
        const { processoOrcamentarioArray, localidadeArray } = result;
        setMainStatesCache({ phase: Phase.ready, processoOrcamentarioArray, localidadeArray });
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
      defaultValues: FrmDefaultValues(new FrmFilter(), { revisao: RevisaoValor.atual }, [ValoresTransfer.F.ano, ValoresTransfer.F.revisao, ValoresTransfer.F.localidadeOrigem]),
    });
    const ano = useWatchMy({ control: frmFilter.control, name: ValoresTransfer.F.ano });
    const revisao = useWatchMy({ control: frmFilter.control, name: ValoresTransfer.F.revisao });
    const localidadeOrigem = useWatchMy({ control: frmFilter.control, name: ValoresTransfer.F.localidadeOrigem });

    React.useEffect(() => {
      const ano = mainStates.processoOrcamentarioArray.length != 0 ? mainStates.processoOrcamentarioArray[0].ano : null;
      frmFilter.setValue(ValoresTransfer.F.ano, ano);
    }, []);

    const getValoresSubmit = async (dataForm: FrmFilter) => {
      const filter = NormalizePropsString(dataForm, [ValoresTransfer.F.ano, ValoresTransfer.F.revisao, ValoresTransfer.F.localidadeOrigem]);
      if (filter.ano == null) return PopupMsg.error('Informe o Ano.');
      if (filter.revisao == null) return PopupMsg.error('Informe a Revisão.');
      if (filter.localidadeOrigem == null) return PopupMsg.error('Informe a Localidade Origem.');
      getItens(filter);
    };

    const localidadeOrigemOptions = mainStates.localidadeArray.map((x) => new SelOption(x.cod, x.descr));
    return (
      <form onSubmit={frmFilter.handleSubmit(getValoresSubmit)}>
        <Stack direction='row' alignItems='center' gap={1}>
          {/* <SelectMy width='80px'
            value={ano || ''}
            onChange={(ev) => { frmFilter.setValue(ValoresTransfer.F.ano, ev.target.value); }}
            displayEmpty
            placeHolder='Ano'
            options={[new SelOption('Ano', 'Ano', true), ...mainStates.processoOrcamentarioArray.map((x) => new SelOption(x.ano, x.ano))]}
          /> */}
          <SelAno value={ano} onChange={(value) => frmFilter.setValue(ValoresTransfer.F.ano, value)}
            options={mainStates.processoOrcamentarioArray.map((x) => new SelOption(x.ano, x.ano))}
          />

          <SelRevisao value={revisao} onChange={(newValue: RevisaoValor) => frmFilter.setValue(ValoresTransfer.F.revisao, newValue)} />
          <SelEntity value={localidadeOrigem} onChange={(newValue: string) => frmFilter.setValue(ValoresTransfer.F.localidadeOrigem, newValue)}
            options={localidadeOrigemOptions} name='Localidade Origem' withCod disableClearable />
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
          <GridCell sticky {...propsColorsHdr}>
            <Box>Localidade Destino</Box>
          </GridCell>
          {mesesHdr.map((mes, index) =>
            <GridCell key={index} sticky textAlign='right' {...propsColorsHdr}>
              <Box>{mes}</Box>
            </GridCell>
          )}
        </>
      );
    };

    const LineComp = ({ localidade, canEdit }: { localidade: Localidade, canEdit: boolean }) => {
      //if (node.stateOpen == null) node.stateOpen = (level == 0) ? true : false;

      let dataOriginal = BinSearchItem(dataStructure.valoresTransfer, localidade.cod, 'localidadeDestino');
      if (dataOriginal == null)
        dataOriginal = new ValoresTransfer().Fill({ localidadeDestino: localidade.cod, valMeses: genValMeses(null) });

      const idLine = `${localidade.cod}`;

      const dataEdit = new DataEdit();

      //#region controle para GridCellEdit
      const fldNewValue = (fldChange: IFldChange) => {
        const { fld, index, value, valueError, initiating } = fldChange;
        if (index == null)
          dataEdit[fld] = value;
        else
          dataEdit[fld][index] = value;
        globalCtrl.logTouchedCells(dataOriginal.localidadeDestino, `Localidade ${dataOriginal.localidadeDestino}`, fld, index, valueError);
        if (!initiating)
          globalCtrl.setChangedLine(idLine, { localidadeDestino: dataOriginal.localidadeDestino }, dataEdit);
      };
      const mainCtrl: IGridEditMainCtrl = { dataOriginal: dataOriginal, fldNewValue, fontSizeGrid };
      const fldsCtrl = {
        valMeses: { fld: 'valMeses', valueType: ValueType.amount, decimals: configApp.decimalsValsInput, arrayItens: mesesFld.length } as IGridEditFldCtrl,
      };
      //#endregion

      const chgValMeses = (cmd: 'clear' | 'repeat') => {
        const valueEmpty = '';
        if (cmd == 'clear') {
          mesesFld.forEach((_, index) => {
            fldsCtrl.valMeses.atuVal[index](valueEmpty);
          });
        }
        else if (cmd == 'repeat') {
          let lastValue = valueEmpty;
          mesesFld.forEach((_, index) => {
            const value = dataEdit.valMeses[index];
            if (value != valueEmpty)
              lastValue = value;
            else {
              if (lastValue != valueEmpty &&
                value == valueEmpty)
                fldsCtrl.valMeses.atuVal[index](lastValue);
            }
          });
        }
      };

      if (canEdit) {
        const descrUse =
          <Stack direction='row' alignItems='center' gap={1}>
            <IconButtonApp icon='clear' onClick={() => chgValMeses('clear')} fontSize={fontSizeIconsInGrid} />
            <IconButtonApp icon='redo' onClick={() => chgValMeses('repeat')} fontSize={fontSizeIconsInGrid} />
            <Box style={cssTextNoWrapEllipsis}>{localidade.descr}</Box>
          </Stack>;

        return (
          <>
            <GridCell alignSelf='end'><Box>{descrUse}</Box></GridCell>
            {mesesFld.map((_, index) => <GridCell alignSelf='end' key={index} textAlign='right'>
              <GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.valMeses} index={index} />
            </GridCell>)}
          </>
        );
      }
      else
        return (<>
          <GridCell><Box style={cssTextNoWrapEllipsis}>{localidade.descr}</Box></GridCell>
          {mesesFld.map((_, index) => <GridCell key={index} textAlign='right'>{amountToStr(dataOriginal.valMeses[index], 0)}</GridCell>)}
        </>);
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
          gridTemplateColumns={`minmax(120px,1.5fr) repeat(${mesesFld.length}, 1fr)`}
          //gridTemplateColumns={`2fr repeat(${meses.length + 1}, minmax(1fr,150px))`}
          // gridTemplateRows='80px'
          gridAutoRows='auto' gridAutoColumns='auto'
          justifyItems='stretch' alignItems='stretch'
          justifyContent='start' alignContent='start'
          fontSize={fontSizeGrid}
        >
          <HeaderComp />

          {mainStates.localidadeArray.map((localidade, index) =>
            <LineComp key={index} localidade={localidade} canEdit={dataStructure.canEdit} />
          )}
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