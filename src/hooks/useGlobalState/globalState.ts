import { dbg, ScopeDbg } from '../../libCommon/dbg';
import { OnClient } from '../../libCommon/util';

import { LogErrorUnmanaged } from '../../components';

const colorDbg = 5;

interface IGlobalState {
  defaultValue?: any;
  defaultValueAsyncFunction?: () => any;
  loadingStateWaitExternal?: boolean;
  id?: string;
  debug?: boolean;
}
/**
 * controle para um hook personalizado compartilhar o seu estado com todas as instancias desse hook em conjunto com useGlobalState
 */
export class GlobalState {
  //#defaultValue: any;
  #currentValue: any;
  #isDefaultValue: boolean;
  #subscribers: any[];     // List of subscribers
  //#cookieName: string;
  #isLoading: boolean; // 'isLoadingDefaultValue' @@@!!!!!
  //#methodRetention: MethodRetention;
  #id: string;
  #debug: boolean;

  dbgT(level: number, ...params) { this.#debug && dbg({ level, levelScope: ScopeDbg.x, context: `GlobalState(${this.#id})`, color: colorDbg }, ...params); }

  constructor({ defaultValue, defaultValueAsyncFunction, loadingStateWaitExternal, id, debug }: IGlobalState) {
    //AssertIsClient(`GlobalState - cookie: ${cookieName} ; defaultValue: ${defaultValue}`);
    //this.#defaultValue = defaultValue;  // Actual value of a global state
    this.#currentValue = defaultValue || null;
    this.#isDefaultValue = true;
    //this.#originValueFromCookie = false;  // Actual value of a global state    
    this.#subscribers = [];     // List of subscribers
    //this.#cookieName = cookieName;
    this.#isLoading = false;
    this.#id = id || '_semId_';
    this.#debug = debug != null ? debug : false;

    this.dbgT(1, 'constructor');

    if (defaultValueAsyncFunction != null) {
      this.#isLoading = true;
      if (OnClient()) {
        //this.dbgX(1, `subscribers ini ${this.#subscribers.length}`);
        defaultValueAsyncFunction()
          .then(value => {
            this.dbgT(1, `defaultValueAsync ${JSON.stringify({ value }, null, 2)}`);
            this.#isLoading = false;
            this.#currentValue = value;
            //this.dbgX(1, `subscribers async finished 1 ${this.#subscribers.length}, value: ${value}`);
            this.#triggerSubscribeds();
            //this.dbgX(1, `subscribers async finished 2 ${this.#subscribers.length}`);
          })
          .catch(error => {
            //this.dbgX(1, `subscribers async error ${error.message}`);
            this.#isLoading = false;
            this.#triggerSubscribeds();
            LogErrorUnmanaged(error, `GlobalState(${id}) - getDefault async`);
          });
      }
    }
    else if (loadingStateWaitExternal)
      this.#isLoading = true;
  }

  //#region methods
  setValue(value, caller?: string, isLoading?: boolean) {
    const newValue = this.getValue() !== value;
    let trigger = '';
    if (newValue) {
      this.#currentValue = value;
      trigger += ' newValue';
    }
    if (this.#isDefaultValue) {
      this.#isDefaultValue = false;
      trigger += ' dafaultValueOverrided';
    }
    if (isLoading != null) {
      this.#isLoading = isLoading;
      trigger += ' isLoading';
    }
    this.dbgT(1, `setValue ${value} ; trigger ${trigger} ; caller ${caller}`);
    if (trigger != '')
      this.#triggerSubscribeds();
  }

  #triggerSubscribeds() {
    this.#subscribers.forEach(subscriber => {
      // Notify subscribers that the global state has changed
      subscriber(this.#currentValue);
    });
  }

  getDebug() {
    return this.#debug;
  }
  getValue() {
    return this.#currentValue;
  }
  isLoading() {
    return this.#isLoading;
  }
  isDefaultValue() {
    return this.#isDefaultValue;
  }
  subscribe(localReRender: () => void, caller: string) {
    this.dbgT(3, `subscribe caller ${caller}`);
    if (this.#subscribers.indexOf(localReRender) > -1) {
      //this.dbgX(1, `subscribe caller ${caller} - Already subscribed`);
      return;
    }
    //this.dbgX(1, 'subscribing');
    this.#subscribers.push(localReRender);
  }
  unsubscribe(itemToUnsubscribe: (isNewValue: boolean) => void, caller: string) {
    this.dbgT(3, `unsubscribe caller ${caller}`);
    this.#subscribers = this.#subscribers.filter(
      subscriber => subscriber !== itemToUnsubscribe
    );
  }
  //#endregion methods
}



