# Catálogo de gráficos — Avalia

## Escopo

O Avalia possui dois painéis: **Presencial** e **EAD**. Ambos trabalham com respostas em escala Likert de 1 a 4:

| Valor | Conceito |
| ---: | --- |
| 4 | Excelente |
| 3 | Bom |
| 2 | Regular |
| 1 | Insuficiente |

Respostas inválidas ou fora da escala não devem entrar nas médias nem nas proporções. Os relatórios PDF do Avalia reutilizam as mesmas famílias de gráficos dos painéis; portanto, não constituem novas saídas analíticas.

## Famílias de gráficos

### Média

- **Tipo:** barras verticais, uma série.
- **Eixo X:** dimensão, subdimensão ou item do questionário.
- **Eixo Y:** média das respostas válidas, de 0 a 4 na apresentação.
- **Comparação:** compara a avaliação média dos agrupadores exibidos dentro do mesmo recorte.
- **Dados mínimos:** código e ordem do agrupador, soma das respostas, quantidade de respostas válidas e média.

### Proporção de respostas

- **Tipo:** barras verticais agrupadas.
- **Eixo X:** dimensão, subdimensão ou item do questionário.
- **Eixo Y:** percentual de respostas, de 0% a 100%.
- **Séries:** Excelente, Bom, Regular e Insuficiente.
- **Comparação:** compara a composição percentual dos quatro conceitos em cada agrupador.
- **Dados mínimos:** agrupador, conceito/valor Likert, quantidade, total válido, percentual e ordem.

### Boxplot das médias

- **Tipo:** boxplot com pontos de outliers.
- **Eixo X:** dimensão, subdimensão ou item do questionário.
- **Eixo Y:** média da unidade observacional, na escala de 1 a 4.
- **Comparação:** compara a distribuição das médias entre ofertas, turmas, disciplinas ou docentes, conforme o painel e o ano.
- **Resumo:** mínimo/limite inferior, Q1, mediana, Q3 e máximo/limite superior; outliers ficam fora de `1,5 × IQR`.
- **Complemento:** cada boxplot é acompanhado por tabela descritiva com quantidade, média, desvio-padrão, mínimo, Q1, mediana, Q3 e máximo quando esses dados estão disponíveis.
- **Dados mínimos:** agrupador, quantidade de observações, estatísticas e valores individuais dos outliers.

### Participação em atividades

- **Tipo:** barras verticais, uma série.
- **Eixo X:** atividade acadêmica.
- **Eixo Y:** percentual de participação, de 0% a 100%.
- **Comparação:** compara a participação nas atividades dentro do recorte, separadamente para discentes e docentes.
- **Dados mínimos:** atividade e ordem, quantidade de participantes, total válido e percentual.

### Rankings

- **Tipo:** tabela ordenada, não gráfico cartesiano.
- **Colunas:** posição, curso, média ou percentual e quantidade de respondentes.
- **Comparação:** compara cursos do mesmo semestre e escopo de campus; o curso selecionado não restringe a população do ranking.
- **Ordenação:** resultado decrescente, seguido de quantidade decrescente e nome do curso para desempate.

## Avalia Presencial

### Organização da tela

1. Cartões de resumo.
2. Filtros obrigatórios de ano/semestre, campus e curso; há também filtro de dimensão.
3. Abas temáticas.
4. Gráficos da aba, normalmente em pares ou em sequência.
5. Rankings opcionais, ativados no bloco de filtros.

O painel admite os recortes: semestre; semestre + campus; semestre + curso; e semestre + campus + curso. O filtro de dimensão funciona como atalho: dimensões 1 e 2 direcionam aos blocos de autoavaliação/ação docente, a dimensão 3 às instalações e a dimensão 4 às atividades.

### Cartões

| Cartão | O que mede |
| --- | --- |
| Total de discentes que responderam | Participantes distintos com resposta válida no recorte. |
| Campus melhor avaliado | Campus com maior média geral válida. |
| Campus pior avaliado | Campus com menor média geral válida. |

### Aba Dimensões Gerais

Organizada em duas colunas para confrontar os instrumentos Discente e Docente:

1. médias por dimensão — Discente e Docente;
2. proporções por dimensão — Discente e Docente;
3. boxplot por dimensão das médias de turmas/docentes, em largura total;
4. tabela descritiva do boxplot, em largura total.

