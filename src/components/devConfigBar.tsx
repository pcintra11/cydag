import React from 'react';
import { Stack } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { blue } from '@mui/material/colors';

import { StrLeft } from '../libCommon/util';
import { IGenericObject } from '../libCommon/types';
import { csd, devContextCli } from '../libCommon/dbg';

import { globals } from '../libClient/clientGlobals';
import { useMediaQueryMy } from '../hooks/useMediaQueryMy';
import { IThemeSchemes, IThemeVariants } from '../styles/themeTools';

import { configApp } from '../app_hub/appConfig';
import { LoggedUserBase } from '../app_base/loggedUserBase';

import { AbortProcComponent, LogErrorUnmanaged } from './abortProc';
import { FrmInput } from './fldMyForm';
import { FakeLink, SelOption, SelectMy, Tx } from './ui';

interface IDevConfigBarProps {
  _appMainStates: IGenericObject; // @!!!!! aqui apenas os demais, como níveis log, etc
  themeVariants: IThemeVariants;
  themeSchemes: IThemeSchemes;
  changeMenuType: () => void;
  changeThemeVariants: (themeVariants: IThemeVariants) => void;
  //changeNivelLog: (nivel: number, scopeDbg: ScopeDbg) => void;
  changeCtrlLog: (ctrlLog: string) => void;
}

export const DevConfigBarContext = React.createContext<IDevConfigBarProps>(null);

