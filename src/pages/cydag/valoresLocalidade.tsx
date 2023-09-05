import React from 'react';
import { useRouter } from 'next/router';

import Box from '@mui/material/Box';
import { Stack } from '@mui/material';

import { BinSearchItem, ErrorPlus, ForceWait, ObjUpdAllProps } from '../../libCommon/util';
import { csd } from '../../libCommon/dbg';
import { IGenericObject } from '../../libCommon/types';
import { PageDef } from '../../libCommon/endPoints';
import { CalcExecTime } from '../../libCommon/calcExectime';
import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { cssTextNoWrapEllipsis } from '../../libClient/util';

import { AbortProc, Btn, BtnLine, SelOption, PopupMsg, WaitingObs, fontSizeGrid, fontSizeIconsInGrid, LogErrorUnmanaged, Tx } from '../../components';
import { GridCell, GridCellEdit, IFldChange, GridEditFldCtrl, GridEditMainCtrl, ValueType } from '../../components/grid';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../hooks/useMyForm';
//import { GlobalState, useGlobalState } from '../../hooks/useGlobalState';

import { configApp } from '../../app_hub/appConfig';

import { IconButtonAppCrud, IconButtonAppSearch, propsColorHeader, SelAno, SelRevisao, TxGridCel, TxGridHdr } from '../../appCydag/components';
import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { mesesFld, mesesHdr, genValMeses, amountToStrApp } from '../../appCydag/util';
import { OperInProcessoOrcamentario, ProcessoOrcamentarioStatusMd, RevisaoValor } from '../../appCydag/types';
import { ProcessoOrcamentario, ValoresLocalidade, Localidade, localidadeCoringa } from '../../appCydag/modelTypes';
import { CmdApi_ValoresLocalidade as CmdApi, IChangedLine, DataEdit } from '../api/appCydag/valoresLocalidade/types';
import { configCydag } from '../../appCydag/configCydag';

//const empresaCoringa = new Empresa().Fill({ cod: codEmpresaCoringa, descr: 'Todas' });

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
  setChangedLine(idLine: string, key: { localidade: string }, dataEdit?: DataEdit) {
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
}

let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync<any>(apisApp.valoresLocalidade.apiPath, parm) };
const pageSelf = pagesApp.valoresLocalidade;
const statesCompsSubord = { setMainStatesData1: null, setMainStatesData2: null };

