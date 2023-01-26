import _ from 'underscore';

import { BinSearchItem, RoundDecs } from '../../../../libCommon/util';
import { csd } from '../../../../libCommon/dbg';
import { isAmbDevOrQas } from '../../../../libCommon/isAmb';

import { Funcionario, localidadeCoringa, Viagem, Premissa, Terceiro, ValoresLocalidade, ValoresPremissa, ValoresTransfer } from '../../../../appCydag/modelTypes';
import { RevisaoValor, TipoColaborador, TipoColaboradorMd, TipoParticipPerOrcam, TipoPlanejViagem } from '../../../../appCydag/types';
import { genValMeses } from '../../../../appCydag/util';
import { configApp } from '../../../../appCydag/config';

const attrProcOrc = { mesIni: 1, mesFim: 12 };

export const premissaCod = {
  dissidio: 'dissidio',
  inss: 'inssEmpr',
  fgts: 'fgts',
  provFerias: 'provFerias',

  vr: 'vr',
  //vtCustoFunc: 'vtCustoFunc',
  assMed: 'assMed',
  almoco: 'almoco',
  //encProvFerias: 'encProvFerias',
  encProvFeriasEmpr: 'encProvFeriasEmpr',
  prov13: 'prov13',
  //encProv13: 'enc_prov_13',
  encProv13Empr: 'encProv13Empr',
  segVida: 'segVida',

  // #!!!!!
  telRamal1: 'telRamal1',
  tiSap1: 'tiSap1',
  tiSap2: 'tiSap2',
};

export interface FuncionarioForCalc {
  funcId?: string;
  tipoIni?: TipoParticipPerOrcam;
  mesIni?: number;
  tipoFim?: TipoParticipPerOrcam;
  mesFim?: number;
  dependentes?: number;
  valeTransp?: number;
  valSalarioMeses: number[];
  tipoColaboradorMeses: TipoColaborador[];
  despsRecorr: string[];
  obs: string[];
}

export interface PremissaValores { premissa: Premissa, valoresPrior1: ValoresPremissa[], valoresPrior2: ValoresPremissa[] }

//export interface ContaCalc { classeCusto: string, subClasseCusto?: string, calc: any }

export interface ValsContaCalc { tipoCalc: string, valMeses: number[], countMeses: number[], anyValue: boolean, memoriaCalcDets?: any[] }
export const RoundCalc = (value: number) => RoundDecs(value, configApp.decimalsValsCalc);

export const ValorPremissaUse = (premisaValores: PremissaValores, tipoColaborador?: TipoColaborador) => {
  let result: ValoresPremissa = null;
  if (premisaValores != null) {
    if (premisaValores.premissa.segmTipoClb) {
      result = premisaValores.valoresPrior1.find((x) => x.tipoColaborador == tipoColaborador);
      if (result == null)
        result = premisaValores.valoresPrior2.find((x) => x.tipoColaborador == tipoColaborador);
    }
    else {
      result = premisaValores.valoresPrior1.find((x) => x.tipoColaborador == null);
      if (result == null)
        result = premisaValores.valoresPrior2.find((x) => x.tipoColaborador == null);
    }
  }
  return result;
};

/**
 * Gera um array de funcionarios com o salario e tipoColaborador 'no tempo'
 */
