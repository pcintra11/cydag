import React from 'react';
import publicIp from 'public-ip';
import { GetServerSidePropsResult } from 'next';
import { useRouter } from 'next/router';

import Box from '@mui/material/Box'; //@!!!!!!!
import Stack from '@mui/material/Stack';
import HorizontalRule from '@mui/icons-material/HorizontalRule';

import { ObjUpdAllProps } from '../../libCommon/util';
import { csd, dbgTest } from '../../libCommon/dbg';

import { AbortProc, LogErrorUnmanaged } from '../../components';

import { pagesSuporte } from '../../app_suporte/endPoints';

//import { useLoggedUser } from '../../../hooks/useLoggedUser';
//import Link from 'next/link';

interface IPageProps {
  // envsMain: object;
  // envsOthers: object;
  envsClient: string[];
}

// @@@@! por que não habilita o menu 'user'?
let mount = false; let mainStatesCache = null;
const pageSelf = pagesSuporte.inspect;
export default function PageInspect(props: IPageProps) { // 
  interface IMainStates {
    ipv4?: string;
    ipv6?: string;
  }
  const [mainStates, setMainStates] = React.useState<IMainStates>({});
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: IMainStates) => { if (!mount) return; ObjUpdAllProps<IMainStates>(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const router = useRouter();
  //const { loggedUser } = useLoggedUser(false);

  // let modoProps;
  // let envsClient: string[];
  // if (props?.pageProps?.envsClient) { // em spamcheck fica assim !!! (???) // @@@
  //   modoProps = 'estranho';
  //   envsClient = props.pageProps.envsClient;
  // }
  // else {
  const modoProps = 'normal';
  const envsClient = props.envsClient;
  //}

  React.useEffect(() => {
    mount = true;
    dbgTest();
    let isMounted = true;

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
      if (isMounted) {
        if (ipType === 'v4')
          setMainStatesCache({ ipv4: ip });
        else if (ipType === 'v6')
          setMainStatesCache({ ipv6: ip });
      }
    });
    getIp('v4');
    getIp('v6');
    return () => { isMounted = false; };
  }, [router?.asPath]);

  try {
    return (
      <Stack gap={1} height='100%' overflow='auto'>
        <HorizontalRule />

        <Box>
          <Box>modo props: {modoProps}</Box>
          <Box>ipv4: {mainStates.ipv4}</Box>
          <Box>ipv6: {mainStates.ipv6}</Box>
        </Box>

        <Box mt={3}>
          <Box>EnvsClient</Box>
          <Box>
            {envsClient.map((x, i) => <Box key={i}>{x}</Box>)}
          </Box>
        </Box>

        {/* <Box>
          <p>Warnings</p>
          <pre>{JSON.stringify(logs.ctrlWarnings, null, 4)}</pre>
        </Box>

        <hr />

        <Box>
          <p>Errors</p>
          <pre>{JSON.stringify(logs.ctrlErrors, null, 4)}</pre>
        </Box> */}

        {/* {loggedUser &&
          <Box>
            <p>LoggedUser</p>
            <pre>{JSON.stringify(loggedUser, null, 4)}</pre>
          </Box>
        } */}

        {/* <hr />

        <Box>
          <p>EnvsMain</p>
          <pre>{JSON.stringify(envsMain, null, 4)}</pre>
        </Box>

        <hr />

        <Box>
          <p>EnvsOthers</p>
          <pre>{JSON.stringify(envsOthers, null, 4)}</pre>
        </Box> */}
      </Stack>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} />);
  }
}

export async function getServerSideProps(): Promise<GetServerSidePropsResult<IPageProps>> { // context: NextPageContext
  //const logs = GetCtrlLogs();
  //@@!!!!!!!!! super lento por que??
  dbgTest();
  const envsMain = {};
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
      envsMain[key] = process.env[key];
    else
      envsOthers[key] = process.env[key];
  }

  csd({ envsMain });
  csd({ envsClient });

  return {
    props: { envsClient }, // { envsMain, envsOthers }, // will be passed to the page component as props
  };
}