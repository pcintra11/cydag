import { NextRouter } from 'next/router';
import QueryString from 'query-string';

import { csd, dbgError } from '../../libCommon/dbg';
import { PageDef } from '../../libCommon/endPoints';
import { IGenericObject } from '../../libCommon/types';
import { CutUndef, FillClassProps, IdByTime } from '../../libCommon/util';

export enum MenuEntryType {
  group = 'group',
  pagePath = 'pagePath',
  onlyShow = 'onlyShow',
  divider = 'divider',
}
export class MenuEntry {
  type?: MenuEntryType;
  content?: React.ReactNode; // ancora do sub menu ou texto para o link da página
  groupItens?: MenuEntry[]; // apenas se 'group'
  pageDef?: PageDef; // apenas se 'page' 
  query?: IGenericObject;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static new(init?: boolean) { return new MenuEntry(); }
  static fill(values: MenuEntry, init = false) { return CutUndef(FillClassProps(MenuEntry.new(init), values)); }

  // public get isGroup() { return this.type == 'group'; } //@@!!!!!
  // public get isPagePath() { return this.type == 'pagePath' };
  static Group(content: React.ReactNode, groupItens: MenuEntry[]) {
    return MenuEntry.fill({ type: MenuEntryType.group, content, groupItens });
  }
  static PagePath(pageDef: PageDef, contentUse: React.ReactNode = null, query?: IGenericObject) {
    if (pageDef?.pagePath == null)
      dbgError('MenuEntry', 'PagePath para path nulo');
    const content = contentUse != null ? contentUse : (pageDef.txtDynamicMenu || pageDef.pagePath);
    return MenuEntry.fill({ type: MenuEntryType.pagePath, content, pageDef, query });
  }
  static OnlyShow(content: React.ReactNode) {
    return MenuEntry.fill({ type: MenuEntryType.onlyShow, content });
  }
  static Divider() {
    return MenuEntry.fill({ type: MenuEntryType.divider });
  }
}

export interface IMenuEntriesForMenuTypesData {
  menuEntries?: MenuEntry[]; // menu lateral
  menuEntriesLeft?: MenuEntry[]; // menu barraSuperior
  menuEntriesRight?: MenuEntry[]; // menu barraSuperior
}

export const routerPageDef = (pageDefCall: PageDef, router: NextRouter, query: IGenericObject, pageDefCurr: PageDef) => {
  let queryUse: any = {};
  if (query != null)
    queryUse = { ...queryUse, ...query };
  if (pageDefCall.options?.variant != null)
    queryUse.variant = pageDefCall.options.variant;
  if (pageDefCall === pageDefCurr)
    queryUse._rnd = IdByTime();
  if (Object.keys(queryUse).length == 0)
    queryUse = undefined;
  //csl({ pageDef, pathname: pageDef.pagePath, query });
  router.push({ pathname: pageDefCall.pagePath, query: queryUse });
};

export const PageByVariant = (pages: PageDef[], router: NextRouter, mustFound = true, debug = false) => { // mustFound = true sempre @!!!!!!
  let index = -1;
  let indexMatchWihtoutVariant = -1;
  const GetVariantInRouter = (asPath: string) => {
    let result = null;
    const comps = asPath.split('?');
    if (comps.length == 2) {
      const query = QueryString.parse(comps[1]);
      debug && csd('queryMy', query);
      result = query.variant;
    }
    return result;
  };
  const pagesChecked: PageDef[] = [];
  for (index = 0; index < pages.length; index++) {
    const page = pages[index];
    if (pagesChecked.find((x) => x.pagePath == page.pagePath && x.options?.variant == page.options?.variant) != null) {
      dbgError('PageByVariant', `entrada duplicada: ${page.pagePath} variante ${page.options?.variant}`, pages);
      return null;
    }
    if (page.pagePath == router.pathname) {
      //csl('page test', page);
      if (page.options?.variant == null) {
        // if (index == pages.length - 1)
        //   break;
        // else
        indexMatchWihtoutVariant = index;
        //csl('indexMatchWihtoutQueryByMenu');
        //throw new Error(`PageDef sem queryByMenu só pode estar na última posição (${router.pathname})`);
      }
      else {
        // const propsDiff = ObjDiff(page.options.queryByMenu, router.query || {});
        // //csl(Object.keys(propsDiff).length, { propsDiff });
        // if (Object.keys(propsDiff).length == 0)
        //   break;
        //csl({ variant: page.options?.variant, getVariantInRouter: GetVariantInRouter(router.asPath) });
        if (page.options?.variant == GetVariantInRouter(router.asPath))
          break;
        //csl('não bateu!');
      }
    }
    pagesChecked.push(page);
  }
  let result: PageDef = null;
  if (index < pages.length)
    result = pages[index];
  else if (indexMatchWihtoutVariant != -1)
    result = pages[indexMatchWihtoutVariant];
  else if (mustFound)
    throw new Error(`PageDef não encontrado para ${router.pathname} (${router.asPath})`);
  debug && csd('call PageByVariant ========>', router.asPath, router.query, { result });
  return result;
};

export * from './menuBarraSup';
export * from './menuFloat';

export * from './menuLateral';
export * from './layout';