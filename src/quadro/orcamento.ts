/** Teto do desktop em milissegundos (60fps) */
export const TETO_DESKTOP_MS: number = 16.7;

/** Teto do visor em milissegundos (90fps) */
export const TETO_VISOR_MS: number = 11.1;

export interface LeituraDoOrcamento {
  readonly tetoMs: number;
  readonly quadrosMedidos: number;
  readonly custoMedioMs: number;
  readonly intervaloMedioMs: number;
  readonly piorIntervaloMs: number;
  readonly quadrosAcimaDoTeto: number;
}

/** Janela de observação em quadros */
const JANELA_PADRAO: number = 120;

export class Orcamento {
  private readonly tetoMs: number;
  private readonly custos: Float64Array;
  private readonly intervalos: Float64Array;
  private proximo: number = 0;
  private preenchidos: number = 0;

  constructor(tetoMs: number, janela: number = JANELA_PADRAO) {
    this.tetoMs = tetoMs;
    this.custos = new Float64Array(janela);
    this.intervalos = new Float64Array(janela);
  }

  registrar(custoMs: number, intervaloMs: number): void {
    this.custos[this.proximo] = custoMs;
    this.intervalos[this.proximo] = intervaloMs;
    this.proximo = (this.proximo + 1) % this.custos.length;
    if (this.preenchidos < this.custos.length) {
      this.preenchidos += 1;
    }
  }

  ler(): LeituraDoOrcamento {
    if (this.preenchidos === 0) {
      return {
        tetoMs: this.tetoMs,
        quadrosMedidos: 0,
        custoMedioMs: 0,
        intervaloMedioMs: 0,
        piorIntervaloMs: 0,
        quadrosAcimaDoTeto: 0,
      };
    }

    let somaDeCustos: number = 0;
    let somaDeIntervalos: number = 0;
    let pior: number = 0;
    let acima: number = 0;

    for (let i: number = 0; i < this.preenchidos; i += 1) {
      const custo: number = this.custos[i] ?? 0;
      const intervalo: number = this.intervalos[i] ?? 0;
      somaDeCustos += custo;
      somaDeIntervalos += intervalo;
      if (intervalo > pior) {
        pior = intervalo;
      }
      if (intervalo > this.tetoMs) {
        acima += 1;
      }
    }

    return {
      tetoMs: this.tetoMs,
      quadrosMedidos: this.preenchidos,
      custoMedioMs: somaDeCustos / this.preenchidos,
      intervaloMedioMs: somaDeIntervalos / this.preenchidos,
      piorIntervaloMs: pior,
      quadrosAcimaDoTeto: acima,
    };
  }
}

export function linhasDoOrcamento(leitura: LeituraDoOrcamento): string[] {
  if (leitura.quadrosMedidos === 0) {
    return ['Orçamento: ainda sem quadros medidos.'];
  }
  const proporcaoAcima: number = (leitura.quadrosAcimaDoTeto / leitura.quadrosMedidos) * 100;
  return [
    `Teto do quadro: ${leitura.tetoMs.toFixed(1)} ms`,
    `Intervalo médio: ${leitura.intervaloMedioMs.toFixed(1)} ms · pior: ${leitura.piorIntervaloMs.toFixed(1)} ms`,
    `Custo do nosso trabalho: ${leitura.custoMedioMs.toFixed(2)} ms`,
    `Acima do teto: ${proporcaoAcima.toFixed(0)}% dos ${leitura.quadrosMedidos} quadros observados`,
  ];
}
