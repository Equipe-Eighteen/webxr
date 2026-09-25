import {
  RECURSOS_CONSULTADOS,
  classificarAparelho,
  descreverClasse,
  estadoDoRecurso,
  grausDeLiberdade,
  type EstadoDeRecurso,
  type FonteDeEntrada,
  type GrausDeLiberdade,
  type LeituraDePagina,
  type LeituraDeSessao,
} from './sonda';

const RESUMO_DO_MODO: Record<'immersive-vr' | 'immersive-ar' | 'inline', string> = {
  'immersive-vr': 'imersivo (VR)',
  'immersive-ar': 'aumentado (AR)',
  inline: 'janela (inline)',
};

const RESUMO_DO_ESTADO: Record<EstadoDeRecurso, string> = {
  concedido: 'concedido',
  negado: 'negado',
  indeterminado: 'indeterminado',
};

const RESUMO_DOS_GRAUS: Record<GrausDeLiberdade, string> = {
  tres: 'três — só rotação da cabeça é acompanhada',
  seis: 'seis — rotação e deslocamento são acompanhados',
  indeterminado: 'indeterminado — a sessão não declarou o suficiente para saber',
};

function escapar(texto: string): string {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function linhaModo(nome: 'immersive-vr' | 'immersive-ar' | 'inline', suportado: boolean | null): string {
  const valor = suportado === null ? 'não consultado' : suportado ? 'sim' : 'não';
  const classe = suportado === null ? 'indet' : suportado ? 'ok' : 'no';
  return `<li><span class="rotulo">${RESUMO_DO_MODO[nome]}</span><span class="valor ${classe}">${valor}</span></li>`;
}

function linhaFonteDeEntrada(fonte: FonteDeEntrada, indice: number): string {
  const mao = fonte.mao === 'none' ? 'sem lateralidade' : fonte.mao === 'left' ? 'esquerda' : 'direita';
  const mira =
    fonte.modoDeMira === 'tracked-pointer'
      ? 'raio rastreado'
      : fonte.modoDeMira === 'screen'
        ? 'toque na tela'
        : fonte.modoDeMira === 'transient-pointer'
          ? 'apontador transitório'
          : 'olhar (gaze)';
  const perfis = fonte.perfis.length > 0 ? escapar(fonte.perfis.join(', ')) : 'nenhum declarado';
  return (
    `<li><span class="rotulo">#${indice} · ${mao}</span>` +
    `<span class="valor">${mira}${fonte.temMaoRastreada ? ' · mão rastreada' : ''}</span>` +
    `<div class="detalhe">perfis: ${perfis}</div></li>`
  );
}

export class PainelDeSonda {
  private readonly raiz: HTMLElement;
  private readonly conteudo: HTMLElement;
  private ultimaPagina: LeituraDePagina | null = null;
  private ultimaSessao: LeituraDeSessao | null = null;
  private sessaoEncerrada = false;

  constructor() {
    this.raiz = document.createElement('div');
    this.raiz.id = 'sonda-painel';
    this.raiz.innerHTML = `
      <button id="sonda-alternar" type="button" aria-expanded="true">Sonda ▾</button>
      <div id="sonda-conteudo" role="status" aria-live="polite">Consultando o aparelho…</div>
    `;
    document.body.appendChild(this.raiz);

    this.conteudo = this.raiz.querySelector('#sonda-conteudo') as HTMLElement;
    const botao = this.raiz.querySelector('#sonda-alternar') as HTMLButtonElement;
    botao.addEventListener('click', () => {
      const recolhido = this.raiz.classList.toggle('recolhido');
      botao.setAttribute('aria-expanded', String(!recolhido));
      botao.textContent = recolhido ? 'Sonda ▸' : 'Sonda ▾';
    });
  }

  mostrarLeituraDePagina(leitura: LeituraDePagina): void {
    this.ultimaPagina = leitura;
    this.renderizar();
  }
  
  mostrarLeituraDeSessao(leitura: LeituraDeSessao): void {
    this.ultimaSessao = leitura;
    this.sessaoEncerrada = false;
    this.renderizar();
  }

  marcarSessaoEncerrada(): void {
    this.sessaoEncerrada = true;
    this.renderizar();
  }

  private renderizar(): void {
    const pagina = this.ultimaPagina;
    if (!pagina) {
      this.conteudo.innerHTML = '<p>Consultando o aparelho…</p>';
      return;
    }

    const sessao = this.ultimaSessao;
    const graus: GrausDeLiberdade | null = sessao ? grausDeLiberdade(sessao.concedidos) : null;
    const classe = classificarAparelho(pagina, graus);

    const linhaTopo =
      `<p class="linha-topo">` +
      `Contexto seguro: <strong class="${pagina.contextoSeguro ? 'ok' : 'no'}">${pagina.contextoSeguro ? 'sim' : 'não'}</strong>` +
      ` · API XR: <strong class="${pagina.temApiXr ? 'ok' : 'no'}">${pagina.temApiXr ? 'presente' : 'ausente'}</strong>` +
      `</p>`;

    const blocoModos = pagina.modosSuportados
      ? `<ul class="lista">
          ${linhaModo('immersive-vr', pagina.modosSuportados['immersive-vr'])}
          ${linhaModo('immersive-ar', pagina.modosSuportados['immersive-ar'])}
          ${linhaModo('inline', pagina.modosSuportados.inline)}
        </ul>`
      : `<p class="aviso">Modos de sessão não consultados — falta API XR ou contexto seguro.</p>`;

    const blocoClasse = `<p class="classe"><strong>${escapar(descreverClasse(classe))}</strong></p>`;

    const blocoGraus =
      graus !== null
        ? `<p>Graus de liberdade: <strong>${RESUMO_DOS_GRAUS[graus]}</strong></p>`
        : `<p class="aviso">Graus de liberdade: só a sessão aberta responde a isso. Toque em ENTER VR ou START AR.</p>`;

    const blocoRecursos = sessao
      ? `<ul class="lista">
          ${RECURSOS_CONSULTADOS.map((recurso) => {
            const estado = estadoDoRecurso(recurso.nome, sessao.concedidos);
            return (
              `<li><span class="rotulo">${escapar(recurso.nome)}</span>` +
              `<span class="valor ${estado === 'concedido' ? 'ok' : estado === 'negado' ? 'no' : 'indet'}">${RESUMO_DO_ESTADO[estado]}</span>` +
              `<div class="detalhe">${escapar(recurso.paraQueServe)}</div></li>`
            );
          }).join('')}
        </ul>`
      : '';

    const blocoEntrada = sessao
      ? sessao.fontesDeEntrada.length > 0
        ? `<ul class="lista">${sessao.fontesDeEntrada.map((f, i) => linhaFonteDeEntrada(f, i)).join('')}</ul>`
        : '<p class="aviso">Nenhuma fonte de entrada declarada ainda.</p>'
      : '';

    const notaSessao = !sessao
      ? ''
      : this.sessaoEncerrada
        ? `<p class="aviso">Sessão encerrada — os dados acima são da última sessão aberta (regime ${sessao.regime}).</p>`
        : `<p class="ok-texto">Sessão aberta — regime ${sessao.regime}.</p>`;

    this.conteudo.innerHTML = `
      ${linhaTopo}
      <h2>Modos de sessão declarados</h2>
      ${blocoModos}
      <h2>Classe do aparelho</h2>
      ${blocoClasse}
      <h2>Rastreamento</h2>
      ${blocoGraus}
      ${notaSessao}
      ${sessao ? '<h2>Recursos opcionais</h2>' : ''}
      ${blocoRecursos}
      ${sessao ? '<h2>Fontes de entrada</h2>' : ''}
      ${blocoEntrada}
    `;
  }
}
