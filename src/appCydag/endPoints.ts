import { ApiDef, PageDef, rolesDev } from '../libCommon/endPoints';
import { EnvDeployConfig } from '../app_base/envs';

// appXXX

export const rolesApp = {
  gestorContr: 'gestor_contr',
  cargaFunc: 'carga_func',
  operContr: 'oper_contr',
  acessaSalarios: 'salarios',
  consTodosCCs: 'cons_todos_ccs',
  dyn_responsCC: 'dyn_respons_cc',
  dyn_planejCC: 'dyn_planej_cc',
  dyn_consultaCC: 'dyn_consulta_cc',
  dyn_consTodosCCs: 'dyn_consTodosCCs',
};
export const rolesAppOnlyGestorContr = [
  rolesApp.gestorContr,
  rolesApp.acessaSalarios,
  rolesApp.cargaFunc,
  //rolesApp.consTodosCCs,
];

export const roleSimulateUserDyn = '*simulateUser*';

const pathPages = '/cydag';
export const pageDummy = new PageDef(`${pathPages}/dummy`, 'Página ainda disponível', null, { onlyAuthenticated: true, variant: 'var-dummy' });

export const quadroPage = {
  path: `${pathPages}/plan/quadroGeral`,
  variant: {  // o uso de 'variant' está provocando erros no refresh forçado da página #!!!!!!!! op `className` did not match. Server: "MuiBox-root css-10klw3m" Client: "MuiBox-root css-0"
    cons: 'cons',
    input: 'input',
  },
};