export function FuncionariosForCalc(centroCusto: string, premissaDissidioVals: PremissaValores, funcionarios: Funcionario[], revisao: RevisaoValor) {
  const result: FuncionarioForCalc[] = [];

  //csl('premissaDissidioVals', JSON.stringify(premissaDissidioVals, null, 2));
  let lastCentrCusto = null;
  // para cada funcionario calcula os valores de salario base em cada mes
  for (const funcionario of funcionarios) {
    if (lastCentrCusto != null) {
      if (funcionario.centroCusto < lastCentrCusto)
        throw new Error('Funcionarios não classificado por centro de custo');
    }
    lastCentrCusto = funcionario.centroCusto;
    if (funcionario.centroCusto < centroCusto) continue;
    // #!!!! separar em dois processos, um para filtrar os funcs e outro para aplicar o dissidio, remover todos os funcs já calculados, liberar memoria
    if (funcionario.centroCusto > centroCusto) break;

    const valSalarioMeses = genValMeses(0);
    const tipoColaboradorMeses = genValMeses(null);

    const funcionarioRevisao = funcionario[Funcionario.funcionarioRevisao(revisao)];
    if (funcionarioRevisao == null || !funcionarioRevisao.ativo) continue;

    let salario = Funcionario.unscrambleSalario(funcionarioRevisao.salario_messy, funcionario.centroCusto, funcionario.refer);

    let tipoColaborador = funcionario.tipoColaborador;
    for (let mes = attrProcOrc.mesIni; mes <= attrProcOrc.mesFim; mes++) {

      if (funcionarioRevisao.mesIni != null && mes < funcionarioRevisao.mesIni) continue;
      if (funcionarioRevisao.mesFim != null && mes > funcionarioRevisao.mesFim) break;

      const indexMes = mes - 1;

      if (mes == funcionarioRevisao.mesPromo) {
        salario = Funcionario.unscrambleSalario(funcionarioRevisao.salarioPromo_messy, funcionario.centroCusto, funcionario.refer);
        tipoColaborador = funcionarioRevisao.tipoColaboradorPromo;
      }

      const premissaDissidioVal = ValorPremissaUse(premissaDissidioVals, tipoColaborador);

      if (premissaDissidioVal != null &&
        premissaDissidioVal.valMeses[indexMes] != null &&
        premissaDissidioVal.valMeses[indexMes] != 0)
        salario += RoundCalc(salario * (premissaDissidioVal.valMeses[indexMes] / 100));

      // if (nbMes == mesMerito)
      //   nbSalario *= (1 + (lc.obFuncionarioRevisao.perc_merito1 / 100));

      valSalarioMeses[indexMes] = salario;
      tipoColaboradorMeses[indexMes] = tipoColaborador;
    }
    const funcionarioForCalc = {
      funcId: `${funcionario.origem}/${funcionario.refer}`,
      tipoIni: funcionarioRevisao.tipoIni,
      mesIni: funcionarioRevisao.mesIni,
      tipoFim: funcionarioRevisao.tipoFim,
      mesFim: funcionarioRevisao.mesFim,
      dependentes: funcionarioRevisao.dependentes,
      valeTransp: funcionarioRevisao.valeTransp,
      valSalarioMeses,
      tipoColaboradorMeses,
      despsRecorr: funcionarioRevisao.despsRecorr,
      obs: [],
    } as FuncionarioForCalc;
    funcionarioForCalc.obs.push(`tipoClb: ${funcionario.tipoColaborador}, sal: ${Funcionario.unscrambleSalario(funcionarioRevisao.salario_messy, funcionario.centroCusto, funcionario.refer)}`);
    if (funcionarioRevisao.mesPromo != null)
      funcionarioForCalc.obs.push(`promo: mes ${funcionarioRevisao.mesPromo}, tipoClb: ${funcionarioRevisao.tipoColaboradorPromo}, sal: ${Funcionario.unscrambleSalario(funcionarioRevisao.salarioPromo_messy, funcionario.centroCusto, funcionario.refer)}`);
    //csl({ funcionarioRevisao, funcionarioForCalc });
    result.push(funcionarioForCalc);
  }
  return result;
}

