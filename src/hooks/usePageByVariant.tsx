import React from 'react';
import { NextRouter } from 'next/router';

import { csd } from '../libCommon/dbg';
import { PageDef } from '../libCommon/endPoints';

import { PageByVariant } from '../components';

export const usePageByVariant = (pagesDef: PageDef[], router: NextRouter, mustFound: boolean, debug = false) => {
  const page = React.useMemo(() => PageByVariant(pagesDef, router, mustFound, debug), [pagesDef, router.asPath]);
  debug && csd('usePageByVariant ====>', page);
  return page;
};