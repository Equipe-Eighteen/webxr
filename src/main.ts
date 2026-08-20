import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRScene } from './scene';
import { setupControllers } from './controllers';
import { setupARHitTest } from './ar';
import { sondarPagina, sondarSessao } from './xr/sonda';
import { PainelDeSonda } from './xr/relatorio';

// --- Renderer ---
const container = document.getElementById('app') as HTMLDivElement;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // habilita o loop WebXR
container.appendChild(renderer.domElement);

// --- Cena ---
const xr = new XRScene();

// Órbita com o mouse no desktop (fora do modo imersivo)
const orbit = new OrbitControls(xr.camera, renderer.domElement);
orbit.target.set(0, 1.2, -1);
orbit.update();

// --- Controllers XR ---
const controllers = setupControllers(renderer, xr.scene, xr.interactive);

// --- AR hit-test ---
const arHitTest = setupARHitTest(renderer, xr.scene);

// --- Botões VR e AR ---
// 'viewer' entra na lista mesmo sendo sempre concedido: alguns navegadores só
// listam em `enabledFeatures` o que foi pedido explicitamente, e a sonda
// (src/xr/sonda.ts) depende de enxergar 'viewer' isolado para inferir três
// graus de liberdade em vez de reportar indeterminado por falta de dado.
// VRButton e ARButton do Three.js usam o mesmo estilo inline fixo
// (position: absolute; bottom: 20px; left: calc(50% - 50px)), então os dois
// botões nascem empilhados exatamente no mesmo lugar. Empurramos o de VR
// para cima do de AR para os dois ficarem visíveis e clicáveis.
const vrButton = VRButton.createButton(renderer, { optionalFeatures: ['viewer'] });
vrButton.style.bottom = '84px';
document.body.appendChild(vrButton);

document.body.appendChild(
  ARButton.createButton(renderer, {
    // Nada em requiredFeatures: uma feature exigida que o aparelho não tem
    // desabilita o botão inteiro, e o aluno vê um botão morto sem saber por quê.
    // Como opcional, a sessão sobe e a ausência fica observável.
    requiredFeatures: [],
    optionalFeatures: ['hit-test', 'local-floor', 'bounded-floor', 'dom-overlay', 'viewer'],
    domOverlay: { root: document.body },
  }),
);

// --- Sonda de capacidades (Tarefa 1) e relatório visível (Tarefa 2) ---
const painelDaSonda = new PainelDeSonda();

// Etapa 1: o que a página descobre sozinha, sem sessão nenhuma.
sondarPagina().then((leitura) => painelDaSonda.mostrarLeituraDePagina(leitura));

// Etapa 2: só a sessão aberta responde. `renderer.xr` é notificado tanto pelo
// clique em ENTER VR quanto em START AR, então um único par de escutas cobre
// os dois botões.
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

// --- Loop de animação (use setAnimationLoop, NÃO requestAnimationFrame) ---
const clock = new THREE.Clock();

renderer.setAnimationLoop((_timestamp, frame) => {
  const delta = clock.getDelta();
  xr.update(delta);
  controllers.update();
  if (frame) arHitTest.update(frame);
  renderer.render(xr.scene, xr.camera);
});

// --- Responsividade ---
window.addEventListener('resize', () => {
  xr.camera.aspect = window.innerWidth / window.innerHeight;
  xr.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});