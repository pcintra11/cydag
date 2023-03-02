import React from 'react';
import { useRouter } from 'next/router';

import { Box, Stack, useTheme } from '@mui/material';

import { PageDef } from '../../libCommon/endPoints';

import { MenuEntry, MenuEntryType, MenuFloat, routerPageDef } from '..';

// @!!!! ao acionar o item de menu atualizar a hora da ultima atividade !!!
// menuEntriesBlock1 = transações principais e mais usadas, mais visiveis, ficam a esquerda
// menuEntriesBlock2 = transações eventuais, ficam a direita
interface IMenuBarraSuperiorProps {
  menuEntriesLeft: MenuEntry[];
  menuEntriesRight: MenuEntry[];
  pageDefCurr: PageDef;
  children: React.ReactNode;
}

// export const MenuLateral: React.FC<IMenuLateralProps> = ({ children }) => { @@!!!!! React.FC
export const MenuBarraSuperior = ({ menuEntriesLeft, menuEntriesRight, pageDefCurr, children }: IMenuBarraSuperiorProps) => {
  const router = useRouter();
  const marginItens = '1rem';
  const themePlus = useTheme();
  const menuBlock = (menuEntries: MenuEntry[], side: 'l' | 'r') => (<>
    {menuEntries.map((menuEntry, i) => {
      const style: React.CSSProperties = side == 'l' ? { marginRight: marginItens } : { marginLeft: marginItens };
      style.cursor = 'pointer';
      if (menuEntry.type == MenuEntryType.group)
        return (<MenuFloat key={i} anchor={menuEntry.content} itens={menuEntry.groupItens} style={style} pageDefCurr={pageDefCurr} />);
      else if (menuEntry.type == MenuEntryType.pagePath) {
        const isPageCurrent = pageDefCurr == menuEntry.pageDef && !pageDefCurr?.pagePath.endsWith('dummy');
        const handlePagePath = (menuEntry: MenuEntry) => routerPageDef(menuEntry.pageDef, router, menuEntry.query, pageDefCurr);
        const renderComp = isPageCurrent ? <b>{menuEntry.content}</b> : <>{menuEntry.content}</>;
        return (<div key={i} onClick={() => handlePagePath(menuEntry)} style={style}>{renderComp}</div>);
      }
      else if (menuEntry.type == MenuEntryType.onlyShow)
        return (<div key={i} style={style}>{menuEntry.content}</div>);
      else if (menuEntry.type == MenuEntryType.divider)
        return (<div key={i} style={style}>|</div>);
      else
        return (<div key={i} style={style}>???</div>);
    })}
  </>);

  // for (let index = 0; index < pagesDisp.length; index++) 
  //   router.prefetch(`/${pagesDisp[index].page}`);
  //   //csl(`http://localhost:3010/${pagesDisp[index].page}`); // parece que não está funcionando ....

  // <ThemeConsumer>
  //   {(theme) =>

  // .xxxg-menu {
  //   background-color: ${({ theme }: { theme: Theme }) => theme.palette.primary.main};
  //   color: ${({ theme }: { theme: Theme }) => theme.palette.primary.contrastText};
  // }       

  const menuSxProps = {
    //color: theme.themeDeriv.destaque1.text,
    backgroundColor: themePlus.palette.primary.main,
    color: themePlus.palette.primary.contrastText,
  };

  return (
    <Stack gap={1} height='100%'>
      <Box className={'menuLine'} sx={menuSxProps}>
        {/* área para a aplicação (home e paginas dinamicas em função dousuario logado) */}
        <div className='itensMenu'>
          {menuBlock(menuEntriesLeft, 'l')}
        </div>
        <div className='itensMenu right'>
          {menuBlock(menuEntriesRight, 'r')}
        </div>
      </Box>
      <style jsx global>{`
        .menuLine {
          width: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          height: auto;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          padding-left: 1rem;
          padding-right: 1rem;
        }       
        .itensMenu {
          display: flex;
          flex-direction: row;
          align-items: center;  
          @media (max-width: 720px) {
            XXflex-direction: column;  /* falta hamburger menu para os itens horizontais @@@! */
          }
        }
        .right {
          margin-left: auto;
        }
      `}</style>
      <Box flex={1} overflow='hidden'>
        {children}
      </Box>
    </Stack>
  );
};
