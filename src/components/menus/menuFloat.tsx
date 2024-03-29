import React from 'react';
import { useRouter } from 'next/router';

import { Box, Menu, MenuItem, Divider, SxProps } from '@mui/material';

import { PageDef } from '../../libCommon/endPoints';

import { Tx } from '../ui';
import { MenuEntry, MenuEntryType, routerPageDef } from '.';

// um componente que, ao clicar, abre um menu de opções abaixo
interface IMenuFloatProps {
  anchor: React.ReactNode;
  itens: MenuEntry[];
  sx?: SxProps;
  pageDefCurr: PageDef;
}

const compByType = (content: React.ReactNode | string, bolder?: boolean) => typeof content === 'string' ? <Tx bold={bolder}>{content}</Tx> : <>{content}</>;

export function MenuFloat({ anchor, itens, pageDefCurr, sx }: IMenuFloatProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const router = useRouter();
  const handleClick = (ev: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(ev.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  // @@@! cor do submenu
  // está causando impacto em paginas com muito conteúdo (css?)

  // const ContentItem = ({ menuEntry, isPageCurrent }: { menuEntry: MenuEntry, isPageCurrent: boolean }) => {
  //   const renderComp = typeof menuEntry.content === 'string' ? <Tx bold={isPageCurrent}>{menuEntry.content}</Tx> : <>{menuEntry.content}</>;
  //   return renderComp;
  // };

  return (
    <>
      <Box onClick={handleClick} sx={{ ...sx, cursor: 'pointer' }}>
        {anchor}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {itens.map((menuEntry, i) => {
          const isPageCurrent = pageDefCurr == menuEntry.pageDef && !pageDefCurr?.pagePath.endsWith('dummy');
          if (menuEntry.type == MenuEntryType.group)
            return <MenuItem key={i}>{compByType(menuEntry.content)} (sem ação para tipo {menuEntry.type})</MenuItem>;
          else if (menuEntry.type == MenuEntryType.pagePath)
            return <MenuItem key={i} onClick={() => routerPageDef(menuEntry.pageDef, router, menuEntry.query, pageDefCurr)}>{compByType(menuEntry.content, isPageCurrent)}</MenuItem>;
          else if (menuEntry.type == MenuEntryType.onlyShow)
            return <MenuItem key={i}>{compByType(menuEntry.content)}</MenuItem>;
          else if (menuEntry.type == MenuEntryType.divider)
            return <Divider key={i} />;
          else
            return <MenuItem key={i}>{menuEntry.type} ???</MenuItem>;
        })}
      </Menu>
    </>
  );
}
