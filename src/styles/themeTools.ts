import Color from 'color';

import { createTheme, Theme as ThemeMui } from '@mui/material/styles';
import { csd, dbgError } from '../libCommon/dbg';
//import { PaletteColorOptions } from '@mui/material';

// https://www.w3schools.com/colors/colors_shades.asp
const whiteColor = '#ffffff';
//const whiteColorPaper = '#f8f8f8'; //@!!!!!
const whiteBackColorAlt1 = '#F0F0F0';
const whiteBackColorAlt2 = '#E0E0E0';
const whiteForeColorAlt1 = '#B0B0B0';
const whiteBackColorSobreposSemiTransparent = '#707070';

const blackColor = '#000000';
//const blackColorPaper = blackColor;
const blackBackColorAlt1 = '#303030';  // linhas alternadas em tabelas
const blackBackColorAlt2 = '#484848';  // hover em linhas de tabela
const blackForeColorAlt1 = '#808080';  // campos disabled 
const blackBackColorSobreposSemiTransparent = '#707070';

// const colorCodeOrange = '#FFA500';
// const colorCodeYellow = '#FFFF00';
// const colorCodeBrown = '#A52A2A';
// const colorCodeGreen = '#008000';

export interface IThemeVariants { maxWidthScheme?: string, maxWidthDetailScheme?: string, colorScheme?: string; fontScheme?: string; spacingScheme?: string }

export const fontFamiliesDefault = ['Roboto', 'Helvetica', 'Verdana', 'Arial', 'Courier'];

export class ThreeColors {
  regular: string;
  weaker: string; // um pouco mais fraco (para tema dar é mais claro, para escuro é amis escuro)
  stronger: string;
  constructor(regular: string, weaker?: string, stronger?: string) {
    this.regular = regular;
    this.weaker = weaker || regular;
    this.stronger = stronger || regular;
  }
}
interface IThemeSchemeMaxWidth { key: string, props: { maxWidth: string } }
interface IThemeSchemeMaxWidthDetail { key: string, props: { maxWidthDetail: string } }
interface IThemeSchemeColor { key: string, props: { bodyDark: boolean, primaryBackColor: ThreeColors, secondaryBackColor?: ThreeColors } }
interface IThemeSchemeFont { key: string, props: { fontFamilies: string[], fontSize?: number } }
interface IThemeSchemeSpacing { key: string, props: { spacing: number } }

export type InputVariantType = 'outlined' | 'filled' | 'standard';
type ButtonVariantType = 'text' | 'outlined' | 'contained';

export interface IThemeSchemes {
  inputVariant?: InputVariantType,
  buttonVariant?: ButtonVariantType,
  colorBackDroparea?: string;
  maxWidth?: IThemeSchemeMaxWidth[],
  maxWidthDetail?: IThemeSchemeMaxWidthDetail[],
  color?: IThemeSchemeColor[],
  font?: IThemeSchemeFont[],
  spacing?: IThemeSchemeSpacing[],
}

// export const defaultThemeVariants = (themeSchemes: ThemeSchemes) => ({
//   maxWidthScheme: themeSchemes.maxWidth[0].key,
//   colorScheme: themeSchemes.color[0].key,
//   fontScheme: themeSchemes.font[0].key,
// } as ThemeVariants);


/**
 * Tudo que pode ser personalizado na app
 */
export interface IThemePlusConfig {
  maxWidth?: string; // body (o mais genérico, para todas telas)
  maxWidthDetail?: string; // para os conteúdos que não podem ser muito largos, com detalhamentos, imagens isoladas, etc
  fontFamilies: string[];
  fontSize: number;
  spacing?: number;
  bodyDark?: boolean;
  primaryBackColor: ThreeColors;
  secondaryBackColor?: ThreeColors;
  widthFontFull?: string;
  widthFontReduz1: string;
  inputVariant: InputVariantType;
  buttonVariant: ButtonVariantType;
  colorBackDroparea?: string;
  //widthSmall: string;
  // @@@! tb para cor disabled !!! montar uma pagina de demonstração completa (themes)  
}
export const themePlusConfigDefault: IThemePlusConfig = {
  maxWidth: '99999px', // @!!!!!!!!!! user null !!!
  maxWidthDetail: '99999px',
  fontFamilies: fontFamiliesDefault,
  fontSize: 16,
  //spacing: 8, // em px
  bodyDark: false,
  primaryBackColor: new ThreeColors('#546E7A', '#607D8B', '#455A64'),
  secondaryBackColor: null,
  widthFontFull: '1000px',
  widthFontReduz1: '768px', // tablets
  inputVariant: 'standard',
  buttonVariant: 'contained',
  //widthSmall: '480px', // mobile
};