const rolesQuadro = [rolesApp.dyn_responsCC, rolesApp.dyn_planejCC, rolesApp.dyn_consultaCC, rolesApp.dyn_consTodosCCs, rolesApp.gestorContr, rolesApp.operContr];
const rolesControladoria = [rolesApp.gestorContr, rolesApp.operContr];
//let seqVariante = 0;
export const pagesApp = {
  processoOrcamentario: new PageDef(`${pathPages}/processoOrcamentario`, 'Controle do Processo Orçamentário', null, { onlyAuthenticated: true, roles: rolesControladoria }),
  cargaFuncionario: new PageDef(`${pathPages}/cargaFuncionario`, 'Carga de Funcionários', null, { onlyAuthenticated: true, roles: [rolesApp.cargaFunc] }),
  importReal: new PageDef(`${pathPages}/importReal`, 'Importação do Realizado', null, { onlyAuthenticated: true, roles: rolesControladoria }),

  user: new PageDef(`${pathPages}/md/user`, 'Usuários', null, { onlyAuthenticated: true, roles: rolesControladoria }),

  agrupPremissas: new PageDef(`${pathPages}/md/agrupPremissas`, 'Agrupamento de Premissas', null, { onlyAuthenticated: true, roles: rolesControladoria }),
  centroCusto: new PageDef(`${pathPages}/md/centroCusto`, 'Centros de Custo', null, { onlyAuthenticated: true, roles: rolesControladoria }),
  classeCusto: new PageDef(`${pathPages}/md/classeCusto`, 'Classes de Custo', null, { onlyAuthenticated: true, roles: rolesControladoria }),
  diretoria: new PageDef(`${pathPages}/md/diretoria`, 'Diretorias', null, { onlyAuthenticated: true, roles: rolesControladoria }),
  empresa: new PageDef(`${pathPages}/md/empresa`, 'Empresas', null, { onlyAuthenticated: true, roles: rolesControladoria }),
  gerencia: new PageDef(`${pathPages}/md/gerencia`, 'Gerências', null, { onlyAuthenticated: true, roles: rolesControladoria }),
  localidade: new PageDef(`${pathPages}/md/localidade`, 'Localidades', null, { onlyAuthenticated: true, roles: rolesControladoria }),
  unidadeNegocio: new PageDef(`${pathPages}/md/unidadeNegocio`, 'Unidades de Negócio', null, { onlyAuthenticated: true, roles: rolesControladoria }),

  classeCustoRestrita: new PageDef(`${pathPages}/classeCustoRestrita`, 'Classes de Custo Restritas', null, { onlyAuthenticated: true, roles: rolesControladoria }),

  premissasGerais: new PageDef(`${pathPages}/premissasGerais`, 'Premissas Gerais', 'Gerais', { onlyAuthenticated: true, roles: rolesControladoria }),
  valoresLocalidade: new PageDef(`${pathPages}/valoresLocalidade`, 'Valores de Pernoites', 'Pernoites', { onlyAuthenticated: true, roles: rolesControladoria }),
  valoresTransfer: new PageDef(`${pathPages}/valoresTransfer`, 'Valores de Viagens', 'Viagens', { onlyAuthenticated: true, roles: rolesControladoria }),

  index: new PageDef(`${pathPages}/`, 'Cydag'),
  home: new PageDef(`${pathPages}/home`, 'Orientações para Uso do Sistema', 'Orientações', { onlyAuthenticated: true }),

  //logRedir: new PageDef(`${pathPages}/logRedir`),
  signIn: new PageDef(EnvDeployConfig().mode_auth == 'azure' ? `${pathPages}/signInAzure` : `${pathPages}/signIn`, 'Login'),
  signOut: new PageDef(EnvDeployConfig().mode_auth == 'azure' ? `${pathPages}/signOutAzure` : `${pathPages}/signOut`, 'Logout'),
  userSimulate: new PageDef(`${pathPages}/userSimulate`, 'Simulação de Usuário', null, { onlyAuthenticated: true, roles: [rolesApp.gestorContr, rolesDev.dev, roleSimulateUserDyn] }),
  userResetPsw: new PageDef(`${pathPages}/resetPsw`, 'Reset de Senha'),

  funcionario: new PageDef(`${pathPages}/plan/funcionario`, 'Composição da Equipe', null, { onlyAuthenticated: true, roles: [rolesApp.dyn_responsCC, rolesApp.gestorContr] }),
  terceiro: new PageDef(`${pathPages}/plan/terceiro`, 'Terceirizados', null, { onlyAuthenticated: true, roles: rolesQuadro }),
  //despCorr: new PageDef(pageDummy.pagePath, 'Despesas Recorentes', null, { onlyAuthenticated: true, roles: [rolesApp.dyn_planejCC, rolesApp.dyn_responsCC, rolesApp.dyn_consTodosCCs, rolesApp.gestorContr, rolesApp.operContr], variant: `var-${++seqVariante}` }),
  viagem: new PageDef(`${pathPages}/plan/viagem`, 'Viagens', null, { onlyAuthenticated: true, roles: rolesQuadro }),
  inputValoresContas: new PageDef(quadroPage.path, 'Orçamento de Despesas Gerais', 'Despesas Gerais', { onlyAuthenticated: true, roles: [rolesApp.dyn_responsCC, rolesApp.dyn_planejCC, rolesApp.gestorContr, rolesApp.operContr], variant: quadroPage.variant.input }),
  quadroGeral: new PageDef(quadroPage.path, 'Quadro Demonstrativo de Despesas Consolidado', 'Quadro de Despesas', { onlyAuthenticated: true, roles: rolesQuadro, variant: quadroPage.variant.cons }),
  //ajustesCtasCalc: new PageDef(pageDummy.pagePath, 'Ajustes em Contas Calculadas', null, { onlyAuthenticated: true, roles: [rolesApp.dyn_responsCC], variant: `var-${++seqVariante}` }),

  analiseAnualRxOCentroCusto: new PageDef(`${pathPages}/cons/analiseAnualCentroCusto`, 'Análise Anual RxO Centro de Custo', 'Anual RxO Centro de Custo', { onlyAuthenticated: true, roles: rolesQuadro }),
  analiseAnualRxOControladoria: new PageDef(`${pathPages}/cons/analiseAnualControladoria`, 'Análise Anual RxO Controladoria', 'Anual RxO Controladoria', { onlyAuthenticated: true, roles: rolesControladoria }),
  comparativoAnualControladoria: new PageDef(`${pathPages}/cons/comparativoAnualControladoria`, 'Comparativo Anual Controladoria', 'Comparativo Anual Controladoria', { onlyAuthenticated: true, roles: rolesControladoria }),

  exportaPlanej: new PageDef(`${pathPages}/exportaPlanej`, 'Exportação do Orçamento', null, { onlyAuthenticated: true, roles: rolesQuadro }),
  exportaRealPlanej: new PageDef(`${pathPages}/exportaRealPlanej`, 'Exportação do Real / Orçado', null, { onlyAuthenticated: true, roles: rolesQuadro }),
  exportaFuncionario: new PageDef(`${pathPages}/exportaFuncionario`, 'Exportação de Funcionários', null, { onlyAuthenticated: true, roles: [rolesApp.gestorContr] }),

  // consTotHier: new PageDef(pageDummy.pagePath, 'Totais Orçados pela Hierarquia', null, { onlyAuthenticated: true, roles: [roleGestorContr], variant: `var-${++seqVariante}` }),
  // consDespsEquipe: new PageDef(pageDummy.pagePath, 'Despesas da Equipe', null, { onlyAuthenticated: true, roles: [rolePlanejDynCC], variant: `var-${++seqVariante}` }),
  // consRealPlaAteMes: new PageDef(pageDummy.pagePath, 'Real x Orçado até o Mês', null, { onlyAuthenticated: true, roles: [rolePlanejDynCC], variant: `var-${++seqVariante}` }),

  funcsAdm: new PageDef(`${pathPages}/funcsAdm`, 'Funções Administrativas', null, { onlyAuthenticated: true, roles: [rolesDev.dev] }),
};

