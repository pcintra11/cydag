import React from 'react';

import { useMediaQuery, useTheme } from '@mui/material';

let mount = false;
export const useMenuLateral = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const toggleMenu = React.useCallback(() => {
    //csl('useMenuLateral-toggleMenu mount', mount);
    mount && setIsMenuOpen(oldIsMenuOpen => !oldIsMenuOpen);
  }, []);
  const closeMenu = React.useCallback(() => {
    //csl('useMenuLateral-closeMenu mount', mount);
    mount && setIsMenuOpen(() => false);
  }, []);
  React.useEffect(() => {
    mount = true;
    return () => { mount = false; };
  }, []);
  //csl('useMenuLateral render');
  const themePlus = useTheme();
  const smDown = useMediaQuery(themePlus.breakpoints.down('sm'));
  return {
    variant: smDown ? 'temporary' : 'permanent',
    isMenuOpen,
    toggleMenu,
    closeMenu,
  } as {
    variant: 'temporary' | 'permanent',
    isMenuOpen: boolean,
    toggleMenu: () => void,
    closeMenu: () => void,
  };
};