export interface IBackFront {
  text: string;
  backColor: string;
}
interface IThemePlusDeriv {
  // status?: {
  //   danger?: string;
  // };
  // minhaCor?: string;
  destaque1: IBackFront;
  destaque2: IBackFront;
  sobreposSemiTransparent: IBackFront;
  borderLightColor: string;
  borderHeavyColor: string;
}

declare module '@mui/material/styles' {
  interface Theme {
    // status: {
    //   danger: string;
    // };
    // minhaCor: string;
    themePlusConfig?: IThemePlusConfig;
    themePlusDeriv?: IThemePlusDeriv;
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    // status?: {
    //   danger?: string;
    // };
    // minhaCor?: string;
    themePlusConfig?: IThemePlusConfig;
    themePlusDeriv?: IThemePlusDeriv;
  }
}

export interface IThemePlus extends ThemeMui { } // @@!!!!! ThemePlus em tudo

// export const colorTypes = {
//   primary: 'primary',
//   secondary: 'secondary',
// };

// aqui se for usado 'Switch size=small' (por exemplo) não fica proporcional ao font size @!!!!!!

export function GenThemePlus(themeSchemes: IThemeSchemes, themeVariants?: IThemeVariants) {
  const themePlusConfig = GenThemeConfig(themeSchemes, themeVariants);

  const secondaryBackColorOrPrimary = themePlusConfig.secondaryBackColor || themePlusConfig.primaryBackColor;

  const bodyBackColor = themePlusConfig.bodyDark ? blackColor : whiteColor;
  //const bodyBackColorPaper = themeConfig.bodyDark ? blackColorPaper : whiteColorPaper;
  const backColorAlt1 = BackColorAlternative(bodyBackColor, 1); // mais proxima da cor base
  const backColorAlt2 = BackColorAlternative(bodyBackColor, 2); // mais distante da cor base (maior contraste)
  const backColorSobreposSemiTransparent = BackColorSobreposSemiTransparent(bodyBackColor);
  const foreColorAlt1 = ForeColorAlternative(bodyBackColor, 1);
  //const foreColor = ForeColorByBack(bodyBackColor);

  const themePlusDeriv: IThemePlusDeriv = {
    destaque1: {
      backColor: backColorAlt1,
      text: ForeColorByBack(backColorAlt1),
    },
    destaque2: {
      backColor: backColorAlt2,
      text: ForeColorByBack(backColorAlt2),
    },
    sobreposSemiTransparent: {
      backColor: backColorSobreposSemiTransparent,
      text: ForeColorByBack(backColorSobreposSemiTransparent),
    },
    borderLightColor: backColorAlt1,
    borderHeavyColor: backColorAlt2,
  };

  const themePlus = createTheme({
    typography: {
      // fontFamily: vip.fontFamily,   // checar se algum componente MUI não usa o font-family/size definido no global style !
      // fontSize: vip.fontSize,
      fontFamily: themePlusConfig.fontFamilies.join(','),   // checar se algum componente MUI não usa o font-family/size definido no global style !
      fontSize: themePlusConfig.fontSize,
      allVariants: {
        color: themePlusConfig.bodyDark ? 'white' : 'black',
      },
      // body1: {
      //   color: 'blue',
      //   backgroundColor: 'green',
      // },
      // // body2: { //@!!!!!!
      // //   color: 'cyan',
      // //   backgroundColor: 'brown',
      // // },
    },
    spacing: themePlusConfig.spacing,
    palette: {
      mode: themePlusConfig.bodyDark ? 'dark' : 'light',
      background: {
        default: bodyBackColor,
      },
      text: {
        // primary: foreColor,
        disabled: foreColorAlt1,
      },
      primary: {
        main: themePlusConfig.primaryBackColor.regular,
        light: themePlusConfig.primaryBackColor.weaker,
        dark: themePlusConfig.primaryBackColor.stronger,
        //contrastText: ForeColorByBack(themeConfig.primaryBackColor.normal),
      },
      secondary: {
        main: secondaryBackColorOrPrimary.regular,
        light: secondaryBackColorOrPrimary.weaker,
        dark: secondaryBackColorOrPrimary.stronger,
        //contrastText: ForeColorByBack(secondaryBackColorOrPrimary.normal),
      },
      // success: {
      //   main: colorCodeOrange,
      //   light: colorCodeGreen,
      //   dark: colorCodeBrown,
      // },
      // action: { // para button
      //   disabledBackground: bodyBack,  // ele aplica algum efeito que não sei qual é!
      //   //disabled: foreColor,
      // },
    },
    themePlusConfig,
    themePlusDeriv,
    // destaque1: {
    //   backColor: backColorAlt1,
    //   text: ForeColorByBack(backColorAlt1),
    // },
    // destaque2: {
    //   backColor: backColorAlt2,
    //   text: ForeColorByBack(backColorAlt2),
    // },
    // sobreposSemiTransparent: {
    //   backColor: backColorSobreposSemiTransparent,
    //   text: ForeColorByBack(backColorSobreposSemiTransparent),
    // },
    // borderLightColor: backColorAlt1,
    // borderHeavyColor: backColorAlt2,
  });

  // const mediaQuery = mediaQueryMy(themePlus);
  // csd({ mediaQuery });
  // themePlus.typography.h3 = {
  // fontSize: '1rem',
  // // '@media (min-width:600px)': {
  // //   fontSize: '.8rem',
  // // },
  // [theme.breakpoints.up('md')]: {
  //   fontSize: '0.7rem',
  // },

  return <IThemePlus>themePlus;
}
// export function ThemeObj(theme) {
//   const themeObj = theme == 'light' ? lightTheme : darkTheme;
// }

