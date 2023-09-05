import React from 'react';
import { useRouter } from 'next/router';

import { Autocomplete, Box, Stack, TextField, useTheme } from '@mui/material';

//import { chgUserAndRouteContext } from '../_appResources';

import { IsErrorManaged, ObjUpdAllProps, ErrorPlus, BinSearchItem } from '../../libCommon/util';
import { csd, dbg, ScopeDbg } from '../../libCommon/dbg';
import { PageDef } from '../../libCommon/endPoints';
import { IGenericObject } from '../../libCommon/types';

import { CallApiCliASync } from '../../fetcher/fetcherCli';

import { ctrlContextFromGlobals } from '../../libClient/clientGlobals';

import { Btn, BtnLine, PopupMsg, Tx, WaitingObs } from '../../components';
import { AbortProc, LogErrorUnmanaged } from '../../components';
import { FrmError } from '../../components';
import { FrmDefaultValues, FrmSetValues, NormalizePropsString, useFrm } from '../../hooks/useMyForm';

import { apisApp, pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { UserSimulateASync } from '../../appCydag/userResourcesCli';
import { CmdApi_UserCrud } from '../api/appCydag/user/types';
import { User } from '../../appCydag/modelTypes';

enum Phase {
  initiating = 'initiating', // @@!!!!!! novo padrão
  ready = 'ready',
}

class FrmData {
  email: string;
}

let mount; let mainStatesCache;
const pageSelf = pagesApp.userSimulate;
export default function PageUserSimulate() {
  const frmUserSimulate = useFrm<FrmData>({ defaultValues: FrmDefaultValues(new FrmData()) });
  // interface FrmDataAdic {
  //   email?: string;
  // }
  interface MainStates {
    error?: Error | ErrorPlus; phase?: Phase; users?: User[];
  }
  const [mainStates, setMainStates] = React.useState<MainStates>({ phase: Phase.initiating });
  mainStatesCache = { ...mainStates }; const setMainStatesCache = (newValues: MainStates) => { if (!mount) return; ObjUpdAllProps(mainStatesCache, newValues); setMainStates({ ...mainStatesCache }); };

  //const { logRedirSetGet } = React.useContext(_AppLogRedir);
  //const { chgUserAndRouteStart } = React.useContext(chgUserAndRouteContext);
  const router = useRouter();
  const { loggedUser, isLoadingUser, setUser } = useLoggedUser({ id: pageSelf.pagePath });
  //const agora = new Date();

  const themePlus = useTheme();

  const dbgX = (...params) => dbg({ level: 3, ctrlContext: ctrlContextFromGlobals(pageSelf.pagePath) }, ...params);

  dbgX('root*****', `isReady: ${router.isReady} ; isLoadingUser: ${isLoadingUser} ; loggedUser: ${loggedUser}`);
  //csl('simulate render');

  React.useEffect(() => {
    mount = true;
    if (!router.isReady || isLoadingUser) return;
    if (!PageDef.IsUserAuthorized(pageSelf, loggedUser?.roles)) throw new ErrorPlus('Não autorizado.');
    FrmSetValues(frmUserSimulate, FrmDefaultValues(new FrmData(), { email: loggedUser.email == loggedUser.emailSigned ? '' : loggedUser.email }));
    setMainStatesCache({ phase: Phase.ready });
    CallApiCliASync<any>(apisApp.user.apiPath, { cmd: CmdApi_UserCrud.list, getAll: true })
      .then(async (apiReturn) => {
        //await (SleepMs(5000));
        if (!mount) return;
        const documents = (apiReturn.value.documents as IGenericObject[]).map((data) => User.deserialize(data));
        setMainStatesCache({ users: documents });
      })
      .catch((error) => {
        LogErrorUnmanaged(error, `${pageSelf.pagePath}-init`);
        setMainStatesCache({ error });
      });

    // const nextPageChangedUserPush = setNextPageChangedUser();
    // if (nextPageChangedUserPush?.pathname != null) {
    //   //csl('simulate pageFetch', pageFetch);
    //   if (loggedUser != null) {
    //     const secsDesdeLogin = DateDifSeconds(agora, loggedUser.firstSignIn);
    //     //csl('simulate secsDesdeLogin', secsDesdeLogin);
    //     if (secsDesdeLogin < 10) {
    //       //csl('simulate redirecting', pageFetch);
    //       setMainStatesCache({ phase: Phase.redirecting });
    //       setTimeout(() => router.push(nextPageChangedUserPush), 500);
    //       return;
    //     }
    //   }
    // }

    // SleepMsDevRandom(0, pageSelf.pagePath)
    //   .then(() => {
    //     // if (pageSelf == pagesUser.pageUserSimulateCancel)
    //     //   UserSimulateASync()
    //     //     .then((loggedUserNow) => {
    //     //       setNextPageChangedUser(pagesUser.pageUserSimulate);
    //     //       setUser(loggedUserNow, pageSelf.pagePath);
    //     //     });
    //     // else
    //     setMainStatesCache({ phase: Phase.ready });
    //   })
    //   .catch((error) => {
    //     LogErrorUnmanaged(error, `${pageSelf.pagePath}-init`);
    //     setMainStatesCache({ error });
    //   });
    return () => { mount = false; };
  }, [router, router.isReady, isLoadingUser, loggedUser?.email]); // sem 'loggedUser?.email' não fazia o refresh ! (mas em signIn não precisou disso! @!!!!! se não trocar nada não faz nada??)
  if (mainStates.error != null) return <AbortProc error={mainStates.error} tela={pageSelf.pagePath} loggedUserBase={loggedUser} />;
  // if (pageSelf == pagesUser.pageUserSimulateCancel)
  //   return (<Box>Cancelando simulação ...</Box>);
  if (mainStates.phase == Phase.initiating) return (<WaitingObs />);

  //#region funções
  const onSubmit = async (dataForm: FrmData) => {
    const data = NormalizePropsString(dataForm);
    if (data.email == null) return PopupMsg.error('Informe o usuário a simular.');
    //FrmSetError(frmUserSimulate, User.F.email, 'Informe o usuário a simular'); // autocomplete deve ter o 'helper' para erros do campo @!!!!!!
    await efetiva(dataForm);
  };
  const cancelaSimul = async () => {
    await efetiva({ email: null });
  };
  const efetiva = async (data: FrmData) => {
    try {
      const loggedUserNow = await UserSimulateASync(data.email);
      //chgUserAndRouteStart({ loggedUser: loggedUserNow, pagePath: pagesApp.home.pagePath });
      setUser(loggedUserNow, pageSelf.pagePath);
      router.push({ pathname: pagesApp.home.pagePath });
    } catch (error) {
      LogErrorUnmanaged(error, `${pageSelf.pagePath}-onSubmit`);
      if (!IsErrorManaged(error)) {
        setMainStatesCache({ error });
        return;
      }
      FrmError(frmUserSimulate, error);
    }
  };
  //#endregion

  try {
    const isInitiating = false; // (mainStates.phase == Phase.initiating)
    const disabledIfInitiating = isInitiating ? { disabled: true } : {};

    const email = frmUserSimulate.watch(User.F.email);

    const usersAll = mainStates.users == null
      ? []
      : mainStates.users;
    const usersShow = usersAll; //.filter((x) => x.ativo);

    let optionsEmail: User[];
    let optionEmailSelected: User;
    optionsEmail = usersAll;
    optionEmailSelected = null;
    if (email != '') {
      if (mainStates.users == null)
        optionEmailSelected = User.fill({ email, nome: `${email} ...` });
      else {
        optionEmailSelected = BinSearchItem(usersAll, email, 'email');
        if (optionEmailSelected == null) {
          optionEmailSelected = User.fill({ email, nome: `${email} (NÂO ENCONTRADO)` });
          optionsEmail = [optionEmailSelected, ...usersShow];
        }
      }
    }
    if (optionEmailSelected == undefined) optionEmailSelected = null;

    return (
      <Stack spacing={1} height='100%' overflow='auto'>
        {isInitiating && <WaitingObs />}
        <form onSubmit={frmUserSimulate.handleSubmit(onSubmit)}>
          <Stack spacing={1}>
            <Tx>
              Usuário atualmente em simulação: {loggedUser.email != loggedUser.emailSigned ? loggedUser.email : 'nenhum'}
            </Tx>
            <Box>
              <Autocomplete
                sx={{ width: '99.5%' }}
                freeSolo={false} disabled={mainStates.users == null}
                value={optionEmailSelected}
                disableClearable
                renderInput={(params) => <TextField {...params} variant={themePlus.themePlusConfig?.inputVariant} label='Usuário a simular' placeholder='Selecione a pessoa' />}
                options={optionsEmail}
                onChange={(ev, newValue: User) => frmUserSimulate.setValue(User.F.email, newValue?.email || '')}
                getOptionLabel={(option: User) => { return `${option.nome} (${option.email})`; }}
                isOptionEqualToValue={(option: User, value: User) => { return option.email === value?.email; }}
                {...disabledIfInitiating}
              />
            </Box>
            <BtnLine>
              <Btn submit {...disabledIfInitiating}>Simula</Btn>
              {(loggedUser.email != loggedUser.emailSigned) &&
                <Btn onClick={() => cancelaSimul()} {...disabledIfInitiating}>Cancela a Simulação</Btn>
              }
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