export const PagesAppArray = () => {
  const pages: PageDef[] = [];
  for (const key in pagesApp)
    pages.push(pagesApp[key]);
  return pages;
};

const pathApi = 'appCydag';
export const apisApp = {
  userAuth: new ApiDef(`${pathApi}/user/auth`),
  userOthers: new ApiDef(`${pathApi}/user/others`),
  userSimulate: new ApiDef(`${pathApi}/user/simulate`, [rolesApp.gestorContr, rolesDev.dev, roleSimulateUserDyn]),

  processoOrcamentario: new ApiDef(`${pathApi}/processoOrcamentario`),
  funcionario: new ApiDef(`${pathApi}/funcionario`),
  terceiro: new ApiDef(`${pathApi}/terceiro`),
  viagem: new ApiDef(`${pathApi}/viagem`),

  user: new ApiDef(`${pathApi}/user/crud`, [rolesApp.gestorContr, rolesApp.operContr]),
  centroCusto: new ApiDef(`${pathApi}/centroCusto`),
  unidadeNegocio: new ApiDef(`${pathApi}/unidadeNegocio`),
  empresa: new ApiDef(`${pathApi}/empresa`),
  localidade: new ApiDef(`${pathApi}/localidade`),
  agrupPremissas: new ApiDef(`${pathApi}/agrupPremissas`),
  diretoria: new ApiDef(`${pathApi}/diretoria`),
  gerencia: new ApiDef(`${pathApi}/gerencia`),
  //depto: new ApiDef(`${pathApi}/depto`),

  classeCusto: new ApiDef(`${pathApi}/classeCusto`),
  classeCustoRestrita: new ApiDef(`${pathApi}/classeCustoRestrita`),
  diversos: new ApiDef(`${pathApi}/diversos`),

  valoresContas: new ApiDef(`${pathApi}/valoresContas`),
  premissasGerais: new ApiDef(`${pathApi}/premissasGerais`, [rolesApp.gestorContr, rolesApp.operContr]),
  valoresLocalidade: new ApiDef(`${pathApi}/valoresLocalidade`, [rolesApp.gestorContr, rolesApp.operContr]),
  valoresTransfer: new ApiDef(`${pathApi}/valoresTransfer`, [rolesApp.gestorContr, rolesApp.operContr]),

  funcsAdm: new ApiDef(`${pathApi}/funcsAdm`, [rolesDev.dev]),
};