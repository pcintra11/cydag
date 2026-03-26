import { useState, useEffect } from 'react';
import publicIp from 'public-ip';
import { GetServerSidePropsResult } from 'next';
import { useRouter } from 'next/router';
import { isBrowser, isDesktop, isMobile, isTablet, isAndroid, isIOS, osVersion, osName, getUA, deviceType, isChrome, isFirefox } from 'react-device-detect';

// import dynamic from 'next/dynamic';
// const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });
import { JsonView, collapseAllNested, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

import Box from '@mui/material/Box'; //@!!!!!!!
import Stack from '@mui/material/Stack';
import HorizontalRule from '@mui/icons-material/HorizontalRule';

import { FillClassProps } from '../../libCommon/util';
import { csd, dbgError, dbgTest } from '../../libCommon/dbg';

import { AbortProc, LogErrorUnmanaged, Tx, fullHeightScroll } from '../../components';

import { LoggedUserBase } from '../../app_base/loggedUserBase';
import { pagesSuporte } from '../../app_suporte/endPoints';

import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { GetLoggedUserServer } from '../../appCydag/getLoggedUserFromHttpCookieASync';
import { LoggedUser } from '../../appCydag/loggedUser';

//import { useLoggedUser } from '../../../hooks/useLoggedUser';
//import Link from 'next/link';

interface IPageProps {
  envsSvr: string[];
  envsClient: string[];
}

// @@@@! por que não habilita o menu 'user'?
class AllStates {
  forcePageRestart?: any;
  preparing?: 'initiating' | 'ready';
  error?: Error;
  ipv4?: string;
  ipv6?: string;
  loggedUserCookieHttp?: LoggedUser;
  static new(init?: boolean) {
    const obj = new AllStates();
    if (init) {
      obj.forcePageRestart = new Object();
      obj.preparing = 'initiating';
    }
    return obj;
  }
}
let mount = false; const allStatesCache = AllStates.new();
// const allStatesCache = new AllStates();
// let mount = false;

const pageSelf = pagesSuporte.inspect;
export default function PageInspect(props: IPageProps) { // 
  // const [mainStates, _setAllStates] = React.useState(AllStates.new());
  // FillClassProps(allStatesCache, mainStates); const setAllStates = (newValues: AllStates) => { if (!mount) return; FillClassProps(allStatesCache, newValues); _setAllStates({ ...allStatesCache }); };
  const [_, _setAllStates] = useState(new AllStates());
  const setAllStates = (newValues: Partial<AllStates>) => { if (!mount) return; FillClassProps(allStatesCache, newValues); _setAllStates({ ...allStatesCache }); };

  const [reactDevDetect, setReactDevDetect] = useState<any>({});

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
        setAllStates({ ipv4: ip });
      else if (ipType === 'v6')
        setAllStates({ ipv6: ip });
    }
  });

  useEffect(() => {
    if (!router.isReady) return;
    mount = true;
    setAllStates(AllStates.new(true));
    return () => { mount = false; };
  }, [router?.asPath, router.isReady]);

  useEffect(() => {
    (async () => {
      try {
        if (allStatesCache.preparing === 'initiating') {
          dbgTest();
          getIp('v4');
          getIp('v6');
          const loggedUserCookieHttp = await GetLoggedUserServer('inspect');
          setAllStates({ preparing: 'ready', loggedUserCookieHttp });
          const reactDevDetect = { isBrowser, isDesktop, isMobile, isTablet, isAndroid, isIOS, osVersion, osName, getUA, deviceType, isChrome, isFirefox };
          setReactDevDetect(reactDevDetect);
        }
      } catch (error) {
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-init`);
        setAllStates({ error });
      }
    })();
  }, [allStatesCache.forcePageRestart, allStatesCache.preparing]);
  if (allStatesCache.error != null) return <AbortProc error={allStatesCache.error} tela={pageSelf.pagePath} />;
  //if (allStatesCache.preparing != 'ready') return (<WaitingObs />);

  csd({ reactDevDetect });

  try {
    return (
      <Stack spacing={2} {...fullHeightScroll}>

        <Box>
          <Tx>ipv4: {allStatesCache.ipv4}</Tx>
          <Tx>ipv6: {allStatesCache.ipv6}</Tx>
        </Box>

        {/* <Box mt={3}>
          <Tx>EnvsClient</Tx>
          <Box>
            {envsClient.map((x, i) => <Tx key={i}>{x}</Tx>)}
          </Box>
        </Box> */}

        <Box>
          <Tx>reactDevDetect</Tx>
          <JsonView data={reactDevDetect} style={defaultStyles} shouldExpandNode={() => collapseAllNested(99)} clickToExpandNode />
        </Box>

        <Box>
          {isLoadingUser
            ? <Tx>loadingUser</Tx>
            : <>
              <Tx>loggedUser</Tx>
              {loggedUser != null
                ? <JsonView data={loggedUser} style={defaultStyles} shouldExpandNode={() => collapseAllNested(99)} clickToExpandNode />
                : <Tx>null</Tx>
              }
            </>
          }
        </Box>

        <Box>
          {allStatesCache.preparing != 'ready'
            ? <Tx>preparing: {allStatesCache.preparing}</Tx>
            : <>
              <Tx>loggedUserCookieHttp:</Tx>
              {allStatesCache.loggedUserCookieHttp != null
                ? <JsonView data={allStatesCache.loggedUserCookieHttp} style={defaultStyles} shouldExpandNode={() => collapseAllNested(99)} clickToExpandNode />
                : <Tx>null</Tx>
              }
            </>
          }
        </Box>

        <Box>
          <Tx>envsClient:</Tx>
          <JsonView data={envsClient} style={defaultStyles} shouldExpandNode={() => collapseAllNested(99)} clickToExpandNode />
        </Box>

        <Box>
          {(loggedUser != null && LoggedUserBase.isDev(loggedUser)) &&
            <>
              <Tx>envsSvr:</Tx>
              <JsonView data={envsSvr} style={defaultStyles} shouldExpandNode={() => collapseAllNested(99)} clickToExpandNode />
            </>
          }
        </Box>

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