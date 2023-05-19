import { CtrlContext } from '../libCommon/ctrlContext';
import { dbg, ScopeDbg } from '../libCommon/dbg';

export interface IPromiseCtrl {
  promise: Promise<any>; //  | Query<any, any, any>
  point: string;
}

const promisesDb: IPromiseCtrl[] = [];
//export function NewOperAsyncDb(operDb: Promise<any>, txt: string) {
export function NewPromiseExecUntilCloseDb(promise: Promise<any>, point: string) { //  | Query<any, any, any>
  // if (ctrl.status === status_closed ||
  //   ctrl.status === status_error) {
  //   dbgError(point, dl(), 'newOperAsync', 'db closed');
  //   //ConnectDb('reopening');
  // }

  promisesDb.push({
    //operDb: wrapperOper(),
    promise,
    point
  });
  return promise; // permite ao chamador utilizar o resultado (com await)
}
export async function ResolvePromisesExecUntilCloseDb(ctrlContext: CtrlContext) {
  await ResolvePromises(ctrlContext, 'db', promisesDb);
}

const promisesResponse: IPromiseCtrl[] = [];
//export function NewOperAsyncDb(operDb: Promise<any>, txt: string) {
export function NewPromiseExecUntilResponse(promise: Promise<any>, point: string) {
  promisesResponse.push({
    promise,
    point
  });
  return promise;
}
export async function ResolvePromisesExecUntilResponse(ctrlContext: CtrlContext) {
  await ResolvePromises(ctrlContext, 'response', promisesResponse);
}

async function ResolvePromises(ctrlContext: CtrlContext, categ: string, promisesCtrl: IPromiseCtrl[]) {
  const dbgX = (level: number, ...params) => dbg({ level, point: 'ResolvePromises', scopeMsg: ScopeDbg.x, ctrlContext }, categ, ...params);
  if (promisesCtrl.length > 0) {
    dbgX(1, 'opers', promisesCtrl.length);
    //let countDone = 0;
    let ciclo = 0;
    //while (opersDbAsync.length > countDone) { // alguma promise liberada pode provocar a inclusão de novas promises !
    while (promisesCtrl.length > 0) { // alguma promise liberada pode provocar a inclusão de novas promises !
      ciclo++;
      const opersExecJa = [...promisesCtrl];
      promisesCtrl.length = 0;
      dbgX(2, 'operASync', `ciclo ${ciclo}`, 'pends', opersExecJa.map(x => x.point));
      //countDone += opersDbAsync.length;
      await Promise.all(opersExecJa.map(x => x.promise
        .then(data => dbgX(1, `'${x.point}' ok:`, data))
        .catch(error => dbgX(1, `'${x.point}' err:`, error.message))));
    }
    dbgX(2, 'operASync', 'allDone');
  }
}