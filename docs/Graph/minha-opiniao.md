# Catálogo de gráficos — Minha Opinião

## Escopo e organização

Minha Opinião possui três painéis independentes:

1. Discente;
2. Docente;
3. Técnico.

Todos seguem a mesma estrutura:

1. cartões de participantes e unidade/lotação com maior participação;
2. filtros do recorte A;
3. opção de comparação, que cria um recorte B independente;
4. um gráfico de barras para cada dimensão disponível;
5. quando a comparação está ativa, os gráficos A e B da mesma dimensão aparecem lado a lado.

## Família única de gráfico

### Média das respostas por pergunta e dimensão

- **Tipo:** barras verticais, uma série por gráfico.
- **Eixo X:** código da pergunta pertencente à dimensão.
- **Eixo Y:** média das respostas válidas, de 0 a 5.
- **Comparação:** compara as perguntas dentro da dimensão. No modo A/B, compara visualmente dois recortes independentes da mesma dimensão; os dados não são combinados em um único gráfico.
- **Tooltip:** apresenta o texto completo da pergunta e a média de 0 a 5.
- **Dados mínimos:** público, dimensão, ordem, código e texto da pergunta, recorte, soma válida, quantidade válida e média.

Se uma dimensão for selecionada, somente seu gráfico aparece. Se uma pergunta for selecionada, o gráfico da dimensão contém somente essa barra. Sem esses filtros, todos os gráficos de dimensão são mostrados em uma grade.

## Painel Discente

### Cartões

- total de participantes no recorte;
- unidade acadêmica com mais participantes e sua contagem.

### Filtros

Campus/município, unidade, curso, dimensão e pergunta. Campus, unidade e curso alteram a população; dimensão e pergunta alteram quais barras são exibidas.

### Dimensões e perguntas

| Dimensão | Perguntas | Quantidade |
| --- | --- | ---: |
| 2 — Políticas de Ensino, Pesquisa, Pós-Graduação e Extensão | `P.2.1` a `P.2.11` | 11 |
| 3 — Responsabilidade Social | `P.3.12` a `P.3.14` | 3 |
| 4 — Comunicação com a Sociedade | `P.4.15` a `P.4.17` | 3 |
| 6 — Organização e Gestão da Instituição | `P.6.18` | 1 |
| 7 — Infraestrutura Física | `P.7.19` a `P.7.27` | 9 |
| 8 — Planejamento e Avaliação | `P.8.28` a `P.8.30` | 3 |
| 9 — Políticas de Atendimento ao Estudante | `P.9.31` a `P.9.34` | 4 |

## Painel Docente

### Cartões

- total de participantes no recorte;
- lotação com mais participantes e sua contagem.

### Filtros

Lotação, cargo, dimensão e pergunta.

### Dimensões e perguntas

| Dimensão | Perguntas | Quantidade |
| --- | --- | ---: |
| 1 — Missão e Plano de Desenvolvimento Institucional | `P.1.1` a `P.1.4` | 4 |
| 2 — Políticas de Ensino, Pesquisa, Pós-Graduação e Extensão | `P.2.5` a `P.2.20` | 16 |
| 3 — Responsabilidade Social | `P.3.21` a `P.3.24` | 4 |
| 4 — Comunicação com a Sociedade | `P.4.25` a `P.4.28` | 4 |
| 5 — Políticas de Pessoal | `P.5.29` a `P.5.31` | 3 |
| 6 — Organização e Gestão Institucional | `P.6.32` a `P.6.35` | 4 |
| 7 — Infraestrutura Física | `P.7.36` a `P.7.41` | 6 |
| 8 — Planejamento e Avaliação | `P.8.42` a `P.8.46` | 5 |
| 9 — Políticas de Atendimento aos Estudantes | `P.9.47` a `P.9.48` | 2 |

Participantes com mais de três respostas nulas no conjunto de perguntas são descartados antes dos cartões e gráficos.

## Painel Técnico

### Cartões

- total de participantes no recorte;
- lotação com mais participantes e sua contagem.

### Filtros

Lotação, unidade de exercício, cargo, dimensão e pergunta.

**Lacuna observada:** atualmente a interface oferece Unidade de Exercício, mas a função que filtra os dados aplica somente Lotação e Cargo. Para a modelagem, unidade de exercício deve ser tratada como dimensão de recorte; a regra de aplicação no painel precisa ser corrigida ou formalmente descartada.

### Dimensões e perguntas

| Dimensão | Perguntas | Quantidade |
| --- | --- | ---: |
| 1 — Missão e Plano de Desenvolvimento Institucional | `P.1.1` a `P.1.3` | 3 |
| 3 — Responsabilidade Social da Instituição | `P.3.4` a `P.3.6` | 3 |
| 4 — Comunicação com a Sociedade | `P.4.7` a `P.4.11` | 5 |
| 5 — Políticas de Pessoal | `P.5.12` a `P.5.15` | 4 |
| 6 — Organização e Gestão da Instituição | `P.6.16` a `P.6.17` | 2 |
| 7 — Infraestrutura Física | `P.7.18` a `P.7.22` | 5 |
| 8 — Planejamento e Avaliação | `P.8.23` a `P.8.28` | 6 |

Participantes com mais de três respostas nulas no conjunto de perguntas são descartados antes dos cartões e gráficos.

## Requisitos de modelagem derivados

- Manter instrumentos Discente, Docente e Técnico separados, mas compartilhar catálogos de dimensão, pergunta e escala quando possível.
- Versionar código, texto, dimensão e ordem das perguntas por edição do questionário.
- Persistir soma e quantidade válida junto da média; uma resposta ausente não equivale a zero.
- Permitir agregação pelos filtros de cada público e por todas as combinações necessárias ao modo A/B.
- Guardar contagem de participantes por recorte para os cartões e contagem por unidade/lotação para identificar a líder.
- Registrar a regra de elegibilidade dos respondentes, especialmente o limite de três respostas nulas para Docente e Técnico.
- Incluir unidade de exercício no grão Técnico caso o filtro permaneça no produto.
