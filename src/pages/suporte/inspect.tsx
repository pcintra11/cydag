import React from 'react';
import publicIp from 'public-ip';
import { GetServerSidePropsResult } from 'next';
import { useRouter } from 'next/router';
import { isBrowser, isDesktop, isMobile, isTablet, isAndroid, isIOS, osVersion, osName, getUA, deviceType, isChrome, isFirefox } from 'react-device-detect';

import dynamic from 'next/dynamic';
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

import Box from '@mui/material/Box'; //@!!!!!!!
import Stack from '@mui/material/Stack';
import HorizontalRule from '@mui/icons-material/HorizontalRule';

import { FillClassProps } from '../../libCommon/util';
import { csd, dbgError, dbgTest } from '../../libCommon/dbg';

import { AbortProc, LogErrorUnmanaged, Tx, fullHeightScroll } from '../../components';

import { LoggedUserBase } from '../../app_base/loggedUserBase';
import { pagesSuporte } from '../../app_suporte/endPoints';

import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { GetLoggedUserFromHttpCookieASync } from '../../appCydag/getLoggedUserFromHttpCookieASync';
import { LoggedUser } from '../../appCydag/loggedUser';

//import { useLoggedUser } from '../../../hooks/useLoggedUser';
//import Link from 'next/link';

interface IPageProps {
  envsSvr: string[];
  envsClient: string[];
}

// @@@@! por que não habilita o menu 'user'?
class MainStates {
  forcePageRestart?: any;
  preparing?: 'initiating' | 'ready';
  error?: Error;
  ipv4?: string;
  ipv6?: string;
  loggedUserCookieHttp?: LoggedUser;
  static new(init?: boolean) {
    const obj = new MainStates();
    if (init) {
      obj.forcePageRestart = new Object();
      obj.preparing = 'initiating';
    }
    return obj;
  }
}
let mount = false; const mainStatesCache = MainStates.new();
const pageSelf = pagesSuporte.inspect;
export default function PageInspect(props: IPageProps) { // 
  const [mainStates, setMainStates] = React.useState(MainStates.new());
  FillClassProps(mainStatesCache, mainStates); const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; FillClassProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: 'inspect' });

  // let modoProps;
  // let envsClient: string[];
  // if (props?.pageProps?.envsClient) { // em spamcheck fica assim !!! (???) // @@@
  //   modoProps = 'estranho';
  //   envsClient = props.pageProps.envsClient;
  // }
  // else {
  //const modoProps = 'normal';
  const envsClient = props.envsClient;
  const envsSvr = props.envsSvr;
  //}

  const getIp = (async (ipType: 'v4' | 'v6') => {
    //dbg(3, 'page', `getting ${ipType}`);
    let ip = null;
    try {
      if (ipType === 'v4')
        ip = await publicIp.v4();
      else if (ipType === 'v6')
        ip = await publicIp.v6();
    } catch (error) {
      ip = `${error.message}`;
    }
    //dbg(3, 'page', `setting ${ipType}: ${ip}`);
    if (mount) {
      if (ipType === 'v4')
        setMainStatesCache({ ipv4: ip });
      else if (ipType === 'v6')
        setMainStatesCache({ ipv6: ip });
    }
  });

  React.useEffect(() => {
    if (!router.isReady) return;
    mount = true;
    setMainStatesCache(MainStates.new(true));
    return () => { mount = false; };
  }, [router?.asPath, router.isReady]);

  React.useEffect(() => {
    (async () => {
      try {
        if (mainStates.preparing === 'initiating') {
          dbgTest();
          getIp('v4');
          getIp('v6');
          const loggedUserCookieHttp = await GetLoggedUserFromHttpCookieASync('inspect');
          setMainStatesCache({ preparing: 'ready', loggedUserCookieHttp });
        }
      } catch (error) {
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-init`);
        setMainStatesCache({ error });
      }
    })();
  }, [mainStates.forcePageRestart, mainStates.preparing]);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} />;
  //if (mainStates.preparing != 'ready') return (<WaitingObs />);

  const reactDevDetect = { isBrowser, isDesktop, isMobile, isTablet, isAndroid, isIOS, osVersion, osName, getUA, deviceType, isChrome, isFirefox };
  csd({ reactDevDetect });

  try {
    return (
      <Stack spacing={1} {...fullHeightScroll}>
        <HorizontalRule />

        <Box>
          <Tx>ipv4: {mainStates.ipv4}</Tx>
          <Tx>ipv6: {mainStates.ipv6}</Tx>
        </Box>

        {/* <Box mt={3}>
          <Tx>EnvsClient</Tx>
          <Box>
            {envsClient.map((x, i) => <Tx key={i}>{x}</Tx>)}
          </Box>
        </Box> */}

        <ReactJson src={reactDevDetect} name='reactDevDetect' collapsed={true} collapseStringsAfterLength={30} />

        {isLoadingUser
          ? <Tx>loadingUser</Tx>
          : <>
            {loggedUser != null
              ? <ReactJson src={loggedUser} name='loggedUser' collapsed={true} collapseStringsAfterLength={30} />
              : <Tx>loggedUser null</Tx>
            }
          </>
        }

        {mainStates.preparing != 'ready'
          ? <Tx>preparing: {mainStates.preparing}</Tx>
          : <>
            {mainStates.loggedUserCookieHttp != null
              ? <ReactJson src={mainStates.loggedUserCookieHttp} name='loggedUserCookieHttp' collapsed={true} collapseStringsAfterLength={30} />
              : <Tx>loggedUserCookieHttp null</Tx>
            }
          </>
        }

        <ReactJson src={envsClient} name='envsClient' collapsed={true} collapseStringsAfterLength={30} />

        {(loggedUser != null && LoggedUserBase.isDev(loggedUser)) &&
          <ReactJson src={envsSvr} name='envsSvr' collapsed={true} collapseStringsAfterLength={30} />
        }

        {/* <Box>
          <p>Warnings</p>
          <pre>{JSON.stringify(logs.ctrlWarnings, null, 4)}</pre>
        </Box> */}

      </Stack>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} />);
  }
}

export async function getServerSideProps(): Promise<GetServerSidePropsResult<IPageProps>> { // 
  //context: NextPageContext
  //const logs = GetCtrlLogs();
  //@@!!!!!!!!! super lento por que??
  dbgTest();
  const envsSvr = [];
  const envsClient = [];
  const envsOthers = {};
  for (const key in process.env) {
    if (key.startsWith('npm_'))
      continue;
    if (key.startsWith('NEXT_PUBLIC_'))
      envsClient.push(`${key}: ${process.env[key]}`);
    else if (key.startsWith('SITE_') ||
      key == 'CLOUDINARY_URL' ||
      key == 'NODE_ENV')
      envsSvr.push(`${key}: ${process.env[key]}`);
    else
      envsOthers[key] = process.env[key];
  }

  csd({ envsSvr });
  csd({ envsClient });

  return {
    props: {
      envsClient,
      envsSvr,
    }, // { envsMain, envsOthers }, // will be passed to the page component as props
  };
}