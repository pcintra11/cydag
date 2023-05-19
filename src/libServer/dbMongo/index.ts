import mongoose, { Mongoose } from 'mongoose';
import { ObjectId } from 'mongodb';

import { EnvSvrDatabase } from '../../app_base/envs';

import { csd, dbg, dbgError, dbgInfo, dbgWarn, ScopeDbg } from '../../libCommon/dbg';
import { CalcExecTime } from '../../libCommon/calcExectime';
import { DateToStrISO, HoraDebug } from '../../libCommon/util';
import { CtrlContext } from '../../libCommon/ctrlContext';

import { LockObjASync, UnLockObj } from '../util';

import { ResolvePromisesExecUntilCloseDb } from '../opersASync';

let _forceDbClose = false;

// https://github.com/mongodb/mongo/blob/master/src/mongo/base/error_codes.yml
export const DbErrors = {
  duplicateKey: { code: 11000 },
};

export enum LockStatus {
  normal = 'normal', // como o figurino, não estava em lock e 'lockou'
  forced = 'forced', // ignorou o lock anterior e 'lockou' a força
}
export const lockWait = {
  nextTry: 100,// ms, para nova tentativa de lock
  max: 1000, // ms, para espera total
};

//#region 
enum StatusDb {
  connecting = 'connecting',
  connected = 'connected',
  error = 'error',
  closed = 'closed',
  closing = 'closing',
}

export const lastCompile = HoraDebug();

const mongooseSlots: { database: string, status: StatusDb, cnnCount: number, whenConnected?: Date, mongoose: Mongoose }[] = [];
export const MongooseSlot = (database?: string) => {
  const databaseUse = database || databaseApp;
  let item = mongooseSlots.find((x) => x.database == databaseUse);
  if (item == null) {
    //mongooseSlot.connection.set(keyLoad, { load: lastCompile, database });
    item = {
      database: databaseUse,
      status: StatusDb.closed,
      cnnCount: 0,
      whenConnected: null,
      mongoose: new mongoose.Mongoose({ autoIndex: false }),
    };
    mongooseSlots.push(item);
  }
  return item;
};

// export function IsDataBaseOpened(database?: string) { // @@@! criar modulo a parte, prevendo sistemas que não tem DB
//   const mongooseSlot = MongooseSlot(database);
//   return (mongooseSlot.status == StatusDb.connecting || mongooseSlot.status == StatusDb.connected);
// }

// //const loadPre = database.connection.get(keyLoad);
// // if (loadPre != null)
// //   dbg([nivelLogOpersDbDetail, 3], 'compile', infoDb, `db.load já com valor *********************************** ${loadPre}`);
// // else
// //   dbg([nivelLogOpersDbDetail, 3], 'compile', infoDb, 'db.load sem valor *********');
// MongooseSlot().connection.set(keyLoad, ctrl.load);
// //dbg(nivelLogOpersDbDetail, 'compile', infoDb, 'ctrl', ctrl);
//#endregion

const databaseApp = 'app';

function InfoDb(database: string) {
  //const db = MongooseSlot(database).connection.get(keyLoad);
  // if (db == ctrl.load) return ''; //`l:${ctrl.load}`;
  // else return `** db (l:db=${db}/ctrl=${ctrl.load})`;
  const mongooseSlot = MongooseSlot(database);
  return `** ${mongooseSlot.database} **`;
}

export function UriDb(database?: string) {
  const databaseUse = database || databaseApp;
  const uri = EnvSvrDatabase(databaseUse);
  return uri;
}

const objCnnLock = { id: 'connDb' };
interface IOpenCloseProps { ctrlContext: CtrlContext, database?: string }

