/** Identificador de uma peça manipulável do quadro. */
export type PecaId =
  | 'disjuntor-1'
  | 'disjuntor-2'
  | 'disjuntor-3'
  | 'disjuntor-4'
  | 'disjuntor-5'
  | 'disjuntor-6'
  | 'barramento'
  | 'borne-1'
  | 'borne-2'
  | 'borne-3'
  | 'borne-4';

export type FamiliaDePeca = 'disjuntor' | 'barramento' | 'borne';

export interface Peca {
  readonly id: PecaId;
  readonly nome: string;
  readonly familia: FamiliaDePeca;
}

export interface TarefaDoAmbiente {
  readonly enunciado: string;
  readonly estadoFinal: string;
}

export interface Dominio {
  readonly nome: string;
  readonly tarefa: TarefaDoAmbiente;
  readonly pecas: readonly Peca[];
}

function seisDisjuntores(): Peca[] {
  const pecas: Peca[] = [];
  for (let i = 1; i <= 6; i += 1) {
    pecas.push({ id: `disjuntor-${i}` as PecaId, nome: `Disjuntor ${i}`, familia: 'disjuntor' });
  }
  return pecas;
}

function quatroBornes(): Peca[] {
  const pecas: Peca[] = [];
  for (let i = 1; i <= 4; i += 1) {
    pecas.push({ id: `borne-${i}` as PecaId, nome: `Borne ${i}`, familia: 'borne' });
  }
  return pecas;
}

export const QUADRO: Dominio = {
  nome: 'Quadro elétrico em trilho',
  tarefa: {
    enunciado:
      'Encaixar os seis disjuntores no trilho DIN, na ordem e no ângulo corretos, e só ' +
      'depois encaixar o barramento por cima, conectando todos.',
    estadoFinal:
      'Os seis disjuntores travados no trilho, em qualquer ordem entre si mas todos antes ' +
      'do barramento; o barramento travado por cima; indicador aceso.',
  },
  pecas: [...seisDisjuntores(), { id: 'barramento', nome: 'Barramento', familia: 'barramento' }, ...quatroBornes()],
};