export default function PageValoresLocalidades() {
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
      valoresLocalidade?: ValoresLocalidade[];  // ##!!!!!! xxxItens
    };
  }

  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

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
      const valoresLocalidade = (apiReturn.value.valoresLocalidade as IGenericObject[]).map((data) => ValoresLocalidade.deserialize(data));

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
          valoresLocalidade,
        }
      });
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-getItens`);
      PopupMsg.error(error);
    }
  };
  const setItens = async (filter: FrmFilter, changedLines: IChangedLine[]) => {
    try {
      await apis.crud({ cmd: CmdApi.valoresSet, filter, data: { changedLines } });
      PopupMsg.success(`Valores gravados para ${filter.ano}.`);
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-setItens`);
      PopupMsg.error(error);
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
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-initialization`);
        PopupMsg.error(error);
      });
    return () => { mount = false; };
  }, []);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  if (mainStates.phase == Phase.initiating) return <WaitingObs />;

  const FilterComp = () => {
    const frmFilter = useFrm<FrmFilter>({
      defaultValues: FrmDefaultValues(new FrmFilter(), { revisao: RevisaoValor.atual }),
    });
    const ano = useWatchMy({ control: frmFilter.control, name: ValoresLocalidade.F.ano });
    const revisao = useWatchMy({ control: frmFilter.control, name: ValoresLocalidade.F.revisao });

    React.useEffect(() => {
      const ano = mainStates.processoOrcamentarioArray.length != 0 ? mainStates.processoOrcamentarioArray[0].ano : '';
      frmFilter.setValue(ValoresLocalidade.F.ano, ano);
    }, []);

    const getItensSubmit = async (dataForm: FrmFilter) => {
      const filter = NormalizePropsString(dataForm);
      if (filter.ano == null) return PopupMsg.error('Informe o Ano.');
      if (filter.revisao == null) return PopupMsg.error('Informe a Revisão.');
      getItens(filter);
    };

    return (
      <form onSubmit={frmFilter.handleSubmit(getItensSubmit)}>
        <Stack direction='row' alignItems='center' spacing={1}>
          {/* <SelectMy width='80px'
            value={ano || ''}
            onChange={(ev) => { frmFilter.setValue(ValoresLocalidade.F.ano, ev.target.value); }}
            displayEmpty
            placeHolder='Ano'
            options={[new SelOption('Ano', 'Ano', true), ...mainStates.processoOrcamentarioArray.map((x) => new SelOption(x.ano, x.ano))]}
          /> */}
          <SelAno value={ano} onChange={(newValue) => frmFilter.setValue(ValoresLocalidade.F.ano, newValue || '')}
            options={mainStates.processoOrcamentarioArray.map((x) => new SelOption(x.ano, x.ano))}
          />
          <SelRevisao value={revisao} onChange={(newValue: RevisaoValor) => frmFilter.setValue(ValoresLocalidade.F.revisao, newValue)} />
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
      if (comps.length > 0) return (<Tx>{comps.join(' ')}</Tx>);
      else return (<></>);
    };

    const propsColorsHdr = propsColorHeader();
    const HeaderComp = () => {
      return (
        <>
          <GridCell sticky {...propsColorsHdr}>
            <TxGridHdr>Localidade</TxGridHdr>
          </GridCell>
          {mesesHdr.map((mes, index) =>
            <GridCell key={index} sticky textAlign='right' {...propsColorsHdr}>
              <TxGridHdr>{mes}</TxGridHdr>
            </GridCell>
          )}
        </>
      );
    };

    const LineComp = ({ localidade, canEdit }: { localidade: Localidade, canEdit: boolean }) => {
      //if (node.stateOpen == null) node.stateOpen = (level == 0) ? true : false;

      let dataOriginal = BinSearchItem(dataStructure.valoresLocalidade, localidade.cod, 'localidade');
      if (dataOriginal == null)
        dataOriginal = ValoresLocalidade.fill({ localidade: localidade.cod, valMeses: genValMeses(null) });

      const idLine = `${localidade.cod}`;

      const dataEdit = new DataEdit();

      //#region controle para GridCellEdit
      const fldNewValue = (fldChange: IFldChange) => {
        const { fld, index, value, valueError, initiating } = fldChange;
        if (index == null)
          dataEdit[fld] = value;
        else
          dataEdit[fld][index] = value;
        globalCtrl.logTouchedCells(dataOriginal.localidade, `Localidade ${dataOriginal.localidade}`, fld, index, valueError);
        if (!initiating)
          globalCtrl.setChangedLine(idLine, { localidade: dataOriginal.localidade }, dataEdit);
      };
      const mainCtrl = GridEditMainCtrl.fill({ dataOriginal: dataOriginal, fldNewValue, fontSizeGrid });
      const fldsCtrl = {
        valMeses: GridEditFldCtrl.fill({ fld: 'valMeses', valueType: ValueType.amount, decimals: configCydag.decimalsValsInput, arrayItens: mesesFld.length }),
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
          <Stack direction='row' alignItems='center' spacing={1}>
            <IconButtonAppCrud icon='clear' onClick={() => chgValMeses('clear')} fontSize={fontSizeIconsInGrid} />
            <IconButtonAppCrud icon='redo' onClick={() => chgValMeses('repeat')} fontSize={fontSizeIconsInGrid} />
            <Tx style={cssTextNoWrapEllipsis}>{localidade.descr}</Tx>
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
          <GridCell><TxGridCel style={cssTextNoWrapEllipsis}>{localidade.descr}</TxGridCel></GridCell>
          {mesesFld.map((_, index) => <GridCell key={index} textAlign='right'><TxGridCel>{amountToStrApp(dataOriginal.valMeses[index], 0)}</TxGridCel></GridCell>)}
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

          {[Localidade.fill({ cod: localidadeCoringa.cod, descr: localidadeCoringa.descr }), ...mainStates.localidadeArray].map((localidade, index) =>
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
      <Stack spacing={1} height='100%'>
        <FilterComp />
        <DataComp />
      </Stack>
    </GlobalCtrlContext.Provider>
  );
}