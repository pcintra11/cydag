import React from 'react';
import { useRouter } from 'next/router';

import Box from '@mui/material/Box';
import { Stack, useTheme } from '@mui/material';

import { BinSearchItem, BinSearchProp, ErrorPlus, ForceWait, ObjUpdAllProps } from '../../../libCommon/util';
import { csd } from '../../../libCommon/dbg';
import { IGenericObject } from '../../../libCommon/types';
import { PageDef } from '../../../libCommon/endPoints';
import { CalcExecTime } from '../../../libCommon/calcExectime';
import { CallApiCliASync } from '../../../fetcher/fetcherCli';

import { AbortProc, Btn, BtnLine, SelOption, PopupMsg, WaitingObs, SnackBarError, fontSizeGrid, fontSizeIconsInGrid } from '../../../components';
import { GridCellEdit, GridCell, IFldChange, GridEditFldCtrl, GridEditMainCtrl, ValueType } from '../../../components/grid';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../../hooks/useMyForm';
//import { GlobalState, useGlobalState } from '../../hooks/useGlobalState';

import { configApp } from '../../../app_hub/appConfig';

import { IconButtonAppCrud, IconButtonAppSearch, propsColorHeader, SelAno, SelEntity, SelRevisao } from '../../../appCydag/components';
import { apisApp, pagesApp } from '../../../appCydag/endPoints';
import { useLoggedUser } from '../../../appCydag/useLoggedUser';
import { amountToStr } from '../../../appCydag/util';
import { CentroCusto, Funcionario, Localidade, ProcessoOrcamentario, ProcessoOrcamentarioCentroCusto, Viagem } from '../../../appCydag/modelTypes';
import { CentroCustoConfigOption, IAnoCentroCustos, ProcCentrosCustoConfig, RevisaoValor, OrigemFuncMd, OrigemFunc, ProcessoOrcamentarioStatusMd, OperInProcessoOrcamentario, TipoPlanejViagem } from '../../../appCydag/types';
import { CmdApi_Viagem as CmdApi, IChangedLine, DataEdit, LineState } from '../../api/appCydag/viagem/types';
import { configCydag } from '../../../appCydag/configCydag';

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
  setChangedLine(idLine: string, key: { _id?: string }, lineState: LineState, dataEdit?: DataEdit) {
    const sxChangedLine = this.changedLinesCtrl.findIndex((item) => item.idLine === idLine);
    if (sxChangedLine == -1)
      this.changedLinesCtrl.push({ idLine, changedLine: { key, lineState, dataEdit } });
    else {
      this.changedLinesCtrl[sxChangedLine].changedLine.lineState = lineState;
      if (dataEdit != null)
        this.changedLinesCtrl[sxChangedLine].changedLine.dataEdit = { ...this.changedLinesCtrl[sxChangedLine].changedLine.dataEdit, ...dataEdit };
    }
  }
  touchedCellsClear(idLine: string) {
    this.touchedCells = this.touchedCells.filter((x) => x.idLine !== idLine);
  }
}
export const GlobalCtrlContext = React.createContext<GlobalEditCtrl>(null);

class FrmFilter {
  ano: string;
  revisao: RevisaoValor;
  centroCusto: string;
}

let mount; let mainStatesCache;
const apis = { crud: (parm) => CallApiCliASync<any>(apisApp.viagem.apiPath, parm) };
const pageSelf = pagesApp.viagem;

