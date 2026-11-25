# Especificação técnica do TreineAI

O TreineAI é um aplicativo web responsivo para montar rotinas, registrar treinos e acompanhar a evolução por exercício. O fluxo começa em **Treinar** e prioriza registrar a próxima série com poucos toques. Planejamento e histórico funcionam bem também no desktop. A interface terá identidade visual própria.

## Hevy na web

Levantamento de 23 de novembro de 2026. A abertura de `hevy.com` sem sessão redireciona para o login. A estrutura abaixo vem do conteúdo público indexado e da documentação oficial. O conector do Hevy complementa o mapa de dados com uma amostra de duas rotinas e três treinos salvos. [Hevy Web](https://hevy.com/) · [Apresentação oficial da versão desktop](https://www.hevyapp.com/)

| Área | Funcionalidade e hierarquia observadas | Evidência |
| --- | --- | --- |
| Acesso | A raiz leva ao login. O cabeçalho indexado de uma rotina compartilhada oferece entrar, criar conta e baixar o app. | [Raiz](https://hevy.com/) · [Rotina compartilhada](https://hevy.com/routine/J0NPYAEoFg5) |
| Rotina compartilhada | Página individual com o nome da rotina e uma seção de resumo. O fluxo de compartilhamento permite que o destinatário veja a rotina e a salve no perfil. | [Exemplo público](https://hevy.com/routine/G3XZMqE61rr) · [Guia de compartilhamento](https://www.hevyapp.com/features/share-folders-routines/) |
| Pasta compartilhada | Título e autoria no topo, seguidos por grupos de exercícios organizados por rotina. Cada linha exibe nome, imagem e resumo de séries e repetições quando disponíveis. | [Pasta pública](https://hevy.com/folder/819681) · [Exemplo com metas de repetições](https://hevy.com/folder/2680052) |
| Programa público | Título, autoria, descrição, nível, objetivo, ambiente e quantidade de rotinas. A página agrupa os exercícios por rotina, com notas e resumo de prescrição. | [Programa publicado pelo Hevy](https://hevy.com/program/f9d3e8ea-b002-4eda-809b-34b8f9d11fde) |
| Treino compartilhado | Cabeçalho com título, data, duração e volume. O detalhe repete um bloco por exercício, com linhas por série e métricas adequadas ao movimento. Esforço percebido, aquecimentos e recordes aparecem quando aplicáveis. | [Exemplo com repetições e RPE](https://hevy.com/workout/2YI660MaUrf) · [Exemplo com distância](https://hevy.com/workout/gtNYmOGkX0B) |
| Planejamento, progresso e social no desktop | O Hevy anuncia criação e planejamento de rotinas, análise de progresso por exercício, visualização de treinos de amigos e opção de salvar rotinas de outros atletas. A apresentação oficial inclui uma imagem do desktop. | [Página oficial do Hevy](https://www.hevyapp.com/) |
| Registro ao vivo | Os guias do app descrevem iniciar de uma rotina, iniciar vazio ou copiar um treino anterior. A documentação geral também descreve desempenho anterior, temporizador, tipos de série e superséries. | [Guia de registro](https://help.hevyapp.com/hc/en-us/articles/35361530647959-How-to-Log-a-Workout-in-the-Hevy-App-Step-by-Step-Guide) · [Guia de funcionalidades](https://help.hevyapp.com/hc/en-us/articles/33106320824727-Everything-You-Need-to-Know-About-the-Hevy-App-2026-Features-Guide) |

Na amostra do conector, o descanso foi configurado por exercício, entre 75 e 150 segundos. Apareceram metas por faixa de repetições, seis exercícios recorrentes entre treinos e vínculos entre os três treinos salvos e suas rotinas de origem. Esses dados sustentam o uso de **Meta**, **Anterior** e **Descanso** no TreineAI.

### Interface autenticada no desktop

A navegação foi verificada em uma sessão autenticada no Chrome. A barra lateral fixa reúne Feed, Rotinas, Exercícios, Trainer, Perfil e Configurações. Na tela inicial observada, o Hevy usa fundo cinza-claro, cartões brancos e azul nas ações. O feed ocupa a coluna central e o resumo do perfil, a atividade recente e as sugestões de atletas ficam à direita.

| Tela visitada | O que foi verificado |
| --- | --- |
| Feed | Cada cartão mostra autor, data, duração, volume e uma prévia dos exercícios. O cartão leva ao treino concluído. |
| Rotinas | As rotinas são agrupadas por pastas. Cada cartão mostra o nome e a lista de exercícios. A tela oferece **Nova rotina** e **Nova pasta**. |
| Detalhe da rotina | Mostra exercícios, número de séries, faixa de repetições, descanso e notas fixadas. O resumo inclui total de séries, duração estimada e distribuição por músculo. No exemplo inspecionado, o menu oferecia copiar link, editar e excluir. |
| Editor de rotina | Mostra campos por série, incluindo faixa de repetições quando configurada, e um seletor de descanso por exercício. Cada bloco permite adicionar séries. A ação de gravação é **Atualizar rotina**. |
| Exercícios | A biblioteca oferece busca, filtros de equipamento e grupo muscular e criação de exercício personalizado. A seleção de um exercício é o ponto de entrada indicado para estatísticas individuais. |
| Perfil e treino concluído | O perfil reúne as seções **Estatísticas** e **Calendário**. O detalhe de treino acessado pelo feed mostra duração, volume e séries por exercício. |

**Registro ao vivo na web.** Nas telas de desktop visitadas, a navegação, a lista de rotinas e o detalhe da rotina inspecionada não apresentaram um comando **Iniciar treino**. Isso delimita o que foi observado nessa conta e nessas telas. O cronômetro em execução, o desfazer e a retomada continuam sem verificação no Hevy web. O TreineAI inclui esses comportamentos por decisão de produto.

Para o TreineAI, trabalhar com blocos de exercício no editor e destacar o resumo da rotina em uma coluna secundária no desktop. Usar busca e filtros no seletor de exercícios. O percurso principal continua começando em **Treinar**, com a opção de iniciar ou retomar uma sessão.

## Telas do TreineAI

| Tela | Rota proposta | Conteúdo e ações |
| --- | --- | --- |
| Treinar | `/treinar` | Entrada padrão. Lista de rotinas, **Nova rotina** e **Treino livre**. Se houver sessão aberta, **Retomar treino** tem prioridade. |
| Editor de rotina | `/rotinas/nova`, `/rotinas/:id/editar` | Nome, notas, busca no catálogo, ordenação de exercícios e séries, metas exatas ou por faixa e descanso por exercício. |
| Treino em andamento | `/treinos/:id/ativo` | Duração, exercícios em ordem, metas, resultado anterior, edição de séries, botão de conclusão e controle de descanso. |
| Histórico | `/historico`, `/treinos/:id` | Lista por data, detalhe por exercício e ação **Repetir treino** para montar uma sessão a partir das séries registradas. |
| Progresso | `/progresso`, `/progresso/:exercicioId` | Busca por exercício, filtro de período, gráfico de carga ou outra métrica compatível, recorde pessoal e séries que sustentam os valores. |

No celular, usar navegação inferior com **Treinar**, **Histórico** e **Progresso**. No desktop, usar navegação lateral e aproveitar a largura para exibir a lista de exercícios ao lado do editor ou do detalhe. Durante o treino, preservar espaço para os campos numéricos, manter o descanso visível sem cobri-los e deixar **Concluir treino** acessível.

A direção visual proposta usa fundo grafite, superfícies em ardósia e verde-lima para a ação principal. Usar números tabulares para cargas, repetições e relógios, foco visível e alvos de toque de pelo menos 44 px. Conclusão e erro precisam de texto ou ícone junto da cor. Em telas estreitas, mostrar o resultado anterior abaixo do título da série quando as colunas deixarem de acomodar os campos.

### Registro de uma série

Cada exercício mostra o nome, a meta da série atual, o descanso configurado e uma grade com **Série**, **Anterior**, campos da métrica atual e **Concluir série**. Em carga e repetições, **Anterior** pode mostrar `40 kg × 10`. Em uma prancha, o campo é tempo. Ausência de histórico aparece como `—`. Valores anteriores ficam visíveis e podem ser copiados por uma ação explícita.

## Regras de treino

1. **Iniciar.** Uma rotina produz uma cópia editável da prescrição, com vínculo de origem. Treino livre abre sem exercícios. Repetir um treino usa as séries concluídas da sessão anterior como ponto de partida. Uma sessão ativa por conta evita iniciar outro treino por engano. Ao tentar iniciar outro, oferecer retomada ou descarte confirmado.
2. **Resolver o anterior.** Buscar o último treino concluído com aquele exercício e usar a série do mesmo tipo e posição dentro do tipo. Exemplo de posição: segunda série normal. Se naquela sessão a série correspondente estiver ausente, exibir `—`. Usar o identificador do exercício para manter o vínculo após mudanças de nome.
3. **Concluir série.** Validar os campos exigidos pelo tipo de exercício, registrar o horário da conclusão e destacar a próxima série pendente. Com descanso configurado acima de zero, iniciar ou substituir a contagem regressiva. Um toque duplo na mesma série deve produzir um único registro.
4. **Descanso.** Guardar a hora prevista de término e a série que disparou o timer. Exibir ajuste de 15 segundos e opção de pular. Ao desfazer a série que originou o timer atual, encerrar esse timer e preservar os valores digitados. Se outra série já tiver iniciado um novo timer, manter a contagem atual.
5. **Retomar.** Persistir a sessão e as edições no dispositivo. Recarregar ou voltar à tela recupera os valores, séries concluídas e a contagem calculada a partir da hora de término. Se o descanso venceu enquanto a página estava em segundo plano, mostrar o estado encerrado ao retornar.
6. **Finalizar ou descartar.** Exigir pelo menos uma série concluída para salvar. Se houver séries pendentes, exibir aviso e permitir finalizar só com as concluídas. Finalizar encerra o timer, grava uma única entrada no histórico e alimenta o progresso. Descartar remove o rascunho da lista de retomada após confirmação.
7. **Calcular progresso.** Considerar séries concluídas em treinos salvos. Para carga e repetições, mostrar maior carga e volume externo no período, calculado pela soma de carga × repetições. Excluir aquecimento dessas duas métricas. Para exercícios de tempo, distância ou assistência, rotular a métrica correspondente e evitar misturá-la com volume externo.

## Arquitetura e dados

Arquitetura proposta para o MVP: frontend web responsivo em TypeScript, API JSON e banco relacional com migrações. O banco é a fonte do histórico e das rotinas. O navegador usa IndexedDB para recuperar a sessão ativa e enfileirar alterações durante perda de conexão. O repositório local estava sem commit inicial ao criar esta especificação, então a escolha de framework e infraestrutura fica para a implementação.

| Entidade | Dados principais |
| --- | --- |
| Conta | ID, idioma, unidade de carga, unidade de distância e fuso para apresentação. Padrões de interface em português do Brasil, kg e km. |
| Exercício | ID estável, nome, equipamento, grupos musculares, modo de registro e proprietário opcional para exercícios personalizados. |
| Rotina | ID, proprietário, nome, notas e lista ordenada de exercícios. Cada exercício guarda descanso, notas e séries planejadas. |
| Série planejada | Ordem, tipo e meta para cada métrica aplicável. Representar repetições fixas e faixa de repetições como alternativas. |
| Treino | ID, proprietário, rotina de origem opcional, nome, revisão, estado `active`, `completed` ou `discarded`, horários e snapshot editável. |
| Série registrada | ID estável, posição, tipo, referência ao exercício da sessão, valores medidos, RPE opcional e horário de conclusão. |
| Descanso atual | ID da série de origem e hora prevista de término, associado à revisão da sessão ativa. |

Guardar carga em kg, distância em metros, duração em segundos e horários em UTC. Converter unidades na interface. Aceitar vírgula decimal no teclado em português e tratar entrada vazia como ausência. O catálogo determina os campos exigidos em cada exercício, com suporte inicial a carga/repetições, repetições e duração. Distância, assistência e superséries entram após o núcleo, com a mesma estrutura de sessão e histórico.

### Contrato inicial da API

| Operação | Método e rota propostos | Regra |
| --- | --- | --- |
| Buscar exercícios | `GET /api/exercises?q=...` | Retorna catálogo acessível à conta, com tipo de registro. |
| Listar, criar e editar rotinas | `GET /api/routines`, `POST /api/routines`, `PATCH /api/routines/:id` | Validar ordenação, metas e fontes de exercício. |
| Iniciar ou retomar treino | `POST /api/workouts`, `GET /api/workouts/active` | A criação recebe ID de rotina, ID de treino anterior ou nenhum dos dois. Em conflito, retornar a sessão ativa. |
| Persistir rascunho | `PATCH /api/workouts/:id` | Recebe revisão esperada e snapshot atualizado. Revisão divergente retorna conflito com a versão atual. |
| Finalizar ou descartar | `POST /api/workouts/:id/finish`, `POST /api/workouts/:id/discard` | Transições atômicas. Repetir a mesma finalização devolve o resultado já gravado. |
| Consultar histórico | `GET /api/workouts?cursor=...`, `GET /api/workouts/:id` | Lista paginada de sessões concluídas e detalhe com acesso pelo proprietário. |
| Consultar desempenho | `GET /api/exercises/:id/history` | Aceita intervalo e agrupa as séries concluídas por treino. |

Aplicar autorização por proprietário em todas as consultas privadas. Usar uma restrição de unicidade para a sessão ativa por conta e transações para finalizar ou descartar. Versões conflitantes entre dispositivos exigem que a interface preserve o rascunho local até o usuário escolher qual versão usar. Em modo offline, somente uma sessão já carregada pode receber edições e ser retomada no dispositivo. Usar um service worker para disponibilizar os recursos da tela ativa ao recarregar e limitar o cache a arquivos estáticos. Guardar os dados locais por conta e limpá-los na saída. A finalização pendente deve aparecer como tal até ser confirmada pelo servidor.

## Escopo e aceite

**MVP.** Catálogo, rotinas, treino livre ou a partir de uma rotina, registro e descanso, retomada, histórico, repetição de treino e progresso por exercício.

**Depois do MVP.** Pastas e programas, compartilhamento, feed social, exercícios personalizados, métricas adicionais e integração de importação com o Hevy. O conector atual serviu para a pesquisa. A especificação assume um aplicativo com armazenamento próprio.

- Criar uma rotina com três séries, faixa de 8 a 12 repetições e 90 segundos de descanso. Iniciar por ela, editar os valores da sessão e verificar que a rotina original conserva a prescrição.
- Registrar um exercício novamente e conferir se **Anterior** corresponde à série de mesmo tipo e posição da sessão de referência.
- Marcar uma série, recarregar a página e retomar com o descanso restante coerente. Desfazer a série que disparou o timer e confirmar que os dados digitados permanecem.
- A partir de uma sessão já carregada, alterar uma série sem conexão, recarregar e sincronizar ao reconectar. Simular edição concorrente e conferir que o rascunho local continua disponível.
- Finalizar um treino duas vezes por reenvio e verificar uma única entrada no histórico. Confirmar que séries pendentes e descartes ficam fora do cálculo de progresso.
- Testar carga e reps, só reps e duração em tela móvel estreita e no desktop. Conferir teclado, foco, vírgula decimal e contraste sem depender apenas de cor.

A validação de referência cobriu o desktop autenticado. A apresentação em tela estreita e os detalhes de registro ao vivo permanecem em aberto no Hevy web.
