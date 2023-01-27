import { Box, LinearProgress } from '@mui/material';

import { PageDef } from '../libCommon/endPoints';
import { csd } from '../libCommon/dbg';

import { IMenuEntriesForMenuTypesData, MenuEntry } from '../components';

import { pagesSuporte } from '../suporte/endPoints';

import { pageDummy, pagesApp } from './endPoints';
import { LoggedUser } from './loggedUser';

type IMenuEntry = (PageDef | SubMenu);

class SubMenu {
  text: string;
  //specialCondition: string;
  itens: IMenuEntry[];
  constructor(text: string, itens: IMenuEntry[]) {
    this.text = text;
    //this.specialCondition = specialCondition;
    this.itens = itens;
  }
}

const menuTotal: IMenuEntry[] = [ // aqui todas as transações, serão filtradas pelo perfil na montagem
  pagesApp.home,
  new SubMenu('Gestão', [
    pagesApp.processoOrcamentario,
    new SubMenu('Premissas', [
      pagesApp.premissasGerais,
      pagesApp.valoresLocalidade,
      pagesApp.valoresTransfer,
    ]),
    new SubMenu('Configuração', [
      pagesApp.classeCustoRestrita,
    ]),
    pagesApp.importReal,
  ]),
  pagesApp.cargaFuncionario,

  new SubMenu('Cadastros', [
    pagesApp.user,
    pagesApp.centroCusto,
    //pagesApp.classeCustoCrud,
    new SubMenu('Outros', [
      pagesApp.unidadeNegocio,
      pagesApp.empresa,
      pagesApp.localidade,
      pagesApp.agrupPremissas,
      pagesApp.diretoria,
      pagesApp.gerencia,
      //pagesApp.deptoCrud,
      pagesApp.classeCusto,
    ]),
  ]),
  new SubMenu('Orçamento', [
    pagesApp.inputValoresContas,
    pagesApp.funcionario,
    pagesApp.terceiro,
    //pagesApp.despCorr,
    pagesApp.viagem,
    pagesApp.quadroGeral,
    //pagesApp.ajustesCtasCalc,
  ]),

  new SubMenu('Análises', [
    pagesApp.analiseAnualRxOCentroCusto,
    pagesApp.analiseAnualRxOControladoria,
    pagesApp.comparativoAnualControladoria,
  ]), 

  new SubMenu('Exportações', [
    pagesApp.exportaPlanej,
    pagesApp.exportaRealPlanej,
  ]), 

  pagesApp.userSimulate,
  pagesApp.signOut,
  new SubMenu('Dev', [
    pagesApp.funcsAdm,
    pagesSuporte.inspect,
    pagesSuporte.playg,
  ]),
];

export function MenuEntriesApp(loggedUser: LoggedUser, isLoadingUser: boolean) {
  let menuEntriesData: IMenuEntriesForMenuTypesData = {};

  const MenuEntries = (menuItens: IMenuEntry[]) => {
    const menuEntries: MenuEntry[] = [];
    if (loggedUser != null) {
      for (const item of menuItens) {
        if (item instanceof SubMenu) {
          //csl('buscando subMenuEntries para', item.text);
          const subMenuEntries = MenuEntries(item.itens);
          //csl('subMenuEntries', subMenuEntries);
          if (subMenuEntries.length > 0)
            menuEntries.push(MenuEntry.Group(item.text, subMenuEntries));
        }
        else if (item instanceof PageDef) {
          //csl('PageDef', item);
          if (PageDef.IsUserAuthorized(item, loggedUser.roles)) {
            if (item.pagePath == pageDummy.pagePath)
              menuEntries.push(MenuEntry.PagePath(item, <Box color='#BEBEBE'>{item.txtDynamicMenu}</Box>)); // , { title: item.pageTitle }
            else
              menuEntries.push(MenuEntry.PagePath(item));
          }
        }
      }
    }
    return menuEntries;
  };

  let menuEntries: MenuEntry[] = [];
  if (isLoadingUser)
    menuEntries = [MenuEntry.OnlyShow(<Box sx={{ width: '100%' }}><LinearProgress /></Box>)];
  else if (loggedUser != null)
    //menuEntries = [MenuEntry.OnlyShow(<div>{loggedUser.email}</div>), ...MenuEntries(menuTotal)];
    menuEntries = MenuEntries(menuTotal);

  menuEntriesData = { menuEntries, menuEntriesLeft: menuEntries, menuEntriesRight: [] };

  return menuEntriesData;
}