export const DevConfigBar = ({ loggedUser }: { loggedUser: LoggedUserBase }) => {
  const [showThemeVars, setShowThemeVars] = React.useState(false);
  const [showDbgLevels, setShowDbgLevels] = React.useState(false);
  const [showOthers, setShowOthers] = React.useState(false);
  const [showDev, setShowDev] = React.useState(false);
  const { _appMainStates, themeVariants, themeSchemes, changeMenuType, changeThemeVariants, changeCtrlLog } = React.useContext(DevConfigBarContext);
  const [ctrlLog, setCtrlLog] = React.useState(_appMainStates.ctrlLog);
  const useMediaQueryData = useMediaQueryMy();

  const changeThemeLocal = (themeVariantsChg: IThemeVariants) => {
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

    const optionsThemeMaxWidth = themeSchemes.maxWidth != null ? themeSchemes.maxWidth.map((x) => new SelOption(x.key, x.key)) : [];
    const optionsThemeMaxWidthDetail = themeSchemes.maxWidthDetail != null ? themeSchemes.maxWidthDetail.map((x) => new SelOption(x.key, x.key)) : [];
    const optionsThemeColorScheme = themeSchemes.color != null ? themeSchemes.color.map((x) => new SelOption(x.key, x.key)) : [];
    const optionsThemeFontScheme = themeSchemes.font != null ? themeSchemes.font.map((x) => new SelOption(x.key, x.key)) : [];
    const optionsThemeSpacingScheme = themeSchemes.spacing != null ? themeSchemes.spacing.map((x) => new SelOption(x.key, x.key)) : [];

    // const mediaPattern = (screenSizeMax, category, index) => `@media only screen and (max-width: ${screenSizeMax}px) {
    //   .infoSize::after { content: " (<= ${screenSizeMax} ${category})"; color: black; background-color: ${index % 2 == 0 ? 'red' : 'white'}; }  
    // } `;
    // let xx = maxWidthCategories.map((x, i) => mediaPattern(x.maxWidth, x.category, i)).join(' ');

    const isDevContext = devContextCli() || LoggedUserBase.isDev(loggedUser);

    const fontSize = '16px';
    const bgcolor1 = 'yellow';

    const themeFix = createTheme({
      typography: {
        fontFamily: 'arial',
        fontSize: 14,
        allVariants: {
          color: blue[900],
        },
      }
    });

    return (
      <>
        <ThemeProvider theme={createTheme(themeFix)}>
          <Stack direction='row' alignItems='center' spacing={1} px={1} flexWrap='wrap' bgcolor='AntiqueWhite' borderRadius={2}>
            {showDev &&
              <>
                {isDevContext &&
                  <>
                    <FakeLink onClick={() => setShowDbgLevels(!showDbgLevels)}>CtrlDbg</FakeLink>
                    {showDbgLevels &&
                      <FrmInput value={ctrlLog} width='5rem' onChange={(ev) => setCtrlLog(ev.target.value)} onBlur={(ev) => changeCtrlLog(ev.target.value)} />
                    }
                  </>
                }

                {isDevContext &&
                  <>
                    <FakeLink onClick={() => setShowOthers(!showOthers)} bgcolor={showOthers ? bgcolor1 : null}>Others</FakeLink>
                    {showOthers &&
                      <Tx bgcolor={bgcolor1}>{`id: ${StrLeft(globals.browserId, 3)} / ${globals.windowId}`}</Tx>
                    }
                  </>
                }

                {(isDevContext || LoggedUserBase.canChangeTheme(loggedUser)) &&
                  <>
                    <FakeLink onClick={changeMenuType}>{`menuType:${_appMainStates.menuType}`}</FakeLink>
                    <FakeLink onClick={() => setShowThemeVars(!showThemeVars)}>Tema</FakeLink>
                    {showThemeVars &&
                      <>
                        {optionsThemeColorScheme.length > 1 &&
                          <SelectMy width='65px'
                            value={themeVariants.colorScheme}
                            onChange={(ev) => changeThemeLocal({ colorScheme: ev.target.value })}
                            options={[new SelOption(null, 'Color', true), ...optionsThemeColorScheme]}
                            fontSize={fontSize}
                          />
                        }
                        {optionsThemeFontScheme.length > 1 &&
                          <SelectMy width='65px'
                            value={themeVariants.fontScheme}
                            onChange={(ev) => changeThemeLocal({ fontScheme: ev.target.value })}
                            options={[new SelOption(null, 'Font', true), ...optionsThemeFontScheme]}
                            fontSize={fontSize}
                          />
                        }
                        {optionsThemeSpacingScheme.length > 1 &&
                          <SelectMy width='65px'
                            value={themeVariants.spacingScheme}
                            onChange={(ev) => changeThemeLocal({ spacingScheme: ev.target.value })}
                            options={[new SelOption(null, 'Spacing', true), ...optionsThemeSpacingScheme]}
                            fontSize={fontSize}
                          />
                        }
                        {optionsThemeMaxWidth.length > 1 &&
                          <SelectMy width='65px'
                            value={themeVariants.maxWidthScheme}
                            onChange={(ev) => changeThemeLocal({ maxWidthScheme: ev.target.value })}
                            options={[new SelOption(null, 'WBody', true), ...optionsThemeMaxWidth]}
                            fontSize={fontSize}
                          />
                        }
                        {optionsThemeMaxWidthDetail.length > 1 &&
                          <SelectMy width='65px'
                            value={themeVariants.maxWidthDetailScheme}
                            onChange={(ev) => changeThemeLocal({ maxWidthDetailScheme: ev.target.value })}
                            options={[new SelOption(null, 'WDetail', true), ...optionsThemeMaxWidthDetail]}
                            fontSize={fontSize}
                          />
                        }
                      </>
                    }
                  </>
                }
              </>
            }

            {/* <span className='infoSize' /> */}
            <Tx>{useMediaQueryData.widthCategory}</Tx>
            <FakeLink onClick={() => setShowDev(!showDev)}>{configApp.appVersion}</FakeLink>

            {/* <style jsx>{`
              .infoSize::after { content: " (${useMediaQueryData.widthCategory})"; } 
              // @media only screen and (max-width: {widthCategoriesShow[0].maxWidth}px) { .infoSize::after { content: " (<= {widthCategoriesShow[0].maxWidth} {widthCategoriesShow[0].category})"; } .infoSize { background-color: white         } }
              // @media only screen and (max-width: {widthCategoriesShow[1].maxWidth}px) { .infoSize::after { content: " (<= {widthCategoriesShow[1].maxWidth} {widthCategoriesShow[1].category})"; } .infoSize { background-color: lemonchiffon; } }
            `}</style> */}

          </Stack>

        </ThemeProvider>
      </>
    );


  } catch (error) {
    LogErrorUnmanaged(error, 'DevConfigBar-render');
    return (<AbortProcComponent error={error} component='DevConfigBar' />);
  }

};
