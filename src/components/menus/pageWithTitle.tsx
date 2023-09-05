import React from 'react';

import { Box, Icon, IconButton, Stack, useTheme } from '@mui/material';

import { useMenuLateral } from '../../components/menus/useMenulateral';

import { MenuType } from './layout';
import { Tx } from '../ui';

interface IPaginaComTitleProps {
  title: string;
  menuType: MenuType;
  toggleMenu?: () => void;
  children: React.ReactNode;
}
export const PageWithTitle = ({ title, menuType, toggleMenu, children }: IPaginaComTitleProps) => {
  const themePlus = useTheme();
  const { variant: menuDrawerVariant } = useMenuLateral();
  //csl('PageWithTitle render');

  const renderIconMenu = menuType == MenuType.lateral && menuDrawerVariant == 'temporary';

  return (
    <Stack px='1.5rem' py='1rem' height='100%' overflow='hidden'>
      {/* <Box padding={1} display'flex' alignItems='center' gap={1} height={theme.spacing(smDown ? 6 : mdDown ? 8 : 12)}> */}
      {(renderIconMenu || title != null) &&
        <Stack direction='row' alignItems='center' spacing={0.5} mb='16px'>
          {/* height={theme.spacing(6)} */}
          {renderIconMenu && (
            <IconButton onClick={toggleMenu}>
              <Icon>menu</Icon>
            </IconButton>
          )}
          {(title != null) &&
            <Box flex={1} display='flex' overflow='hidden' sx={{ backgroundColor: themePlus.themePlusDeriv?.destaque1.backColor }}>
              <Tx noWrap m='auto' variant='h6'>
                {title}
              </Tx>
            </Box>
          }
        </Stack>
      }
      {/* no 'children' (a pagina que será renderizada) deve ser determinado qual parte é a scrollable para ser possível 'congelar' algumas partes! */}
      <Box flex={1} overflow='hidden'>
        {children}
      </Box>
    </Stack>
  );
};
// const TitleTrans2 = ({ pageTitle }: { pageTitle?: string }) => {
//   return (<>      {pageTitle != null && <Box>          {pageTitle}        </Box>}    </>);
// };