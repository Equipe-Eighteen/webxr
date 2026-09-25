export interface Amostra {
  /** Tempo desde o quadro anterior, já limitado pelo teto de salto */
  readonly delta: number;
  /** Tempo acumulado desde o primeiro quadro, somando os deltas limitados */
  readonly decorrido: number;
  /** Intervalo real medido, antes do limite */
  readonly intervaloReal: number;
}

/** Teto de salto em segundos */
const TETO_DE_SALTO_PADRAO: number = 0.1;

export class Relogio {
  private readonly tetoDeSalto: number;
  private ultimoInstanteMs: number | undefined = undefined;
  private decorrido: number = 0;

  constructor(tetoDeSalto: number = TETO_DE_SALTO_PADRAO) {
    this.tetoDeSalto = tetoDeSalto;
  }

  avancar(instanteMs: number): Amostra {
    const anterior: number | undefined = this.ultimoInstanteMs;
    this.ultimoInstanteMs = instanteMs;

    if (anterior === undefined) {
      return { delta: 0, decorrido: 0, intervaloReal: 0 };
    }

    const intervaloReal: number = (instanteMs - anterior) / 1000;
    const delta: number = Math.min(intervaloReal, this.tetoDeSalto);
    this.decorrido += delta;

    return { delta, decorrido: this.decorrido, intervaloReal };
  }
}
