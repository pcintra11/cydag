import React from 'react';

import { Box, Icon, IconButton, Stack, Typography, useTheme } from '@mui/material';

import { useMenuLateral } from '../../components/menus/useMenulateral';

import { MenuType } from './layout';

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
    <Stack pl='1.5rem' pr='1rem' pt='1rem' pb='0.5rem' height='100%' overflow='hidden'>
      {/* <Box padding={1} display'flex' alignItems='center' gap={1} height={theme.spacing(smDown ? 6 : mdDown ? 8 : 12)}> */}
      {(renderIconMenu || title != null) &&
        <Stack direction='row' alignItems='center' gap={0.5} mb='16px'>
          {/* height={theme.spacing(6)} */}
          {renderIconMenu && (
            <IconButton onClick={toggleMenu}>
              <Icon>menu</Icon>
            </IconButton>
          )}
          {(title != null) &&
            <Stack flex={1} justifyContent='center' sx={{ backgroundColor: themePlus.themePlusDeriv.destaque1.backColor }}>
              <Typography noWrap
                // whiteSpace='nowrap' overflow='hidden' textOverflow='ellipses' @!!!!!!!!! ellipses não funciona aqui
                m='auto'
                // variant={smDown ? 'h5' : mdDown ? 'h4' : 'h3'}
                variant='h6'
              >
                {title}
              </Typography>
            </Stack>
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