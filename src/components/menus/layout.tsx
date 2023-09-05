import React from 'react';

import { Box } from '@mui/material';

import { PageDef } from '../../libCommon/endPoints';
import { IGenericObject } from '../../libCommon/types';

import { AbortProcComponent, MenuEntriesForMenuTypesData, LogErrorUnmanaged } from '..';
import { MenuBarraSuperior } from './menuBarraSup';
import { MenuLateral } from './menuLateral';
import { useMenuLateral } from './useMenulateral';
import { PageWithTitle } from './pageWithTitle';

// insere as página no layout, considerando menus para os usuario logados

export interface IMenuLateralContext {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}
export const MenuLateralContext = React.createContext<IMenuLateralContext>(null);
interface ILayout {
  menuEntriesForMenuTypes: MenuEntriesForMenuTypesData;
  Component: any;
  pageProps: IGenericObject;
  pageDefCurr: PageDef;
  menuType: MenuType;
  imgApp?: string;
}
export enum MenuType {
  none = 'none',
  lateral = 'lateral',
  barraSuperior = 'barraSuperior'
}

export function Layout({ menuEntriesForMenuTypes, Component, pageProps, pageDefCurr, menuType, imgApp }: ILayout) {
  const { isMenuOpen, toggleMenu, closeMenu } = useMenuLateral();
  //csl('Layout render');

  const pagePropsExtended = { ...pageProps, menuType, protTest1: 'a' }; // teste completo com SSG @@!!!!!!

  //csl({pageDefCurr});
  const pageTitle = pageDefCurr?.options?.pageTitle;
  //const childrenPage = <Box height='100%'><Component {...pagePropsExtended} /></Box>;
  const childrenPage = <Component {...pagePropsExtended} />;
  // const devConfigComp = (<>{dbgShowCli() && <Box><DevConfigBar /></Box>}</>);

  try {
    if (menuType == MenuType.lateral) {
      return (
        <Box height='100%' overflow='hidden'>
          <MenuLateralContext.Provider value={{ isMenuOpen, toggleMenu, closeMenu }}>
            <MenuLateral menuEntries={menuEntriesForMenuTypes.menuEntries} pageDefCurr={pageDefCurr} imgApp={imgApp}>
              <Box height='100%' overflow='hidden'>
                <PageWithTitle title={pageTitle} menuType={menuType} toggleMenu={toggleMenu}>{childrenPage}</PageWithTitle>
              </Box>
            </MenuLateral>
          </MenuLateralContext.Provider>
        </Box>
      );
    }

    else if (menuType == MenuType.barraSuperior) {
      return (
        <Box height='100%' overflow='hidden'>
          <MenuBarraSuperior menuEntriesLeft={menuEntriesForMenuTypes.menuEntriesLeft} menuEntriesRight={menuEntriesForMenuTypes.menuEntriesRight} pageDefCurr={pageDefCurr}>
            {/* <CheckAuth pageDef={pageDef}> <Component {...pageProps} protTest1='a' /> </CheckAuth> */}
            <PageWithTitle title={pageTitle} menuType={menuType}>{childrenPage}</PageWithTitle>
          </MenuBarraSuperior>
        </Box>
      );
    }

    else {
      return (
        <Box height='100%' overflow='hidden'>
          <PageWithTitle title={pageTitle} menuType={menuType}>{childrenPage}</PageWithTitle>
        </Box>
      );
    }

  } catch (error) {
    LogErrorUnmanaged(error, 'Layout-render');
    return (<AbortProcComponent error={error} component='Layout' />);
  }
}