const calcContaSalario = (tipoCalc: string, funcionariosForCalc: FuncionarioForCalc[], tipoColaboradorArray: TipoColaborador[], showCalcFunc = false) => {
  const showCalcUse = showCalcFunc && isAmbDevOrQas();
  const memoriaCalcDets: any = [];
  const valMeses = genValMeses(0); const countMeses = genValMeses(0); let anyValue = false;
  for (const item of funcionariosForCalc) {
    const memoriaCalcFunc: any = { funcId: item.funcId, obs: item.obs.join(';') };
    let anyValueFunc = false;
    for (let mes = Math.max(attrProcOrc.mesIni, item.mesIni || 0); mes <= Math.min(attrProcOrc.mesFim, item.mesFim || 12); mes++) {
      const indexMes = mes - 1;
      if (!tipoColaboradorArray.includes(item.tipoColaboradorMeses[indexMes])) continue;
      if (item.valSalarioMeses[indexMes] == 0) continue;
      const calc = item.valSalarioMeses[indexMes];
      valMeses[indexMes] += calc;
      countMeses[indexMes]++;
      anyValueFunc = true;
      memoriaCalcFunc[`m${mes}`] = calc;
    }
    (showCalcUse && anyValueFunc) && memoriaCalcDets.push(memoriaCalcFunc);
    anyValue = anyValue || anyValueFunc;
  }
  return { tipoCalc, valMeses, countMeses, anyValue, memoriaCalcDets } as ValsContaCalc;
};
const calcContaAvisoPrevio = (funcionariosForCalc: FuncionarioForCalc[], showCalcFunc = false) => {
  const showCalcUse = showCalcFunc && isAmbDevOrQas();
  const memoriaCalcDets: any = [];
  const valMeses = genValMeses(0); const countMeses = genValMeses(0); let anyValue = false;
  for (const item of funcionariosForCalc) {
    const memoriaCalcFunc: any = { funcId: item.funcId, obs: item.obs.join(';') };
    let anyValueFunc = false;
    if (item.tipoFim != TipoParticipPerOrcam.desl) continue;
    if (item.mesFim >= attrProcOrc.mesIni && item.mesFim <= attrProcOrc.mesFim) {
      const mes = item.mesFim;
      const indexMes = mes - 1;
      // if (memoriaCalcFunc.infosTempo.length == 0 ||
      //   memoriaCalcFunc.infosTempo[memoriaCalcFunc.infosTempo.length - 1].salario != item.valSalarioMeses[indexMes])
      //   memoriaCalcFunc.infosTempo.push({ mes, salario: item.valSalarioMeses[indexMes] });
      if (item.valSalarioMeses[indexMes] == 0) continue;
      const calc = item.valSalarioMeses[indexMes];
      valMeses[indexMes] += calc;
      countMeses[indexMes]++;
      anyValueFunc = true;
      memoriaCalcFunc[`m${mes}`] = calc;
    }
    (showCalcUse && anyValueFunc) && memoriaCalcDets.push(memoriaCalcFunc);
    anyValue = anyValue || anyValueFunc;
  }
  return { tipoCalc: 'avisoPrevio', valMeses, countMeses, anyValue, memoriaCalcDets } as ValsContaCalc;
};
const calcContasPercSalario = (tipoCalc: string, funcionariosForCalc: FuncionarioForCalc[], tipoColaboradorArray: TipoColaborador[], premissaVals: PremissaValores, dobraMesDesl: boolean, showCalcFunc = false) => {
  const showCalcUse = showCalcFunc && isAmbDevOrQas();
  const memoriaCalcDets: any = [];
  const valMeses = genValMeses(0); const countMeses = genValMeses(0); let anyValue = false;
  if (premissaVals != null) {
    for (const item of funcionariosForCalc) {
      const memoriaCalcFunc: any = { funcId: item.funcId, obs: item.obs.join(';') };
      let anyValueFunc = false;
      for (let mes = Math.max(attrProcOrc.mesIni, item.mesIni || 0); mes <= Math.min(attrProcOrc.mesFim, item.mesFim || 12); mes++) {
        const indexMes = mes - 1;
        if (tipoColaboradorArray != null && !tipoColaboradorArray.includes(item.tipoColaboradorMeses[indexMes])) continue;
        const premissaVal = ValorPremissaUse(premissaVals, item.tipoColaboradorMeses[indexMes]);
        if (premissaVal != null) {
          if (premissaVal.valMeses[indexMes] == null || premissaVal.valMeses[indexMes] == 0) continue;
          // if (memoriaCalcFunc.infosTempo.length == 0 ||
          //   memoriaCalcFunc.infosTempo[memoriaCalcFunc.infosTempo.length - 1].salario != item.valSalarioMeses[indexMes] ||
          //   memoriaCalcFunc.infosTempo[memoriaCalcFunc.infosTempo.length - 1].tipoColaborador != item.tipoColaboradorMeses[indexMes])
          //   memoriaCalcFunc.infosTempo.push({ mes, salario: item.valSalarioMeses[indexMes], tipoColaborador: item.tipoColaboradorMeses[indexMes] });
          if (item.valSalarioMeses[indexMes] == 0) continue;
          let calc = RoundCalc((item.valSalarioMeses[indexMes] * (premissaVal.valMeses[indexMes] / 100)));
          if (dobraMesDesl &&
            item.tipoFim == TipoParticipPerOrcam.desl &&
            item.mesFim == mes)
            calc *= 2;
          valMeses[indexMes] += calc;
          countMeses[indexMes]++;
          anyValueFunc = true;
          memoriaCalcFunc[`m${mes}`] = calc;
        }
      }
      (showCalcUse && anyValueFunc) && memoriaCalcDets.push(memoriaCalcFunc);
      anyValue = anyValue || anyValueFunc;
    }
  }
  return { tipoCalc, valMeses, countMeses, anyValue, memoriaCalcDets } as ValsContaCalc;
};
const calcContasValorPorPessoa = (tipoCalc: string, funcionariosForCalc: FuncionarioForCalc[], tipoColaboradorArray: TipoColaborador[], premissaVals: PremissaValores, incluiDependentes: boolean, showCalcFunc = false) => {
  const showCalcUse = showCalcFunc && isAmbDevOrQas();
  const memoriaCalcDets: any = [];
  const valMeses = genValMeses(0); const countMeses = genValMeses(0); let anyValue = false;
  if (premissaVals != null) {
    for (const item of funcionariosForCalc) {
      const memoriaCalcFunc: any = { funcId: item.funcId, deps: item.dependentes, obs: item.obs.join(';') };
      let anyValueFunc = false;
      const nrPessoas = incluiDependentes ? 1 + (item.dependentes || 0) : 1;
      for (let mes = Math.max(attrProcOrc.mesIni, item.mesIni || 0); mes <= Math.min(attrProcOrc.mesFim, item.mesFim || 12); mes++) {
        const indexMes = mes - 1;
        if (tipoColaboradorArray != null && !tipoColaboradorArray.includes(item.tipoColaboradorMeses[indexMes])) continue;
        const premissaVal = ValorPremissaUse(premissaVals, item.tipoColaboradorMeses[indexMes]);
        if (premissaVal != null) {
          if (premissaVal.valMeses[indexMes] == null || premissaVal.valMeses[indexMes] == 0) continue;
          // if (memoriaCalcFunc.infosTempo.length == 0 ||
          //   memoriaCalcFunc.infosTempo[memoriaCalcFunc.infosTempo.length - 1].tipoColaborador != item.tipoColaboradorMeses[indexMes])
          //   memoriaCalcFunc.infosTempo.push({ mes, tipoColaborador: item.tipoColaboradorMeses[indexMes] });
          const calc = RoundCalc(premissaVal.valMeses[indexMes] * nrPessoas);
          valMeses[indexMes] += calc;
          countMeses[indexMes]++;
          anyValueFunc = true;
          memoriaCalcFunc[`m${mes}`] = calc;
        }
      }
      (showCalcUse && anyValueFunc) && memoriaCalcDets.push(memoriaCalcFunc);
      anyValue = anyValue || anyValueFunc;
    }
  }
  return { tipoCalc, valMeses, countMeses, anyValue, memoriaCalcDets } as ValsContaCalc;
};
const calcConta_vt = (funcionariosForCalc: FuncionarioForCalc[], showCalcFunc = false) => {
  const showCalcUse = showCalcFunc && isAmbDevOrQas();
  const memoriaCalcDets: any = [];
  const valMeses = genValMeses(0); const countMeses = genValMeses(0); let anyValue = false;
  for (const item of funcionariosForCalc) {
    if (item.valeTransp == null || item.valeTransp == 0) continue;
    const calc = item.valeTransp;
    const memoriaCalcFunc: any = { funcId: `${item.funcId}`, vt: item.valeTransp };
    let anyValueFunc = false;
    for (let mes = Math.max(attrProcOrc.mesIni, item.mesIni || 0); mes <= Math.min(attrProcOrc.mesFim, item.mesFim || 12); mes++) {
      const indexMes = mes - 1;
      valMeses[indexMes] += calc;
      countMeses[indexMes]++;
      anyValueFunc = true;
      memoriaCalcFunc[`m${mes}`] = calc;
    }
    (showCalcUse && anyValueFunc) && memoriaCalcDets.push(memoriaCalcFunc);
    anyValue = anyValue || anyValueFunc;
  }
  return { tipoCalc: 'vt', valMeses, countMeses, anyValue, memoriaCalcDets } as ValsContaCalc;
};
export const calcContaDespCorr = (despRecorr: string, funcionariosForCalc: FuncionarioForCalc[], premissaVals: PremissaValores, showCalcFunc = false) => {
  const showCalcUse = showCalcFunc && isAmbDevOrQas();
  const memoriaCalcDets: any = [];
  //csl('premissa vals', despRecorr, JSON.stringify(premissaVals, null, 2));

  const valMeses = genValMeses(0); const countMeses = genValMeses(0); let anyValue = false;
  if (premissaVals != null) {
    for (const item of funcionariosForCalc) {
      //csl({item});
      if (item.despsRecorr == null || !item.despsRecorr.includes(despRecorr)) continue;
      const memoriaCalcFunc: any = { funcId: item.funcId, obs: item.obs.join(';') };
      let anyValueFunc = false;
      for (let mes = Math.max(attrProcOrc.mesIni, item.mesIni || 0); mes <= Math.min(attrProcOrc.mesFim, item.mesFim || 12); mes++) {
        const indexMes = mes - 1;
        const premissaVal = ValorPremissaUse(premissaVals, item.tipoColaboradorMeses[indexMes]);
        //csl('premissa val use tipoclb', item.tipoColaboradorMeses[indexMes], {premissaVal});
        if (premissaVal != null) {
          if (premissaVal.valMeses[indexMes] == null || premissaVal.valMeses[indexMes] == 0) continue;
          // if (memoriaCalcFunc.infosTempo.length == 0 ||
          //   memoriaCalcFunc.infosTempo[memoriaCalcFunc.infosTempo.length - 1].tipoColaborador != item.tipoColaboradorMeses[indexMes])
          //   memoriaCalcFunc.infosTempo.push({ mes, tipoColaborador: item.tipoColaboradorMeses[indexMes] });
          const calc = premissaVal.valMeses[indexMes];
          valMeses[indexMes] += calc;
          countMeses[indexMes]++;
          anyValueFunc = true;
          memoriaCalcFunc[`m${mes}`] = calc;
        }
      }
      (showCalcUse && anyValueFunc) && memoriaCalcDets.push(memoriaCalcFunc);
      anyValue = anyValue || anyValueFunc;
    }
  }
  return { tipoCalc: despRecorr, valMeses, countMeses, anyValue, memoriaCalcDets } as ValsContaCalc;
};

