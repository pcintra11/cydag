import React from 'react';
import { useRouter } from 'next/router';

import { Box, Divider, Stack, useTheme } from '@mui/material';

import { PageDef } from '../../libCommon/endPoints';

import { preserveStateContext } from '../../pages/_appResources';

import { MenuEntry, MenuEntryType, MenuFloat, routerPageDef, Typo } from '..';

// @!!!! ao acionar o item de menu atualizar a hora da ultima atividade !!!
// menuEntriesBlock1 = transações principais e mais usadas, mais visíveis, ficam a esquerda
// menuEntriesBlock2 = transações eventuais, ficam a direita
interface IMenuBarraSuperiorProps {
  menuEntriesLeft: MenuEntry[];
  menuEntriesRight: MenuEntry[];
  pageDefCurr: PageDef;
  children: React.ReactNode;
}

// export const MenuLateral: React.FC<IMenuLateralProps> = ({ children }) => { @@!!!!! React.FC
export const MenuBarraSuperior = ({ menuEntriesLeft, menuEntriesRight, pageDefCurr, children }: IMenuBarraSuperiorProps) => {
  const { preserveStateResetAll } = React.useContext(preserveStateContext);
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
        const handlePagePath = (menuEntry: MenuEntry) => { preserveStateResetAll(); routerPageDef(menuEntry.pageDef, router, menuEntry.query, pageDefCurr); };
        const renderComp = (isPageCurrent && typeof menuEntry.content === 'string') ? <Typo bold variant='inherit'>{menuEntry.content}</Typo> : <>{menuEntry.content}</>;
        return (<Box key={i} onClick={() => handlePagePath(menuEntry)} style={style}>{renderComp}</Box>);
      }
      else if (menuEntry.type == MenuEntryType.onlyShow)
        return (<Box key={i} style={style}>{menuEntry.content}</Box>);
      else if (menuEntry.type == MenuEntryType.divider)
        return (<Box key={i} style={style}>|</Box>);
      else
        return (<Box key={i} style={style}>???</Box>);
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
      <Stack direction='row' alignItems='center' gap={1}
        sx={menuSxProps} p={1} divider={<Divider orientation="vertical" flexItem />}>
        {/* área para a aplicação (home e paginas dinâmicas em função do usuário logado) */}
        <Stack direction='row' alignItems='center' gap={1} divider={<Divider orientation="vertical" flexItem />} sx={{ flexGrow: 1 }}>
          {menuBlock(menuEntriesLeft, 'l')}
        </Stack>
        <Stack direction='row' alignItems='center' gap={1} divider={<Divider orientation="vertical" flexItem />}>
          {menuBlock(menuEntriesRight, 'r')}
        </Stack>
      </Stack>
      <Box flex={1} overflow='hidden'>
        {children}
      </Box>
    </Stack>
  );
};
