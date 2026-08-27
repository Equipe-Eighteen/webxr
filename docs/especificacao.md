# Especificação do Projeto — Quadro Elétrico em Trilho

## Seção 1. Identificação do grupo e da cena

**Grupo:** Equipe-Eighteen  
**Integrantes:** Davi Reina, Eduardo Akira, João Pedro Fusco, João Pedro Ruy, Lucas Valente

**Cena escolhida:** Quadro elétrico em trilho.

**Frase única:** Um trilho DIN fixado numa placa recebe disjuntores encaixados na ordem e no ângulo corretos, e o quadro só é dado como pronto quando o barramento entra por cima e o indicador acende.

**Por que esta cena:** ela endurece a etapa de encaixe (a regra de "o que aceita e o que recusa") sem exigir modelagem 3D complexa, porque as peças são essencialmente caixas. O grupo topa esse custo porque prefere concentrar o esforço de construção na lógica de manipulação e nos três regimes — que é o núcleo do que a disciplina avalia — em vez de gastar tempo esculpindo geometria detalhada.

**Armadilha declarada:** como as peças (disjuntor, trilho, placa) são caixas fáceis demais de gerar por código, existe o risco de a cena inteira ser construída sem nenhum objeto importado de arquivo externo, o que deixaria a etapa de modelagem/importação sem cobertura. **Mitigação:** o borne e o barramento serão obrigatoriamente objetos importados (arquivo de formato de troca, ex. glTF), com escala e pivot ajustados dentro do projeto — não apenas arrastados prontos para a cena.

---

## Seção 2. O que a pessoa faz ali

A pessoa chega diante de uma placa de montagem fixada numa bancada, com um trilho metálico horizontal já instalado nela. Ao lado do trilho, seis disjuntores estão dispostos soltos, em posições e orientações aleatórias, junto com um barramento e um jogo de bornes. A pessoa mira um disjuntor, aponta para ele, e ele realça. Ela o apanha, gira até a orientação correta ("garra para baixo") e aproxima do trilho. Se a posição e o ângulo estiverem dentro da tolerância, a peça assenta e trava no trilho; senão, ela recusa e a pessoa tenta de novo. Esse processo se repete para os seis disjuntores. Somente depois de todos os seis estarem alinhados e travados, o barramento pode ser encaixado por cima, conectando todos eles. Quando o barramento assenta, um indicador luminoso no canto do quadro acende, e a tarefa é considerada concluída.

**O que se faz com as mãos (além de apertar botão):** apanhar um disjuntor, girá-lo em três eixos até a orientação certa, e deslizá-lo ao longo do trilho até a posição de encaixe — uma manipulação contínua, não um clique único.

**O que muda com o visor:** o quadro passa a ter escala corporal real; a pessoa percebe que precisa se abaixar ou esticar o braço para alcançar os disjuntores mais distantes no trilho, algo que não aparece girando a cena com o cursor na tela.

**O que a câmera precisa provar contra uma mesa real:** o quadro elétrico (reduzido em escala de mesa) precisa continuar exatamente pousado sobre a superfície física enquanto a pessoa anda ao redor da mesa, provando que a câmera está sendo usada como sensor de ambiente e não como fundo estático.

---

## Seção 3. Inventário de objetos

| Objeto | Quantos | Origem | Move? | Observação |
|---|---|---|---|---|
| Trilho DIN | 1 | construído por código | não | apoio fixo, uma caixa alongada |
| Placa de montagem | 1 | construída por código | não | apoio fixo da cena |
| Disjuntor | 6 | construído por código (caixas com detalhe de alavanca) | sim, apanhado pela pessoa | todos iguais na forma, cor pode variar |
| Barramento | 1 | modelo importado (glTF), licença livre | sim, apanhado pela pessoa | única peça, entra por último |
| Borne | 4 | modelo importado (glTF), licença livre | sim, apanhado pela pessoa | pequenos, presos nas extremidades do trilho |
| Indicador luminoso | 1 | construído por código | não | muda de estado (apagado/aceso) |
| Bancada de apoio | 1 | construída por código | não | cenário fixo em volta da placa |

---

## Seção 4. O espaço e as escalas

O quadro completo (placa + trilho + disjuntores) mede aproximadamente **60 cm de largura por 40 cm de altura**, apoiado sobre uma bancada a **90 cm do chão**. Cada disjuntor tem cerca de **4,5 cm de largura por 8 cm de altura**. O barramento tem **50 cm de comprimento**.

A cena fica apoiada sobre uma superfície horizontal — mesa ou bancada de verdade.

