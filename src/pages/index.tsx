import React from 'react';
import { useRouter } from 'next/router';

import { pagesHub } from '../link';

import { WaitingObs } from '../components';

export default function PageIndex() {
  const router = useRouter();
  React.useEffect(() => {
    router.push(pagesHub.index.pagePath);
  }, []);
  return (<WaitingObs text='Redirecionando' />);
}