const calcConta_viagens = (viagens: Viagem[], valoresLocalidades: ValoresLocalidade[], valoresTransfersCCOrigem: ValoresTransfer[]) => {
  const memoriaCalcDets: any = [];
  const valMeses = genValMeses(0); const countMeses = genValMeses(0); let anyValue = false;
  const mesesProcessoOrcamentario = (attrProcOrc.mesFim - attrProcOrc.mesIni) + 1;
  for (const item of viagens) {
    const memoriaCalc: any = item.tipoPlanejViagem === TipoPlanejViagem.porPremissa
      ? { viagem: _.pick(item, ['localidadeDestino', 'qtdViagens', 'mediaPernoites']) }
      : { viagem: _.pick(item, ['valor', 'obs']) };


    for (let mes = attrProcOrc.mesIni; mes <= attrProcOrc.mesFim; mes++) {
      const indexMes = mes - 1;
      let calc = 0;
      if (item.tipoPlanejViagem === TipoPlanejViagem.porPremissa) {
        const qtdViagensMes = (item.qtdViagens / mesesProcessoOrcamentario);
        const valoresTransfer = BinSearchItem(valoresTransfersCCOrigem, item.localidadeDestino, 'localidadeDestino');
        if (valoresTransfer != null &&
          valoresTransfer.valMeses[indexMes] != null && valoresTransfer.valMeses[indexMes] != 0)
          calc += valoresTransfer.valMeses[indexMes] * qtdViagensMes;
        let valoresLocalidade = BinSearchItem(valoresLocalidades, item.localidadeDestino, 'localidade');
        if (valoresLocalidade == null)
          valoresLocalidade = BinSearchItem(valoresLocalidades, localidadeCoringa.cod, 'localidade');
        if (valoresLocalidade != null &&
          valoresLocalidade.valMeses[indexMes] != null && valoresLocalidade.valMeses[indexMes] != 0)
          calc += valoresLocalidade.valMeses[indexMes] * (qtdViagensMes * item.mediaPernoites);
      }
      else if (item.tipoPlanejViagem === TipoPlanejViagem.porValor)
        calc = item.valor / mesesProcessoOrcamentario;
      if (calc == 0) continue;
      calc = RoundCalc(calc);
      valMeses[indexMes] += calc;
      countMeses[indexMes]++;
      anyValue = true;
      memoriaCalc[`m${mes}`] = calc;
    }
    memoriaCalcDets.push(memoriaCalc);
  }
  return { tipoCalc: 'terceiros', valMeses, countMeses, anyValue, memoriaCalcDets } as ValsContaCalc;
};

