// ---------------------------------------------------------------------------
// A sonda de capacidades.
//
// Este arquivo não desenha nada. Ele pergunta ao aparelho o que ele oferece e
// guarda a resposta numa estrutura que o resto do ambiente possa consultar.
// A pergunta acontece em duas etapas, porque a plataforma só responde a
// segunda depois de um gesto explícito de quem usa:
//
//   Etapa 1 — ao carregar a página, sem sessão nenhuma aberta: existe a
//   interface de programação? o contexto é seguro (HTTPS)? que modos de
//   sessão o aparelho DECLARA suportar?
//
//   Etapa 2 — só depois que uma sessão abre: que recursos opcionais a sessão
//   CONCEDEU de fato, que fontes de entrada ela declara, e o que a concessão
//   de espaços de referência permite inferir sobre graus de liberdade.
//
// A distinção entre "declarar suporte" (etapa 1) e "conceder recurso" (etapa
// 2) é o eixo do arquivo inteiro. Confundi-las é tratar uma pergunta ainda
// não feita como se já tivesse sido respondida com "não".
// ---------------------------------------------------------------------------

/**
 * O que se sabe sobre um recurso opcional depois de a sessão responder — ou
 * não responder — o que concedeu.
 *
 * - `concedido`: o nome está em `session.enabledFeatures`; o recurso pode ser
 *   usado.
 * - `negado`: a sessão declarou a lista de concessões e o nome não está nela.
 *   Houve resposta, e ela foi negativa.
 * - `indeterminado`: a sessão não declarou lista alguma. `enabledFeatures` é
 *   opcional na especificação — ausência de lista não é resposta negativa.
 *   Tratá-la como `negado` produz um relatório confiante e errado.
 */
export type EstadoDeRecurso = 'concedido' | 'negado' | 'indeterminado';

/** O que a concessão de espaços de referência permite inferir sobre o rastreamento de posição. */
export type GrausDeLiberdade = 'tres' | 'seis' | 'indeterminado';

/**
 * Classe do aparelho, deduzida do que ele declarou e concedeu — nunca do nome
 * ou da cadeia de identificação que o navegador expõe.
 */
export type ClasseDeAparelho =
  | 'sem-api'
  | 'somente-janela'
  | 'aparelho-de-mao-com-camera'
  | 'visor-nao-verificado'
  | 'visor-sem-posicao'
  | 'visor-com-posicao';

/** Um recurso opcional que a sonda consulta, com o motivo de estar no catálogo. */
export interface RecursoOpcional {
  /** O nome exato aceito por `optionalFeatures` — não traduzir. */
  readonly nome: string;
  /** O que ele habilita neste projeto, em uma frase. */
  readonly paraQueServe: string;
}

/**
 * O catálogo é curto de propósito: só entra o recurso de que alguma parte
 * deste projeto já depende (compare com `main.ts` e `ar.ts`). Pedir mais
 * alongaria a negociação de abertura da sessão sem responder pergunta
 * nenhuma que o projeto de fato faça — e algumas plataformas recusam a
 * sessão inteira por causa de um item exótico malformado.
 */
export const RECURSOS_CONSULTADOS: readonly RecursoOpcional[] = [
  {
    nome: 'local-floor',
    paraQueServe: 'origem no chão do espaço físico — altura em que os cubos flutuam',
  },
  {
    nome: 'bounded-floor',
    paraQueServe: 'origem no chão mais os limites da área livre conhecida',
  },
  {
    nome: 'hit-test',
    paraQueServe: 'lançar um raio contra superfícies reais para plantar objetos (ar.ts)',
  },
  {
    nome: 'dom-overlay',
    paraQueServe: 'mostrar esta própria sonda dentro da sessão de AR',
  },
] as const;

/** O que o aparelho declara suportar, sem sessão alguma aberta. */
export interface ModosSuportados {
  readonly 'immersive-vr': boolean;
  readonly 'immersive-ar': boolean;
  readonly inline: boolean;
}

/** Uma fonte de entrada declarada pela sessão. */
export interface FonteDeEntrada {
  readonly mao: XRHandedness;
  readonly modoDeMira: XRTargetRayMode;
  readonly temMaoRastreada: boolean;
  readonly perfis: readonly string[];
}

/** O que a etapa 1 descobre sozinha, ao carregar a página. */
export interface LeituraDePagina {
  readonly contextoSeguro: boolean;
  readonly temApiXr: boolean;
  /** `null` quando a pergunta nem chegou a ser feita (sem API ou fora de contexto seguro). */
  readonly modosSuportados: ModosSuportados | null;
}

/** O que a etapa 2 descobre — e só ela descobre, porque exige sessão aberta. */
export interface LeituraDeSessao {
  /**
   * Inferido do modo de mescla com o ambiente, e não guardado à parte: uma
   * sessão opaca substitui a visão inteira (regime imersivo); uma sessão que
   * mescla aditivamente ou por transparência compõe sobre o mundo real
   * (regime aumentado). É a mesma pergunta de suporte, respondida agora pela
   * sessão em vez de suposta pelo botão que a abriu.
   */
  readonly regime: 'imersivo' | 'aumentado';
  /** `session.enabledFeatures`. `undefined` = a sessão não declarou lista alguma. */
  readonly concedidos: readonly string[] | undefined;
  readonly fontesDeEntrada: readonly FonteDeEntrada[];
}

