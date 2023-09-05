import { useRouter } from 'next/router';

import { Stack } from '@mui/material';

import { Btn, BtnLine, Tx } from '../components';
import { LinkHelpEmail } from '../components';

export default function Custom500() {
  const router = useRouter();
  return (
    <Stack spacing={1}>
      <Tx>Houver um erro no sistema</Tx>
      <LinkHelpEmail />
      <BtnLine left>
        <Btn onClick={() => router.push('/')}>Página de entrada</Btn>
      </BtnLine>
    </Stack>
  );
}