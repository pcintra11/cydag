import React from 'react';
import { useRouter } from 'next/router';

import Box from '@mui/material/Box';
import { Stack } from '@mui/material';

import { BinSearchProp, ErrorPlus, ForceWait, ObjUpdAllProps } from '../../../libCommon/util';
import { csd } from '../../../libCommon/dbg';
import { IGenericObject } from '../../../libCommon/types';
import { BooleanToSN } from '../../../libCommon/util';
import { PageDef } from '../../../libCommon/endPoints';
import { CalcExecTime } from '../../../libCommon/calcExectime';
import { CallApiCliASync } from '../../../fetcher/fetcherCli';

import { AbortProc, Btn, BtnLine, SelOption, PopupMsg, WaitingObs, fontSizeGrid, fontSizeIconsInGrid, LogErrorUnmanaged, Tx } from '../../../components';
import { GridCell, GridCellEdit, IFldChange, GridEditFldCtrl, GridEditMainCtrl, ValueType } from '../../../components/grid';
import { FrmDefaultValues, NormalizePropsString, useFrm, useWatchMy } from '../../../hooks/useMyForm';

import { isAmbDev } from '../../../app_base/envs';
import { configApp } from '../../../app_hub/appConfig';

import { IconButtonAppCrud, IconButtonAppSearch, propsColorHeader, SelAno, SelEntity, SelRevisao, TxGridCel, TxGridHdr } from '../../../appCydag/components';
import { apisApp, pagesApp } from '../../../appCydag/endPoints';
import { useLoggedUser } from '../../../appCydag/useLoggedUser';
import { amountToStrApp } from '../../../appCydag/util';
import { CentroCusto, Funcionario, Premissa, ProcessoOrcamentario, ProcessoOrcamentarioCentroCusto } from '../../../appCydag/modelTypes';
import { CentroCustoConfigOption, IAnoCentroCustos, OrigemFunc, OrigemFuncMd, ProcCentrosCustoConfig, RevisaoValor, TipoColaboradorMd, TipoParticipPerOrcamMd, ProcessoOrcamentarioStatusMd, OperInProcessoOrcamentario } from '../../../appCydag/types';

