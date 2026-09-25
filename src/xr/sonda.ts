export type EstadoDeRecurso = 'concedido' | 'negado' | 'indeterminado';

export type GrausDeLiberdade = 'tres' | 'seis' | 'indeterminado';

export type ClasseDeAparelho =
  | 'sem-api'
  | 'somente-janela'
  | 'aparelho-de-mao-com-camera'
  | 'visor-nao-verificado'
  | 'visor-sem-posicao'
  | 'visor-com-posicao';

export interface RecursoOpcional {
  readonly nome: string;
  readonly paraQueServe: string;
}

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

export interface ModosSuportados {
  readonly 'immersive-vr': boolean;
  readonly 'immersive-ar': boolean;
  readonly inline: boolean;
}

export interface FonteDeEntrada {
  readonly mao: XRHandedness;
  readonly modoDeMira: XRTargetRayMode;
  readonly temMaoRastreada: boolean;
  readonly perfis: readonly string[];
}

export interface LeituraDePagina {
  readonly contextoSeguro: boolean;
  readonly temApiXr: boolean;
  readonly modosSuportados: ModosSuportados | null;
}

export interface LeituraDeSessao {
  readonly regime: 'imersivo' | 'aumentado';
  readonly concedidos: readonly string[] | undefined;
  readonly fontesDeEntrada: readonly FonteDeEntrada[];
}

export async function sondarPagina(): Promise<LeituraDePagina> {
  const contextoSeguro = window.isSecureContext;
  const xr = contextoSeguro ? navigator.xr : undefined;

  if (!xr) {
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

export function estadoDoRecurso(
  nome: string,
  concedidos: readonly string[] | undefined,
): EstadoDeRecurso {
  if (concedidos === undefined) {
    return 'indeterminado';
  }
  return concedidos.includes(nome) ? 'concedido' : 'negado';
}

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

  if (suportaAr && !suportaVr) {
    return 'aparelho-de-mao-com-camera';
  }

  if (graus === 'seis') {
    return 'visor-com-posicao';
  }
  if (graus === 'tres') {
    return 'visor-sem-posicao';
  }
  return 'visor-nao-verificado';
}

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
