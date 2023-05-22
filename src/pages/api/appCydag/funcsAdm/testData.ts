import _ from 'underscore';

import { compareForBinSearch, CtrlCollect, ErrorPlus, OnlyPropsInClass, StrRight } from '../../../../libCommon/util';

import { anoAdd, mesesFld, multiplyValMeses, sumValMeses } from '../../../../appCydag/util';
import { CategRegional, OrigemFunc, ProcessoOrcamentarioStatus, RevisaoValor, TipoColaborador, TipoParticipPerOrcam, TipoPlanejViagem, TipoSegmCentroCusto } from '../../../../appCydag/types';
import { CentroCustoModel, EmpresaModel, UnidadeNegocioModel, LocalidadeModel, AgrupPremissasModel, DiretoriaModel, GerenciaModel, ValoresRealizadosModel, PremissaModel, ValoresPremissaModel, ViagemModel, ValoresLocalidadeModel, ValoresTransferModel, FuncionarioModel, ProcessoOrcamentarioCentroCustoModel, TerceiroModel, ValoresImputadosModel, ValoresRealizadosInterfaceSapModel, ProcessoOrcamentarioModel } from '../../../../appCydag/models';
import { Funcionario, FuncionarioRevisao, empresaCoringa, localidadeCoringa, ValoresImputados } from '../../../../appCydag/modelTypes';

import { premissaCod } from '../valoresContas/calcsCydag';
import { accountDeveloper } from '../user/auth';

import { CmdApi_FuncAdm } from './types';