/** Etapa 1: pergunta ao aparelho o que ele declara suportar, sem abrir sessão. */
export async function sondarPagina(): Promise<LeituraDePagina> {
  const contextoSeguro = window.isSecureContext;
  const xr = contextoSeguro ? navigator.xr : undefined;

  if (!xr) {
    // Ou o navegador não implementa a API, ou a página está fora de conexão
    // cifrada. Do lado de dentro do código as duas situações são
    // indistinguíveis, e não finjo que são: `modosSuportados` fica `null`,
    // não `{ 'immersive-vr': false, ... }`. A pergunta nunca chegou a ser feita.
    return { contextoSeguro, temApiXr: false, modosSuportados: null };
  }

  const [vr, ar, inline] = await Promise.all([
    xr.isSessionSupported('immersive-vr'),
    xr.isSessionSupported('immersive-ar'),
    xr.isSessionSupported('inline'),
  ]);

  return {
    contextoSeguro,
    temApiXr: true,
    modosSuportados: { 'immersive-vr': vr, 'immersive-ar': ar, inline },
  };
}

/** Etapa 2: lê o que uma sessão já aberta concedeu de fato. */
export function sondarSessao(session: XRSession): LeituraDeSessao {
  const fontesDeEntrada: FonteDeEntrada[] = [];
  for (const fonte of session.inputSources) {
    fontesDeEntrada.push({
      mao: fonte.handedness,
      modoDeMira: fonte.targetRayMode,
      temMaoRastreada: fonte.hand !== undefined,
      perfis: fonte.profiles,
    });
  }

  return {
    regime: session.environmentBlendMode === 'opaque' ? 'imersivo' : 'aumentado',
    concedidos: session.enabledFeatures,
    fontesDeEntrada,
  };
}

/**
 * Classifica um recurso do catálogo contra a lista que a sessão declarou.
 * Ver o tipo `EstadoDeRecurso` para o porquê dos três estados.
 */
export function estadoDoRecurso(
  nome: string,
  concedidos: readonly string[] | undefined,
): EstadoDeRecurso {
  if (concedidos === undefined) {
    return 'indeterminado';
  }
  return concedidos.includes(nome) ? 'concedido' : 'negado';
}

/**
 * Regra da inferência, conservadora de propósito:
 *
 * - `local-floor`, `bounded-floor` ou `unbounded` concedidos exigem que o
 *   aparelho saiba onde está o chão em relação a quem observa. Um visor que
 *   só gira não sustenta essa promessa, então a concessão é evidência forte
 *   de posição rastreada.
 * - Nenhum desses três concedidos, mas a sessão abriu: evidência de que o
 *   aparelho não afirma mais que rotação.
 * - `enabledFeatures` indefinido: a sessão não disse nada, e apostar no mais
 *   provável é exatamente o que este arquivo se recusa a fazer.
 */
export function grausDeLiberdade(concedidos: readonly string[] | undefined): GrausDeLiberdade {
  if (concedidos === undefined) {
    return 'indeterminado';
  }
  const temChao =
    concedidos.includes('local-floor') ||
    concedidos.includes('bounded-floor') ||
    concedidos.includes('unbounded');
  return temChao ? 'seis' : 'tres';
}

/**
 * Classifica o aparelho pela combinação de modos declarados e, quando uma
 * sessão já abriu, dos graus inferidos. Nunca lê nome de aparelho.
 */
export function classificarAparelho(
  leitura: LeituraDePagina,
  graus: GrausDeLiberdade | null,
): ClasseDeAparelho {
  if (!leitura.temApiXr || leitura.modosSuportados === null) {
    return 'sem-api';
  }

  const { modosSuportados } = leitura;
  const suportaVr = modosSuportados['immersive-vr'];
  const suportaAr = modosSuportados['immersive-ar'];

  if (!suportaVr && !suportaAr) {
    return 'somente-janela';
  }

  // Aparelho que faz realidade aumentada e não faz sessão imersiva completa
  // é o celular: a câmera vê o mundo, mas ninguém veste a tela no rosto.
  if (suportaAr && !suportaVr) {
    return 'aparelho-de-mao-com-camera';
  }

  // `graus` é `null` enquanto nenhuma sessão abriu, e `'indeterminado'` quando
  // a sessão abriu mas não declarou lista de concessões. Nos dois casos, o
  // relatório honesto é "ainda não sei", não uma aposta em seis graus.
  if (graus === 'seis') {
    return 'visor-com-posicao';
  }
  if (graus === 'tres') {
    return 'visor-sem-posicao';
  }
  return 'visor-nao-verificado';
}

/** Frase curta e legível para cada classe, usada no relatório. */
export function descreverClasse(classe: ClasseDeAparelho): string {
  switch (classe) {
    case 'sem-api':
      return 'Navegador sem a API XR, ou página fora de contexto seguro.';
    case 'somente-janela':
      return 'Aparelho que só sustenta o regime de janela — o caso do computador de mesa.';
    case 'aparelho-de-mao-com-camera':
      return 'Aparelho de mão que compõe o virtual sobre a imagem da própria câmera.';
    case 'visor-nao-verificado':
      return 'Aparelho que declara suportar sessão imersiva de VR. Os graus de liberdade só são conhecidos depois de uma sessão abrir.';
    case 'visor-sem-posicao':
      return 'Visor que acompanha a rotação da cabeça e não acompanha o deslocamento.';
    case 'visor-com-posicao':
      return 'Visor que acompanha rotação e deslocamento, com o chão do ambiente como referência.';
  }
}
