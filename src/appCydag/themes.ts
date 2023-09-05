import { MenuType } from '../components';
import { IThemeSchemes, ThreeColors } from '../styles/themeTools';

// appXXX

export const menuTypeApp = MenuType.lateral;

export const cydagColors = {
  colorsBackHier: ['#ce171f', '#999999', '#cccccc', '#eeeeee'],
  bgColorRealMaiorPlan: '#ffe5e5',
  bgColorRealMenorPlan: '#e5f2e5',
};

export const themeSchemesApp: IThemeSchemes = {
  inputVariant: 'standard',
  buttonVariant: 'contained',
  colorBackDroparea: 'lightblue',
  maxWidth: [
    { key: 'full', props: { maxWidth: null } },
  ],
  color: [
    //{ key: 'petroleo', props: { bodyDark: false, primaryBackColor: new ThreeColors('#546E7A', '#607D8B', '#455A64') } },
    { key: 'cinza_escuro', props: { bodyDark: false, primaryBackColor: new ThreeColors('#545454') } },
    { key: 'cinza_claro', props: { bodyDark: false, primaryBackColor: new ThreeColors('#7d7d7d') } },
    { key: 'laranja', props: { bodyDark: false, primaryBackColor: new ThreeColors('#f16523') } },
    { key: 'vermelho', props: { bodyDark: false, primaryBackColor: new ThreeColors('#ca5b61') } },
    //{ key: 'vermelho3', props: { bodyDark: false, primaryBackColor: new ThreeColors('#B3151c', '#ca5b61', '#a1131a') } },
    // { key: 'tema2', props: { bodyDark: false, primaryBackColor: new ThreeColors('#dd5e64', '#e48287', '#c3444b') } },
    { key: 'laranjaD', props: { bodyDark: true, primaryBackColor: new ThreeColors('#f16523') } },
  ],
  font: [
    { key: 'Roboto', props: { fontFamilies: ['Roboto', 'Helvetica', 'Verdana', 'Arial', 'Courier'] } },
    { key: 'Roboto10', props: { fontFamilies: ['Roboto', 'Helvetica', 'Verdana', 'Arial', 'Courier'], fontSize: 10 } },
    { key: 'Roboto20', props: { fontFamilies: ['Roboto', 'Helvetica', 'Verdana', 'Arial', 'Courier'], fontSize: 20 } },
    { key: 'Segoe Script', props: { fontFamilies: ['Segoe Script'] } },
    { key: 'Arial', props: { fontFamilies: ['Arial'] } },
  ],
  spacing: [
    { key: 'spc8', props: { spacing: 8 } },
    { key: 'spc16', props: { spacing: 16 } },
    { key: 'spc24', props: { spacing: 24 } },
    { key: 'spc0', props: { spacing: 0 } },
    { key: 'spc1', props: { spacing: 1 } },
  ],
};