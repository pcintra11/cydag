import { useRouter } from 'next/router';

import { Box, Stack } from '@mui/material';

import { pagesHub } from '../link';

import { Btn, BtnLine } from '../components';

export default function Custom404() {
  const router = useRouter();
  return (
    <Stack gap={1}>
      <Box>Página não encontrada.</Box>

      <BtnLine left>
        <Btn onClick={() => router.push(pagesHub.index.pagePath)}>Página de entrada</Btn>
      </BtnLine>
    </Stack>
  );
}