// export function MyClassName(props) {
//   const result = {};
//   if (props.color) {
//     if (color_combinations.includes(props.color))
//       result.className = `color_${props.color}`;
//     else
//       csl('color invalid', props.color);
//   }
//   return result;
// }

// para uso nos componentes

// export function CssColorsByType(colorType: string, theme: Theme) { // obsoleta !
//   // csl('colorTypeProp', `${colorType}BackColor`, theme[`${colorType}BackColor`]);
//   // csl('theme', theme);
//   const colorBack = theme[`${colorType}BackColor`] || 'white';
//   //const colorBack = theme.palette[colorType].main..[`${colorType}BackColor`] || 'white';
//   return CssColorsByBack(colorBack);
// }

// export function CssColorsByBack(colorBackground: string) {
//   const colors = ColorsByBack(colorBackground);
//   return `
//     color: ${colors.color};
//     background-color: ${colors.backgroundColor};
//   `;
// }
// export function ColorsByBack(colorBackground: string) {
//   return {
//     backgroundColor: colorBackground,
//     color: ForeColorByBack(colorBackground),
//     lum: Math.round(Color(colorBackground).luminosity() * 100).toString().padStart(2, '0'),
//     contrWh: Math.round(Color(colorBackground).contrast(Color('white'))).toString().padStart(2, '0'),
//     contrBl: Math.round(Color(colorBackground).contrast(Color('black'))).toString().padStart(2, '0'),
//   };
// }

export function ForeColorByBack(backColor: string) {
  let result: string;
  try {
    if (Color(backColor).isDark()) { // @@!!!!! não aceita as cores nomeadas !!! adaptar um conversor !
      result = '#FFFFFF';
      if (Color(backColor).contrast(Color(result)) >= 18)
        result = '#DDDDDD';
    }
    else {
      result = '#000000';
      if (Color(backColor).contrast(Color(result)) >= 18)
        result = '#222222';
    }
  } catch (error) {
    dbgError('ForeColorByBack', `Erro ao interpretar backColor '${backColor}' e assumido blue como cor de fonte (tente usar o código da cor no formato #xxxxxx)`);
    result = 'blue';
  }
  //csl('ForeColorByBack - backcolor', backColor, 'dark?', Color(backColor).isDark(), 'fore', result);
  return result;
}

