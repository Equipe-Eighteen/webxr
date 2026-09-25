import { CanvasTexture, LinearFilter, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';

const LARGURA_M: number = 0.3;
const ALTURA_M: number = 0.18;

const LARGURA_PX: number = 600;
const ALTURA_PX: number = 360;

/** Em segundos. */
const INTERVALO_DE_REDESENHO: number = 0.25;

const CORPO_PX: number = 26;
const ENTRELINHA_PX: number = 36;
const MARGEM_PX: number = 22;

export interface Painel {
  readonly no: Mesh;
  atualizar(linhas: readonly string[], decorrido: number): void;
}

export function montarPainel(titulo: string): Painel {
  const tela: HTMLCanvasElement = document.createElement('canvas');
  tela.width = LARGURA_PX;
  tela.height = ALTURA_PX;

  const contexto: CanvasRenderingContext2D | null = tela.getContext('2d');
  if (contexto === null) {
    throw new Error('Este navegador não fornece contexto de desenho para o painel.');
  }
  const pincel: CanvasRenderingContext2D = contexto;

  const textura: CanvasTexture = new CanvasTexture(tela);
  textura.minFilter = LinearFilter;
  textura.generateMipmaps = false;

  const no: Mesh = new Mesh(
    new PlaneGeometry(LARGURA_M, ALTURA_M),
    new MeshBasicMaterial({ map: textura }),
  );
  no.name = 'painel-do-orcamento';

  let ultimoDesenho: number = Number.NEGATIVE_INFINITY;
  let ultimoTexto: string = '';

  function desenhar(linhas: readonly string[]): void {
    pincel.fillStyle = '#11131a';
    pincel.fillRect(0, 0, LARGURA_PX, ALTURA_PX);
    pincel.fillStyle = '#f2f4fa';
    pincel.font = `bold ${CORPO_PX + 4}px system-ui, sans-serif`;
    pincel.fillText(titulo, MARGEM_PX, 46);

    pincel.font = `${CORPO_PX}px system-ui, sans-serif`;
    let linhaY: number = 92;
    for (const linha of linhas) {
      if (linhaY > ALTURA_PX - MARGEM_PX) {
        break;
      }
      pincel.fillText(linha, MARGEM_PX, linhaY);
      linhaY += ENTRELINHA_PX;
    }
    textura.needsUpdate = true;
  }

  desenhar([]);

  function atualizar(linhas: readonly string[], decorrido: number): void {
    const texto: string = linhas.join('\n');
    if (decorrido - ultimoDesenho < INTERVALO_DE_REDESENHO || texto === ultimoTexto) {
      return;
    }
    ultimoDesenho = decorrido;
    ultimoTexto = texto;
    desenhar(linhas);
  }

  return { no, atualizar };
}