// export interface GlobalState_ConfigApi {
//   cookieName: string,
//   cookieTTL: number,
// }

/*
  - ao buscar o valor no cookie, se houver, revalida novo periodo de tempo
  - exceto se for api específica o cookie server não terá expiração (eterno)
*/
// export class GlobalStateOld {
//   //#region
//   #defaultValue: any;
//   #currentValue: any;
//   #originValueFromCookie: boolean; // aqui objetos podem perder seus tipo originais, como Date. O 'consumer' deve então tratar
//   #subscribers: any[];     // List of subscribers
//   #cookieName: string;
//   // #cookieTTL?: number;
//   #isLoading: boolean;
//   #methodRetention: MethodRetention;
//   #api: string;
//   //#callId: () => string;
//   //#endregion

//   // configApi(): GlobalState_ConfigApi {
//   //   return {
//   //     cookieName: this.#cookieName,
//   //     cookieTTL: this.#cookieTTL,
//   //   };
//   // }

//   // callId() {
//   //   if (this.#callId != null)
//   //     return `${this.#callId()}-GlState`;
//   //   else
//   //     return `GlState`;
//   // }

//   constructor(defaultValue: any, cookieName: string = null,
//     methodRetention: MethodRetention = MethodRetention.clientCookie, secureApi: string = null) { // , callId: () => string = null
//     //AssertIsClient(`GlobalState - cookie: ${cookieName} ; defaultValue: ${defaultValue}`);
//     this.#defaultValue = defaultValue;  // Actual value of a global state
//     this.#currentValue = defaultValue;  // Actual value of a global state
//     this.#originValueFromCookie = false;  // Actual value of a global state
//     this.#subscribers = [];     // List of subscribers
//     this.#cookieName = cookieName;
//     //this.#cookieTTL = cookieTTLSeconds;
//     this.#isLoading = false;
//     this.#methodRetention = methodRetention;
//     if (this.#methodRetention === MethodRetention.custom) {
//       if (secureApi == null)
//         throw new Error('secureApi not provided');
//       // if (cookieTTLSeconds == null)
//       //   throw new Error('secureApi must have TTL');
//       this.#api = secureApi;
//     }
//     else {
//       if (secureApi != null)
//         throw new Error('secureApi not applied');
//       if (this.#methodRetention === MethodRetention.httpSecureCookie)
//         //NEXT_PUBLIC_SITE_SESSION_PATH_API=http://localhost:3000/api/
//         this.#api = apisXXX.globalStateApi.apiPath;
//     }
//     //this.#callId = callId;

//     const delay = 0; // OnServer() ? 1000 : 2000;
//     const agora = new Date();

//     //console.log('cookieName', this.#cookieName, 'onserver', OnServer());

