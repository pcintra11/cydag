import { CalcExecTime } from './calcExectime';
import { colorsMsg, csd, dbg } from './dbg';
import { StrToNumber } from './util';

export class CtrlContext {
  context?: string;
  calcExecTime: CalcExecTime;
  lastElapsed: number;
  ctrlLog?: string;  // para teste nos locais de dbg()
  colorContext?: number;
  callSeq?: string;
  constructor(context: string, { ctrlLog, colorContext, callSeq }: { ctrlLog?: string, colorContext?: number, callSeq?: string } = {}) {
    this.context = context;
    this.calcExecTime = new CalcExecTime();
    this.lastElapsed = 0;
    this.ctrlLog = ctrlLog;
    this.colorContext = colorContext;
    this.callSeq = callSeq;
  }
  // suffix(suffix: string) {
  //   return new CtrlContext(`${this.context}-${suffix}`);
  // }
  checkElapsed(point: string, showAlways = false) {
    const elapsedTot = this.calcExecTime.elapsedMs();
    const gap = elapsedTot - this.lastElapsed;
    if (showAlways || gap > 1500) {
      if (gap > 1500) dbg({ level: 0, ctrlContext: this, point, colorMsg: colorsMsg.elapsedAlert }, `elapsedAlert tot ${elapsedTot}ms, gap ${gap}ms ${gap > 1500 ? '- **********' : ''}`);
      else dbg({ level: 1, ctrlContext: this, point, colorMsg: colorsMsg.elapsedWarn }, `elapsedWarn tot ${elapsedTot}ms, gap ${gap}ms ${gap > 1500 ? '- **********' : ''}`);
    }
    this.lastElapsed = elapsedTot;
  }
  static ProcCtrlLogStr(ctrlLog: string) {
    let ctrlLogLevel = 0; let ctrlLogScopes = '';
    const comps = ctrlLog.split(' ');
    if (comps.length > 0) {
      try {
        ctrlLogLevel = StrToNumber(comps[0]);
      }
      catch (error) { }
      ctrlLogScopes = comps.filter((x, index) => index > 0 && x.trim() != '').join(' ');
    }
    return { ctrlLogLevel, ctrlLogScopes };
  }
  static CtrlLogJoinScopes(scope1: string, scope2: string) {
    const comps = `${scope1} ${scope2}`.split(' ');
    const uniqScopes = new Set();
    comps.filter((x) => x.trim() != '').forEach((x) => uniqScopes.add(x));
    return Array.from(uniqScopes).join(' ');
  }
}
