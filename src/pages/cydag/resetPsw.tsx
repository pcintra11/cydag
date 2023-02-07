import React from 'react';
import { useRouter } from 'next/router';

import { Box, Stack } from '@mui/material';

import { _AppLogRedir } from '../_app';

import { ErrorPlus, IsErrorManaged, ObjUpdAllProps } from '../../libCommon/util';

import { FakeLink, PopupMsg } from '../../components';
import { Btn, BtnLine, WaitingObs } from '../../components';
import { AbortProc, LogErrorUnmanaged } from '../../components';
//import { LinkHelpEmail } from '../../components';
import { FrmError, FrmInput, FrmSetError } from '../../components';
import { FrmDefaultValues, NormalizePropsString, useFrm } from '../../hooks/useMyForm';

import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { UserEmailLinkASync, UserResetPswASync, UserSignOut } from '../../appCydag/userResourcesCli';
import { pagesApp } from '../../appCydag/endPoints';
import { resetPswValidations, UserLinkType } from '../api/appCydag/user/types';

enum Phase {
  initiating = 'initiating',
  ready = 'ready',
  //redirecting = 'redirecting',
}

const f = ({
  email: 'email',
  psw: 'psw',
  pswConfirm: 'pswConfirm',
});
class FrmDataResetPsw {
  email: string;
  psw: string;
  pswConfirm: string;
}
let mount; let mainStatesCache;
const pageSelf = pagesApp.userResetPsw;
export default function PageResetPsw() {
  const frmResetPsw = useFrm<FrmDataResetPsw>({ defaultValues: FrmDefaultValues(new FrmDataResetPsw()), schema: resetPswValidations });
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase; showHelp?: boolean;
  }
  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  const { logRedirSetGet } = React.useContext(_AppLogRedir);

  const router = useRouter();
  const { loggedUser, isLoadingUser, setUser } = useLoggedUser({ id: pageSelf.pagePath });
  const agora = new Date();

  React.useEffect(() => {
    mount = true;
    if (isLoadingUser) return;

    // const nextPageChangedUserPush = setNextPageChangedUser();
    // if (nextPageChangedUserPush?.pathname != null) {
    //   if (loggedUser != null) {
    //     const secsDesdeLogin = DateDifSeconds(agora, loggedUser.firstSignIn);
    //     if (secsDesdeLogin < 10) {
    //       setMainStatesCache({ phase: Phase.redirecting });
    //       setTimeout(() => router.push(nextPageChangedUserPush), 500);
    //       return;
    //     }
    //   }
    // }

    try {
      if (loggedUser != null) {
        UserSignOut(pageSelf.pagePath);
        setUser(null, pageSelf.pagePath + '(logout)');
      }
      setMainStatesCache({ phase: Phase.ready });
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-init`);
      setMainStatesCache({ error });
    }
    return () => { mount = false; };
  }, [isLoadingUser]);
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  //if (mainStates.phase == Phase.redirecting) return (<WaitingObs text='Redirecionando' />);
  if (mainStates.phase == Phase.initiating) return (<WaitingObs />);

  //#region funções
  const onSubmit = async (dataForm: FrmDataResetPsw) => {
    const data = NormalizePropsString(dataForm);
    try {
      //FrmClearErrorGeneric(frm);
      if (data.pswConfirm != data.psw)
        //return FrmSetError('Senhas não conferem', null, frm);
        return FrmSetError(frmResetPsw, f.pswConfirm, 'Senha não confere');
      const loggedUserNow = await UserResetPswASync(router.query.token as string, data.email, data.psw, data.pswConfirm);
      // //console.log({ loggedUserNow });
      // //dbg(3, 'resetPsw ok', { loggedUserNow });
      // //SnackBar.success('Senha alterada com sucesso!');
      // setNextPageChangedUser(pagesApp.welcome.pagePath);
      // setUser(loggedUserNow, pageSelf.pagePath);
      logRedirSetGet({ loggedUser: loggedUserNow, pathname: pagesApp.home.pagePath });
      setTimeout(() => router.push(pagesApp.logRedir.pagePath), 0);
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-onSubmit`);
      if (!IsErrorManaged(error)) {
        setMainStatesCache({ error });
        return;
      }
      FrmError(frmResetPsw, error);
      setMainStatesCache({ showHelp: true });
    }
  };
  const sendResetPswLink = async (dataForm) => {
    try {
      const message = await UserEmailLinkASync(dataForm.email, UserLinkType.resetPsw);
      PopupMsg.success(message);
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-sendResetPswLink`);
      if (!IsErrorManaged(error)) {
        setMainStatesCache({ error });
        return;
      }
      FrmError(frmResetPsw, error);
    }
  };

  //#endregion

  try {
    const isInitiating = false; // (mainStates.phase == Phase.initiating)
    const disabledIfInitiating = isInitiating ? { disabled: true } : {};

    return (
      <Stack gap={1} height='100%' overflow='auto'>
        {isInitiating && <WaitingObs />}

        <form onSubmit={frmResetPsw.handleSubmit(onSubmit)}>
          <Stack gap={1}>
            {isInitiating
              ? <FrmInput label='Email' value='' />
              : <FrmInput label='Email' frm={frmResetPsw} name={f.email} autoFocus {...disabledIfInitiating} />
            }
            <FrmInput label='Senha' frm={frmResetPsw} name={f.psw} type='password' {...disabledIfInitiating} />
            <FrmInput label='Confirmação da Senha' frm={frmResetPsw} name={f.pswConfirm} type='password' {...disabledIfInitiating} />
            <BtnLine left>
              <Btn submit {...disabledIfInitiating}>Confirma</Btn>
            </BtnLine>
            {mainStates.showHelp &&
              <Stack gap={1}>
                <Box>
                  <FakeLink onClick={frmResetPsw.handleSubmit(sendResetPswLink)}>Enviar novo link de reset</FakeLink>
                </Box>
                <Box>
                  <FakeLink onClick={() => router.push(pagesApp.signIn.pagePath)}>Ir para tela de login</FakeLink>
                </Box>
                {/* <LinkHelpEmail tela={pageSelf.pagePath} loggedUserBase={loggedUser} /> */}
              </Stack>
            }
          </Stack>
        </form>
      </Stack>
    );

  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />);
  }

}