export function BackColorAlternative(backColor: string, variant: number) {
  let result: string;
  if (backColor == whiteColor) {
    if (variant == 1)
      result = whiteBackColorAlt1;
    else if (variant == 2)
      result = whiteBackColorAlt2;
    else
      throw new Error(`BackColorAlternative variant '${variant}' não prevista.`);
  }
  else if (backColor == blackColor) {
    if (variant == 1)
      result = blackBackColorAlt1;
    else if (variant == 2)
      result = blackBackColorAlt2;
    else
      throw new Error(`BackColorAlternative variant '${variant}' não prevista.`);
  }
  else
    throw new Error(`BackColorAlternative backcolor '${backColor}' não prevista.`);
  //csl('BackColorAlternative - backcolor', backColor, 'alternative', result);
  return result;
}

export function BackColorSobreposSemiTransparent(backColor: string) {
  let result: string;
  if (backColor == whiteColor) {
    result = whiteBackColorSobreposSemiTransparent;
  }
  else if (backColor == blackColor) {
    result = blackBackColorSobreposSemiTransparent;
  }
  else
    throw new Error(`BackColorSobreposSemiTransparent backcolor '${backColor}' não prevista.`);
  return result;
}

export function ForeColorAlternative(backColor: string, variant: number) {
  let result: string;
  if (backColor == whiteColor) {
    if (variant == 1)
      result = blackForeColorAlt1;
    else
      throw new Error(`BackColorAlternative variant '${variant}' não prevista.`);
  }
  else if (backColor == blackColor) {
    if (variant == 1)
      result = whiteForeColorAlt1;
    else
      throw new Error(`BackColorAlternative variant '${variant}' não prevista.`);
  }
  else
    throw new Error(`BackColorAlternative backcolor '${backColor}' não prevista.`);
  //csl('BackColorAlternative - backcolor', backColor, 'alternative', result);
  return result;
}

const GenThemeConfig = (themeSchemes: IThemeSchemes, themeVariants?: IThemeVariants) => {
  let themeConfig = themePlusConfigDefault;
  if (themeSchemes.inputVariant != null) themeConfig.inputVariant = themeSchemes.inputVariant;
  if (themeSchemes.colorBackDroparea != null) themeConfig = { ...themeConfig, colorBackDroparea: themeSchemes.colorBackDroparea };
  if (themeSchemes.maxWidth?.length > 0) themeConfig = { ...themeConfig, ...themeSchemes.maxWidth[0].props };
  if (themeSchemes.maxWidthDetail?.length > 0) themeConfig = { ...themeConfig, ...themeSchemes.maxWidthDetail[0].props };
  if (themeSchemes.color?.length > 0) themeConfig = { ...themeConfig, ...themeSchemes.color[0].props };
  if (themeSchemes.font?.length > 0) themeConfig = { ...themeConfig, ...themeSchemes.font[0].props };
  if (themeSchemes.spacing?.length > 0) themeConfig = { ...themeConfig, ...themeSchemes.spacing[0].props };
  if (themeVariants != null) {
    if (themeVariants.maxWidthScheme != null && themeSchemes.maxWidth != null) {
      const maxWidthScheme = themeSchemes.maxWidth.find((x) => x.key == themeVariants.maxWidthScheme);
      if (maxWidthScheme != null) themeConfig = { ...themeConfig, ...maxWidthScheme.props };
      //else dbgError(`maxWidthScheme ${themeVariants.maxWidthScheme} não previsto`);
    }
    if (themeVariants.maxWidthDetailScheme != null && themeSchemes.maxWidthDetail != null) {
      const maxWidthDetailScheme = themeSchemes.maxWidthDetail.find((x) => x.key == themeVariants.maxWidthDetailScheme);
      if (maxWidthDetailScheme != null) themeConfig = { ...themeConfig, ...maxWidthDetailScheme.props };
    }
    if (themeVariants.colorScheme != null && themeSchemes.color != null) {
      const colorScheme = themeSchemes.color.find((x) => x.key == themeVariants.colorScheme);
      if (colorScheme != null) themeConfig = { ...themeConfig, ...colorScheme.props };
    }
    if (themeVariants.fontScheme != null && themeSchemes.font != null) {
      const fontScheme = themeSchemes.font.find((x) => x.key == themeVariants.fontScheme);
      if (fontScheme != null) themeConfig = { ...themeConfig, ...fontScheme.props };
    }
    if (themeVariants.spacingScheme != null && themeSchemes.spacing != null) {
      const spacingScheme = themeSchemes.spacing.find((x) => x.key == themeVariants.spacingScheme);
      if (spacingScheme != null) themeConfig = { ...themeConfig, ...spacingScheme.props };
    }
  }

  return themeConfig;
};