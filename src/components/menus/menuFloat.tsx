import React from 'react';
import { useRouter } from 'next/router';

import Menu_mui from '@mui/material/Menu';
import MenuItem_mui from '@mui/material/MenuItem';
import Divider_mui from '@mui/material/Divider';

import { PageDef } from '../../libCommon/endPoints';

import { MenuEntry, MenuEntryType, routerPageDef } from '.';

// um componente que, ao clicar, abre um menu de opções abaixo
interface IMenuFloatProps {
  anchor: React.ReactNode;
  itens: MenuEntry[];
  style?: React.CSSProperties;
  pageDefCurr: PageDef;
}
export function MenuFloat({ anchor, itens, pageDefCurr, style }: IMenuFloatProps) {
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
  // está causando impacto em paginas com muito conteudo (css?)

  const ContentItem = ({ menuEntry, isPageCurrent }: { menuEntry: MenuEntry, isPageCurrent: boolean }) => {
    const renderComp = isPageCurrent ? <b>{menuEntry.content}</b> : <>{menuEntry.content}</>;
    return renderComp;
  };

  return (
    <>
      <div onClick={handleClick} style={{ ...style, cursor: 'pointer' }}>
        {anchor}
      </div>
      <Menu_mui
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
            return <MenuItem_mui key={i}>{menuEntry.content} (sem ação para tipo {menuEntry.type})</MenuItem_mui>;
          else if (menuEntry.type == MenuEntryType.pagePath)
            return <MenuItem_mui key={i} onClick={() => routerPageDef(menuEntry.pageDef, router, menuEntry.query, pageDefCurr)}><ContentItem menuEntry={menuEntry} isPageCurrent={isPageCurrent} /></MenuItem_mui>;
          else if (menuEntry.type == MenuEntryType.onlyShow)
            return <MenuItem_mui key={i}>{menuEntry.content}</MenuItem_mui>;
          else if (menuEntry.type == MenuEntryType.divider)
            return <Divider_mui key={i} />;
          else
            return <MenuItem_mui key={i}>{menuEntry.type} ???</MenuItem_mui>;
        })}
      </Menu_mui>
    </>
  );
}
