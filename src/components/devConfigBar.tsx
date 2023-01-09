import React from 'react';
import { Box, MenuItem, Select, Stack, SxProps } from '@mui/material';

import { Env } from '../libCommon/envs';

import { ScopeDbg } from '../libCommon/dbg';
import { StrLeft } from '../libCommon/util';
import { IGenericObject } from '../libCommon/types';
import { isAmbDev } from '../libCommon/isAmb';

import { globals } from '../libClient/clientGlobals';
import { ThemeSchemes, ThemeVariants } from '../styles/themeTools';
import { useMediaQueryMy } from '../hooks/useMediaQueryMy';

import { AbortProcComponent, LogErrorUnmanaged } from './abortProc';

interface IDevConfigBarProps {
  _appMainStates: IGenericObject; // @!!!!! aqui apenas os demais, como niveis log, etc
  themeVariants: ThemeVariants;
  themeSchemes: ThemeSchemes;
  changeMenuType: () => void;
  changeThemeVariants: (themeVariants: ThemeVariants) => void;
  changeNivelLog: (nivel: number, scopeDbg: ScopeDbg) => void
}

export const DevConfigBarContext = React.createContext<IDevConfigBarProps>(null);

class SelectOption {
  value: string;
  text: string;
  constructor(value: string, text?: string) {
    this.value = value;
    this.text = text != null ? text : value.toString();
  }
}