export async function ConnectDbASync({ ctrlContext, database }: IOpenCloseProps) {
  const databaseUse = database || databaseApp;

  const dbgD = (level: number, ...params) => dbg({ level, point: 'ConnectDb', scopeMsg: ScopeDbg.d, ctrlContext }, ...params);

  const infoDb = InfoDb(databaseUse);

  const mongooseSlot = MongooseSlot(databaseUse);

  dbgD(3, infoDb, 'ConnectDb', `cnnCount: ${mongooseSlot.cnnCount} ; whenConnected: ${DateToStrISO(mongooseSlot.whenConnected)}`); //@@!!!! acho que apos cancelamento por timeout fica com sujeira !

  await LockObjASync(objCnnLock, ctrlContext, 'ConnectDb'); // no vercel PODE causar um reaproveitamento
  ctrlContext.checkElapsed('ConnectDbASync - LockObjASync');

  try {

    mongooseSlot.cnnCount++;
    if (//mongooseSlot.status === status_connecting ||
      //mongooseSlot.status === status_connected
      mongooseSlot.cnnCount > 1) {
      // if (database.connection.readyState === xxx || // connected
      //   database.connection.readyState === STATES.connecting)  // connecting = 2
      dbgD(2, infoDb, 'connect-rej', `cnnCount: ${mongooseSlot.cnnCount}`); // Database().connection.readyState
      UnLockObj(objCnnLock, ctrlContext, 'ConnectDb');
      return;
    }
    if (mongooseSlot.whenConnected != null) {
      dbgD(1, infoDb, 'connect-rej', `already connected ${DateToStrISO(mongooseSlot.whenConnected)}`); // Database().connection.readyState
      UnLockObj(objCnnLock, ctrlContext, 'ConnectDb');
      return;
    }

    //UnLockObj(objCnnLock, `${dbgContext}-ConnectDb`);

    mongooseSlot.status = StatusDb.connecting;
    //mongooseSlot.lastConnect = HoraDbg();

    const uri = UriDb(databaseUse);
    if (uri == null) throw new Error(`string de conexão para database ${databaseUse} não configurado`);

    dbgD(1, infoDb, 'connecting ******', `${uri}`);

    // na nova versão do mongo não está funcionando o bufferCommands, então tem que aguardar a conexão
    try {

      const calcExecTime = new CalcExecTime();
      await mongooseSlot.mongoose.connect(uri);
      mongooseSlot.whenConnected = new Date();
      const elapsed = calcExecTime.elapsedMs();
      dbgD(1, infoDb, `connected in ${elapsed}ms`);
      if (elapsed > 2000) dbgWarn('ConnectDb', `conexão muito demorada: ${elapsed}ms`);
      //else dbgInfo(`conexão ao banco: ${elapsed}ms`);
      mongooseSlot.status = StatusDb.connected;
      dbgD(2, infoDb, 'connectOk');
    } catch (error) {
      //mongooseSlot.status = status_error;
      throw new Error(`Erro na conexão ao db '${uri}': ${error.message}.`);
    }

    UnLockObj(objCnnLock, ctrlContext, 'ConnectDb');
    ctrlContext.checkElapsed('ConnectDbASync - fim');

  } catch (error) {
    mongooseSlot.status = StatusDb.error;
    mongooseSlot.cnnCount--;
    dbgError('ConnectDb', ctrlContext.context, infoDb, error.message);
    UnLockObj(objCnnLock, ctrlContext, 'ConnectDb');
    throw error;
  }
}

export function SwitchForceCloseDb() {
  _forceDbClose = !_forceDbClose;
  return _forceDbClose;
}

