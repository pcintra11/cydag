import { DateDisp } from './util';

interface ICallCtrl { hr: string, info: string }
export class CtrlRecursion {
  #moduleFunc: string;
  #maxPending: number;
  #qtdPendingAlert: number;
  #pendingCallsArray: ICallCtrl[];
  #ciclosCompletos: number;
  constructor(moduleFunc: string, maxPending = 5, qtdPendingAlert = 1) {
    //csl('******** CtrlRecursion constructor', context);
    this.#maxPending = maxPending;
    this.#qtdPendingAlert = qtdPendingAlert;
    this.#moduleFunc = moduleFunc;
    this.#pendingCallsArray = [];
    this.#ciclosCompletos = 0;
  }
  // inExceeded(info?: string) {
  //   //csl('CtrlRecursion', this.#context, 'pending calls', this.#pendingCalls);
  //   this.#pendingCalls++;
  //   if (this.#pendingCalls > this.#qtdPendingAlert)
  //     console.warn(`CtrlRecursion '${this.#moduleFunc}' - this call: ${this.#pendingCalls} (${info})`);
  //   if (this.#pendingCalls > this.#maxPending) {
  //     console.error(`CtrlRecursion '${this.#moduleFunc}' - max pending calls allowed: ${this.#maxPending} ; this call: ${this.#pendingCalls} (${info}) : aborted`);
  //     return true;
  //   }
  //   return false;
  // }
  in(info?: string) {
    if (this.#pendingCallsArray.length > this.#qtdPendingAlert) {
      // eslint-disable-next-line no-console
      console.log(`CtrlRecursion alert '${this.#moduleFunc}' - this call: ${this.#pendingCallsArray.length} (${info})`);
    }
    if (this.#pendingCallsArray.length > this.#maxPending) {
      // eslint-disable-next-line no-console
      console.log(`CtrlRecursion error '${this.#moduleFunc}' - max pending calls allowed: ${this.#maxPending} ; this call: ${this.#pendingCallsArray.length} (${info}) : aborted`);
      return null;
    }
    const callCtrl: ICallCtrl = { hr: DateDisp(new Date(), 'hmsSSSS'), info };
    this.#pendingCallsArray.push(callCtrl);
    //csd(`in ${callCtrl.info}`, JSON.stringify({ pendingCallsArray: this.#pendingCallsArray }));
    return callCtrl;
  }
  // out() {
  //   this.#pendingCalls--;
  //   if (this.#pendingCalls < 0)
  //     // eslint-disable-next-line no-console
  //     console.log(`CtrlRecursion '${this.#moduleFunc}': #out exceeded #in`);
  //   else {
  //     this.#ciclosCompletos++;
  //     //csl(`CtrlRecursion ${this.#context}: completou o ciclo ${this.#ciclos}`);
  //   }
  // }
  out(callCtrl: ICallCtrl) {
    const indexCtrl = this.#pendingCallsArray.findIndex((x) => x === callCtrl);
    if (indexCtrl === -1)
      // eslint-disable-next-line no-console
      console.log(`CtrlRecursion error '${this.#moduleFunc}': #out para ctrl inexistente (${callCtrl.info})`);
    else {
      this.#pendingCallsArray.splice(indexCtrl, 1);
      this.#ciclosCompletos++;
    }
    //csd(`out ${callCtrl.info}`, JSON.stringify({ ciclosCompletos: this.#ciclosCompletos, pendingCallsArray: this.#pendingCallsArray }));
  }
  status() {
    return `pending: ${this.#pendingCallsArray.length}; ciclos completos: ${this.#ciclosCompletos}`;
  }
}