export const DevConfigBar = () => {
  const [showThemeVars, setShowThemeVars] = React.useState(false);
  const [showDbgLevels, setShowDbgLevels] = React.useState(false);
  const [showOthers, setShowOthers] = React.useState(false);
  const { _appMainStates, themeVariants, themeSchemes, changeMenuType, changeThemeVariants, changeNivelLog } = React.useContext(DevConfigBarContext);
  const useMediaQueryData = useMediaQueryMy();

  const changeThemeLocal = (themeVariantsChg: ThemeVariants) => { // ThemeVariants { maxWidth: string, colorScheme: string; fontScheme: string };
    changeThemeVariants({ ...themeVariants, ...themeVariantsChg });
  };

  try {
    // const widthCategoriesShow = [
    //   { maxWidth: 99999, category: 'full' },
    //   { maxWidth: 1536, category: 'desk2' },
    //   { maxWidth: 1366, category: 'desk1' },
    //   { maxWidth: 768, category: 'tablet' },
    //   { maxWidth: 414, category: 'mob2' },
    //   { maxWidth: 375, category: 'mob1' },
    // ];

    const optionsThemeMaxWidth = themeSchemes.maxWidth != null ? themeSchemes.maxWidth.map((x) => new SelectOption(x.key, x.key)) : [];
    const optionsThemeColorScheme = themeSchemes.color != null ? themeSchemes.color.map((x) => new SelectOption(x.key, x.key)) : [];
    const optionsThemeFontScheme = themeSchemes.font != null ? themeSchemes.font.map((x) => new SelectOption(x.key, x.key)) : [];
    const optionsThemeSpacingScheme = themeSchemes.spacing != null ? themeSchemes.spacing.map((x) => new SelectOption(x.key, x.key)) : [];

    // const mediaPattern = (screenSizeMax, category, index) => `@media only screen and (max-width: ${screenSizeMax}px) {
    //   .infoSize::after { content: " (<= ${screenSizeMax} ${category})"; color: black; background-color: ${index % 2 == 0 ? 'red' : 'white'}; }  
    // } `;
    // let xx = maxWidthCategories.map((x, i) => mediaPattern(x.maxWidth, x.category, i)).join(' ');

    const isDevContext = (isAmbDev() || globals?.loggedUserIsDev === true);

    const sxFont: SxProps = { fontFamily: 'arial', fontSize: '16px' };

    return (
      <>
        {/* <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'start',
          gap: '1rem',
        }}>   em box usar o flaxdirection revertido @!!!!! */}
        <Stack direction='row' alignItems='center' gap='16px' sx={sxFont}>
          {showOthers &&
            <Box>{`id: ${StrLeft(globals.browserId, 3)} / ${globals.windowId}`}</Box>
          }
          {isDevContext &&
            <Box onClick={() => setShowOthers(!showOthers)}>Ot</Box>
          }

          {showThemeVars &&
            <>
              {optionsThemeMaxWidth.length > 1 &&
                <Select variant='standard' value={themeVariants.maxWidthScheme || ''} onChange={(ev) => changeThemeLocal({ maxWidthScheme: ev.target.value })} sx={sxFont}>
                  {optionsThemeMaxWidth.map((option, index) => <MenuItem key={index} value={option.value} sx={sxFont}>{option.text}</MenuItem>)}
                </Select>
              }
              {optionsThemeColorScheme.length > 1 &&
                <Select variant='standard' value={themeVariants.colorScheme || ''} onChange={(ev) => changeThemeLocal({ colorScheme: ev.target.value })} sx={sxFont}>
                  {optionsThemeColorScheme.map((option, index) => <MenuItem key={index} value={option.value} sx={sxFont}>{option.text}</MenuItem>)}
                </Select>
              }
              {optionsThemeFontScheme.length > 1 &&
                <Select variant='standard' value={themeVariants.fontScheme || ''} onChange={(ev) => changeThemeLocal({ fontScheme: ev.target.value })} sx={sxFont}>
                  {optionsThemeFontScheme.map((option, index) => <MenuItem key={index} value={option.value} sx={sxFont}>{option.text}</MenuItem>)}
                </Select>
              }
              {optionsThemeSpacingScheme.length > 1 &&
                <Select variant='standard' value={themeVariants.spacingScheme || ''} onChange={(ev) => changeThemeLocal({ spacingScheme: ev.target.value })} sx={sxFont}>
                  {optionsThemeSpacingScheme.map((option, index) => <MenuItem key={index} value={option.value} sx={sxFont}>{option.text}</MenuItem>)}
                </Select>
              }
            </>
          }
          {(isDevContext || globals?.loggedUserCanChangeTheme === true) &&
            <Box onClick={() => setShowThemeVars(!showThemeVars)}>tema</Box>
          }

          {showDbgLevels &&
            <>
              <a onClick={() => changeNivelLog(_appMainStates.nivelLogA + 1, ScopeDbg.a)}>a{_appMainStates.nivelLogA}</a>
              <a onClick={() => changeNivelLog(_appMainStates.nivelLogD + 1, ScopeDbg.d)}>d{_appMainStates.nivelLogD}</a>
              <a onClick={() => changeNivelLog(_appMainStates.nivelLogE + 1, ScopeDbg.e)}>e{_appMainStates.nivelLogE}</a>
              <a onClick={() => changeNivelLog(_appMainStates.nivelLogT + 1, ScopeDbg.t)}>t{_appMainStates.nivelLogT}</a>
              <a onClick={() => changeNivelLog(_appMainStates.nivelLogX + 1, ScopeDbg.x)}>x{_appMainStates.nivelLogX}</a>
            </>
          }
          {isDevContext &&
            <div onClick={() => setShowDbgLevels(!showDbgLevels)}>dL</div>
          }

          {isDevContext &&
            <a onClick={changeMenuType}>menuType:{_appMainStates.menuType}</a>
          }

          <span className='infoSize' />

          <Box>{`${Env('appVersion')}`}</Box>
        </Stack>

        <style jsx>{`
          .infoSize::after { content: " (<= ${useMediaQueryData.widthCategory})"; } 
          // @media only screen and (max-width: {widthCategoriesShow[0].maxWidth}px) { .infoSize::after { content: " (<= {widthCategoriesShow[0].maxWidth} {widthCategoriesShow[0].category})"; } .infoSize { background-color: white         } }
          // @media only screen and (max-width: {widthCategoriesShow[1].maxWidth}px) { .infoSize::after { content: " (<= {widthCategoriesShow[1].maxWidth} {widthCategoriesShow[1].category})"; } .infoSize { background-color: lemonchiffon; } }
        `}</style>

      </>
    );

  } catch (error) {
    LogErrorUnmanaged(error, 'DevConfigBar-render');
    return (<AbortProcComponent error={error} component='DevConfigBar' />);
  }

};