export async function CloseDbASync({ ctrlContext, database }: IOpenCloseProps) {
  const databaseUse = database || databaseApp;

  const infoDb = InfoDb(databaseUse);

  const dbgD = (level: number, ...params) => dbg({ level, point: 'CloseDb', scopeMsg: ScopeDbg.d, ctrlContext }, ...params);

  const mongooseSlot = MongooseSlot(databaseUse);

  await LockObjASync(objCnnLock, ctrlContext, 'CloseDb');

  try {

    if (mongooseSlot.cnnCount > 1) {
      mongooseSlot.cnnCount--;
      dbgD(2, infoDb, 'close-rej', `cnnCount: ${mongooseSlot.cnnCount}`);
      UnLockObj(objCnnLock, ctrlContext, 'CloseDb');
      return;
    }
    mongooseSlot.cnnCount--;
    if (mongooseSlot.cnnCount < 0)
      dbgD(0, `cnnCount ${mongooseSlot.cnnCount} !!!!!!`);

    //UnLockObj(objCnnLock, `${dbgContext}-CloseDb`);

    dbgD(1, infoDb, `close - forceDbClose: ${_forceDbClose}`);

    // let seq = 0;
    // while (database.connection.readyState === database.STATES.connecting && (++seq < 5)) {
    //   dbgColor(2, nivelLogOpersDbTop, dbgContext, infoDisp, infoDb, 'CloseDb-pre', `waiting connection ${seq}`);
    //   Wait(1);
    // }

    //mongooseSlot.closing = dbgContext.trim();

    // await ResolveAllOpersASync(dbgContext);

    //dbg([nivelLogOpersDbTop, 2], dbgContext, infoDb, 'close-pre', `readyState: ${database?.connection?.readyState}; opersDbAsync: ${opersASync.length}`);

    //mongooseSlot.closing = null;

    dbgD(3, infoDb, 'close-posWait');

    // if (ctrl.cnnCount > 0) { // durante a liberação das promises pode ter ocorrido um novo Connect sem o close correspondente
    //   abort = `closes pends: ${ctrl.cnnCount}`;
    //   dbg([nivelLogOpersDbMedium, 3], dbgContext, infoDb, 'close-abort (pos wait)', abort);
    //   return;
    // }

    // if (mongooseSlot.connection.get(keyLoad) != ctrl.load) {
    //   // essa situação provoca ero, pois potencialmente está sendo fechado uma conexão ao mesmo tempo que 
    //   // outra thread está tentando abrir (no mesmo objeto!)
    //   dbgD(0, infoDb, 'close', '******************');
    //   // SystemError('db', `CloseDb - init ${database.connection.get(varCtrl)} dif load ${ctrl.load}`);
    // }

    mongooseSlot.status = StatusDb.closing;
    //ctrl.lastDisconnect = HoraDbg();

    if (mongooseSlot.cnnCount == 0)
      await ResolvePromisesExecUntilCloseDb(ctrlContext);

    // sem for asyncrono no netlify a conexão vai cair antes da desconexão do banco, gerando problema na próxima conexão
    // database.connection.close()
    //   .then((x) => {
    //     ctrl.status = status_closed;
    //     dbg(nivelLogOpersDbDetail, dbgContext, 'CloseDb-Disconn-Ok', info);
    //     //SystemWarning('connectDb', 'ok');
    //   })
    //   .catch((error) => {
    //     ctrl.status = status_closed;
    //     dbg(nivelLogOpersDbAlways, dbgContext, 'CloseDb-Disconn-Error', info, error.message);
    //     //SystemError('connectDb', 'erro ao connectar', { error: error.message });
    //   });

    try {
      if (mongooseSlot.mongoose?.connection.readyState != mongooseSlot.mongoose.STATES.connected) {
        dbgD(2, infoDb, 'closing readyState', mongooseSlot.mongoose?.connection.readyState);
        dbgD(3, infoDb, 'JunkModel.findOne', 'pre');
        await LixoModel.findOne({}); // força acesso ao mongo para abrir, senão dá pau no close
        dbgD(3, infoDb, 'JunkModel.findOne', 'pos');
      }
      // // let seq = 0;
      // // while (database.connection.readyState === database.STATES.connecting && (++seq < 20)) {
      // //   dbgColor(2, nivelLogOpersDbTop, dbgContext, infoDisp, infoDb, 'CloseDb-pos', `waiting connection ${seq}`);
      // //   Wait(1);
      // // }  
      if (mongooseSlot.cnnCount != 0) {
        dbgD(2, infoDb, 'close abortado, houve nova conexão');
        UnLockObj(objCnnLock, ctrlContext, 'CloseDb');
        return;
      }

      if (_forceDbClose) {
        await mongooseSlot.mongoose.connection.close();
        mongooseSlot.whenConnected = null;
        mongooseSlot.status = StatusDb.closed;
        dbgD(3, infoDb, 'disconn-Ok');
      }
      //SystemWarning('connectDb', 'ok');    
    } catch (error) {
      mongooseSlot.status = StatusDb.closed;
      dbgError('CloseDb', ctrlContext.context, infoDb, 'disconn-Error', error.message);
      //SystemError('connectDb', 'erro ao connectar', { error: error.message });
    }

  } catch (error) {
    dbgError('CloseDb', ctrlContext.context, infoDb, '**************** Close-Main-Error', error.message);
  }

  UnLockObj(objCnnLock, ctrlContext, 'CloseDb');

  dbgD(2, infoDb, 'close-pos');
}

