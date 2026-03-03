import { pagesApp } from '../../appCydag/endPoints';
import { authClient } from '../../libClient/betterAuth';
import { UrlForPage } from '../../libCommon/util';
import { AbortProc, Btn, BtnLine, LogErrorUnmanaged } from '../../components';

const pageSelf = pagesApp.signInMs;

const apis = {
  signInSocial: async (provider: 'microsoft') => {
    await authClient.signIn.social({
      provider,
      callbackURL: UrlForPage(pagesApp.posLoginSSO.pagePath),
    });
  },
};
export default function PageSignInMs() {
  try {
    return (
      <BtnLine left>
        <Btn onClick={() => apis.signInSocial('microsoft')}>Entrar com login de rede</Btn>
      </BtnLine>
    );

  } catch (error: any) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} />);
  }
}