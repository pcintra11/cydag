import { useRouter } from 'next/router';

import { Stack } from '@mui/material';

import { Btn, BtnLine, Tx } from '../components';

export default function Custom404() {
  const router = useRouter();
  return (
    <Stack spacing={1}>
      <Tx>Página não encontrada.</Tx>

      <BtnLine left>
        <Btn onClick={() => router.push('/')}>Página de entrada</Btn>
      </BtnLine>
    </Stack>
  );
}