As dimensões comparadas são Autoavaliação Discente/Avaliação da Turma, Ação Docente/Autoavaliação da Ação Docente e Instalações Físicas, conforme o instrumento.

### Aba Autoavaliação Discente

Os blocos seguem a ordem **média → proporções → boxplot → tabela descritiva**:

1. subdimensões da Avaliação da Ação Docente: Atitude Profissional, Gestão Didática e Processo Avaliativo;
2. itens da Autoavaliação Discente (`P111` a `P117`);
3. itens de Atitude Profissional (`P211` a `P214`);
4. itens de Gestão Didática (`P221` a `P228`);
5. itens de Processo Avaliativo (`P231` a `P234`).

### Aba Avaliação da Ação Docente

Apresenta a perspectiva do instrumento docente. Cada bloco usa média, proporções e boxplot, acompanhado de estatísticas:

1. boxplot geral da dimensão Ação Docente;
2. subdimensões da Autoavaliação da Ação Docente;
3. itens da Avaliação da Turma (`111` a `117`);
4. itens de Atitude Profissional (`211` a `214`);
5. itens de Gestão Didática (`221` a `228`);
6. itens de Processo Avaliativo (`231` a `234`).

### Aba Instalações Físicas

Organizada em duas colunas para Discente e Docente:

1. médias por item — Discente e Docente;
2. proporções por item — Discente e Docente;
3. boxplot das médias por item do instrumento Discente;
4. tabela descritiva correspondente.

Os itens são `P311` a `P314` no instrumento discente e `311` a `314` no docente.

### Aba Atividades Acadêmicas

Contém dois gráficos empilhados verticalmente:

1. percentual de participação por atividade — Discente (`4.1.1.A` a `4.1.1.R`);
2. percentual de participação por atividade — Docente (`4.1.1.A` a `4.1.1.P`).

### Rankings opcionais

| Contexto | Grupos comparados | Métrica |
| --- | --- | --- |
| Dimensões Gerais | Autoavaliação Discente, Ação Docente Discente, Avaliação da Turma, Autoavaliação da Ação Docente e instalações dos dois instrumentos | Média |
| Autoavaliação Discente | Dimensão geral e três subdimensões | Média |
| Avaliação da Ação Docente | Avaliação da Turma, Autoavaliação da Ação Docente e três subdimensões | Média |
| Instalações Físicas | Discente e Docente | Média |
| Atividades Acadêmicas | Discente e Docente | Percentual médio de participação |

## Avalia EAD

### Organização e filtros

O painel começa com três cartões: total de respondentes, grupo mais bem avaliado e grupo menos bem avaliado. O grupo é **polo** em 2025 e **curso** em 2023. Os filtros disponíveis no componente são ano, polo quando a fonte o possui, curso, disciplina e dimensão.

As abas são:

1. Dimensões Gerais;
2. Autoavaliação Discente;
3. Atitude Profissional;
4. Gestão Didática;
5. Processo Avaliativo;
6. Instalações Físicas e Recursos de TI.

### Dimensões Gerais

O layout confronta três leituras do mesmo recorte:

1. proporções por dimensão;
2. médias por dimensão;
3. boxplot das médias por dimensão e tabela estatística.

As dimensões são Autoavaliação Discente, Avaliação da Ação Docente e Instalações Físicas e Recursos de TI.

### Abas de itens

Cada uma das cinco abas restantes repete a mesma sequência:

1. proporções das respostas por item;
2. boxplot das médias por item e tabela estatística;
3. médias por item.

O EAD mantém versões de questionário dependentes do ano. A ordem e a associação de cada item à dimensão devem, portanto, ser versionadas por vigência, e não inferidas apenas pela posição da coluna.

## Requisitos de modelagem derivados

- Versionar questionário, instrumento, dimensão, subdimensão, item, atividade e ordem de exibição por período.
- Persistir numerador e denominador das médias, proporções e participações, evitando média de médias.
- Identificar explicitamente o nível do recorte; não representar agregados com entidades fictícias chamadas “Todos”.
- Preservar a unidade observacional usada no boxplot e as estatísticas já agregadas.
- Manter Discente, Docente, Presencial e EAD como atributos explícitos.
- Gerar rankings em grão próprio, pois eles ignoram o curso selecionado e dependem do universo de comparação.
