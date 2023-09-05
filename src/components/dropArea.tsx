import { Box, Stack } from '@mui/material';
import { DropzoneState } from 'react-dropzone';
import { Tx } from './ui';

export const DropAreaUpload = ({ dropZone, infoAdic, bgcolor }: { dropZone: DropzoneState, infoAdic?: string, bgcolor?: string }) => {
  return (
    <Box {...dropZone.getRootProps({ className: 'dropzone' })} height='60px' bgcolor={bgcolor} display='flex' >
      {/* overflow='hidden'  */}
      <Stack spacing={0.8} alignItems='center' m='auto'>
        <input {...dropZone.getInputProps()} />
        <Tx whiteSpace='nowrap' overflow='hidden'>Arraste para cá o arquivo de upload ou clique para buscá-lo</Tx>
        {infoAdic != null &&
          <Tx whiteSpace='nowrap' overflow='hidden'>{infoAdic}</Tx>
        }
      </Stack>
    </Box>
  );
};
