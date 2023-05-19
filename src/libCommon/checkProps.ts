export enum PrimitivesType {
  undefined = 'undefined',
  boolean = 'boolean',
  number = 'number',
  string = 'string',
  bigint = 'bigint',
  symbol = 'symbol',
  object = 'object',
}
interface IPropPrimType {
  name: string;
  type: PrimitivesType;
  propsInObj?: IPropPrimType[];
  optional?: boolean;
}
export function CheckProps(obj: object, propsType: IPropPrimType[]) {
  for (let index = 0; index < propsType.length; index++) {
    const prop = propsType[index];
    if (prop.optional &&
      obj[prop.name] == null)
      continue;
    if (obj[prop.name] == null)
      return `${prop.name} missing`;
    if (typeof (obj[prop.name]) !== prop.type)
      return `${prop.name} type mismatch`;
    else if (typeof (obj[prop.name]) === PrimitivesType.object &&
      prop.propsInObj != null) {
      const result = CheckProps(obj[prop.name], prop.propsInObj);
      if (result != null)
        return `${prop.name}.${result}`;
    }
  }
  return null;
}