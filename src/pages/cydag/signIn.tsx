import React from 'react';
import { useRouter } from 'next/router';
import _ from 'underscore';

import { Stack } from '@mui/material';

import { _AppLogRedir } from '../_app';

import { IsErrorManaged, ObjUpdAllProps, ErrorPlus } from '../../libCommon/util';
import { dbg, ScopeDbg } from '../../libCommon/dbg';

import { Btn, BtnLine, WaitingObs, FrmSetError, FakeLink, PopupMsg } from '../../components';
import { AbortProc, LogErrorUnmanaged } from '../../components';
import { FrmError, FrmInput } from '../../components';
import { FrmDefaultValues, NormalizePropsString, useFrm } from '../../hooks/useMyForm';

import { pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
//import { userSchema } from '../../appCydag/types_user_db'; //@@!!!!!
import { UserEmailLinkASync, UserSignInASync } from '../../appCydag/userResourcesCli';
import { User } from '../../appCydag/modelTypes';
import { signInValidations, UserLinkType } from '../api/appCydag/user/types';

enum Phase {
  initiating = 'initiating',
  ready = 'ready',
}

class FrmDataSignIn {
  email: string;
  psw: string;
}

let mount; let mainStatesCache;
const pageSelf = pagesApp.signIn;
export default function PageSignIn() {
  const frmSignIn = useFrm<FrmDataSignIn>({ defaultValues: FrmDefaultValues(new FrmDataSignIn()), schema: signInValidations });
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase;
  }
  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const { logRedirSetGet } = React.useContext(_AppLogRedir);

  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });
  //const agora = new Date();

  const dbgX = (...params) => dbg({ level: 99, levelScope: ScopeDbg.x, context: 'signIn', color: 2 }, ...params);

  dbgX('root*****', `isReady: ${router.isReady} ; isLoadingUser: ${isLoadingUser} ; loggedUser: ${loggedUser}`);

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;

    //const nextPageChangedUserPush = logRedirSetGet();
    // if (nextPageChangedUserPush?.pathname != null) {
    //   if (loggedUser != null) {
    //     const secsDesdeLogin = DateDifSeconds(agora, loggedUser.firstSignIn);
    //     //csl('signIn secsDesdeLogin', secsDesdeLogin);
    //     if (secsDesdeLogin < 10) {
    //       //csl('signIn fetching', pageFetch.pagePath);
    //       setMainStatesCache({ phase: Phase.redirecting });
    //       setTimeout(() => router.push(nextPageChangedUserPush), 5000);
    //       return;
    //     }
    //   }
    // }

    setMainStatesCache({ phase: Phase.ready });
    // SleepMsDevRandom(0, pageSelf.pagePath)
    //   .then(() => {
    //     setMainStatesCache({ phase: Phase.ready }); // aqui dá erro de useState / unmount apenas se menu lateral
    //   })
    //   .catch((error) => {
    //     LogErrorUnmanaged(error, `${pageSelf.pagePath}-init`);
    //     setMainStatesCache({ error });
    //   });
    return () => { mount = false; };
  }, [router.isReady, isLoadingUser]);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  //if (mainStates.phase == Phase.redirecting) return (<WaitingObs text='Redirecionando' />);
  if (mainStates.phase == Phase.initiating) return (<WaitingObs />);

  //#region funções
  const onSubmit = async (dataForm: FrmDataSignIn) => {
    const data = NormalizePropsString(dataForm);
    try {
      if (data.psw == null) return FrmSetError(frmSignIn, User.F.psw, 'Informe a senha');
      const loggedUserNow = await UserSignInASync(data.email, data.psw);
      let nextPagePathName = pagesApp.home.pagePath;
      let nextPageQuery: any = undefined;
      if (router.query?.pageNeedAuthentication != null) {
        nextPagePathName = router.query.pageNeedAuthentication as string;
        nextPageQuery = _.omit(router.query, 'pageNeedAuthentication');
      }
      logRedirSetGet({ loggedUser: loggedUserNow, pathname: nextPagePathName, query: nextPageQuery });
      setTimeout(() => router.push(pagesApp.logRedir.pagePath), 0);
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-onSubmit`);
      if (!IsErrorManaged(error)) {
        setMainStatesCache({ error });
        return;
      }
      FrmError(frmSignIn, error);
    }
  };
  const sendResetPswLink = async (dataForm) => {
    const data = NormalizePropsString(dataForm);
    try {
      const message = await UserEmailLinkASync(data.email, UserLinkType.resetPsw);
      PopupMsg.success(message);
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-sendResetPswLink`);
      if (!IsErrorManaged(error)) {
        setMainStatesCache({ error });
        return;
      }
      FrmError(frmSignIn, error);
    }
  };
  //#endregion

  try {
    const isInitiating = false; // (mainStates.phase == Phase.initiating)
    const disabledIfInitiating = isInitiating ? { disabled: true } : {};

    return (
      <Stack gap={1} height='100%' overflow='auto'>
        {isInitiating && <WaitingObs />}
        <form onSubmit={frmSignIn.handleSubmit(onSubmit)}>
          <Stack gap={1}>
            {isInitiating
              ? <FrmInput label='Email' value='' />
              : <FrmInput label='Email' frm={frmSignIn} name={User.F.email} autoFocus {...disabledIfInitiating} />
            }
            <FrmInput label='Senha' frm={frmSignIn} name={User.F.psw} type='password' {...disabledIfInitiating} />
            <BtnLine left>
              <Btn submit {...disabledIfInitiating}>Entrar</Btn>
              <FakeLink onClick={frmSignIn.handleSubmit(sendResetPswLink)}>Esqueci a senha (reset)</FakeLink>
            </BtnLine>
          </Stack>
        </form>
      </Stack>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />);
  }
}