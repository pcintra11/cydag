import { createGlobalStyle } from 'styled-components';

import { ThemePlus } from './themeTools';

// Configuring styled-jsx with scss in Next.js: https://bfanger.medium.com/styled-jsx-with-scss-in-next-js-5850dfc00449

// resolution
// http://sergiolopes.org/media-queries-retina/
// 0.75dppx (= 72dpi) - Android low-end, tipo Galaxy 5.
// 1dppx (= 96dpi) - Notebooks, desktops e vários celulares e tablets.
// 1.33dppx (= 127dpi) - Nexus 7.
// 1.5dppx (= 144dpi) - Vários Androids, como Atrix ou S2.
// 2dppx (= 192dpi) - Telas retina da Apple, celulares e tablets mais modernos como S3.
// 3dppx (= 288dpi) - Celulares ultra modernos, como Droid DNA e Galaxy S4.
// 320px - 480px: Mobile devices
// 481px - 768px: iPads, Tablets
// 769px - 1024px: Small screens, laptops
// 1025px - 1200px: Desktops, large screens
// 1201px and more - Extra large screens, TV

// remover styled components !
export const GlobalStyleSC = createGlobalStyle<{ theme: ThemePlus }>`
  ${({ theme }: { theme: ThemePlus }) => cssByTheme(theme)}
`;

export const cssByTheme = (theme: ThemePlus) => {
  //#region  
  return `
    div#__next {
      height: 100%;
    }

    html {
      XXfont-size: max(${`${theme.themePlusConfig?.fontSize}px`}, 16px); /* se o default do browser for muito pequeno então ajusta */
      font-size: ${`${theme.themePlusConfig?.fontSize}px`}};
      height: 100vh;
    }

    body {
      /* ({ theme }) => CssColorsByBack(theme.themeConfig.bodyBackColor) */

      height: 100vh;
      margin: 0;
      padding: 0rem;

      color: ${theme.palette.text.primary};
      background-color: ${theme.palette.background.default};

      /*font-family: Tahoma, Helvetica, Arial, Roboto, sans-serif;*/
      font-family: ${theme.themePlusConfig?.fontFamilies.join(',')};
      transition: all 0.50s linear;
    }

    @media only screen and (resolution: 1dppx) { /* @@@! qbg para evitar a redução de font em mobiles, pois geralmente o 1dppx é para browsers redimensionáveis */
      body {
        font-size: 87.5%; /* reduz o fonte padrão de 16 para 14px */
      }

      @media only screen and (min-width: ${theme.themePlusConfig?.widthFontReduz1}) {
        body {
          font-size: 93.75%; /* reduz o fonte padrão de 16 para 15px */
        }
      }

      @media only screen and (min-width: ${theme.themePlusConfig?.widthFontFull}) {
        body {
          font-size: 100%;
        }
      }

      @media only screen and (min-width: ${theme.themePlusConfig?.maxWidth}) {
        body {
          width: ${theme.themePlusConfig?.maxWidth};
          margin: auto;
        }
      }

    }

    * {
      box-sizing: border-box;
    }
    a {
      color: inherit;
      /* text-decoration: none; */
    }
    a, button {
      cursor: pointer;
      &:disabled {
        cursor: none;
      }
    }

    /* animação para button  */
    button {
      border-radius: 0.5rem;
      border-style: solid;
      border: 1px solid;
      padding: 0.5rem 1rem;
      transition: filter 0.2s;
      margin-left: 0.5rem;
      height: 0%;

      &:hover {
        //border-radius: 2rem;
        filter: brightness(0.9);
      }
      &:disabled {
        filter: brightness(0.3);
      }
      &.processingZZZ {
        &::after {
          content: " ...";
        }  
      }
      &.xxxZZZZZ-small {
        padding: 0.2rem 0.5rem;
      }
      &.xxxZZZZZ-large {
        padding: 0.8rem 1.3rem;
      }
    }


    .xxxg-distribVert {
      XXmargin-top: 1rem;
      XXmargin-bottom: 1rem;
      width: 100%;
      & > * {
        margin-top: 1rem;
        &:first-child {
          margin-top: 0rem;
        }
      }
    }

    /*
    .xxxg-pageTitle {
      XXmargin-top: 1rem;
      margin-bottom: 1rem;
      font-size: larger;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    */

    .xxxgZZZ-gridBorder {
      border: 1px solid ${theme.themePlusDeriv.borderLightColor};
    }

    /* 
    .xxxg-destaq1 {
      ({ theme }) => CssColorsByBack(theme.themeConfig.bodyBackColorDestaq)
      color: ${theme.themePlusDeriv.destaque1.text};
      background-color: ${theme.themePlusDeriv.destaque1.backColor};
    }
    .xxxg-destaq2 {
      color: ${theme.themePlusDeriv.destaque2.text};
      background-color: ${theme.themePlusDeriv.destaque2.backColor};
    }
    */

    /* forms e validações */

    .xxxg-inline {
      display: flex;
      flex-direction: row;
      align-items: center;  /* eixo cruzado era flex-direction (alinhamento na vertical) */
      justify-content: flex-start; /* filhos no proprio eixo */
      flex-wrap: wrap;
      & > * { /* apenas o filho imediato */
        margin-left: 0.5rem;
        &:first-child {
          margin-left: 0rem;
        }
      }
      &.right {
        justify-content: flex-end;
      }
      &.center {
        justify-content: center;
      }
    }

    .xxxg-clickable {
      cursor: pointer;
      &:hover {
        filter: brightness(0.8);
        transition: all 0.50s linear;
      }
    }

    ul.xxxg-ul-clean {
      list-style-type: none;
      margin: 0;
      padding: 0;
    }

    img.xxxg-img-fitCenter { /* preenche todo o box, priorizando o centro da imagem */
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
    }
  `;
  //#endregion
};