const calcConta_terceiros = (terceiros: Terceiro[]) => {
  const memoriaCalcDets: any = [];
  const valMeses = genValMeses(0); const countMeses = genValMeses(0); let anyValue = false;
  for (const item of terceiros) {
    const memoriaCalc: any = { refer: item.refer };
    for (let mes = attrProcOrc.mesIni; mes <= attrProcOrc.mesFim; mes++) {
      const indexMes = mes - 1;
      if (item.valMeses[indexMes] == null || item.valMeses[indexMes] == 0) continue;
      const calc = item.valMeses[indexMes];
      valMeses[indexMes] += calc;
      countMeses[indexMes]++;
      anyValue = true;
      memoriaCalc[`m${mes}`] = calc;
    }
    memoriaCalcDets.push(memoriaCalc);
  }
  return { tipoCalc: 'terceiros', valMeses, countMeses, anyValue, memoriaCalcDets } as ValsContaCalc;
};

export const contasCalc = {
  salario: { classeCusto: '5200201001', calc: (funcionarioForCalc: FuncionarioForCalc[], showCalcFunc = false) => calcContaSalario('salClt', funcionarioForCalc, [TipoColaborador.clt, TipoColaborador.aprendiz, TipoColaborador.dir_clt], showCalcFunc) },
  admServs: { classeCusto: '5200504030', calc: (funcionarioForCalc: FuncionarioForCalc[], showCalcFunc = false) => calcContaSalario('salPJ', funcionarioForCalc, [TipoColaborador.gestorpj, TipoColaborador.dir_pj], showCalcFunc) },
  bolsaAux: { classeCusto: '5200208007', calc: (funcionarioForCalc: FuncionarioForCalc[], showCalcFunc = false) => calcContaSalario('salEstag', funcionarioForCalc, [TipoColaborador.estag], showCalcFunc) },
  prolabore: { classeCusto: '5200206003', calc: (funcionarioForCalc: FuncionarioForCalc[], showCalcFunc = false) => calcContaSalario('salDir', funcionarioForCalc, [TipoColaborador.dir], showCalcFunc) },

  avisoPrevio: { classeCusto: '5200201003', calc: (funcionarioForCalc: FuncionarioForCalc[], showCalcFunc = false) => calcContaAvisoPrevio(funcionarioForCalc, showCalcFunc) },
  inss: { classeCusto: '5200205001', calc: (funcionarioForCalc: FuncionarioForCalc[], premissaVals: PremissaValores, showCalcFunc = false) => calcContasPercSalario('inss', funcionarioForCalc, TipoColaboradorMd.all.filter(x => x.plus.calcINSS).map(x => x.cod), premissaVals, true, showCalcFunc) },
  inssHonorarios: { classeCusto: '5200206050', calc: (funcionarioForCalc: FuncionarioForCalc[], premissaVals: PremissaValores, showCalcFunc = false) => calcContasPercSalario('inssHonorarios', funcionarioForCalc, TipoColaboradorMd.all.filter(x => x.plus.calcINSSHonorarios).map(x => x.cod), premissaVals, true, showCalcFunc) },
  fgts: { classeCusto: '5200205002', calc: (funcionarioForCalc: FuncionarioForCalc[], premissaVals: PremissaValores, showCalcFunc = false) => calcContasPercSalario('fgts', funcionarioForCalc, null, premissaVals, true, showCalcFunc) },
  provFerias: { classeCusto: '5200203001', calc: (funcionarioForCalc: FuncionarioForCalc[], premissaVals: PremissaValores, showCalcFunc = false) => calcContasPercSalario('provFerias', funcionarioForCalc, null, premissaVals, false, showCalcFunc) },
  encProvFerias: { classeCusto: '5200203002', calc: (funcionarioForCalc: FuncionarioForCalc[], premissaVals: PremissaValores, showCalcFunc = false) => calcContasPercSalario('encProvFerias', funcionarioForCalc, null, premissaVals, false, showCalcFunc) },
  prov13: { classeCusto: '5200204001', calc: (funcionarioForCalc: FuncionarioForCalc[], premissaVals: PremissaValores, showCalcFunc = false) => calcContasPercSalario('prov13', funcionarioForCalc, null, premissaVals, false, showCalcFunc) },
  encProv13: { classeCusto: '5200204002', calc: (funcionarioForCalc: FuncionarioForCalc[], premissaVals: PremissaValores, showCalcFunc = false) => calcContasPercSalario('encProv13', funcionarioForCalc, null, premissaVals, false, showCalcFunc) },
  segVida: { classeCusto: '5200208003', calc: (funcionarioForCalc: FuncionarioForCalc[], premissaVals: PremissaValores, showCalcFunc = false) => calcContasPercSalario('segVida', funcionarioForCalc, null, premissaVals, false, showCalcFunc) },
  assMed: { classeCusto: '5200208001', calc: (funcionarioForCalc: FuncionarioForCalc[], premissaVals: PremissaValores, showCalcFunc = false) => calcContasValorPorPessoa('assMed', funcionarioForCalc, null, premissaVals, true, showCalcFunc) },
  vr: { classeCusto: '5200208004', calc: (funcionarioForCalc: FuncionarioForCalc[], premissaVals: PremissaValores, showCalcFunc = false) => calcContasValorPorPessoa('vr', funcionarioForCalc, null, premissaVals, false, showCalcFunc) },
  vt: { classeCusto: '5200208009', calc: (funcionarioForCalc: FuncionarioForCalc[], showCalcFunc = false) => calcConta_vt(funcionarioForCalc, showCalcFunc) },

  viagens: { classeCusto: '5200503001', calc: (viagens: Viagem[], valoresLocalidades: ValoresLocalidade[], valoresTransfersCCOrigem: ValoresTransfer[]) => calcConta_viagens(viagens, valoresLocalidades, valoresTransfersCCOrigem) },

  terceiros: { classeCusto: '5200504025', calc: (terceiros: Terceiro[]) => calcConta_terceiros(terceiros) },
};

// para as contas abaixo mudei a origem para 'calculada (não é tot calculada com detalhes) - já fiz no qlt
// var ap_ob_item_viagens          = { cod_classe_custo: "5200503001" , cod_sub_classe_custo: "01" } ;
// var ap_ob_item_almoco           = { cod_classe_custo: "5200503004" , cod_sub_classe_custo: "01" } ;
// var ap_ob_item_terceiros

// export const contasCalc: ContaCalc[] = [
//   calcSalario, calcAdmServs, calcBolsaAux, calcProlabore,
//   calcAvisoPrevio,
// ];