**Duas escalas:** não há necessidade de duas escalas distintas aqui. O quadro é pequeno o suficiente para ser manipulado em tamanho real tanto no visor quanto sobre uma mesa física pela câmera — a mesma escala de mundo (metros reais) serve nos três regimes. Isso simplifica a especificação em relação a cenas que exigem redução para caber na mesa.

---

## Seção 5. As ações do usuário

| Ação | O que a pessoa faz | O que o sistema faz | Se não puder |
|---|---|---|---|
| Apontar | mira um disjuntor, borne ou barramento | o objeto realça (contorno colorido) | nada acontece, sem realce |
| Apanhar | aciona sobre o objeto mirado | o objeto passa a acompanhar a mão/controle/cursor | avisa que não há objeto mirado no momento |
| Orientar | gira a peça segurada | a peça gira junto, livre, sem restrição | — (ação sempre disponível enquanto segura) |
| Encaixar no trilho | aproxima o disjuntor do trilho e solta | a peça assenta na posição mais próxima válida e trava | recusa e diz o motivo: "fora da tolerância de posição" ou "ângulo incorreto" |
| Encaixar o barramento | aproxima o barramento de cima dos disjuntores e solta | o barramento assenta se todos os 6 disjuntores já estiverem travados | recusa e diz: "ainda faltam N disjuntores para travar" |
| Soltar sem encaixar | solta a peça longe de qualquer ponto válido | a peça cai/permanece na mesa, livre para ser apanhada de novo | — |

---

## Seção 6. A tarefa e sua validação

**Estado inicial:** seis disjuntores, um barramento e quatro bornes espalhados aleatoriamente sobre a bancada, fora do trilho. Indicador apagado.

**Estado final (sucesso):** os seis disjuntores travados no trilho, em qualquer ordem entre si mas todos antes do barramento; o barramento travado por cima, conectando todos; indicador aceso.

**Ordem:** parcialmente rígida. Os disjuntores podem ser encaixados em qualquer ordem entre si (livre), mas o barramento só pode ser encaixado depois que todos os seis disjuntores estiverem travados (regra de precedência única e obrigatória).

**Condição de sucesso verificável:** `disjuntores_travados == 6 AND barramento_travado == true` → indicador muda de estado para aceso.

---

## Seção 7. Regras de encaixe e tolerâncias

| Tipo de encaixe | Folga de posição (provisória) | Folga de ângulo (provisória) |
|---|---|---|
| Disjuntor → trilho | 1,5 cm ao longo do trilho, 0,5 cm perpendicular | 10° em relação ao eixo "garra para baixo" |
| Barramento → conjunto de disjuntores | 1,0 cm | 8° |
| Borne → extremidade do trilho | 1,0 cm | 15° |

**Raciocínio:** o trilho é uma restrição de um grau de liberdade (a peça só desliza ao longo dele), então a folga de posição pode ser generosa sem tornar o encaixe automático demais — o valor de 1,5 cm foi escolhido por ser cerca de um terço da largura do próprio disjuntor. A folga de ângulo de 10° evita que o teste vire uma tortura de precisão, já que o "sentido" da peça (garra para baixo) é o que importa, não a rotação fina. Esses valores são provisórios e serão ajustados após teste no visor real; o que foi testado antes da escolha final será registrado nesta mesma seção.

---

## Seção 8. Retorno ao usuário

| Situação | Forma de retorno |
|---|---|
| Objeto mirado | contorno colorido ao redor do objeto |
| Objeto apanhado | leve brilho/realce mais forte + o objeto passa a seguir a mão |
| Encaixe aceito | som curto de "clique" + a peça trava visualmente (para de seguir a mão) |
| Encaixe recusado | vibração/piscada vermelha rápida no objeto + texto curto flutuante próximo à peça explicando o motivo (não apenas na tela 2D) |
| Barramento encaixado / tarefa concluída | indicador muda de cor (apagado → verde) + som de confirmação mais longo |

Nenhuma dessas formas depende exclusivamente de texto na tela do computador, para que o retorno funcione igualmente dentro do visor.

---

## Seção 9. Os três regimes

| Aspecto | Na tela | No visor | Pela câmera |
|---|---|---|---|
| Como se olha | câmera em órbita controlada pelo cursor | posição da cabeça rastreada, visão em primeira pessoa | câmera do celular, cena sobreposta ao ambiente real |
| Como se aponta e age | cursor do mouse + clique | raio saindo do controle rastreado + botão de acionamento | toque na tela sobre o objeto projetado |
| Escala da cena | livre, ajustada para caber na janela | escala real de mundo (metros) | escala real, pousada sobre a mesa física detectada |
| O que a cena faz de diferente | nada além do quadro em si; alcance não é restrição | exige que a pessoa se mova/estique o braço para alcançar disjuntores distantes no trilho | o quadro precisa permanecer ancorado à mesa enquanto a pessoa anda ao redor |
| O que não existe neste regime | não há noção de alcance físico do braço | não há sobreposição ao mundo real da pessoa | não há rastreamento de cabeça nem controle dedicado |

