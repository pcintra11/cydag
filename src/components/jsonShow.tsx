import { ObjectInspector } from 'react-inspector'; // #!!!!!!! atualizar para algo mais moderno !

import { IGenericObject } from '../libCommon/types';

export function JsonShow({ data }: { data: IGenericObject }) {
  return (
    <ObjectInspector data={data} />
  );
}