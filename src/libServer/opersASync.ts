import { dbg, dbgError, ScopeDbg } from '../libCommon/dbg';

export interface promiseCtrl {
  promise: Promise<any>; //  | Query<any, any, any>
  point: string;
}

const promisesDb: promiseCtrl[] = [];
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
export async function ResolvePromisesExecUntilCloseDb(context: string) {
  await ResolvePromises(context, 'db', promisesDb);
}

const promisesResponse: promiseCtrl[] = [];
//export function NewOperAsyncDb(operDb: Promise<any>, txt: string) {
export function NewPromiseExecUntilResponse(promise: Promise<any>, point: string) {
  promisesResponse.push({
    promise,
    point
  });
  return promise;
}
export async function ResolvePromisesExecUntilResponse(context: string) {
  await ResolvePromises(context, 'response', promisesResponse);
}

async function ResolvePromises(context: string, categ: string, promisesCtrl: promiseCtrl[]) {
  const dbgT = (level: number, ...params) => dbg({ level, levelScope: ScopeDbg.t, context }, `==> ResolvePromises (${categ})`, ...params);
  if (promisesCtrl.length > 0) {
    dbgT(1, 'opers', promisesCtrl.length);
    //let countDone = 0;
    let ciclo = 0;
    //while (opersDbAsync.length > countDone) { // alguma promise liberada pode provocar a inclusão de novas promises !
    while (promisesCtrl.length > 0) { // alguma promise liberada pode provocar a inclusão de novas promises !
      ciclo++;
      const opersExecJa = [...promisesCtrl];
      promisesCtrl.length = 0;
      //dbg(nivelLogOpersDbMedium, dbgContext, 'CloseDb-wait', `ciclo ${ciclo}`, `${opersDbAsync.length - countDone} promises`);
      dbgT(2, 'operASync', `ciclo ${ciclo}`, 'pends', opersExecJa.map(x => x.point));
      //countDone += opersDbAsync.length;
      await Promise.all(opersExecJa.map(x => x.promise
        .then(data => dbgT(1, `'${x.point}' ok:`, data))
        .catch(error => dbgT(1, `'${x.point}' err:`, error.message))));
      //dbg(0, dbgContext, 'opersDbAsync', `ciclo ${ciclo}`, 'pos', opersExecJa);
    }
    //dbg3(0, dbgContext, 'CloseDb-waiting', `connectCount pos: ${ctrl.cnnCount}`);
    dbgT(2, 'operASync', 'allDone');
  }
}