export class CalcExecTime {
  #timeIni: number;
  #lastLap: number;
  constructor() {
    this.#timeIni = Date.now();
    this.#lastLap = this.#timeIni;
  }
  elapsedMs() {
    return Date.now() - this.#timeIni;
  }
  lapMs() {
    const agora = Date.now();
    const lap = agora - this.#lastLap;
    this.#lastLap = agora;
    return lap;
  }
}