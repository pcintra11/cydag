import { AbortProc, LogErrorUnmanaged, Tx } from '../../components';

import { pageDummy } from '../../appCydag/endPoints';

const pageSelf = pageDummy;
export default function PageDummy() {
  //const router = useRouter();
  try {
    return (
      <Tx>
        {/* Tentativa em abrir {`'${router.query?.title}'`} */}
        Página ainda não disponível
      </Tx>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} />);
  }
}