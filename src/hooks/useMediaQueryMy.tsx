import { useMediaQuery, useTheme } from '@mui/material';

export const useMediaQueryMy = () => {
  const themePlus = useTheme();
  const smDown = useMediaQuery(themePlus.breakpoints.down('sm')); // < 600px?
  const mdDown = useMediaQuery(themePlus.breakpoints.down('md')); // < 900px?
  const lgDown = useMediaQuery(themePlus.breakpoints.down('lg')); // < 1200px?
  const xlDown = useMediaQuery(themePlus.breakpoints.down('xl')); // < 1536px?
  const xxl = useMediaQuery(themePlus.breakpoints.up('xl')); // >= 1536px?
  const widthCategory =
    //xsDown ? 'xs' :
    smDown ? 'sm' :
      mdDown ? 'md' :
        lgDown ? 'lg' :
          xlDown ? 'xl' :
            xxl ? 'xxl' : '??';
  //console.log('DevConfigBar', { widthCategory, smDown, mdDown, lgDown, xlDown, xxl });
  return {
    smDown,
    mdDown,
    lgDown,
    xlDown,
    xxl,
    widthCategory
  };
};