import { CmdApi_Funcionario as CmdApi, FuncionarioClient, IChangedLine, DataEdit, LineState } from '../../api/appCydag/funcionario/types';
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
const apis = { crud: (parm) => CallApiCliASync<any>(apisApp.funcionario.apiPath, parm) };
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
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-getItens`);
      PopupMsg.error(error);
    }
  };
  const setItens = async (filter: FrmFilter, changedLines: IChangedLine[]) => {
    try {
      await apis.crud({ cmd: CmdApi.itensSet, filter, data: { changedLines } });
      PopupMsg.success(`Dados gravados para ${filter.ano} / ${filter.centroCusto}.`);
      getItens(filter);
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
        <Stack direction='row' alignItems='center' spacing={1}>
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

    let itemPreReserveNext = 0;
    const newLine = () => {
      //csd('newLine', mPreReserveNext);
      if (itemPreReserveNext > (itensPreReserve - 1))
        return PopupMsg.error('O máximo de itens incluídos e não salvos foi atingido. Favor salvar os dados para incluir mais itens.');
      statesCompsSubord.setStatePreReservedItens[itemPreReserveNext++](LineState.inserted);
    };
    const FuncId = (funcionario: Funcionario) => `${funcionario.origem}/${funcionario.refer}`;

    const InfoComp = () => {
      const comps = [];
      if (dataStructure.headerInfo != null)
        comps.push(`${dataStructure.headerInfo}`);
      if (comps.length > 0) return (<Tx>{comps.join(' ')}</Tx>);
      else return (<></>);
    };

    const showPromo = isAmbDev(); //#!!!!!!!!!!! devContextCli
    const colsPromo = showPromo ? 3 : 0;

    const propsColorsHdr = propsColorHeader();
    const HeaderComp = () => {
      const permiteNovos = dataStructure.processoOrcamentarioCentroCusto.permiteNovosClb && dataStructure.canEdit;
      return (
        <>
          <GridCell textAlign='center' columnSpan={8} rowSpan={2} {...propsColorsHdr}><TxGridHdr>Informações Gerais</TxGridHdr></GridCell>

          <GridCell textAlign='center' columnSpan={8 + colsPromo + premissaDespRecorrArray.length} {...propsColorsHdr}><TxGridHdr>Participação no Orçamento</TxGridHdr></GridCell>

          <GridCell textAlign='center' columnSpan={1} {...propsColorsHdr}><TxGridHdr></TxGridHdr></GridCell>
          <GridCell textAlign='center' columnSpan={2} {...propsColorsHdr}><TxGridHdr>Início</TxGridHdr></GridCell>
          <GridCell textAlign='center' columnSpan={2} {...propsColorsHdr}><TxGridHdr>Fim</TxGridHdr></GridCell>
          <GridCell textAlign='center' columnSpan={3} {...propsColorsHdr}><TxGridHdr>Valores</TxGridHdr></GridCell>
          {showPromo &&
            <GridCell textAlign='center' columnSpan={colsPromo} {...propsColorsHdr}><TxGridHdr>Promoção</TxGridHdr></GridCell>
          }
          <GridCell textAlign='center' columnSpan={premissaDespRecorrArray.length} {...propsColorsHdr} ><TxGridHdr>Outros</TxGridHdr></GridCell>

          <GridCell sticky textAlign='center' {...propsColorsHdr}>
            {permiteNovos
              ? <Stack direction='row' alignItems='center' spacing={1} justifyContent='center'>
                <IconButtonAppCrud icon='create' colorSx={propsColorsHdr.color} onClick={() => newLine()} />
              </Stack>
              : <></>
            }
          </GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><TxGridHdr>Origem</TxGridHdr></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><TxGridHdr>Refer</TxGridHdr></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><TxGridHdr>Nome</TxGridHdr></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><TxGridHdr>Id Vaga</TxGridHdr></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><TxGridHdr>Tipo Clb.</TxGridHdr></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><TxGridHdr>Função</TxGridHdr></GridCell>
          <GridCell sticky textAlign='left' {...propsColorsHdr}><TxGridHdr>Salário (legado)</TxGridHdr></GridCell>

          <GridCell sticky textAlign='center' {...propsColorsHdr}><TxGridHdr>Ativo</TxGridHdr></GridCell>
          <GridCell sticky textAlign='center' {...propsColorsHdr}><TxGridHdr>Tipo</TxGridHdr></GridCell>
          <GridCell sticky textAlign='center' {...propsColorsHdr}><TxGridHdr>Mês</TxGridHdr></GridCell>
          <GridCell sticky textAlign='center' {...propsColorsHdr}><TxGridHdr>Tipo</TxGridHdr></GridCell>
          <GridCell sticky textAlign='center' {...propsColorsHdr}><TxGridHdr>Mês</TxGridHdr></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Salário</TxGridHdr></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Deps</TxGridHdr></GridCell>
          <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Vale Transp.</TxGridHdr></GridCell>
          {
            showPromo &&
            <>
              <GridCell sticky textAlign='center' {...propsColorsHdr}><TxGridHdr>Mês</TxGridHdr></GridCell>
              <GridCell sticky textAlign='center' {...propsColorsHdr}><TxGridHdr>Tipo Clb.</TxGridHdr></GridCell>
              <GridCell sticky textAlign='right' {...propsColorsHdr}><TxGridHdr>Salário</TxGridHdr></GridCell>
            </>
          }

          {
            premissaDespRecorrArray.map((x, index) =>
              <GridCell key={index} sticky textAlign='center' {...propsColorsHdr}><TxGridHdr>{x.descrDespRecorrFunc}</TxGridHdr></GridCell>
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

      const dataOriginal = funcionarioClient != null ? funcionarioClient : FuncionarioClient.fill({ origem: OrigemFunc.local, refer: `incl. ${indexPreReserve + 1}` });

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
      const mainCtrl = GridEditMainCtrl.fill({ dataOriginal: dataOriginal, fldNewValue, fontSizeGrid });
      const fldsCtrl = {
        nome: GridEditFldCtrl.fill({ fld: 'nome', mandatory: true }),
        idVaga: GridEditFldCtrl.fill({ fld: 'idVaga' }),
        tipoColaborador: GridEditFldCtrl.fill({ fld: 'tipoColaborador', valueType: ValueType.options, options: TipoColaboradorMd.all.map((x) => new SelOption(x.cod, x.descr)), mandatory: true }),
        funcao: GridEditFldCtrl.fill({ fld: 'funcao' }),

        ativo: GridEditFldCtrl.fill({ fld: 'ativo', valueType: ValueType.boolean }),
        tipoIni: GridEditFldCtrl.fill({ fld: 'tipoIni', valueType: ValueType.options, options: TipoParticipPerOrcamMd.all.filter((x) => x.plus.ini).map((x) => new SelOption(x.cod, x.descr)), mandatory: true }),
        mesIni: GridEditFldCtrl.fill({ fld: 'mesIni', valueType: ValueType.number, mandatory: true }),
        tipoFim: GridEditFldCtrl.fill({ fld: 'tipoFim', valueType: ValueType.options, options: [new SelOption('', 'sem'), ...TipoParticipPerOrcamMd.all.filter((x) => x.plus.fim).map((x) => new SelOption(x.cod, x.descr))] }),
        mesFim: GridEditFldCtrl.fill({ fld: 'mesFim', valueType: ValueType.number }),
        salario: GridEditFldCtrl.fill({ fld: 'salario', valueType: ValueType.amount, decimals: configCydag.decimalsSalario, mandatory: true }),
        dependentes: GridEditFldCtrl.fill({ fld: 'dependentes', valueType: ValueType.number }),
        valeTransp: GridEditFldCtrl.fill({ fld: 'valeTransp', valueType: ValueType.amount, decimals: configCydag.decimalsValsInput }),
        mesPromo: GridEditFldCtrl.fill({ fld: 'mesPromo', valueType: ValueType.number }),
        tipoColaboradorPromo: GridEditFldCtrl.fill({ fld: 'tipoColaboradorPromo', valueType: ValueType.options, options: [new SelOption('', 'sem'), ...TipoColaboradorMd.all.map((x) => new SelOption(x.cod, x.descr))] }),
        salarioPromo: GridEditFldCtrl.fill({ fld: 'salarioPromo', valueType: ValueType.amount, decimals: configCydag.decimalsSalario }),
      };
      //#endregion

      let iconsCmd: React.ReactNode = null;
      if (canEdit) {
        if (lineState == LineState.original) {
          iconsCmd = <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
            <IconButtonAppCrud icon='edit' onClick={() => changeLineState(LineState.updated)} fontSize={fontSizeIconsInGrid} />
            <IconButtonAppCrud icon='delete' onClick={() => changeLineState(LineState.deleted)} fontSize={fontSizeIconsInGrid} />
          </Stack>;
        }
        else if (lineState == LineState.deleted)
          iconsCmd = <Tx>excl.</Tx>;
        // else if (lineState == LineState.insertedAndDeleted)
        //   iconsCmd = <IconButtonCrud icon='restoreDelete' onClick={() => changeLineState(LineState.inserted, funcId)} fontSize={fontSizeIconsInGrid} />;
        else if (lineState == LineState.aborted)
          iconsCmd = <Tx>cancel.</Tx>;
        else if (lineState == LineState.updated)
          iconsCmd = <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
            <IconButtonAppCrud icon='delete' onClick={() => changeLineState(LineState.deleted)} fontSize={fontSizeIconsInGrid} />
          </Stack>;
        else if (lineState == LineState.inserted)
          iconsCmd = <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
            <IconButtonAppCrud icon='delete' onClick={() => changeLineState(LineState.aborted)} fontSize={fontSizeIconsInGrid} />
          </Stack>;
      }


      if (lineState == LineState.inserted ||
        lineState == LineState.updated) {

        return (
          <>
            <GridCell alignSelf='end'>{iconsCmd}</GridCell>

            <GridCell alignSelf='end'><TxGridCel>{OrigemFuncMd.descr(dataOriginal.origem)}</TxGridCel></GridCell>
            <GridCell alignSelf='end'><TxGridCel>{dataOriginal.refer}</TxGridCel></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.nome} /></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.idVaga} /></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.tipoColaborador} /></GridCell>
            <GridCell alignSelf='end'><GridCellEdit mainCtrl={mainCtrl} fldCtrl={fldsCtrl.funcao} /></GridCell>
            <GridCell alignSelf='end'><TxGridCel>{amountToStrApp(dataOriginal.salarioLegado, configCydag.decimalsSalario)}</TxGridCel></GridCell>

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

            {premissaDespRecorrArray.map((_, index) => <GridCell alignSelf='end' key={index}><TxGridCel>s</TxGridCel></GridCell>)}
          </>
        );
      }
      else
        return (<>
          <GridCell textAlign='center'>{iconsCmd}</GridCell>

          <GridCell textAlign='left'><TxGridCel>{OrigemFuncMd.descr(dataOriginal.origem)}</TxGridCel></GridCell>
          <GridCell textAlign='left'><TxGridCel>{dataOriginal.refer}</TxGridCel></GridCell>
          <GridCell textAlign='left'><TxGridCel>{dataOriginal.nome}</TxGridCel></GridCell>
          <GridCell textAlign='left'><TxGridCel>{dataOriginal.idVaga}</TxGridCel></GridCell>
          <GridCell textAlign='left'><TxGridCel>{TipoColaboradorMd.descr(dataOriginal.tipoColaborador)}</TxGridCel></GridCell>
          <GridCell textAlign='left'><TxGridCel>{dataOriginal.funcao}</TxGridCel></GridCell>
          <GridCell textAlign='right'><TxGridCel>{amountToStrApp(dataOriginal.salarioLegado, configCydag.decimalsSalario)}</TxGridCel></GridCell>

          <GridCell textAlign='center'><TxGridCel>{BooleanToSN(dataOriginal.ativo)}</TxGridCel></GridCell>
          <GridCell textAlign='center'><TxGridCel>{TipoParticipPerOrcamMd.descr(dataOriginal.tipoIni)}</TxGridCel></GridCell>
          <GridCell textAlign='right'><TxGridCel>{dataOriginal.mesIni}</TxGridCel></GridCell>
          <GridCell textAlign='center'><TxGridCel>{TipoParticipPerOrcamMd.descr(dataOriginal.tipoFim)}</TxGridCel></GridCell>
          <GridCell textAlign='right'><TxGridCel>{dataOriginal.mesFim}</TxGridCel></GridCell>
          <GridCell textAlign='right'><TxGridCel>{amountToStrApp(dataOriginal.salario, configCydag.decimalsSalario)}</TxGridCel></GridCell>
          <GridCell textAlign='right'><TxGridCel>{dataOriginal.dependentes}</TxGridCel></GridCell>
          <GridCell textAlign='right'><TxGridCel>{amountToStrApp(dataOriginal.valeTransp, configCydag.decimalsValsInput)}</TxGridCel></GridCell>
          {showPromo &&
            <>
              <GridCell textAlign='center'><TxGridCel>{dataOriginal.mesPromo}</TxGridCel></GridCell>
              <GridCell textAlign='center'><TxGridCel>{TipoColaboradorMd.descr(dataOriginal.tipoColaboradorPromo)}</TxGridCel></GridCell>
              <GridCell textAlign='right'><TxGridCel>{amountToStrApp(dataOriginal.salarioPromo, configCydag.decimalsSalario)}</TxGridCel></GridCell>
            </>
          }
          {premissaDespRecorrArray.map((_, index) => <GridCell key={index} textAlign='center'><TxGridCel>s</TxGridCel></GridCell>)}
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
      <Stack spacing={1} height='100%'>
        <FilterComp />
        <DataComp />
      </Stack>
    </GlobalCtrlContext.Provider>
  );
}