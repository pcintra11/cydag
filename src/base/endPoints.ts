import { ApiDef, PageDef } from '../libCommon/endPoints';

const pagesBase = {
};

export const PagesBaseArray = () => {
  const pages: PageDef[] = [];
  for (const key in pagesBase)
    pages.push(pagesBase[key]);
  return pages;
};

export const apisBase = {
  asyncProc: new ApiDef('base/asyncProc'), // apenas serverCall
  httpCryptoCookie: new ApiDef('base/httpCryptoCookie'),
  logSystemMsgClient: new ApiDef('base/logSystemMsgClient'),
  cloudinarySignature: new ApiDef('base/cloudinarySignature'),
  others: new ApiDef('base/others'),
};