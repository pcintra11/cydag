import React from 'react';

import { dbg, dbgWarn, ScopeDbg } from '../../libCommon/dbg';

import { GlobalState } from './globalState';

// vide https://dev.to/yezyilomo/global-state-management-in-react-with-global-variables-and-hooks-state-management-doesn-t-have-to-be-so-hard-2n2c

const colorDbg = 5;

let mount;
export function useGlobalState(globalState: GlobalState, config?: { reRender?: boolean, id?: string, debug?: boolean }) { // reRender : false => para componentes que são subordinados a um pai que será renderizado evita a dupla renderização
  const reRender = config?.reRender != null ? config.reRender : true;
  const caller = config?.id != null ? config.id : '_semId_';
  const debug = config?.debug != null ? config.debug : globalState.getDebug();

  const [localState, setStateLocal] = React.useState({ caller, count: 0 }); // apenas para forçar o reRender
  const value = globalState.getValue();
  const isLoading = globalState.isLoading();
  const isDefaultValue = globalState.isDefaultValue();

  const dbgX = (level: number, ...params) => { debug && dbg({ level, levelScope: ScopeDbg.x, context: `useGlobalState(${caller})`, color: colorDbg }, ...params); };

  function localReRender() { // isNewValue: boolean
    dbgX(1, 'localReRender');
    //if (isNewValue)
    if (mount) // @@!!!! ???? não resolver nenhum problema !
      setStateLocal({ ...localState, count: localState.count + 1 }); // isso é para provocar o rerender do componente, buscar o valor atualizado no global state
  }
  React.useEffect(() => {
    mount = true;
    dbgX(1, 'useEffect');
    // Subscribe to a global state when a component mounts
    if (reRender) {
      // SleepMsDevClient(`${prefixMsg}-subscribing`, 400)
      //   .then(() => {
      globalState.subscribe(localReRender, caller);
      //dbgX(1, 'subscribed');
      const currentValue = globalState.getValue();
      if (currentValue !== value) // numa situação limite o valor foi alterado antes da subscrição ser registrada
      {
        dbgWarn(`useGS (${caller})`, 'valor alterado antes da subscrição, reRender forçado');
        localReRender();
      }
      // });
    }
    return () => {
      if (reRender)
        globalState.unsubscribe(localReRender, caller);
      mount = false;
    };
  }, []);
  function setState(newValue, caller?: string, isLoading?: boolean) { // aqui é a ponte com o global state
    globalState.setValue(newValue, caller, isLoading);
  }
  return { value, setState, isLoading, isDefaultValue, localState };
}

//#region lixo
//import { PreComp } from '../libCommon/consoleColor';
//import { Wait } from '../libCommon/util';

//export const reRenderOnlyNewValue = 'onlyNewValue'; // para evitar o reRender apenas na mudanã de 'loading'
// export function useGlobalStateOld(globalState: GlobalStateOld, reRender: boolean | 'onlyNewValue' = false, caller: string = '') { // reRender : false => para componentes que são subordinados a um pai que será renderizado evita a dupla renderização
//   const [localState, setStateLocal] = React.useState({ caller, count: 0 }); // apenas para forçar o reRender
//   const state = globalState.getValue();
//   const isLoading = globalState.isLoading();
//   const isOriginValueFromCookie = globalState.isOriginValueFromCookie();

//   function localReRender(isNewValue: boolean) {
//     if (isNewValue || reRender == true)
//       setStateLocal({ ...localState, count: localState.count + 1 });
//   }

//   useEffect(() => {
//     // Subscribe to a global state when a component mounts
//     if (reRender) {
//       globalState.subscribe(localReRender);
//       const currentState = globalState.getValue();
//       //console.log({ state, currentState });
//       if (currentState !== state) // numa situação limite o valor foi alterado antes da subscrição ser registrada
//       {
//         dbg(3, 'page', 'valor alterado antes da subscrição!');
//         localReRender(true);
//       }
//       // const currentIsLoading = globalState.isLoading();
//       // if (currentIsLoading !== isLoading) // numa situação limite o valor foi alterado antes da subscrição ser registrada
//       // {
//       //   console.log('isLoading alterado antes da subscrição!');
//       //   localReRender(true);
//       // }
//     }

//     return () => {
//       // Unsubscribe from a global state when a component unmounts
//       if (reRender)
//         globalState.unsubscribe(localReRender);
//     }
//   }, []);

//   function setState(newState) {
//     // Send update request to the global state and let it
//     // update itself
//     globalState.setValue(newState);
//   }

//   return [state, setState, isLoading, localState, isOriginValueFromCookie];
// }

//const levelDbg = 1;
//#endregion lixo

export * from './globalState';