O regime em tela é o caso base, funciona em qualquer máquina sem equipamento algum.

---

## Seção 10. Orçamento e desempenho

**Total de objetos na cena:** 1 trilho + 1 placa + 6 disjuntores + 1 barramento + 4 bornes + 1 indicador + 1 bancada = **15 objetos**.

**Meta de fluidez:** manter quadros estáveis o suficiente para não causar desconforto no visor (a cena é pequena e não deve se aproximar do limite da máquina de vídeo integrado).

**Repetição:** os 6 disjuntores são idênticos em geometria (mesma malha, cor pode variar) — serão tratados como instâncias da mesma forma, não como 6 objetos desenhados independentemente.

**Ordem de degradação, se necessário:**
1. Reduzir detalhe visual do disjuntor (menos triângulos na alavanca).
2. Remover sombra dinâmica da bancada em volta.
3. Simplificar a bancada de fundo para uma caixa lisa.

---

## Seção 11. Erros, limites e degradação

- **Aparelho não suporta o regime pedido:** o ambiente detecta via sonda de capacidades e abre automaticamente no regime em tela, com uma mensagem curta explicando que o modo imersivo/AR não está disponível neste aparelho.
- **Permissão de câmera negada:** o ambiente exibe uma mensagem explicando que o regime de câmera precisa dessa permissão para funcionar, e oferece o regime em tela como alternativa.
- **Rastreamento perdido:** se a câmera perde a superfície (ex. aponta para uma parede branca), o quadro ancorado congela na última posição conhecida e um aviso discreto aparece indicando que o rastreamento foi perdido, até ser recuperado.
- **Fora do alcance / fora do espaço útil:** se a pessoa tentar alcançar um disjuntor fora do alcance do braço no visor, nada é apanhado e um aviso indica que é preciso se aproximar.

---

## Seção 12. Ativos, formatos e licenças

| Arquivo | Origem | Licença | Endereço |
|---|---|---|---|
| barramento.gltf | Kenney — Factory Kit, arquivo `box-long.glb` (Models/GLB format/), esticado não uniformemente pelo projeto até a proporção de barra alongada | CC0 1.0 Universal (domínio público, crédito voluntário) | https://kenney.nl/assets/factory-kit |
| borne.gltf | Kenney — Factory Kit, arquivo `machine-connection-hole.glb` (Models/GLB format/), usado próximo da forma original | CC0 1.0 Universal (domínio público, crédito voluntário) | https://kenney.nl/assets/factory-kit |

---

## Seção 13. Plano de construção por blocos

| Bloco | O que estará funcionando ao fim dele |
|---|---|
| Bloco A | Vocabulário da cena declarado; sonda de capacidades relatando os três regimes distintos por aparelho |
| Bloco B | Cena completa no regime em tela: trilho, placa, 6 disjuntores e barramento visíveis, câmera em órbita funcionando |
| Bloco C | Abstração de apontar unificada (cursor/controle/toque); disjuntores podem ser apanhados, girados e encaixados no trilho com recusa explicada; barramento fecha a tarefa |
| Bloco D | Regime imersivo funcional: escala real, conforto tratado, alcance do braço restringindo a manipulação |
| Bloco E | Regime por câmera funcional: quadro ancorado sobre mesa real, degradação graciosa quando o rastreamento se perde |

---

## Seção 14. Riscos, decisões em aberto e declarações

**Riscos:**
- A tolerância de encaixe escolhida pode se mostrar frouxa ou apertada demais só no teste real no visor — será recalibrada no Bloco D.
- O aparelho móvel usado para testar o regime de câmera pode não suportar a sessão de AR — será validado cedo, no Bloco A, via sonda de capacidades.

**Decisões em aberto:**
- Se o barramento terá folga de posição igual à dos disjuntores ou uma folga própria — será decidido testando as duas opções no Bloco C.
- Se a cor dos disjuntores varia por decoração ou carrega algum significado funcional — decisão de conteúdo a ser tomada até o Bloco B.

**Declaração de uso de ferramentas de IA:** o rascunho inicial desta especificação (especificacao.md) foi gerado com apoio de IA, a partir da descrição da cena escolhida pelo grupo e das regras do enunciado do trabalho. O grupo conduziu a escolha da cena entre as dez opções, definiu os ajustes de conteúdo (remoção de justificativas fora do escopo do documento e revisou cada seção antes da entrega, verificando se os números propostos (tolerâncias, medidas, contagem de objetos) fazem sentido para a cena e se nenhuma frase do documento é apenas afirmação vazia.
