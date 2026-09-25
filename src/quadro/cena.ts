import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from 'three';

import { QUADRO, type PecaId } from './dominio';

/** Em metros */
export const ALTURA_DO_TAMPO: number = 0.9;
const ESPESSURA_DO_TAMPO: number = 0.04;

/** Largura x altura x espessura da placa de montagem */
const DIMENSOES_DA_PLACA: readonly [number, number, number] = [0.64, 0.44, 0.02];
/** Comprimento x altura x profundidade do trilho DIN */
const DIMENSOES_DO_TRILHO: readonly [number, number, number] = [0.56, 0.03, 0.015];
/** Largura x altura x profundidade de um disjuntor */
const DIMENSOES_DO_DISJUNTOR: readonly [number, number, number] = [0.045, 0.08, 0.05];

const COMPRIMENTO_DO_BARRAMENTO: number = 0.5;

export interface CenaDoQuadro {
  readonly raiz: Group;
  readonly tampo: Group;
  readonly placa: Group;
  readonly trilho: Object3D;
  readonly indicador: Mesh;
  readonly suporteDoPainel: Object3D;
  readonly pecas: ReadonlyMap<PecaId, Object3D>;
}

function material(cor: number, opcoes: Partial<MeshStandardMaterial> = {}): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: cor, roughness: 0.6, metalness: 0.15, ...opcoes });
}

const CORES_DO_DISJUNTOR: readonly number[] = [
  0x2b2f36, 0x35414f, 0x3a3a3a, 0x2e3b2e, 0x2e2e3b, 0x3b2e2e,
];

function alturaDaPeca(id: PecaId): number {
  if (id.startsWith('disjuntor-')) {
    return DIMENSOES_DO_DISJUNTOR[1];
  }
  if (id === 'barramento') {
    return 0.02;
  }
  return 0.025; // bornes
}

function formaDaPeca(id: PecaId): Mesh {
  if (id.startsWith('disjuntor-')) {
    const indice: number = Number(id.split('-')[1]) - 1;
    const [largura, altura, profundidade] = DIMENSOES_DO_DISJUNTOR;
    return new Mesh(
      new BoxGeometry(largura, altura, profundidade),
      material(CORES_DO_DISJUNTOR[indice % CORES_DO_DISJUNTOR.length] ?? 0x2b2f36),
    );
  }
  if (id === 'barramento') {
    return new Mesh(new BoxGeometry(COMPRIMENTO_DO_BARRAMENTO, 0.02, 0.03), material(0xb0842e));
  }
  // bornes
  return new Mesh(new BoxGeometry(0.02, 0.025, 0.03), material(0xc9cbd6));
}

function posicaoSoltaAleatoria(altura: number): { x: number; z: number; y: number; rotY: number } {
  const x: number = (Math.random() - 0.5) * 0.84; // dentro da largura útil do tampo
  const z: number = 0.02 + Math.random() * 0.24; // à frente da placa, sem sobrepor
  return {
    x,
    z,
    y: ESPESSURA_DO_TAMPO / 2 + altura / 2,
    rotY: Math.random() * Math.PI * 2,
  };
}

export function montarCena(): CenaDoQuadro {
  const raiz: Group = new Group();
  raiz.name = 'quadro';

  const cavalete: Mesh = new Mesh(
    new BoxGeometry(0.9, ALTURA_DO_TAMPO - ESPESSURA_DO_TAMPO, 0.5),
    material(0x3f3428, { roughness: 0.85, metalness: 0 }),
  );
  cavalete.name = 'cavalete';
  cavalete.position.y = (ALTURA_DO_TAMPO - ESPESSURA_DO_TAMPO) / 2;
  raiz.add(cavalete);

  const tampo: Group = new Group();
  tampo.name = 'tampo';
  tampo.position.y = ALTURA_DO_TAMPO;
  raiz.add(tampo);

  const superficie: Mesh = new Mesh(
    new BoxGeometry(1.0, ESPESSURA_DO_TAMPO, 0.6),
    material(0x5c4a35, { roughness: 0.85, metalness: 0 }),
  );
  superficie.name = 'superficie-do-tampo';
  tampo.add(superficie);

  const placa: Group = new Group();
  placa.name = 'placa-de-montagem';
  placa.position.set(0, ESPESSURA_DO_TAMPO / 2, -0.14);
  tampo.add(placa);

  const [larguraPlaca, alturaPlaca, espessuraPlaca] = DIMENSOES_DA_PLACA;
  const corpoDaPlaca: Mesh = new Mesh(
    new BoxGeometry(larguraPlaca, alturaPlaca, espessuraPlaca),
    material(0x8d99ae),
  );
  corpoDaPlaca.name = 'corpo-da-placa';
  corpoDaPlaca.position.y = alturaPlaca / 2;
  placa.add(corpoDaPlaca);

  const [comprimentoTrilho, alturaTrilho, profundidadeTrilho] = DIMENSOES_DO_TRILHO;
  const trilho: Mesh = new Mesh(
    new BoxGeometry(comprimentoTrilho, alturaTrilho, profundidadeTrilho),
    material(0xc9cbd6, { metalness: 0.6, roughness: 0.35 }),
  );
  trilho.name = 'trilho-din';
  trilho.position.set(0, alturaPlaca * 0.55, espessuraPlaca / 2 + profundidadeTrilho / 2);
  placa.add(trilho);

  const indicador: Mesh = new Mesh(
    new SphereGeometry(0.014, 16, 12),
    material(0x4a1414, { roughness: 0.4 }), // apagado: vermelho escuro
  );
  indicador.name = 'indicador-luminoso';
  indicador.position.set(larguraPlaca / 2 - 0.03, alturaPlaca - 0.03, espessuraPlaca / 2 + 0.005);
  placa.add(indicador);

  const suporteDoPainel: Object3D = new Object3D();
  suporteDoPainel.name = 'suporte-do-painel';
  suporteDoPainel.position.set(-0.55, 0.16, -0.27);
  tampo.add(suporteDoPainel);

  const pecas: Map<PecaId, Object3D> = new Map<PecaId, Object3D>();
  for (const peca of QUADRO.pecas) {
    const no: Mesh = formaDaPeca(peca.id);
    no.name = peca.id;
    const { x, z, y, rotY } = posicaoSoltaAleatoria(alturaDaPeca(peca.id));
    no.position.set(x, y, z);
    no.rotation.y = rotY;
    tampo.add(no);
    pecas.set(peca.id, no);
  }

  return { raiz, tampo, placa, trilho, indicador, suporteDoPainel, pecas };
}
