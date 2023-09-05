import React from 'react';
import { useRouter } from 'next/router';
import { Box, Stack, SxProps, useTheme } from '@mui/material';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Scrollbar } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/scrollbar';

import { PageDef } from '../../libCommon/endPoints';
import { csd } from '../../libCommon/dbg';

import { preserveStateContext } from '../../pages/_appResources';

import { MenuEntry, MenuEntryType, MenuFloat, routerPageDef, SwiperWidthAutoCss, Tx } from '..';

// @!!!! ao acionar o item de menu atualizar a hora da ultima atividade !!!
// menuEntriesBlock1 = transações principais e mais usadas, mais visíveis, ficam a esquerda
// menuEntriesBlock2 = transações eventuais, ficam a direita
interface IMenuBarraSuperiorProps {
  menuEntriesLeft: MenuEntry[];
  menuEntriesRight: MenuEntry[];
  pageDefCurr: PageDef;
  children: React.ReactNode;
}

const compByType = (content: React.ReactNode | string, bolder?: boolean) => typeof content === 'string' ? <Tx bold={bolder} noWrap color='inherit'>{content}</Tx> : <>{content}</>;

// export const MenuLateral: React.FC<IMenuLateralProps> = ({ children }) => { @@!!!!! React.FC
export const MenuBarraSuperior = ({ menuEntriesLeft, menuEntriesRight, pageDefCurr, children }: IMenuBarraSuperiorProps) => {
  const { preserveStateResetAll } = React.useContext(preserveStateContext);
  const router = useRouter();
  const themePlus = useTheme();
  const menuBlock = (menuEntries: MenuEntry[]) =>
    menuEntries.map((menuEntry, i) => {
      const sxPointer: SxProps = { cursor: 'pointer' };
      if (menuEntry.type == MenuEntryType.group) {
        const isCurrent = false; //@!!!!!!!!
        return (<MenuFloat key={i} anchor={compByType(menuEntry.content, isCurrent)} itens={menuEntry.groupItens} pageDefCurr={pageDefCurr} />);
      }
      else if (menuEntry.type == MenuEntryType.pagePath) {
        const isPageCurrent = pageDefCurr == menuEntry.pageDef && !pageDefCurr?.pagePath.endsWith('dummy');
        const handlePagePath = (menuEntry: MenuEntry) => { preserveStateResetAll(); routerPageDef(menuEntry.pageDef, router, menuEntry.query, pageDefCurr); };
        return (<Box key={i} onClick={() => handlePagePath(menuEntry)} sx={sxPointer}>{compByType(menuEntry.content, isPageCurrent)}</Box>);
      }
      else if (menuEntry.type == MenuEntryType.onlyShow)
        return (<Box key={i}>{compByType(menuEntry.content)}</Box>);
      else if (menuEntry.type == MenuEntryType.divider)
        return (<Box key={i}>|</Box>);
      else
        return (<Box key={i}>???</Box>);
    });

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
    <Stack spacing={1} height='100%'>
      <Stack direction='row' alignItems='center' spacing='2rem'
        sx={menuSxProps} px='1.5rem' py='0.5rem'>
        <Box flex={1} overflow='hidden'>
          <Swiper className="mySwiper" slidesPerView='auto' spaceBetween={menuEntriesLeft.length > 1 ? 25: 0}  scrollbar modules={[Scrollbar]}>
            {menuBlock(menuEntriesLeft).map((x, i) => <SwiperSlide key={i}>{x}</SwiperSlide>)}
          </Swiper>
        </Box>
        <Box>
          <Swiper className="mySwiper" slidesPerView='auto' spaceBetween={menuEntriesRight.length > 1 ? 25 : 0}>
            {menuBlock(menuEntriesRight).map((x, i) => <SwiperSlide key={i}>{x}</SwiperSlide>)}
          </Swiper>
        </Box>
      </Stack>
      <Box flex={1} overflow='hidden'>
        {children}
      </Box>
      <SwiperWidthAutoCss />
    </Stack>
  );
};
