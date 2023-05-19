//#region salva o status da página

import React from 'react';

import { LoggedUserBase } from '../app_base/modelTypes';

import { IGenericObject } from '../libCommon/types';

//#region troca de usuário logado em página de serviço
// Ao setar o loggedUser em uma pagina ela será sempre renderizada, pois está dentro do _App.
// Como uma 'autenticação' sempre vai acabar 'roteando' para uma página 'pós login' o 'setUser' é executado em uma
// 'página de serviço', pois a renderização extra não trará nenhum prejuízo nessa página
export interface IChgUserAndRoute { loggedUser: LoggedUserBase, pagePath: string, query?: any }
interface IChgUserAndRouteContext {
  chgUserAndRouteStart: (chgUserAndRoute?: IChgUserAndRoute) => void;
  chgUserAndRouteFinish: () => void;
}
export const chgUserAndRouteContext = React.createContext<IChgUserAndRouteContext>(null);
//#endregion

// - guarda o ponto de scrolling antes de ir para página de detalhamento para voltar no mesmo ponto (botão back do browser)
interface IPreserveStateContext {
  preserveStateSet: (page: string, state: IGenericObject) => void;
  preserveStateGet: (page: string, destroy?: boolean) => IGenericObject;
  preserveStateResetAll: () => void;
}
export const preserveStateContext = React.createContext<IPreserveStateContext>(null);
//#endregion