export const DataTestCydag = async (cmd: CmdApi_FuncAdm) => {
  const agora = new Date();

  //#region dados teste comuns
  const ano = '2001';
  const mesesLen = mesesFld.length;

  const testUn1p = { unidadeNegocio: '_UN1P', descr: 'Unidade de Negócio 1 (teste - regionais principais)', categRegional: CategRegional.principais };
  const testUn2o = { unidadeNegocio: '_UN2O', descr: 'Unidade de Negócio 2 (teste - regional outras)', categRegional: CategRegional.outras };
  const testUn3 = { unidadeNegocio: '_UN3', descr: 'Unidade de Negócio 3 (teste - sem regional)', categRegional: null };
  const unArray = [testUn1p, testUn2o, testUn3];

  const dir1 = { diretoria: '_DIR1', descr: 'Diretoria 1 (teste)' };
  const dir2 = { diretoria: '_DIR2', descr: 'Diretoria 2 (teste)' };
  const dir3 = { diretoria: '_DIR3', descr: 'Diretoria 3 (teste)' };
  const dirArray = [dir1, dir2, dir3];

  const ger1 = { gerencia: '_GER1', descr: 'Gerencia 1 (teste)' };
  const ger2 = { gerencia: '_GER2', descr: 'Gerencia 2 (teste)' };
  const gerArray = [ger1, ger2];

  const empr1 = { empresa: '_TST1', descr: 'Empresa 1 (teste)' };
  const empr2 = { empresa: '_TST2', descr: 'Empresa 2 (teste)' };
  const emprArray = [empr1, empr2];

  const agrup1 = { agrupPremissas: '_AGRUP1', descr: 'Agrupamento 1 (teste - sudeste)' };
  const agrup2 = { agrupPremissas: '_AGRUP2', descr: 'Agrupamento 2 (teste - sul)' };
  const agrupArray = [agrup1, agrup2];

  const localidade1 = { localidade: 'L1', descr: 'Localidade 1 (teste)' };
  const localidade2 = { localidade: 'L2', descr: 'Localidade 2 (teste)' };
  const localidade3 = { localidade: 'L3', descr: 'Localidade 3 (teste)' };
  const localidadeArray = [localidade1, localidade2, localidade3];

  // cc10 cc11 são idênticos, mudam apenas as premissas localidade e UN
  // cc10 cc12 são idênticos, mudam apenas as premissas por agrup premissas
  // final cc10 são idênticos, mudam apenas as premissas por empresa
  const empr1_cc10 = { centroCusto: `${empr1.empresa}_CC10`, agrupPremissas: agrup1.agrupPremissas, localidade: localidade1.localidade, unidadeNegocio: testUn1p.unidadeNegocio, diretoria: dir1.diretoria, gerencia: ger1.gerencia };
  const empr1_cc11 = { centroCusto: `${empr1.empresa}_CC11`, agrupPremissas: agrup1.agrupPremissas, localidade: localidade2.localidade, unidadeNegocio: testUn2o.unidadeNegocio, diretoria: dir2.diretoria, gerencia: ger2.gerencia };
  const empr1_cc12 = { centroCusto: `${empr1.empresa}_CC12`, agrupPremissas: agrup2.agrupPremissas, localidade: localidade1.localidade, unidadeNegocio: testUn1p.unidadeNegocio, diretoria: dir1.diretoria };
  const empr2_cc10 = { centroCusto: `${empr2.empresa}_CC10`, agrupPremissas: agrup1.agrupPremissas, localidade: localidade1.localidade, unidadeNegocio: testUn1p.unidadeNegocio, diretoria: dir2.diretoria };
  const empr1_cc20 = { centroCusto: `${empr1.empresa}_CC20`, agrupPremissas: null, localidade: localidade1.localidade, unidadeNegocio: testUn3.unidadeNegocio };
  const empr1_cc30 = { centroCusto: `${empr1.empresa}_CC30`, agrupPremissas: agrup2.agrupPremissas, localidade: localidade2.localidade, diretoria: dir2.diretoria };
  const empr1_cc40 = { centroCusto: `${empr1.empresa}_CC40`, agrupPremissas: agrup1.agrupPremissas, localidade: localidade1.localidade, unidadeNegocio: testUn1p.unidadeNegocio };
  const empr1_cc50 = { centroCusto: `${empr1.empresa}_CC50`, agrupPremissas: agrup1.agrupPremissas, localidade: localidade1.localidade };
  const ccArray: any[] = [empr1_cc10, empr1_cc11, empr1_cc12, empr1_cc20, empr1_cc30, empr1_cc40, empr1_cc50, empr2_cc10];
  ccArray.forEach((x) => x.descr = `${x.centroCusto}, agrup ${x.agrupPremissas || '(sem)'} un ${x.unidadeNegocio || '(sem)'}, dir: ${x.diretoria || '(sem)'}, ger: ${x.gerencia || '(sem)'} (teste)`);

  const clCustoImputNorm1 = '5200208012';
  const clCustoImputNorm2 = '5200207001';
  const clCustoImputNorm3 = '5200504021';
  const clCustoImputNorm4 = '5200505002';
  const clCustoImputDet1 = '5200503005';
  const clCustoImputDet2 = '5200504002';
  const clCustoCalcNorm1 = '5200201001'; // salarios
  const clCustoCalcNorm2 = '5200205001'; // inss

  //#endregion

  if (cmd == CmdApi_FuncAdm.setTesteDataPlan) {
    //if (!isAmbDev()) throw new Error('Apenas em dev e tst é possível criar dados de teste'); //@!!!!!!
    const promoAndDespRecorr = false; // isAmbDev(); 

    const msgs = [];

    const anoAnt = anoAdd(ano, -1);

    msgs.push(`ano ${ano}, empresa ${empr1.empresa}, agrups: ${agrupArray.map(x => x.agrupPremissas).join(',')}, localids: ${localidadeArray.map(x => x.localidade).join(',')}`);
    msgs.push(`UNs: ${unArray.map(x => x.unidadeNegocio).join(',')}, Dirs: ${dirArray.map(x => x.diretoria).join(',')}`);
    msgs.push(`Gers: ${gerArray.map(x => x.gerencia).join(',')}, CCs: ${ccArray.map(x => x.centroCusto).join(',')}`);

    //#region dados mestre gerais
    for (const item of unArray) {
      await UnidadeNegocioModel.updateOne({ cod: item.unidadeNegocio }, {
        descr: item.descr,
        categRegional: item.categRegional,
        created: agora,
        lastUpdated: agora,
      }, { upsert: true });
    }

    for (const item of dirArray) {
      await DiretoriaModel.updateOne({ cod: item.diretoria }, {
        descr: item.descr,
        created: agora,
        lastUpdated: agora,
      }, { upsert: true });
    }

    for (const item of gerArray) {
      await GerenciaModel.updateOne({ cod: item.gerencia }, {
        descr: item.descr,
        created: agora,
        lastUpdated: agora,
      }, { upsert: true });
    }

    for (const item of emprArray) {
      await EmpresaModel.updateOne({ cod: item.empresa }, {
        descr: item.descr,
        created: agora,
        lastUpdated: agora,
      }, { upsert: true });
    }

    for (const item of agrupArray) {
      await AgrupPremissasModel.updateOne({ cod: item.agrupPremissas }, {
        descr: item.descr,
        created: agora,
        lastUpdated: agora,
      }, { upsert: true });
    }

    for (const item of localidadeArray) {
      await LocalidadeModel.updateOne({ cod: item.localidade }, {
        descr: item.descr,
        created: agora,
        lastUpdated: agora,
      }, { upsert: true });
    }
    //#endregion

    //#region premissas gerais
    {
      if (promoAndDespRecorr) {
        const premissasDespRecorr = [
          { cod: premissaCod.telRamal1, classeCusto: '5200502003', descr: 'Tel - Ramal 1', descrDespRecorrFunc: 'Tel. Ramal', tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false },
          { cod: premissaCod.tiSap1, classeCusto: '5200504020', descr: 'TI - SAP 1', descrDespRecorrFunc: 'Sap 1', tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false },
          { cod: premissaCod.tiSap2, classeCusto: '5200504020', descr: 'TI - SAP 2', descrDespRecorrFunc: 'Sap 2', tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true },
        ];
        for (const premissa of premissasDespRecorr) {
          await PremissaModel.updateOne({ cod: premissa.cod }, {
            ...premissa, despRecorrFunc: true, obsValor: 'R$/func.', decimais: 2, seqApresent: 1, anoIni: anoAnt, anoFim: ano
          }, { upsert: true });
        }
      }

      await ValoresPremissaModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , premissa: { $in: [premissaCod.telRamal1, premissaCod.tiSap1, premissaCod.tiSap2] }
      // const resultDelPremaDespcorr = await ValoresPremissaModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , premissa: { $in: [premissaCod.telRamal1, premissaCod.tiSap1, premissaCod.tiSap2] }
      // //msgs.push(`valoresPremissa despCorr - excluídos ${resultDelPremaDespcorr.deletedCount}`);
      // const resultDelPremAgrup = await ValoresPremissaModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, agrupPremissas: { $in: [agrupPremissasCoringa.cod, ...agrupsTeste.map((x) => x.agrupPremissas)] }
      // //msgs.push(`valoresPremissa agrup - excluídos ${resultDelPremAgrup.deletedCount}`);
      // const resultDelPremEmpr = await ValoresPremissaModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, empresa: { $in: [empresaCoringa.cod, ...emprsTeste.map((x) => x.empresa)] }
      // //msgs.push(`valoresPremissa empr - excluídos ${resultDelPremEmpr.deletedCount}`);

      const valPremissasAdd = [
        { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(100) },
        { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup2.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(110) },

        { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(200) },
        { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.estag, valMeses: new Array(mesesLen).fill(300) },
        { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.gestorpj, valMeses: new Array(mesesLen).fill(400) },
        { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.dir, valMeses: new Array(mesesLen).fill(500) },
        { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.dir_clt, valMeses: new Array(mesesLen).fill(600) },
        { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.dir_pj, valMeses: new Array(mesesLen).fill(700) },
        { premissa: premissaCod.assMed, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.terc, valMeses: new Array(mesesLen).fill(800) },

        { premissa: premissaCod.dissidio, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false, agrupPremissas: agrup1.agrupPremissas, valMeses: [...new Array(7).fill(undefined), 10, ...new Array(4).fill(undefined)] },
        { premissa: premissaCod.dissidio, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false, agrupPremissas: agrup2.agrupPremissas, valMeses: [...new Array(7).fill(undefined), 20, ...new Array(4).fill(undefined)] },

        { premissa: premissaCod.fgts, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(10) },
        { premissa: premissaCod.fgts, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(20) },
        { premissa: premissaCod.prov13, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(1) },
        { premissa: premissaCod.prov13, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(2) },
        { premissa: premissaCod.provFerias, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(3) },
        { premissa: premissaCod.provFerias, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(4) },

        { premissa: premissaCod.segVida, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false, agrupPremissas: agrup1.agrupPremissas, valMeses: new Array(mesesLen).fill(2) },

        { premissa: premissaCod.vr, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(500) },

        { premissa: premissaCod.encProv13Empr, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(1) },
        { premissa: premissaCod.encProv13Empr, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(2) },
        { premissa: premissaCod.encProvFeriasEmpr, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(3) },
        { premissa: premissaCod.encProvFeriasEmpr, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(4) },

        { premissa: premissaCod.inss, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(10) },
        { premissa: premissaCod.inss, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr2.empresa, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(20) },

        { premissa: premissaCod.inss, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(11) },
        { premissa: premissaCod.inss, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empresaCoringa.cod, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(20) },

        { premissa: premissaCod.inss, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.dir, valMeses: new Array(mesesLen).fill(12) },
        { premissa: premissaCod.inss, tipoSegmCentroCusto: TipoSegmCentroCusto.empresa, segmTipoClb: true, empresa: empr1.empresa, tipoColaborador: TipoColaborador.dir_clt, valMeses: new Array(mesesLen).fill(13) },
      ];
      if (promoAndDespRecorr) {
        valPremissasAdd.push({ premissa: premissaCod.telRamal1, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false, agrupPremissas: agrup1.agrupPremissas, valMeses: new Array(mesesLen).fill(10) });
        valPremissasAdd.push({ premissa: premissaCod.tiSap1, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: false, agrupPremissas: agrup1.agrupPremissas, valMeses: new Array(mesesLen).fill(20) });
        valPremissasAdd.push({ premissa: premissaCod.tiSap2, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.clt, valMeses: new Array(mesesLen).fill(30) });
        valPremissasAdd.push({ premissa: premissaCod.tiSap2, tipoSegmCentroCusto: TipoSegmCentroCusto.agrupPremissas, segmTipoClb: true, agrupPremissas: agrup1.agrupPremissas, tipoColaborador: TipoColaborador.aprendiz, valMeses: new Array(mesesLen).fill(40) });
      }
      try {
        const resultIncls1 = await ValoresPremissaModel.insertMany(valPremissasAdd.map((x) => ({
          ...x, ano, revisao: RevisaoValor.atual, ativa: true, lastUpdated: agora,
        })), { ordered: false });
        const resultIncls2 = await ValoresPremissaModel.insertMany(valPremissasAdd.map((x) => ({
          ...x, ano: anoAnt, revisao: RevisaoValor.atual, ativa: true, lastUpdated: agora,
        })), { ordered: false });
        //msgs.push(`incluídos ${resultIncls1.length + resultIncls2.length} valoresPremissa`);
      }
      catch (error) {
        msgs.push(`Erro em ValoresPremissa.insertMany: ${error.message}`);
      }
    }
    //#endregion

    //#region ValoresLocalidad
    {
      const resultDelValoresLocalid = await ValoresLocalidadeModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , localidade: { $in: [localidadeCoringa.cod, ...localidadesTeste.map((x) => x.localidade)] }
      //msgs.push(`ValoresLocalidad - excluídos ${resultDelValoresLocalid.deletedCount}`);
      const valoresLocalidadAdd = [
        { localidade: localidadeCoringa.cod, valMeses: new Array(mesesLen).fill(400) },
        { localidade: localidade1.localidade, valMeses: new Array(mesesLen).fill(100) },
        { localidade: localidade2.localidade, valMeses: new Array(mesesLen).fill(200) },
      ];
      try {
        const resultIncls1 = await ValoresLocalidadeModel.insertMany(valoresLocalidadAdd.map((x) => ({
          ...x, ano, revisao: RevisaoValor.atual, lastUpdated: agora,
        })), { ordered: false });
        const resultIncls2 = await ValoresLocalidadeModel.insertMany(valoresLocalidadAdd.map((x) => ({
          ...x, ano: anoAnt, revisao: RevisaoValor.atual, lastUpdated: agora,
        })), { ordered: false });
        //msgs.push(`incluídos ${resultIncls1.length + resultIncls2.length} ValoresLocalidade`);
      }
      catch (error) {
        msgs.push(`Erro em ValoresLocalidade.insertMany: ${error.message}`);
      }
    }
    //#endregion

    //#region ValoresTranfer
    {
      const resultDelValoresTranfer = await ValoresTransferModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , localidadeOrigem: { $in: localidadesTeste.map((x) => x.localidade) }
      //msgs.push(`ValoresTranfer - excluídos ${resultDelValoresTranfer.deletedCount}`);
      const valoresTransferAdd = [
        { localidadeOrigem: localidade1.localidade, localidadeDestino: localidade2.localidade, valMeses: new Array(mesesLen).fill(100) },
        { localidadeOrigem: localidade1.localidade, localidadeDestino: localidade3.localidade, valMeses: new Array(mesesLen).fill(200) },
      ];
      try {
        const resultIncls1 = await ValoresTransferModel.insertMany(valoresTransferAdd.map((x) => ({
          ...x, ano, revisao: RevisaoValor.atual, lastUpdated: agora,
        })), { ordered: false });
        const resultIncls2 = await ValoresTransferModel.insertMany(valoresTransferAdd.map((x) => ({
          ...x, ano: anoAnt, revisao: RevisaoValor.atual, lastUpdated: agora,
        })), { ordered: false });
        //msgs.push(`incluídos ${resultIncls1.length + resultIncls2.length} ValoresTransfer`);
      }
      catch (error) {
        msgs.push(`Erro em ValoresTransfer.insertMany: ${error.message}`);
      }
    }
    //#endregion

    //#region Centros Custo (master data, config, limpesas pré carga, etc)
    {
      await ProcessoOrcamentarioModel.deleteMany({ ano: { $in: [ano, anoAnt] } });
      await ProcessoOrcamentarioCentroCustoModel.deleteMany({ ano: { $in: [ano, anoAnt] } }); // , centroCusto: { $in: ccsTeste.map((x) => x.centroCusto) }

      //const regexp = new RegExp('^' + empresaTest);
      const resultDelTerc = await TerceiroModel.deleteMany({ ano: { $in: [ano, anoAnt] } });
      //msgs.push(`excluídos ${resultDelTerc.deletedCount} terceiros`);

      const resultDelFunc = await FuncionarioModel.deleteMany({ ano: { $in: [ano, anoAnt] } });
      //msgs.push(`excluídos ${resultDelFunc.deletedCount} funcionários`);

      const resultDelViagem = await ViagemModel.deleteMany({ ano: { $in: [ano, anoAnt] } });
      //msgs.push(`excluídos ${resultDelViagem.deletedCount} viagem`);

      const resultDelImput = await ValoresImputadosModel.deleteMany({ ano: { $in: [ano, anoAnt] } });
      //msgs.push(`excluídos ${resultDelImput.deletedCount} imputados`);

      const resultDelReais = await ValoresRealizadosModel.deleteMany({ ano: { $in: [ano, anoAnt] } });
      //msgs.push(`excluídos ${resultDelReais.deletedCount} reais`);

      await ProcessoOrcamentarioModel.updateOne({ ano }, {
        status: ProcessoOrcamentarioStatus.inputPlanej,
        horaLoadFuncFull: agora,
        horaLoadValoresRealizados: agora,
        created: agora,
        lastUpdated: agora,
      }, { upsert: true });
      await ProcessoOrcamentarioModel.updateOne({ ano: anoAnt }, {
        status: ProcessoOrcamentarioStatus.bloqueado,
        horaLoadFuncFull: agora,
        horaLoadValoresRealizados: agora,
        created: agora,
        lastUpdated: agora,
      }, { upsert: true });

      for (const item of ccArray) {
        await CentroCustoModel.updateOne({ cod: item.centroCusto }, {
          descr: item.descr,
          created: agora,
          lastUpdated: agora,
        }, { upsert: true });
        await ProcessoOrcamentarioCentroCustoModel.updateOne({ ano, centroCusto: item.centroCusto, }, {
          ...item,
          emailResponsavel: accountDeveloper,
          planejamentoEmAberto: true,
          permiteNovosClb: true,
          created: agora,
          lastUpdated: agora,
        }, { upsert: true });
        await ProcessoOrcamentarioCentroCustoModel.updateOne({ ano: anoAnt, centroCusto: item.centroCusto, }, {
          ...item,
          emailResponsavel: accountDeveloper,
          planejamentoEmAberto: true,
          permiteNovosClb: true,
          created: agora,
          lastUpdated: agora,
        }, { upsert: true });
      }
    }
    //#endregion

    //#region Terceiro
    {
      const terceiros_empr1_cc10 = [
        { centroCusto: empr1_cc10.centroCusto, refer: 'terc_01', nome: 'Pedro arq', fornecedor: 'Arte 1', funcaoTerceiros: 'ADM', valMeses: new Array(mesesLen).fill(1000) },
        { centroCusto: empr1_cc10.centroCusto, refer: 'terc_02', nome: 'Zaidan eng', fornecedor: 'ele proprio', funcaoTerceiros: 'ADM', valMeses: new Array(mesesLen).fill(2000) },
      ];
      const terceirosAdd = [
        ...terceiros_empr1_cc10,
        ...terceiros_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc11.centroCusto })),
        ...terceiros_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc12.centroCusto })),
        ...terceiros_empr1_cc10.map((x) => ({ ...x, centroCusto: empr2_cc10.centroCusto })),

        ...terceiros_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc40.centroCusto })),
        ...terceiros_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc50.centroCusto })),
        { centroCusto: empr1_cc20.centroCusto, refer: 'terc_01', nome: 'Pedro 2 arq', fornecedor: 'Arte 1', funcaoTerceiros: 'ADM', valMeses: new Array(mesesLen).fill(1000) },
        { centroCusto: empr1_cc20.centroCusto, refer: 'terc_02', nome: 'Zaidan 2 eng', fornecedor: 'ele proprio', funcaoTerceiros: 'ADM', valMeses: new Array(mesesLen).fill(2000) },
        { centroCusto: empr1_cc20.centroCusto, refer: 'terc_03', nome: 'RP 2 cons', fornecedor: 'ele proprio', funcaoTerceiros: 'ADM', valMeses: new Array(mesesLen).fill(3000) },
      ];
      //terceirosAdd.length = 0;
      try {
        const resultIncls1 = await TerceiroModel.insertMany(terceirosAdd.map((x) => ({
          ...x, ano, revisao: RevisaoValor.atual, created: agora, lastUpdated: agora,
        })), { ordered: false });
        const resultIncls2 = await TerceiroModel.insertMany(terceirosAdd.map((x) => ({
          ...x, ano: anoAnt, revisao: RevisaoValor.atual, created: agora, lastUpdated: agora,
        })), { ordered: false });
        //msgs.push(`incluídos ${resultIncls1.length + resultIncls2.length} terceiros`);
      }
      catch (error) {
        msgs.push(`Erro em Terceiro.insertMany: ${error.message}`);
      }
    }
    //#endregion

    //#region Funcionario
    {
      const valsPromoAndDespRecorrReset = { despsRecorr: null, mesPromo: null, tipoColaboradorPromo: null, salarioPromo: null };
      const valsPromoAndDespRecorrTest = promoAndDespRecorr ? { despsRecorr: [premissaCod.telRamal1, premissaCod.tiSap1, premissaCod.tiSap2], mesPromo: 6, tipoColaboradorPromo: TipoColaborador.dir, salarioPromo: 2000 } : {};
      let cpfSeq = 0;
      const funcionarios_empr1_cc10 = [
        //if (promoAndDespRecorr) {
        { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'Mônica clt', tipoColaborador: TipoColaborador.clt, funcao: 'psicóloga', salarioBase: 1000.23, dependentes: 1, valeTransp: 1000, idVaga: 'v1', idCentroCustoRh: 'rh1', tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, ...valsPromoAndDespRecorrTest },
        { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'Carlos aprendiz', tipoColaborador: TipoColaborador.aprendiz, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: 'v2', idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
        { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'jorge estag', tipoColaborador: TipoColaborador.estag, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: 'rh3', tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
        { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'jose gestor pj', tipoColaborador: TipoColaborador.gestorpj, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
        { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'mario diretor', tipoColaborador: TipoColaborador.dir, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
        { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'caetano dir clt', tipoColaborador: TipoColaborador.dir_clt, funcao: 'diretor', salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
        { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'flavio dir pj', tipoColaborador: TipoColaborador.dir_pj, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
        { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'cris pr.srv terc', tipoColaborador: TipoColaborador.terc, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
        { centroCusto: empr1_cc10.centroCusto, origem: OrigemFunc.local, refer: `CPF:${++cpfSeq}`, nome: 'vilhena clt temp', tipoColaborador: TipoColaborador.clt, funcao: 'gerente', salarioBase: 1000, dependentes: 2, valeTransp: 2000, idVaga: null, idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.adm, mesIni: 4, tipoFim: TipoParticipPerOrcam.desl, mesFim: 10, despsRecorr: null },
      ];
      const funcionariosAdd: any[] = [
        ...funcionarios_empr1_cc10,
        ...funcionarios_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc11.centroCusto, ...valsPromoAndDespRecorrReset })),
        ...funcionarios_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc12.centroCusto, ...valsPromoAndDespRecorrReset })),
        ...funcionarios_empr1_cc10.map((x) => ({ ...x, centroCusto: empr2_cc10.centroCusto, ...valsPromoAndDespRecorrReset })),

        ...funcionarios_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc40.centroCusto, ...valsPromoAndDespRecorrReset })),
        ...funcionarios_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc50.centroCusto, ...valsPromoAndDespRecorrReset })),
        { centroCusto: empr1_cc20.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'Mônica 2 clt', tipoColaborador: TipoColaborador.clt, funcao: 'psicóloga', salarioBase: 1000, dependentes: 1, valeTransp: 1000, idVaga: 'v1', idCentroCustoRh: 'rh1', tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, ...valsPromoAndDespRecorrTest },
        { centroCusto: empr1_cc20.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'Carlos 2 aprendiz', tipoColaborador: TipoColaborador.aprendiz, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: 'v2', idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
        { centroCusto: empr1_cc20.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'jorge 2 estag', tipoColaborador: TipoColaborador.estag, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: null, idCentroCustoRh: 'rh3', tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
        { centroCusto: empr1_cc30.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'Mônica 3 clt', tipoColaborador: TipoColaborador.clt, funcao: 'psicóloga', salarioBase: 1000, dependentes: 1, valeTransp: 1000, idVaga: 'v1', idCentroCustoRh: 'rh1', tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, ...valsPromoAndDespRecorrTest },
        { centroCusto: empr1_cc30.centroCusto, origem: OrigemFunc.legado, refer: `CPF:${++cpfSeq}`, nome: 'Carlos 3 aprendiz', tipoColaborador: TipoColaborador.aprendiz, funcao: null, salarioBase: 1000, dependentes: null, valeTransp: null, idVaga: 'v2', idCentroCustoRh: null, tipoIni: TipoParticipPerOrcam.quadro, mesIni: 1, tipoFim: null, mesFim: null, despsRecorr: null },
      ];
      //funcionariosAdd.length = 0;

      const funcDataIncl = funcionariosAdd.map((x) => {
        const item = Funcionario.fill({
          ...OnlyPropsInClass(x, Funcionario.new()),
          created: agora, lastUpdated: agora,
          salario_messy: x.origem === OrigemFunc.legado ? Funcionario.scrambleSalario(x.salarioBase, x.centroCusto, x.refer) : undefined,
          revisaoAtual: FuncionarioRevisao.fill({
            ...OnlyPropsInClass(x, FuncionarioRevisao.new()),
            ativo: true,
            salario_messy: Funcionario.scrambleSalario(x.salarioBase, x.centroCusto, x.refer),
            salarioPromo_messy: x.salarioPromo == null ? null : Funcionario.scrambleSalario(x.salarioPromo, x.centroCusto, x.refer),
          }),
        }, true);
        return item;
      });

      try {
        const resultIncls1 = await FuncionarioModel.insertMany(funcDataIncl.map((x) => ({ ...x, ano })), { ordered: false });
        const resultIncls2 = await FuncionarioModel.insertMany(funcDataIncl.map((x) => ({ ...x, ano: anoAnt })), { ordered: false });
        //msgs.push(`incluídos ${resultIncls1.length + resultIncls2.length} funcionários`);
      }
      catch (error) {
        msgs.push(`Erro em Funcionario.insertMany: ${error.message}`);
      }
    }
    //#endregion

    //#region Viagem
    {
      const viagemAdd = [
        { centroCusto: empr1_cc10.centroCusto, tipoPlanejViagem: TipoPlanejViagem.porPremissa, localidadeDestino: localidade2.localidade, qtdViagens: 12, mediaPernoites: 2 },
        { centroCusto: empr1_cc10.centroCusto, tipoPlanejViagem: TipoPlanejViagem.porPremissa, localidadeDestino: localidade3.localidade, qtdViagens: 12, mediaPernoites: 2 },
        { centroCusto: empr1_cc10.centroCusto, tipoPlanejViagem: TipoPlanejViagem.porPremissa, localidadeDestino: localidade3.localidade, qtdViagens: 24, mediaPernoites: 1 },
        { centroCusto: empr1_cc10.centroCusto, tipoPlanejViagem: TipoPlanejViagem.porValor, obs: 'obs 1', valor: 1200 },
        { centroCusto: empr1_cc10.centroCusto, tipoPlanejViagem: TipoPlanejViagem.porValor, obs: 'obs 2', valor: 2400 },
      ];
      try {
        const resultIncls1 = await ViagemModel.insertMany(viagemAdd.map((x) => ({
          ...x, ano, revisao: RevisaoValor.atual, created: agora, lastUpdated: agora,
        })), { ordered: false });
        const resultIncls2 = await ViagemModel.insertMany(viagemAdd.map((x) => ({
          ...x, ano: anoAnt, revisao: RevisaoValor.atual, created: agora, lastUpdated: agora,
        })), { ordered: false });
        //msgs.push(`incluídos ${resultIncls1.length + resultIncls2.length} Viagem`);
      }
      catch (error) {
        msgs.push(`Erro em Viagem.insertMany: ${error.message}`);
      }
    }
    //#endregion

    //#region valores inputados / realizados
    const valoresImputados_empr1_cc10 = [
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm1, idDetalhe: null, descr: null, valMeses: new Array(mesesLen).fill(100) },
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm2, idDetalhe: null, descr: null, valMeses: new Array(mesesLen).fill(200) },
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm3, idDetalhe: null, descr: null, valMeses: new Array(mesesLen).fill(300) },
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm4, idDetalhe: null, descr: null, valMeses: new Array(mesesLen).fill(300) },
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputDet1, idDetalhe: '24112022-1459325', descr: 'aaaaa', valMeses: new Array(mesesLen).fill(300) },
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputDet1, idDetalhe: '24112022-1459336', descr: 'bbbbb', valMeses: new Array(mesesLen).fill(400) },
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputDet2, idDetalhe: '24112022-1500424', descr: 'ccccc', valMeses: new Array(mesesLen).fill(500) },
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputDet2, idDetalhe: '24112022-1500446', descr: 'ddddd', valMeses: new Array(mesesLen).fill(600) },
    ];
    const valoresImputadosAdd = [
      ...valoresImputados_empr1_cc10,
      ...valoresImputados_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc11.centroCusto })),
      ...valoresImputados_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc12.centroCusto })),
      ...valoresImputados_empr1_cc10.map((x) => ({ ...x, centroCusto: empr2_cc10.centroCusto })),

      ...valoresImputados_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc40.centroCusto })),
      ...valoresImputados_empr1_cc10.map((x) => ({ ...x, centroCusto: empr1_cc50.centroCusto })),
      { centroCusto: empr1_cc20.centroCusto, classeCusto: clCustoImputNorm1, idDetalhe: null, descr: null, valMeses: new Array(mesesLen).fill(100) },
      { centroCusto: empr1_cc20.centroCusto, classeCusto: clCustoImputNorm2, idDetalhe: null, descr: null, valMeses: new Array(mesesLen).fill(200) },
      { centroCusto: empr1_cc20.centroCusto, classeCusto: clCustoImputDet1, idDetalhe: '24112022-1459325', descr: 'aaaaa', valMeses: new Array(mesesLen).fill(300) },
    ];
    valoresImputadosAdd.sort((a, b) => compareForBinSearch(`${a.centroCusto}-${a.classeCusto}`, `${b.centroCusto}-${b.classeCusto}`));
    //#region ValoresImputados
    {
      try {
        const resultIncls1 = await ValoresImputadosModel.insertMany(valoresImputadosAdd.map((x) => ({
          ...x, ano, revisao: RevisaoValor.atual, lastUpdated: agora,
        })), { ordered: false });
        //msgs.push(`incluídos ${resultIncls1.length} imputados (ano)`);
        const resultIncls2 = await ValoresImputadosModel.insertMany(valoresImputadosAdd.map((x) => ({
          ...x, ano: anoAnt, revisao: RevisaoValor.atual, lastUpdated: agora, valMeses: sumValMeses([...x.valMeses], new Array(mesesLen).fill(10))
        })), { ordered: false });
        //msgs.push(`incluídos ${resultIncls2.length} imputados (ano)`);
      }
      catch (error) {
        msgs.push(`Erro em ValoresImputados.insertMany: ${error.message}`);
      }
    }
    //#endregion

    //#region ValoresRealizados
    {
      try {
        const valsForReal = (new CtrlCollect<ValoresImputados>(['centroCusto', 'classeCusto'], { fldsSum: [{ fld: 'valMeses', arrayLen: mesesLen }] }, valoresImputadosAdd)).getArray();
        //csd('valoresImputadosAdd', JSON.stringify(valoresImputadosAdd, null, 2));
        //csd('valsForReal', JSON.stringify(valsForReal, null, 2));
        const valsRealAnt = valsForReal.map((val) => {
          const last4 = StrRight(val.classeCusto, 4);
          // const mult = (100 + (Number(last4) > 5000 ? 30 : -20)) / 100;
          // const valMeses = multiplyValMeses([...val.valMeses], new Array(mesesLen).fill(mult));
          const ajusteAbs = Number(last4) > 5000 ? 500 : -200;
          const valMeses = sumValMeses([...val.valMeses], new Array(mesesLen).fill(ajusteAbs));
          return {
            ...val, valMeses
          };
        });
        valsRealAnt.push({ centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoCalcNorm1, valMeses: new Array(mesesLen).fill(200) });
        valsRealAnt.push({ centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoCalcNorm2, valMeses: new Array(mesesLen).fill(100) });
        const resultInclAnt = await ValoresRealizadosModel.insertMany(valsRealAnt.map((valReal) => { return { ...valReal, ano: anoAnt }; }), { ordered: false });

        const mesUltRealizado = 10;
        const valsRealAtu = valsRealAnt.map((val) => {
          const valMeses = multiplyValMeses([...val.valMeses], [...new Array(mesUltRealizado).fill(1), ...new Array(mesesLen - mesUltRealizado).fill(0)]);
          return {
            ...val, valMeses
          };
        });
        const resultInclAtu = await ValoresRealizadosModel.insertMany(valsRealAtu.map((valReal) => { return { ...valReal, ano }; }), { ordered: false });
        //msgs.push(`incluídos ${resultInclAtu.length + resultInclAnt.length} reais`);
      }
      catch (error) {
        msgs.push(`Erro em ValoresRealizados.insertMany: ${error.message}`);
      }
    }
    //#endregion
    //#endregion

    return msgs;
  }

  else if (cmd == CmdApi_FuncAdm.setTesteDataInterfaceSap) {
    //if (!isAmbDev()) throw new Error('Apenas em dev e tst é possível criar dados de teste');
    const msgs = [];

    //#region ValoresImputados
    let valMes = 100;
    const valsCC1 = [
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm1, m01: ++valMes, m02: ++valMes, m03: ++valMes, m04: ++valMes, m05: ++valMes, m06: ++valMes, m07: ++valMes, m08: ++valMes, m09: ++valMes, m10: ++valMes, m11: 0, m12: 0 },
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm2, m01: ++valMes, m02: ++valMes, m03: ++valMes, m04: ++valMes, m05: ++valMes, m06: ++valMes, m07: ++valMes, m08: ++valMes, m09: ++valMes, m10: ++valMes, m11: 0, m12: 0 },
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm3, m01: ++valMes, m02: ++valMes, m03: ++valMes, m04: ++valMes, m05: ++valMes, m06: ++valMes, m07: ++valMes, m08: ++valMes, m09: ++valMes, m10: ++valMes, m11: 0, m12: 0 },
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputNorm4, m01: ++valMes, m02: ++valMes, m03: ++valMes, m04: ++valMes, m05: ++valMes, m06: ++valMes, m07: ++valMes, m08: ++valMes, m09: ++valMes, m10: ++valMes, m11: 0, m12: 0 },
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputDet1, m01: ++valMes, m02: ++valMes, m03: ++valMes, m04: ++valMes, m05: ++valMes, m06: ++valMes, m07: ++valMes, m08: ++valMes, m09: ++valMes, m10: ++valMes, m11: 0, m12: 0 },
      { centroCusto: empr1_cc10.centroCusto, classeCusto: clCustoImputDet2, m01: ++valMes, m02: ++valMes, m03: ++valMes, m04: ++valMes, m05: ++valMes, m06: ++valMes, m07: ++valMes, m08: ++valMes, m09: ++valMes, m10: ++valMes, m11: 0, m12: 0 },
    ];
    const vals = [
      ...valsCC1,
      ...valsCC1.map((x) => ({ ...x, centroCusto: empr1_cc11.centroCusto })),
      ...valsCC1.map((x) => ({ ...x, centroCusto: empr1_cc12.centroCusto })),
    ];

    vals.sort((a, b) => compareForBinSearch(`${a.centroCusto}-${a.classeCusto}`, `${b.centroCusto}-${b.classeCusto}`));
    try {
      const resultIncls1 = await ValoresRealizadosInterfaceSapModel.insertMany(vals.map((x) => ({
        ...x, ano
      })), { ordered: false });
      msgs.push(`incluídos ${resultIncls1.length} interface sap`);
    }
    catch (error) {
      msgs.push(`Erro em ValoresImputados.insertMany: ${error.message}`);
    }
    //#endregion
    return msgs;
  }
};