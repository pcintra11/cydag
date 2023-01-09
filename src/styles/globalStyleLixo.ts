export const lixo = `
/* animação para o underscore do link */
/* a {
  position: relative;

  &::before,
  &::after {
    position: absolute;
    content: "";
    left: 0;
    bottom: -0.01rem;
    display: block;
    width: 100%;
    height: 1px;
    background: $ {({ theme }: { theme: Theme }) => theme.themeConfig.primaryBackColor};
    transition: 0.5s;
  }
  
  &::before {
    transform: scaleX(0);
    transform-origin: left;
  }

  &::after {
    transform-origin: right;
    transition-delay: 0.5s;
    XXXXcontent: ' (→ ' attr(href) ')';
  }
  
  &:hover {
    &::before {
      transform: scaleX(1);
      transition-delay: 0.5s;
    }

    &::after {
      transform: scaleX(0);
      transition-delay: 0s;
    }
  }
} 
*/

/* .xxx-flexCol {   flex column 
  display: flex;
  flex-direction: column;
  justify-content: flex-start;    proprio eixo 
  align-items: flex-start;     eixo cruzado 
}
.xxx-flexRow {  flex row 
  display: flex;
  flex-direction: row;
  justify-content: flex-start; 
  align-items: flex-start; 
  & > * {
    margin-left: 1rem;
    &:first-child {
      margin-left: 0rem;
    }
  }
} */

/* 
.xxx-fieldGroup { 
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; 
  align-items: flex-start; 
  width: 100%;
  &.xxx-inline {
    flex-direction: row;
    justify-content: flex-start; 
    align-items: center;
    * {
      width: auto;
    }
  }
  input {
    width: 100%;
  }
} */
/* .xxx-box {
  border: 2px red solid;
} */

/*
.xxx-inline {
  & .xxx-formFldBlock {
    flex-direction: row;
    * {
      margin-left: 0.4rem;
      &:first-child {
        margin-left: 0rem;
      }
      width: auto;
    }
    & .xxx-formFldErrorMessage {
      margin-left: 0rem;
      display: none;
    }
  } 
}
*/ 

.xxx-buttonsArea {
  display: flex;
  flex-direction: row;
  margin-top: 1rem;
}

.xxx-img-resp-w { /* preenche todo o box, priorizando o centro da imagem */
  max-width: 100%;
  height: auto;
}
`;