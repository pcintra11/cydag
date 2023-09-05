import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

import { AddIndex, MongooseSlot, ICollectionDef } from '../libServer/dbMongo';

import { SentMessage, ApiSyncLog, ApiAsyncLog, SendMailLog, SiteEntryPoint, ControlledAccess, SystemLog, NotifyAdmCtrl, DbTest, MainCtrl, CacheApp, Junk } from './modelTypes';

export const collectionsDef: ICollectionDef[] = [];

export const keyMainCtrl = '*';
const modelNameMainCtrl = 'base_main_ctrls';
collectionsDef.push({
  name: modelNameMainCtrl,
  indexes: [
    { fields: { key: 1 }, options: { name: 'key', unique: true } },
  ],
});
interface MainCtrlMd extends mongoose.Document<ObjectId, any, MainCtrl>, MainCtrl { }
export const MainCtrlModel = (() => {
  const modelName = modelNameMainCtrl;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    key: { type: String, required: true },
    blockMsg: { type: String, required: false },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<MainCtrlMd>(modelName, schema);
})();

const modelNameSentMessages = 'base_sent_message_logs';
interface SentMessageMd extends mongoose.Document<ObjectId, any, SentMessage>, SentMessage { }
export const SentMessageModel = (() => {
  const modelName = modelNameSentMessages;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    userId: { type: ObjectId, required: false },
    date: { type: Date, required: true },
    type: { type: String, enum: ['email', 'sms'], required: true },
    target: { type: String, required: true },
    message: { type: String, required: true },
    resultOk: { type: String, required: false },
    resultError: { type: String, required: false },
  });
  return mongoose.model<SentMessageMd>(modelName, schema);
})();

const modelNameSendMailLog = 'base_sendmail_logs';
interface SendMailLogMd extends mongoose.Document<ObjectId, any, SendMailLog>, SendMailLog { }
export const SendMailLogModel = (() => {
  const modelName = modelNameSendMailLog;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    sendEmailParams: { type: Object, required: true },
    started: { type: Date, required: true },
    ended: { type: Date, required: false },
    elapsedMs: { type: Number, required: false },
    resultOk: { type: Object, required: false },
    resultError: { type: Object, required: false },
    attention: { type: String, required: false },
    shouldDelete: { type: Boolean, required: false },
  });
  return mongoose.model<SendMailLogMd>(modelName, schema);
})();

const modelNameApiSyncLogs = 'base_api_sync_logs';
interface ApiSyncLogMd extends mongoose.Document<ObjectId, any, ApiSyncLog>, ApiSyncLog { }
export const ApiSyncLogModel = (() => {
  const modelName = modelNameApiSyncLogs;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    appVersion: { type: String, required: false },
    apiHost: { type: String, required: false },
    apiPath: { type: String, required: true },
    ip: { type: String, required: true },
    //originHost: { type: String, required: false },
    paramsTypeVariant: { type: String, required: false },
    paramsTypeKey: { type: String, required: false },
    userId: { type: ObjectId, required: false },
    userInfo: { type: String, required: false },
    started: { type: Date, required: true },
    parm: { type: Object, required: false },
    ended: { type: Date, required: false },
    elapsedMs: { type: Number, required: false },
    result: { type: Object, required: false },
    attention: { type: String, required: false },
    sessionIdStr: { type: String, required: false },
    shouldDelete: { type: Boolean, required: false },
    additionalInfo: { type: String, required: false },
    //referer: { type: String, required: false },
  });
  return mongoose.model<ApiSyncLogMd>(modelName, schema);
})();

const modelNameApiAsyncLogs = 'base_api_async_logs';
collectionsDef.push({
  name: modelNameApiAsyncLogs,
  indexes: [
    { fields: { type: 1, customType: 1, register: 1 }, options: { name: 'type_register', unique: false } },
  ],
});
export interface ApiAsyncLogMd extends mongoose.Document<ObjectId, any, ApiAsyncLog>, ApiAsyncLog { }
export const ApiAsyncLogModel = (() => {
  const modelName = modelNameApiAsyncLogs;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    appVersion: { type: String, required: false },
    apiHost: { type: String, required: false },
    type: { type: String, required: true },
    customType: { type: String, required: false },
    info: { type: String, required: true },
    params: { type: Object, required: true },
    register: { type: Date, required: true },
    started: { type: Date, required: false },
    ended: { type: Date, required: false },
    elapsedMs: { type: Number, required: false },
    resultOk: { type: String, required: false },
    resultError: { type: String, required: false },
    attention: { type: String, required: false },
    shouldDelete: { type: Boolean, required: false },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ApiAsyncLogMd>(modelName, schema);
})();

//const modelNameRefererLogs = 'base_referer_logs'; //@!!!!!!! remover
const modelNameSiteEntryPoint = 'base_site_entry_points';
interface SiteEntryPointMd extends mongoose.Document<ObjectId, any, SiteEntryPoint>, SiteEntryPoint { }
export const SiteEntryPointModel = (() => {
  const modelName = modelNameSiteEntryPoint;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    date: { type: Date, required: true },
    url: { type: String, required: true },
    referer: { type: String, required: false },
    ip: { type: String, required: true },
    ipInfo: { type: Object, required: false },
    browserId: { type: String, required: true },
    userAgent: { type: String, required: true },
    browserInfo: { type: Object, required: false },
  });
  return mongoose.model<SiteEntryPointMd>(modelName, schema);
})();

