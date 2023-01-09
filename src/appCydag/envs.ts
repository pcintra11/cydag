import { CheckProps, OnClient, PrimitivesType } from '../libCommon/util';

const nullOrObj = (valueStr) => valueStr == null ? null : JSON.parse(valueStr);

interface IInterfaceSapRealizado {
  url: string;
  auth: { user: string; pass: string; };
}
export function EnvSvrInterfaceSapRealizadoConfig() {
  const envName = 'SITE_INTERFACE_SAP_REALIZADO_CONFIG';
  if (OnClient()) throw new Error(`EnvSvr (${envName}) requisitada no client`);
  const value: IInterfaceSapRealizado = nullOrObj(process.env.SITE_INTERFACE_SAP_REALIZADO_CONFIG);
  if (value == null) throw new Error(`Env ${envName} não configurada`);
  const errorProp = CheckProps(value, [
    { name: 'url', type: PrimitivesType.string },
    {
      name: 'auth', type: PrimitivesType.object, propsInObj: [
        { name: 'user', type: PrimitivesType.string },
        { name: 'pass', type: PrimitivesType.string },
      ]
    },
  ]);
  if (errorProp != null)
    throw new Error(`Env ${envName} - ${errorProp}`);
  return value;
}