import { Box, Stack } from '@mui/material';
import { DropzoneState } from 'react-dropzone';

export const DropAreaUpload = ({ dropZone, infoAdic, bgcolor }: { dropZone: DropzoneState, infoAdic?: string, bgcolor?: string }) => {
  return (
    <Box {...dropZone.getRootProps({ className: 'dropzone' })} height='60px' bgcolor={bgcolor} display='flex' >
      {/* overflow='hidden'  */}
      <Stack gap={0.8} alignItems='center' m='auto'>
        <input {...dropZone.getInputProps()} />
        <Box whiteSpace='nowrap' overflow='hidden'>Arraste para cá o arquivo de upload ou clique para buscá-lo</Box>
        {infoAdic != null &&
          <Box whiteSpace='nowrap' overflow='hidden'>{infoAdic}</Box>
        }
      </Stack>
    </Box>
  );
};
