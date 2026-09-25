import { Matrix4, Object3D, Vector3 } from 'three';

/**
 * Devolve o desvio residual em metros
 */
export function reparentar(filho: Object3D, novoPai: Object3D): number {
  filho.updateWorldMatrix(true, false);
  novoPai.updateWorldMatrix(true, false);
  const posicaoAntes: Vector3 = new Vector3().setFromMatrixPosition(filho.matrixWorld);

  const matrizLocal: Matrix4 = new Matrix4()
    .copy(novoPai.matrixWorld)
    .invert()
    .multiply(filho.matrixWorld);

  novoPai.add(filho);
  matrizLocal.decompose(filho.position, filho.quaternion, filho.scale);

  filho.updateWorldMatrix(true, false);
  const posicaoDepois: Vector3 = new Vector3().setFromMatrixPosition(filho.matrixWorld);

  return posicaoAntes.distanceTo(posicaoDepois);
}

export function descreverArvore(raiz: Object3D, profundidadeMaxima: number = 4): string[] {
  const linhas: string[] = [];

  function percorrer(no: Object3D, nivel: number): void {
    if (nivel > profundidadeMaxima) {
      return;
    }
    const nome: string = no.name === '' ? `<sem nome: ${no.type}>` : no.name;
    linhas.push(`${'  '.repeat(nivel)}${nome}`);
    for (const filho of no.children) {
      percorrer(filho, nivel + 1);
    }
  }

  percorrer(raiz, 0);
  return linhas;
}