const modelNameControlledAccess = 'base_controlled_accesses';
collectionsDef.push({
  name: modelNameControlledAccess,
  indexes: [
    { fields: { browserId: 1 }, options: { name: 'browserId', unique: true } },
  ],
});
interface ControlledAccessMd extends mongoose.Document<ObjectId, any, ControlledAccess>, ControlledAccess { }
export const ControlledAccessModel = (() => {
  const modelName = modelNameControlledAccess;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    browserId: { type: String, required: true },
    ips: { type: [String], required: true },
    dateAsked: { type: Date, required: true },
    info: { type: String, required: true },
    dateAuthorized: { type: Date, required: false },
    searchTerms: { type: String, required: false },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<ControlledAccessMd>(modelName, schema);
})();


const modelNameSysLogs = 'base_system_logs'; // era base_msg_logs
interface SystemLogMd extends mongoose.Document<ObjectId, any, SystemLog>, SystemLog { }
export const SystemLogModel = (() => {
  const modelName = modelNameSysLogs;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    //app: { type: String, required: true },
    appVersion: { type: String, required: false },
    //appDomain: { type: String, required: false },
    date: { type: Date, required: true },
    scope: { type: String, required: true }, // 'Server, Client'
    categ: { type: String, required: false },
    point: { type: String, required: false },
    ip: { type: String, required: false },
    browserId: { type: String, required: false },
    userId: { type: ObjectId, required: false },
    msg: { type: String, required: false },
    details: {},
  });
  return mongoose.model<SystemLogMd>(modelName, schema);
  // return GenericModel(    'LogSystem',    new database.Schema({ ...
})();

const modelNameNotifyAdmCtrl = 'base_notify_ctrls';
export const keyNotifyAdmCtrl = '*';
interface NotifyAdmCtrlMd extends mongoose.Document<ObjectId, any, NotifyAdmCtrl>, NotifyAdmCtrl { }
export const NotifyAdmCtrlModel = (() => {
  const modelName = modelNameNotifyAdmCtrl;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    key: { type: String, required: true },
    start: { type: Date, required: false },
    last: { type: Date, required: false },
    messages: { type: [Object], required: false },
    lockedStr: { type: String, required: false },
  });
  return mongoose.model<NotifyAdmCtrlMd>(modelName, schema);
})();


const modelNameCache = 'base_caches';
collectionsDef.push({
  name: modelNameCache,
  indexes: [
    { fields: { key1: 1, key2: 1 }, options: { name: 'key', unique: true } }, //@!!!!!!!!! reindexar at build time!
  ],
});
interface CacheAppMd extends mongoose.Document<ObjectId, any, CacheApp>, CacheApp { }
export const CacheModel = (() => {
  const modelName = modelNameCache;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    key1: { type: String, required: true },
    key2: { type: String, required: false },
    date: { type: Date, required: true },
    data: { type: String, required: true },
  });
  AddIndex(collectionsDef, modelName, schema);
  return mongoose.model<CacheAppMd>(modelName, schema);
})();

const cacheConnections: { mongooseSlot: string, modelName: string, model: mongoose.Model<any> }[] = [];
interface DbTestMd extends mongoose.Document<ObjectId, any, DbTest>, DbTest { }
export const DbTestModelX = ((collection: string, mongooseSlot?: string) => {
  const modelName = collection;
  const cacheConnection = (cacheConnections.find((x) => x.mongooseSlot === mongooseSlot && x.modelName === modelName));
  if (cacheConnection != null)
    return cacheConnection.model;
  const mongoose = MongooseSlot(mongooseSlot).mongoose;
  const schema = new mongoose.Schema({
    key: { type: String, required: true },
    fld: { type: String, required: false },
  });
  //AddIndex(modelsIndexes, modelName, schema);
  // for (const index of modelNameDbTestIndexes)
  //   schema.index(index.fields, { ...index.options, background: true });
  const model = mongoose.model<DbTestMd>(modelName, schema);
  cacheConnections.push({ mongooseSlot, modelName, model });
  return model;
});

// function GenericModel(collection, schema) {
//   if (database.models[collection])
//     return database.models[collection];
//   return database.model(collection, schema);
// }

const modelJunk = 'base_junks';
interface JunkMd extends mongoose.Document<ObjectId, any, Junk>, Junk { }
export const JunkModel = (() => {
  const modelName = modelJunk;
  const mongoose = MongooseSlot().mongoose;
  const schema = new mongoose.Schema({
    app: { type: String, required: false },
    host: { type: String, required: false },
    key: { type: String, required: true },
    date: { type: Date, required: true },
    textField: { type: String, required: true },
    obj1: {},
    obj2: {},
    obj3: {},
    obj4: {},
  });
  return mongoose.model<JunkMd>(modelName, schema);
})();