import React from 'react';
import { useRouter } from 'next/router';

import { Collapse, ListItemText } from '@mui/material';
import { Box } from '@mui/system';
import { Divider, Drawer, List, ListItemButton } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { PageDef } from '../../libCommon/endPoints';

//import { useMediaQueryMy } from '../../hooks/useMediaQueryMy';

import { preserveStateContext } from '../../pages/_appResources';

import { ImgResponsive, Tx } from '../ui';
import { useMenuLateral } from './useMenulateral';
import { MenuEntry, MenuEntryType, routerPageDef, MenuLateralContext } from '.';

interface IMenuLateralProps {
  menuEntries: MenuEntry[];
  pageDefCurr: PageDef;
  imgApp: string;
  children: React.ReactNode;
}

const compByType = (content: React.ReactNode | string, bolder?: boolean) => typeof content === 'string' ? <Tx bold={bolder}>{content}</Tx> : <>{content}</>;

export const MenuLateral: React.FC<IMenuLateralProps> = ({ menuEntries, pageDefCurr, imgApp, children }: IMenuLateralProps) => {
  const { variant: menuLateralVariant } = useMenuLateral();
  const { preserveStateResetAll } = React.useContext(preserveStateContext);
  const router = useRouter();

  const { isMenuOpen, closeMenu } = React.useContext(MenuLateralContext);
  //const useMediaQueryData = useMediaQueryMy();

  interface IRenderItemProps {
    menuEntry: MenuEntry;
    level: number;
  }
  const desloc = 6;
  const RenderItem = ({ menuEntry, level }: IRenderItemProps) => {
    const [open, setOpen] = React.useState(false);
    //const sx = { pl: level * 0.5, pr: 0.5 };
    const sx = { pl: `${desloc * level}px`, pr: `${desloc}px` };
    if (menuEntry.type == MenuEntryType.group)
      return (<>
        <ListItemButton onClick={() => setOpen(!open)} sx={sx}>
          {compByType(menuEntry.content)}
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={open} timeout='auto' unmountOnExit>
          <List component='div' disablePadding>
            {menuEntry.groupItens.map((item, i) => <RenderItem key={i} menuEntry={item} level={level + 1} />)}
          </List>
        </Collapse>
      </>);
    else if (menuEntry.type == MenuEntryType.pagePath) {
      //const match = pageDef?.pagePath == menuEntry.pageDef.pagePath && !actualPagePath.endsWith('dummy');
      const isPageCurrent = pageDefCurr == menuEntry.pageDef && !pageDefCurr?.pagePath.endsWith('dummy');
      const handlePagePath = () => { closeMenu(); preserveStateResetAll(); routerPageDef(menuEntry.pageDef, router, menuEntry.query, pageDefCurr); };
      return (<ListItemButton selected={isPageCurrent} onClick={handlePagePath} sx={sx}>{compByType(menuEntry.content)}</ListItemButton>);
    }
    else if (menuEntry.type == MenuEntryType.onlyShow)
      return (<ListItemText sx={sx}>{compByType(menuEntry.content)}</ListItemText>);
    else if (menuEntry.type == MenuEntryType.divider)
      return (<Divider />);
    else
      return (<Box>{menuEntry.type} ???</Box>);
  };

  //const menuWidth = useMediaQueryData.lgDown ? theme.spacing(20) : theme.spacing(25);
  const menuWidth = '180px'; // useMediaQueryData.lgDown ? '180px' : '200px'; // pode dar pau, de pagina gerada na compilação ser diferente da pagina renderizada? //@!!!!!!!!

  return (
    <Box height='100%'>
      <Drawer open={isMenuOpen} variant={menuLateralVariant} onClose={closeMenu}>
        <Box width={menuWidth} height='100%' display='flex' flexDirection='column'>
          {imgApp != null &&
            <>
              <Box width='100%' display='flex' alignItems='center' justifyContent='center' padding={`${desloc*2}px`}>
                {/* <Avatar sx={{ height: theme.spacing(12), width: theme.spacing(12) }} src={imgApp} /> */}
                <Box width='100%'>
                  <ImgResponsive src={imgApp} />
                </Box>
              </Box>
              <Divider />
            </>
          }
          <Box>
            <List component='nav'>
              {menuEntries.map((menuEntry, i) => <RenderItem key={i} menuEntry={menuEntry} level={2} />)}
            </List>
          </Box>
        </Box>
      </Drawer>
      <Box height='100%' marginLeft={menuLateralVariant == 'permanent' ? menuWidth : 0}>
        {children}
      </Box>
    </Box>
  );
};