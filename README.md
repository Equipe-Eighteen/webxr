# Quadro Elétrico em Trilho — Projeto WebXR (Equipe-Eighteen)

## O que é o ambiente

Uma cena WebXR em que a pessoa monta um quadro elétrico: encaixa seis
disjuntores num trilho DIN, na ordem e no ângulo corretos, e só então encaixa
o barramento por cima, conectando todos. O quadro é dado como pronto quando o
indicador acende. A especificação completa (cena, regras de encaixe,
tolerâncias, os três regimes e o plano de construção) está em
[`docs/especificacao.md`](docs/especificacao.md).

O ambiente declara os três regimes descritos na especificação (Seção 9):

- **Em tela** — câmera em órbita controlada pelo mouse, caso base, roda em
  qualquer máquina sem equipamento algum.
- **No visor (VR)** — sessão `immersive-vr`, escala real de mundo, cabeça e
  controles rastreados.
- **Pela câmera (AR)** — sessão `immersive-ar`, quadro ancorado sobre uma
  superfície real detectada por hit-test.

Construído com [Three.js](https://threejs.org/) e TypeScript, sobre Vite. Até
o fim do Módulo 03 a geometria é toda crua (formas primitivas por código);
nenhum objeto é importado ou texturizado ainda — isso é assunto dos módulos
seguintes.

## Como se põe para rodar

WebXR exige contexto seguro (HTTPS), inclusive na rede local — por isso o
`vite.config.ts` já sobe com um certificado autoassinado
(`@vitejs/plugin-basic-ssl`).

Com [devenv](https://devenv.sh)/direnv instalados, o ambiente de
desenvolvimento (Node 24 + TypeScript) entra sozinho ao entrar na pasta
(`.envrc` + `devenv.nix`). Sem devenv, basta ter Node 22+ instalado.

```bash
npm install
npm run dev
```

O terminal mostra dois endereços: um `https://localhost:5173` para testar no
próprio computador, e um `https://<ip-da-máquina>:5173` para abrir de outro
aparelho na mesma rede (celular, visor). Como o certificado é autoassinado,
o navegador do aparelho que acessa vai pedir para confirmar a exceção de
segurança na primeira vez.

Outros comandos:

```bash
npm run typecheck
npm run build
npm run preview
```

Ao abrir a página, a sonda de capacidades (`src/xr/sonda.ts`) consulta o
aparelho sozinha e mostra o relatório num painel no canto inferior direito da
tela (`src/xr/relatorio.ts`), inclusive dentro de uma sessão de AR, via
`dom-overlay`.

## Aparelhos testados

| Aparelho | Regime que abriu | O que não abriu |
|---|---|---|
| Celular (Chrome para Android) | Em tela; no visor (VR); pela câmera (AR) os três regimes abriram | — |
| Computador de desenvolvimento | Em tela | No visor (VR) e pela câmera (AR) máquina sem câmera usada como sensor de ambiente; `navigator.xr` relata as sessões imersivas como não suportadas |
