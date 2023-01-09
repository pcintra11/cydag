import { Box } from '@mui/material';

import { AbortProc, LogErrorUnmanaged } from '../../components';

import { pageDummy } from '../../appCydag/endPoints';

const pageSelf = pageDummy;
export default function PageDummy() {
  //const router = useRouter();
  try {
    return (
      <Box>
        {/* Tentativa em abrir {`'${router.query?.title}'`} */}
        Página ainda não disponível
      </Box>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} />);
  }
}