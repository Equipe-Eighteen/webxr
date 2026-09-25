import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRScene } from './scene';
import { setupControllers } from './controllers';
import { setupARHitTest } from './ar';
import { sondarPagina, sondarSessao } from './xr/sonda';
import { PainelDeSonda } from './xr/relatorio';
import { Relogio, type Amostra } from './quadro/relogio';
import { Orcamento, TETO_DESKTOP_MS, linhasDoOrcamento } from './quadro/orcamento';
import { montarPainel, type Painel } from './quadro/painel';
import { reparentar } from './quadro/hierarquia';

const container = document.getElementById('app') as HTMLDivElement;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
container.appendChild(renderer.domElement);

const xr = new XRScene();

const orbit = new OrbitControls(xr.camera, renderer.domElement);
orbit.target.set(0, 1.2, -1);
orbit.update();

const relogio = new Relogio();
const orcamento = new Orcamento(TETO_DESKTOP_MS);
const painel: Painel = montarPainel('Custo do quadro');
xr.quadro.suporteDoPainel.add(painel.no);

const botaoReparentar: HTMLButtonElement = document.createElement('button');
botaoReparentar.type = 'button';
botaoReparentar.textContent = 'Fixar disjuntor 1 no trilho (demonstração)';
botaoReparentar.style.cssText =
  'position:fixed;top:56px;left:12px;z-index:10;font:16px system-ui,sans-serif;' +
  'padding:10px 16px;border-radius:8px;border:1px solid #4f7cff;background:#24243a;color:#eef0ff;cursor:pointer;';
document.body.appendChild(botaoReparentar);

botaoReparentar.addEventListener('click', () => {
  const disjuntor1 = xr.quadro.pecas.get('disjuntor-1');
  if (!disjuntor1) return;
  const desvioEmMetros: number = reparentar(disjuntor1, xr.quadro.trilho);
  botaoReparentar.textContent = `Disjuntor 1 preso ao trilho (desvio de ${desvioEmMetros.toExponential(1)} m)`;
  botaoReparentar.disabled = true;
});

const posicaoOriginalDaPlaca = xr.quadro.placa.position.clone();
const posicaoDeslocadaDaPlaca = posicaoOriginalDaPlaca.clone().add(new THREE.Vector3(0.2, 0, 0));
let placaDeslocada = false;

const botaoMoverPlaca: HTMLButtonElement = document.createElement('button');
botaoMoverPlaca.type = 'button';
botaoMoverPlaca.textContent = 'Mover a placa (demonstração)';
botaoMoverPlaca.style.cssText =
  'position:fixed;top:104px;left:12px;z-index:10;font:16px system-ui,sans-serif;' +
  'padding:10px 16px;border-radius:8px;border:1px solid #4f7cff;background:#24243a;color:#eef0ff;cursor:pointer;';
document.body.appendChild(botaoMoverPlaca);

botaoMoverPlaca.addEventListener('click', () => {
  placaDeslocada = !placaDeslocada;
  xr.quadro.placa.position.copy(placaDeslocada ? posicaoDeslocadaDaPlaca : posicaoOriginalDaPlaca);
  botaoMoverPlaca.textContent = placaDeslocada
    ? 'Devolver a placa ao lugar (demonstração)'
    : 'Mover a placa (demonstração)';
});

const controllers = setupControllers(renderer, xr.scene, xr.interactive);
const arHitTest = setupARHitTest(renderer, xr.scene);

const vrButton = VRButton.createButton(renderer, { optionalFeatures: ['viewer'] });
vrButton.style.bottom = '84px';
document.body.appendChild(vrButton);

document.body.appendChild(
  ARButton.createButton(renderer, {
    requiredFeatures: [],
    optionalFeatures: ['hit-test', 'local-floor', 'bounded-floor', 'dom-overlay', 'viewer'],
    domOverlay: { root: document.body },
  }),
);

const painelDaSonda = new PainelDeSonda();

sondarPagina().then((leitura) => painelDaSonda.mostrarLeituraDePagina(leitura));

renderer.xr.addEventListener('sessionstart', () => {
  const session = renderer.xr.getSession();
  if (!session) return;

  const atualizar = (): void => painelDaSonda.mostrarLeituraDeSessao(sondarSessao(session));
  atualizar();
  session.addEventListener('inputsourceschange', atualizar);
});

renderer.xr.addEventListener('sessionend', () => {
  painelDaSonda.marcarSessaoEncerrada();
});

renderer.setAnimationLoop((timestampMs, frame) => {
  const inicio: number = performance.now();

  const amostra: Amostra = relogio.avancar(timestampMs);
  controllers.update();
  if (frame) arHitTest.update(frame);

  renderer.render(xr.scene, xr.camera);

  const custoMs: number = performance.now() - inicio;
  orcamento.registrar(custoMs, amostra.intervaloReal * 1000);
  painel.atualizar(linhasDoOrcamento(orcamento.ler()), amostra.decorrido);
});

window.addEventListener('resize', () => {
  xr.camera.aspect = window.innerWidth / window.innerHeight;
  xr.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});