//     if (this.#cookieName != null) {
//       this.#isLoading = true;
//       if (OnClient()) {
//         if (this.#methodRetention === MethodRetention.httpSecureCookie ||
//           this.#methodRetention === MethodRetention.custom) {
//           setTimeout(async () => {
//             //this.setValueInternal(this.#currentValue, true); // força o reRender para dar refresh no isLoading
//             try {
//               //console.log('cookieName', this.#cookieName, 'setting internal', 'onserver', OnServer());
//               //console.log(PreComp(), 'chamando api para valor inicial', this.api);
//               const data = await CallApi(this.#api,
//                 { cookieName: this.#cookieName, cmd: GlobalStateCmd.get })
//               //{ callId: this.callId() }
//               //console.log(PreComp(), 'getCookie ok', { data });
//               let newValue = this.#currentValue;
//               if (data?.value != null &&
//                 data.value != this.#currentValue)
//                 newValue = data.value;
//               this.setValueInternal(newValue, true, false); // força o reRender para dar refresh no isLoading
//             } catch (error) {
//               LogErrorUnmanaged(error, `useGlobalState-getDefault (api ${this.#api})`);
//               this.setValueInternal(this.#currentValue, true, false);
//               //console.log(PreComp(), 'getCookie err ***', error.message);
//             }
//           }, delay);
//         }
//         else {
//           setTimeout(() => {
//             //this.setValueInternal(this.#currentValue, true); // força o reRender para dar refresh no isLoading
//             //console.log('obtendo cookie', this.#cookieName);
//             const cookieData = Cookies.getJSON(this.#cookieName);
//             console.log('cookie data', this.#cookieName, cookieData);
//             //let newValue = this.#currentValue;
//             if (cookieData != null)
//               this.setValueInternal(cookieData.value, true, false);
//             else
//               SetClientCookie(this.#cookieName, this.#currentValue); // mesmo se o valor for o mesmo força o expiration renew
//           }, delay); // com 30ms está ocorrendo do valor inicial em useGlobal ser alterado antes da subscrição (ficaria desatualizado se não for checado novamente) !
//         }
//       }
//     }
//   }

//   //#region methods
//   setValue(newState) {
//     this.setValueInternal(newState, false, null);
//     if (this.#cookieName != null) {
//       if (this.#methodRetention === MethodRetention.httpSecureCookie) {
//         //console.log('chamando api para set value');
//         CallApi(this.#api,
//           { cookieName: this.#cookieName, cmd: GlobalStateCmd.set, value: newState })
//           //{ callId: this.callId() }
//           //.then(data => console.log(`ok para cookie set`, data))
//           .catch(error => SystemErrorCli('useGlobalState-setValue', error.message))
//       }
//       else if (this.#methodRetention === MethodRetention.custom) { } // deve ser feito pela rotina específica!
//       else if (this.#methodRetention === MethodRetention.clientCookie) {
//         if (newState !== null)
//           //&& newState !== this.#defaultValue)
//           SetClientCookie(this.#cookieName, newState);
//         else
//           Cookies.remove(this.#cookieName);
//       }
//     }
//   }

//   setValueInternal(newState, originValueFromCookie: boolean, isLoadingSet: boolean | null) { // usada para inicialização via cookie, sem setar novamente o cookie
//     // This is a method for updating a global state
//     //console.log(this.#cookieName, 'set', { newState, originValueFromCookie });

//     const newValue = this.getValue() !== newState;
//     //console.log(`setValueInternal ${this.#cookieName} (#${this.#subscribers.length})`, newState);
//     if (newValue || isLoadingSet != null) {
//       //console.log('newValueSet');
//       this.#currentValue = newState;
//       this.#originValueFromCookie = originValueFromCookie;
//       // Update global state value
//       if (isLoadingSet != null)
//         this.#isLoading = isLoadingSet;
//       this.#subscribers.forEach(subscriber => {
//         // Notify subscribers that the global state has changed
//         subscriber(newValue);
//       });
//     }
//   }

//   getValue() {
//     //console.log(this.#cookieName, 'get', this.#currentValue);
//     // Get the actual value of a global state
//     //console.log('getting value from object');
//     return this.#currentValue;
//   }
//   isOriginValueFromCookie() {
//     return this.#originValueFromCookie;
//   }
//   isLoading() {
//     return this.#isLoading;
//   }

//   subscribe(itemToSubscribe: (isNewValue: boolean) => void) {
//     if (this.#subscribers.indexOf(itemToSubscribe) > -1) {
//       // Already subscribed
//       return
//     }
//     //console.log('subscribing');
//     this.#subscribers.push(itemToSubscribe);
//   }

//   unsubscribe(itemToUnsubscribe: (isNewValue: boolean) => void) {
//     this.#subscribers = this.#subscribers.filter(
//       subscriber => subscriber !== itemToUnsubscribe
//     );
//   }
//   //#endregion methods
// }
