import { CutUndef, FillClassProps } from '../libCommon/util';

import { CacheModel } from './model';

export class CacheKeys {
  key1?: string;
  key2?: string;
  static new() { return new CacheKeys(); }
  static fill(values: CacheKeys) { return CutUndef(FillClassProps(CacheKeys.new(), values)); }
}

export const CacheSet = async (keys: CacheKeys, data: string) => {
  await CacheModel.findOneAndUpdate(
    CacheKeys.fill(keys),
    { date: new Date(), data }, { upsert: true }
  );
};

export const CacheGet = async (keys: CacheKeys) => {
  const cacheDoc = await CacheModel.findOne(CacheKeys.fill(keys),).lean();
  return cacheDoc?.data;
};
