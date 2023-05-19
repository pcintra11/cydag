import { ObjectInspector } from 'react-inspector'; // @!!!!!!! atualizar para algo mais moderno !

import { IGenericObject } from '../libCommon/types';

// https://mac-s-g.github.io/react-json-view/demo/dist/  bem melhor !

export function JsonShow({ data }: { data: IGenericObject }) {
  return (
    <ObjectInspector data={data} />
  );
}