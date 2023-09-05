export const globalStyle = () => (
  <style jsx global>{`
    div#__next {
      height: 100%;
    }

    html {
      XXfont-size: 16px;
      height: 100vh;
    }

    body {
      height: 100vh;
      margin: 0;
      padding: 0rem;

      font-size: 1rem; font-family: Verdana; color: magenta; /* pra chamar a atenção mesmo, pois não pode ocorrer! */
      XXbackground-color: green;     
    }

    * {
      box-sizing: border-box;
    } 
  `}</style>
);

//#!!!!!!!!!!!!!!!!!!! 10