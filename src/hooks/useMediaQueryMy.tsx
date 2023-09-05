import { useMediaQuery, useTheme } from '@mui/material';

export const useMediaQueryMy = () => {
  const themePlus = useTheme();
  const xsUp = useMediaQuery(themePlus.breakpoints.up('xs')); // >= 0
  const smUp = useMediaQuery(themePlus.breakpoints.up('sm')); // >= 600px?
  const mdUp = useMediaQuery(themePlus.breakpoints.up('md')); // >= 900px?
  const lgUp = useMediaQuery(themePlus.breakpoints.up('lg')); // >= 1200px?
  const xlUp = useMediaQuery(themePlus.breakpoints.up('xl')); // >= 1536px?
  const widthCategory =
    xlUp ? 'xl' :
      lgUp ? 'lg' :
        mdUp ? 'md' :
          smUp ? 'sm' :
            xsUp ? 'xs' : '??';
  //csl('DevConfigBar', { widthCategory, smDown, mdDown, lgDown, xlDown, xxl });
  return {
    xsUp,
    smUp,
    mdUp,
    lgUp,
    xlUp,
    widthCategory
  };
};