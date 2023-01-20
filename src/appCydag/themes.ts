import { MenuType } from '../components';
import { ThemeSchemes, ThreeColors } from '../styles/themeTools';

// appXXX

export const menuTypeApp = MenuType.lateral;

export const themeSchemesApp: ThemeSchemes = {
  inputVariant: 'standard',
  buttomVariant: 'contained',
  colorsBackHier: ['#ce171f', '#999999', '#cccccc', '#eeeeee'],
  colorBackDroparea: 'lightblue',
  maxWidth: [
    { key: 'full', props: { maxWidth: 99999 } },
    // { key: '700', props: { maxWidth: 700 } },
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
    { key: 'Freestyle Script', props: { fontFamilies: ['Freestyle Script', 'Courier'] } },
    { key: 'Jokerman', props: { fontFamilies: ['Jokerman', 'Courier'] } },
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