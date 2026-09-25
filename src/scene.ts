import * as THREE from 'three';
import { montarCena, type CenaDoQuadro } from './quadro/cena';

export class XRScene {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly interactive: THREE.Object3D[] = [];
  readonly quadro: CenaDoQuadro;

  constructor() {
    this.scene.background = new THREE.Color(0x101015);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      100,
    );
    this.camera.position.set(0, 1.6, 0.9);

    this.addLights();
    this.addFloor();

    this.quadro = montarCena();
    this.quadro.raiz.position.set(0, 0, -1);
    this.scene.add(this.quadro.raiz);

    this.interactive.push(...this.quadro.pecas.values());
  }

  private addLights(): void {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444455, 1.0);
    hemi.position.set(0, 1, 0);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(1, 3, 2);
    this.scene.add(dir);
  }

  private addFloor(): void {
    const grid = new THREE.GridHelper(10, 20, 0x4f7cff, 0x2a2a35);
    this.scene.add(grid);
  }
}
