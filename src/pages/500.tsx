import { useRouter } from 'next/router';

import { Box, Stack } from '@mui/material';

import { pagesHub } from '../link';

import { Btn, BtnLine } from '../components';
import { LinkHelpEmail } from '../components';

export default function Custom500() {
  const router = useRouter();
  return (
    <Stack gap={1}>
      <Box>Houver um erro no sistema</Box>
      <LinkHelpEmail />
      <BtnLine left>
        <Btn onClick={() => router.push(pagesHub.index.pagePath)}>Página de entrada</Btn>
      </BtnLine>
    </Stack>
  );
}