const statesCompsSubord = { setMainStatesFilter: null, setMainStatesData1: null, setMainStatesData2: null, setStatePreReservedItensPrem: null, setStatePreReservedItensVal: null };
export default function PageViagem() {
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
      localidadeMdArray?: Localidade[]; localidadeDestinoMdArray?: Localidade[]; funcionarioMdArray?: Funcionario[];
      viagemItens?: Viagem[];
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
    const centroCustoMdArray = (apiReturn.value.centroCustoArray as IGenericObject[]).map((data) => CentroCusto.deserialize(data));
    return { procsCentrosCustoConfigAllYears, centroCustoMdArray };
  };
  const getItens = async (filter: FrmFilter) => {
    try {
      const calcExecTimeSearch = new CalcExecTime();
      statesCompsSubord.setMainStatesData2({ dataStructure: { loading: true } });
      statesCompsSubord.setMainStatesData1({ filterApplied: { ...filter } });
      const apiReturn = await apis.crud({ cmd: CmdApi.itensGet, filter });
      const processoOrcamentario = ProcessoOrcamentario.deserialize(apiReturn.value.processoOrcamentario);
      const processoOrcamentarioCentroCusto = ProcessoOrcamentarioCentroCusto.deserialize(apiReturn.value.processoOrcamentarioCentroCusto);
      const localidadeMdArray = (apiReturn.value.localidadeArray as IGenericObject[]).map((data) => Localidade.deserialize(data));
      const localidadeDestinoMdArray = (apiReturn.value.localidadeDestinoArray as IGenericObject[]).map((data) => Localidade.deserialize(data));
      const funcionarioMdArray = (apiReturn.value.funcionarioArray as IGenericObject[]).map((data) => Funcionario.deserialize(data));
      const viagemItens = (apiReturn.value.viagemItens as IGenericObject[]).map((data) => Viagem.deserialize(data));
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
          headerInfo, canEdit,
          processoOrcamentario, processoOrcamentarioCentroCusto,
          localidadeMdArray, localidadeDestinoMdArray, funcionarioMdArray,
          viagemItens,
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
        const { procsCentrosCustoConfigAllYears, centroCustoMdArray } = result;
        const anoCentroCustosArray: IAnoCentroCustos[] = [];
        procsCentrosCustoConfigAllYears.forEach((x) => {
          anoCentroCustosArray.push({
            ano: x.ano,
            centroCustoConfigOptions: x.centroCustoConfig.map((ccConfig) => ({ cod: ccConfig.centroCusto, descr: BinSearchProp(centroCustoMdArray, ccConfig.centroCusto, 'descr', 'cod'), ccConfig })),
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
      defaultValues: FrmDefaultValues(new FrmFilter(), { revisao: RevisaoValor.atual }),
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
        frmFilter.setValue(Funcionario.F.centroCusto, '');
    };

    React.useEffect(() => {
      const ano = mainStates.anoCentroCustosArray.length != 0 ? mainStates.anoCentroCustosArray[0].ano : '';
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
          <SelAno value={ano} onChange={(newValue) => { frmFilter.setValue(Funcionario.F.ano, newValue || ''); mountOptionsCC(newValue); }}
            options={mainStates.anoCentroCustosArray.map((x) => new SelOption(x.ano, x.ano))}
          />
          <SelRevisao value={revisao} onChange={(newValue: RevisaoValor) => frmFilter.setValue(Funcionario.F.revisao, newValue)} />
          {centroCustoOptions != null &&
            <SelEntity value={centroCusto} onChange={(newValue: string) => frmFilter.setValue(Funcionario.F.centroCusto, newValue || '')}
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
    statesCompsSubord.setStatePreReservedItensPrem = new Array(itensPreReserve).fill(undefined);
    statesCompsSubord.setStatePreReservedItensVal = new Array(itensPreReserve).fill(undefined);

    const globalCtrl = React.useContext(GlobalCtrlContext);

    React.useEffect(() => {
      globalCtrl.reset();
    }, [mainStatesData1.filterApplied]);

    if (mainStatesData1.filterApplied == null || mainStatesData2.dataStructure == null) return <></>;
    const dataStructure = mainStatesData2.dataStructure;
    if (dataStructure.loading) return <WaitingObs text='carregando' />;

    let itemPreReserveNextPrem = 0;
    const newLine1 = () => {
      if (itemPreReserveNextPrem > (itensPreReserve - 1))
        return PopupMsg.error('O máximo de itens incluídos e não salvos foi atingido. Favor salvar os dados para incluir mais itens.');
      statesCompsSubord.setStatePreReservedItensPrem[itemPreReserveNextPrem++](LineState.inserted);
    };
    let itemPreReserveNextVal = 0;
    const newLine2 = () => {
      if (itemPreReserveNextVal > (itensPreReserve - 1))
        return PopupMsg.error('O máximo de itens incluídos e não salvos foi atingido. Favor salvar os dados para incluir mais itens.');
      statesCompsSubord.setStatePreReservedItensVal[itemPreReserveNextVal++](LineState.inserted);
    };
    const FuncId = (origem: OrigemFunc, refer: string) => `${origem}/${refer}`;
    const FuncDescr = (funcionario: Funcionario) => `${funcionario.nome} (${OrigemFuncMd.descr(funcionario.origem)}/${funcionario.refer})`;

    const localidadeDestinoOptions = dataStructure.localidadeDestinoMdArray.map((x) => new SelOption(x.cod, x.descr));
    const funcIdOptions = dataStructure.funcionarioMdArray.map((x) => new SelOption(FuncId(x.origem, x.refer), FuncDescr(x)));

    const InfoComp = () => {
      const comps = [];
      if (dataStructure.headerInfo != null)
        comps.push(`${dataStructure.headerInfo}`);
      if (comps.length > 0) return (<Box>{comps.join(' ')}</Box>);
      else return (<></>);
    };

    const propsColorsHdr = propsColorHeader(themePlus);
    const HeaderComp1 = () => {
      return (
        <>
          <GridCell sticky columnSpan={5} textAlign='center' {...propsColorsHdr}>Por Premissas</GridCell>
          <GridCell sticky textAlign='center' {...propsColorsHdr}>
            <Stack direction='row' alignItems='center' gap={1} justifyContent='center'>
              <IconButtonAppCrud icon='create' colorSx={propsColorsHdr.color} onClick={() => newLine1()} />
            </Stack>
          </GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Destino</Box></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Funcionário (opcional)</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Viagens no Ano</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Média de Pernoites</Box></GridCell>
        </>
      );
    };
    const HeaderComp2 = () => {
      return (
        <>
          <GridCell sticky columnSpan={3} textAlign='center' {...propsColorsHdr}>Por Valor</GridCell>
          <GridCell sticky textAlign='center' {...propsColorsHdr}>
            <Stack direction='row' alignItems='center' gap={1} justifyContent='center'>
              <IconButtonAppCrud icon='create' colorSx={propsColorsHdr.color} onClick={() => newLine2()} />
            </Stack>
          </GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><Box>Obs</Box></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><Box>Valor</Box></GridCell>
        </>
      );
    };

    const LineCompPrem = ({ viagem, indexPreReserve, lineSeq, canEdit }: { viagem?: Viagem, indexPreReserve?: number, lineSeq: number, canEdit: boolean }) => {
      //const [, forceRefresh] = React.useState({});
      const [lineState, setLineState] = React.useState(viagem != null ? LineState.original : LineState.reserved);
      const setor = 'prem';

      if (indexPreReserve != null)
        statesCompsSubord.setStatePreReservedItensPrem[indexPreReserve] = setLineState;

      if (lineState === LineState.reserved) return (<></>);

      const dataOriginal = viagem != null ? viagem : Viagem.fill({ tipoPlanejViagem: TipoPlanejViagem.porPremissa });

      const idLine = `${setor}-${lineSeq}`;

      const dataEdit = DataEdit.fill({ tipoPlanejViagem: dataOriginal.tipoPlanejViagem });

      const changeLineState = (lineState: LineState) => {
        setLineState(lineState);
        if (lineState === LineState.deleted ||
          lineState === LineState.aborted) {
          globalCtrl.setChangedLine(idLine, { _id: dataOriginal._id?.toString() }, lineState);
          globalCtrl.touchedCellsClear(idLine);
        }
      };

      //#region controle para GridCellEdit
      const fldNewValue = (fldChange: IFldChange) => {
        const { fld, value, valueError, initiating } = fldChange;
        dataEdit[fld] = value;
        globalCtrl.logTouchedCells(idLine, `${lineSeq} (Por Premissa)`, fld, valueError);
        if (!initiating)
          globalCtrl.setChangedLine(idLine, { _id: dataOriginal._id?.toString() }, lineState, dataEdit);
      };
      const mainCtrl = GridEditMainCtrl.fill({ dataOriginal: dataOriginal, fldNewValue, fontSizeGrid });
      const fldsCtrl = {
        localidadeDestino: GridEditFldCtrl.fill({ fld: 'localidadeDestino', valueType: ValueType.options, options: localidadeDestinoOptions, mandatory: true }),
        funcId: GridEditFldCtrl.fill({ fld: 'funcId', valueType: ValueType.options, options: funcIdOptions }),
        qtdViagens: GridEditFldCtrl.fill({ fld: 'qtdViagens', valueType: ValueType.number, mandatory: true }),
        mediaPernoites: GridEditFldCtrl.fill({ fld: 'mediaPernoites', valueType: ValueType.number, mandatory: true }),
      };
      //#endregion

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
          </Stack>;
        else if (lineState == LineState.inserted)
          iconsCmd = <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
            <IconButtonAppCrud icon='delete' onClick={() => changeLineState(LineState.aborted)} fontSize={fontSizeIconsInGrid} />
          </Stack>;
      }

      if (lineState == LineState.inserted ||
        lineState == LineState.updated) {
        return (
          <>
            <GridCell alignSelf='end'>{iconsCmd}</GridCell>

            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.localidadeDestino} /></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.funcId} /></GridCell>
            <GridCell alignSelf='end' textAlign='right'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.qtdViagens} /></GridCell>
            <GridCell alignSelf='end' textAlign='right'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.mediaPernoites} /></GridCell>
          </>
        );
      }
      else {
        let funcDescr = '';
        if (dataOriginal.funcId != null) {
          const funcionario = BinSearchItem(dataStructure.funcionarioMdArray, dataOriginal.funcId, (x) => FuncId(x.origem, x.refer));
          if (funcionario != null)
            funcDescr = FuncDescr(funcionario);
        }

        return (<>
          <GridCell textAlign='center'>{iconsCmd}</GridCell>

          <GridCell><Box>{BinSearchProp(dataStructure.localidadeMdArray, dataOriginal.localidadeDestino, 'descr', 'cod')}</Box></GridCell>
          <GridCell><Box>{funcDescr}</Box></GridCell>
          <GridCell textAlign='right'>{amountToStr(dataOriginal.qtdViagens, 0)}</GridCell>
          <GridCell textAlign='right'>{amountToStr(dataOriginal.mediaPernoites, 0)}</GridCell>
        </>);
      }
    };

    const LineCompVal = ({ viagem, indexPreReserve, lineSeq, canEdit }: { viagem?: Viagem, indexPreReserve?: number, lineSeq: number, canEdit: boolean }) => {
      const [lineState, setLineState] = React.useState(viagem != null ? LineState.original : LineState.reserved);
      const setor = 'val';

      if (indexPreReserve != null)
        statesCompsSubord.setStatePreReservedItensVal[indexPreReserve] = setLineState;

      if (lineState === LineState.reserved) return (<></>);

      const dataOriginal = viagem != null ? viagem : Viagem.fill({ tipoPlanejViagem: TipoPlanejViagem.porValor });

      const idLine = `${setor}-${lineSeq}`;

      const dataEdit = DataEdit.fill({ tipoPlanejViagem: dataOriginal.tipoPlanejViagem });

      const changeLineState = (lineState: LineState) => {
        setLineState(lineState);
        if (lineState === LineState.deleted ||
          lineState === LineState.aborted) {
          globalCtrl.setChangedLine(idLine, { _id: dataOriginal._id?.toString() }, lineState);
          globalCtrl.touchedCellsClear(idLine);
        }
      };

      //#region controle para GridCellEdit
      const fldNewValue = (fldChange: IFldChange) => {
        const { fld, value, valueError, initiating } = fldChange;
        dataEdit[fld] = value;
        globalCtrl.logTouchedCells(idLine, `${lineSeq} (Por Valor)`, fld, valueError);
        if (!initiating)
          globalCtrl.setChangedLine(idLine, { _id: dataOriginal._id?.toString() }, lineState, dataEdit);
      };
      const mainCtrl = GridEditMainCtrl.fill({ dataOriginal: dataOriginal, fldNewValue, fontSizeGrid });
      const fldsCtrl = {
        obs: GridEditFldCtrl.fill({ fld: 'obs', valueType: ValueType.string, mandatory: true }),
        valor: GridEditFldCtrl.fill({ fld: 'valor', valueType: ValueType.amount, decimals: configCydag.decimalsValsInput, mandatory: true }),
      };
      //#endregion

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
          </Stack>;
        else if (lineState == LineState.inserted)
          iconsCmd = <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
            <IconButtonAppCrud icon='delete' onClick={() => changeLineState(LineState.aborted)} fontSize={fontSizeIconsInGrid} />
          </Stack>;
      }

      if (lineState == LineState.inserted ||
        lineState == LineState.updated) {
        return (
          <>
            <GridCell alignSelf='end'>{iconsCmd}</GridCell>

            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.obs} /></GridCell>
            <GridCell alignSelf='end' textAlign='right'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.valor} /></GridCell>
          </>
        );
      }
      else {
        return (<>
          <GridCell textAlign='center'>{iconsCmd}</GridCell>

          <GridCell><Box>{dataOriginal.obs}</Box></GridCell>
          <GridCell textAlign='right'>{amountToStr(dataOriginal.valor, configCydag.decimalsValsInput)}</GridCell>
        </>);
      }
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

    let lineSeqPrem = 0;
    let lineSeqVal = 0;
    return (
      <Stack gap={1} height='100%'>
        <InfoComp />

        <Box display='grid' gap={0.2} flex='1' overflow='auto'
          gridTemplateColumns={'auto minmax(50px,2fr) minmax(50px,3fr) 1fr 1fr'}
          gridAutoRows='auto' gridAutoColumns='auto'
          justifyItems='stretch' alignItems='stretch'
          justifyContent='start' alignContent='start'
          fontSize={fontSizeGrid}
        >
          <HeaderComp1 />
          {dataStructure.viagemItens.filter((x) => x.tipoPlanejViagem === TipoPlanejViagem.porPremissa).map((viagem, index) =>
            <LineCompPrem key={index} viagem={viagem} lineSeq={++lineSeqPrem} canEdit={dataStructure.canEdit} />
          )}
          {dataStructure.canEdit &&
            <>
              {new Array(itensPreReserve).fill(undefined).map((_, index) =>
                <LineCompPrem key={index} indexPreReserve={index} lineSeq={++lineSeqPrem} canEdit={true} />
              )}
            </>
          }
        </Box>

        <Box display='grid' gap={0.2} flex={1} overflow='auto'
          gridTemplateColumns={'auto minmax(50px,2fr) 1fr'}
          gridAutoRows='auto' gridAutoColumns='auto'
          justifyItems='stretch' alignItems='stretch'
          justifyContent='start' alignContent='start'
          fontSize={fontSizeGrid}
        >
          <HeaderComp2 />
          {dataStructure.viagemItens.filter((x) => x.tipoPlanejViagem === TipoPlanejViagem.porValor).map((viagem, index) =>
            <LineCompVal key={index} viagem={viagem} lineSeq={++lineSeqVal} canEdit={dataStructure.canEdit} />
          )}
          {dataStructure.canEdit &&
            <>
              {new Array(itensPreReserve).fill(undefined).map((_, index) =>
                <LineCompVal key={index} indexPreReserve={index} lineSeq={++lineSeqVal} canEdit={true} />
              )}
            </>
          }
        </Box>

        {dataStructure.canEdit &&
          <Botoes />
        }
      </Stack>
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