export interface ICollectionDef { name: string, database?: string, indexes: { fields: mongoose.IndexDefinition, options: mongoose.IndexOptions }[] }

export async function EnsureModelsIndexesASync(scope: string, collectionsDef: ICollectionDef[], collection?: string) {
  const messages = [];
  const collectionsChecked = [];
  //const mongoose = MongooseSlot().mongoose;
  for (const collectionDef of collectionsDef) {
    collectionsChecked.push(collectionDef.name);
    if (collection != null &&
      collectionDef.name != collection)
      continue;
    dbgInfo('EnsureModelsIndexesASync', `ensuringIndexes ${collectionDef.name} ${collectionDef.database || ''}`);
    const model = MongooseSlot(collectionDef.database).mongoose.model(collectionDef.name);
    try {
      await model.ensureIndexes();
    } catch (error) {
      messages.push(`***** collection ${collectionDef.name}: error: ${error.message}`);
    }
  }
  if (messages.length == 0)
    messages.push('- no errors detected');
  messages.unshift(`- checked: ${collectionsChecked.join(', ')}`);
  messages.unshift(`scope ${scope}`);
  return messages;
}
export async function CheckModelsIndexesASync(scope: string, collectionsDef: ICollectionDef[]) {
  // prever que o nome do indice não foi informado e deduzir como o Mongo faz!! @@!!!!! (categ_1_status_1 ...)
  const messages = [];
  const collectionsChecked = [];
  //const mongoose = MongooseSlot().mongoose;
  for (const collectionDef of collectionsDef) {
    collectionsChecked.push(collectionDef.name);
    dbgInfo('CheckModelsIndexesASync', `checking ${collectionDef.name}  ${collectionDef.database || ''}`);
    const model = MongooseSlot(collectionDef.database).mongoose.model(collectionDef.name);
    const indexesDef = collectionDef.indexes.map((x) => x.options.name);
    const indexesDb = (await model.listIndexes()).map((x) => x.name);

    const missingIndexes = [];
    indexesDef.forEach((indexName) => {
      if (indexesDb.findIndex((db) => db == indexName) == -1)
        missingIndexes.push(indexName);
    });
    if (missingIndexes.length != 0)
      messages.push(`***** collection ${collectionDef.name}: missing index ${missingIndexes.join(', ')}`);

    const unknowIndexes = [];
    indexesDb.forEach((indexName) => {
      if (indexName != '_id_' &&
        indexesDef.findIndex((db) => db == indexName) == -1)
        unknowIndexes.push(indexName);
    });
    if (unknowIndexes.length != 0)
      messages.push(`***** collection ${collectionDef.name}: unknow index ${unknowIndexes.join(', ')}`);
  }
  if (messages.length == 0)
    messages.push('- no errors detected');
  messages.unshift(`- checked: ${collectionsChecked.join(', ')}`);
  messages.unshift(`scope ${scope}`);

  return messages;
}
export function AddIndex(models: ICollectionDef[], modelName: string, schema: mongoose.Schema) { // @@!!!!!! mudar o protocolo e passar os indices !
  const modelDef = models.find((x) => x.name == modelName);
  if (modelDef == null)
    return;
  for (const index of modelDef.indexes)
    schema.index(index.fields, { ...index.options, background: true });
}

export function MongoIncrVersion(query) {
  const update: any = query.getUpdate();
  // remove do 'update' qualquer menção ao campo de versionamento     
  if (update.__v != null)
    delete update.__v;
  const keys = ['$set', '$setOnInsert'];
  for (const key of keys) {
    if (update[key] != null && update[key].__v != null) {
      delete update[key].__v;
      if (Object.keys(update[key]).length === 0)
        delete update[key];
    }
  }
  // agora faz o incremento na versão, de forma controlada
  update.$inc = update.$inc || {};
  update.$inc.__v = 1;
}

const modelJunk = 'base_lixos';
interface LixoMd extends mongoose.Document<ObjectId, any> { }
export const LixoModel = (() => {
  const modelName = modelJunk;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    lixo: { type: String, required: false },
  });
  return mongoose.model<LixoMd>(modelName, schema);
})();