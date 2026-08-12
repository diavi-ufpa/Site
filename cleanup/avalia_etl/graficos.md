# Catálogo de gráficos — Avalia Presencial

## 1. Objetivo

Este arquivo descreve os dados que o ETL deve pré-calcular para preencher o painel do Avalia Presencial. Ele é o contrato funcional entre:

1. as fontes oficiais semestrais `DISC_<ANO>_<PERIODO>.csv` e `DOC_<ANO>_<PERIODO>.csv` (ou equivalentes `.xlsx`);
2. as funções de cálculo do ETL, que serão implementadas separadamente;
3. o banco PostgreSQL de resultados; e
4. a API e os componentes de gráficos do site.

O banco de resultados não deve guardar respostas individuais. Cada registro deve representar um resultado agregado e reproduzível a partir dos arquivos brutos. O semestre é imutável e registra a versão do questionário, a versão do cálculo e os hashes das duas fontes.

## 2. Fontes e recortes

### 2.1 Instrumentos

- `DISC`: respostas dos discentes.
- `DOC`: respostas e autoavaliação dos docentes.

### 2.2 Período

Cada par de arquivos pertence a exatamente um semestre, identificado por `ano` e `periodo`, por exemplo `2024-2`. Um novo semestre adiciona resultados; não altera resultados publicados de semestres anteriores.

### 2.3 Filtros públicos

Todos os resultados do painel são consultados pelas seguintes dimensões:

- semestre, obrigatório;
- campus, obrigatório no fluxo atual do painel;
- curso, obrigatório para gráficos e cartões, mas omitido nos rankings por curso.

O ETL deve calcular também os níveis agregados necessários à navegação e aos rankings:

- semestre;
- semestre + campus;
- semestre + curso, somando o curso em todos os campi onde ele existe;
- semestre + campus + curso.

Não se deve representar o total com texto como `TODOS`. O nível de agregação deve ser explícito e as chaves de campus e curso devem ser nulas quando a dimensão não participar do recorte.

## 3. Escalas, grupos e itens

### 3.1 Escala Likert

| Valor | Conceito | Ordem de exibição |
|---:|---|---:|
| 4 | Excelente | 1 |
| 3 | Bom | 2 |
| 2 | Regular | 3 |
| 1 | Insuficiente | 4 |

Respostas vazias, inválidas ou fora de `1..4` não entram no numerador nem no denominador de médias e proporções.

### 3.2 Eixos e itens — discente

| Eixo | Subdimensão | Itens |
|---|---|---|
| Autoavaliação Discente | — | `P111..P117` |
| Ação Docente | Atitude Profissional | `P211..P214` |
| Ação Docente | Gestão Didática | `P221..P228` |
| Ação Docente | Processo Avaliativo | `P231..P234` |
| Instalações Físicas | — | `P311..P314` |
| Atividades Acadêmicas | — | `4.1.1.A..4.1.1.R` |

As colunas `MEDIAP111..MEDIAP314` são a fonte da distribuição por oferta/turma usada nos boxplots discentes. Elas devem ser convertidas de vírgula decimal para número.

### 3.3 Eixos e itens — docente

| Eixo | Subdimensão | Itens |
|---|---|---|
| Avaliação da Turma | — | `111..117` |
| Autoavaliação da Ação Docente | Atitude Profissional | `211..214` |
| Autoavaliação da Ação Docente | Gestão Didática | `221..228` |
| Autoavaliação da Ação Docente | Processo Avaliativo | `231..234` |
| Instalações Físicas | — | `311..314` |
| Atividades Acadêmicas | — | `4.1.1.A..4.1.1.P` |

Para os boxplots docentes, a unidade da distribuição é a oferta/turma: primeiro calcula-se a média das respostas válidas da oferta para o agrupador solicitado; depois calculam-se os quartis entre essas médias.

## 4. Regras comuns de cálculo

### 4.1 Média Likert

`media = soma das respostas Likert válidas / quantidade de respostas Likert válidas`

Armazenar a soma e a quantidade, além da média arredondada para duas casas. Soma e quantidade permitem recompor agregações futuras sem calcular uma “média de médias”.

### 4.2 Proporção Likert

Para cada conceito e agrupador:

`percentual = quantidade de respostas do conceito / total de respostas válidas do agrupador * 100`

Devem existir quatro registros por agrupador, inclusive quando uma opção tiver zero respostas. Armazenar `quantidade`, `total` e `percentual` com duas casas.

### 4.3 Estatísticas de boxplot

Sobre as médias válidas por oferta/turma de cada agrupador, calcular:

- mínimo;
- primeiro quartil (`Q1`, percentil contínuo 0,25);
- mediana (percentil contínuo 0,50);
- média;
- terceiro quartil (`Q3`, percentil contínuo 0,75);
- máximo;
- quantidade de observações (`N`).

Um valor é outlier quando está abaixo de `Q1 - 1,5 * IQR` ou acima de `Q3 + 1,5 * IQR`, sendo `IQR = Q3 - Q1`. Os outliers devem ser armazenados como valores associados à estatística, pois o gráfico atual os exibe individualmente.

### 4.4 Participação em atividades

`percentual = soma dos valores binários válidos / quantidade de valores válidos * 100`

Vazios seguem a regra vigente da fonte e viram zero. A marcação `X` equivale a `1`.
Os campos textuais de outra atividade são `4.1.1.R` em DISC e `4.1.1.P` em DOC;
quando preenchidos, equivalem a `1`, conforme compatibilidade legada. Guardar
quantidade positiva e total, além do percentual.

### 4.5 Ordenação

Eixos, subdimensões, itens e atividades devem usar uma posição semântica cadastrada no catálogo do questionário. A interface não deve depender de ordenação alfabética nem inferir posição a partir do texto exibido.

## 5. Catálogo de saídas

Em todas as famílias abaixo, `recorte` significa uma das quatro combinações válidas de semestre, campus e curso conforme a seção 2.3.

### G01 — Resumo geral discente

Preenche os três cartões da visão geral.

| Saída | Descrição | Regra |
|---|---|---|
| Total de discentes que responderam | Quantidade de participantes distintos no recorte | Contagem distinta do identificador anonimizado do discente com ao menos resposta Likert válida |
| Campus melhor avaliado | Campus com maior média Likert discente | Média de todas as respostas válidas; desempate por nome do campus crescente |
| Campus pior avaliado | Campus com menor média Likert discente | Média de todas as respostas válidas; desempate compatível com a API vigente |

Grão: um resultado por semestre e recorte. Com campus selecionado, os cartões de melhor e pior campus respeitam o filtro e ambos apontam para o próprio campus.

### G02 — Médias Likert

Preenche gráficos de barras de médias. Variantes:

| Instrumento | Nível | Conteúdo |
|---|---|---|
| DISC | dimensão | Autoavaliação Discente, Ação Docente e Instalações Físicas |
| DOC | dimensão | Avaliação da Turma, Autoavaliação da Ação Docente e Instalações Físicas |
| DISC | subdimensão | Atitude Profissional, Gestão Didática e Processo Avaliativo da Ação Docente |
| DOC | subdimensão | Atitude Profissional, Gestão Didática e Processo Avaliativo da Autoavaliação da Ação Docente |
| DISC | item | Itens de Autoavaliação, Ação Docente e Instalações Físicas |
| DOC | item | Itens de Avaliação da Turma, Autoavaliação da Ação Docente e Instalações Físicas |

Grão: semestre + recorte + instrumento + nível + agrupador. Campos mínimos: código do agrupador, posição, soma, quantidade e média.

### G03 — Proporções Likert

Preenche gráficos de barras agrupadas por conceito. Possui as mesmas variantes de instrumento, nível e conteúdo de G02.

Grão: semestre + recorte + instrumento + nível + agrupador + valor Likert. Campos mínimos: código do agrupador, posição, valor/conceito, quantidade, total e percentual.

### G04 — Boxplots e tabelas descritivas

Preenche simultaneamente o boxplot e sua tabela de estatísticas. Variantes:

| Instrumento | Nível | Conteúdo |
|---|---|---|
| DISC | dimensão | Dimensões gerais |
| DOC | dimensão | Dimensões gerais da base docente |
| DISC | subdimensão | Subdimensões da Ação Docente |
| DOC | subdimensão | Subdimensões da Autoavaliação da Ação Docente |
| DISC | item | Autoavaliação Discente, Atitude Profissional, Gestão Didática, Processo Avaliativo e Instalações Físicas |
| DOC | item | Avaliação da Turma, Atitude Profissional, Gestão Didática e Processo Avaliativo |

Grão da estatística: semestre + recorte + instrumento + nível + agrupador. Grão do outlier: estatística + sequência do valor. O mesmo registro estatístico deve atender o gráfico e a tabela; não criar cópias para endpoints chamados `boxplot`, `descritivas` ou `estatisticas`.

### G05 — Participação em atividades acadêmicas

Preenche os gráficos de percentual de participação, separadamente para DISC e DOC.

Grão: semestre + recorte + instrumento + atividade. Campos mínimos: código da atividade, posição, quantidade positiva, total válido e percentual.

### G06 — Ranking de cursos por média

Preenche tabelas de até 20 cursos, em ordem decrescente de média, para:

- dimensões gerais de DISC e DOC;
- Autoavaliação Discente e suas três subdimensões;
- Avaliação da Turma, Autoavaliação da Ação Docente e suas três subdimensões;
- Instalações Físicas de DISC e DOC.

O ranking ignora o curso selecionado e mantém semestre e campus. O ETL ordena por média decrescente, quantidade decrescente e nome do curso, limita a 20 e persiste a posição final. São calculados rankings por campus e também para todos os campi. Grão: semestre + escopo de campus + instrumento + agrupador + posição/curso. Campos mínimos: posição, soma, quantidade e média.

### G07 — Ranking de cursos por participação

Preenche tabelas de até 20 cursos com o percentual médio de participação em atividades, separadamente para DISC e DOC.

O ranking ignora o curso selecionado e mantém semestre e campus. O ETL ordena por percentual decrescente, quantidade decrescente e nome do curso, limita a 20 e persiste a posição final. São calculados rankings por campus e também para todos os campi. Grão: semestre + escopo de campus + instrumento + posição/curso. Campos mínimos: posição, quantidade positiva, total e percentual.

## 6. Contrato de saída para o site

O banco deve guardar valores tipados e normalizados, não objetos JSON de bibliotecas de gráfico. A API transforma os registros nos formatos atuais:

- média: `{ dimensao|subdimensao|item, media, respondentes, ordem_bloco, ordem_item }`;
- proporção: `{ dimensao|subdimensao|item, conceito, valor, respostas, total_respostas, ordem_bloco, ordem_item }`;
- atividade: `{ atividade, percentual, respondentes, ordem_bloco, ordem_item }`;
- boxplot: `{ x, y: [min, q1, mediana, q3, max] }`, outliers e tabela descritiva;
- ranking de média: `{ ranking, curso, media, respondentes }`;
- ranking de atividade: `{ ranking, curso, percentual, respondentes }`.

Arredondamento para exibição ocorre em duas casas decimais. O banco deve usar tipos numéricos exatos para contagens e agregados, evitando `double precision` como fonte canônica.

## 7. Validações obrigatórias por semestre

- Os dois arquivos devem declarar o mesmo semestre esperado pela execução.
- Cada arquivo deve ter hash SHA-256 registrado e não pode mudar durante a carga.
- Todo item encontrado deve existir no catálogo do questionário vigente para o semestre.
- Respostas Likert válidas devem estar em `1..4`.
- Para cada proporção, a soma das quatro quantidades deve ser igual ao total do agrupador e os percentuais devem totalizar aproximadamente 100%, considerada a tolerância de arredondamento.
- Toda média deve estar entre 1 e 4; médias discentes de origem podem aceitar 0 apenas se a regra de negócio confirmar que zero é valor válido, não ausência.
- Estatísticas devem respeitar `min <= Q1 <= mediana <= Q3 <= max` e `N > 0`.
- Percentuais de atividade devem estar entre 0 e 100.
- O semestre não pode existir previamente no banco.
- Resultados não podem ser inseridos se qualquer validação crítica falhar.

## 8. Evolução do catálogo

Itens, textos, agrupamentos e posições devem ser versionados por vigência de semestre. A inclusão de uma nova pergunta não exige nova tabela: cria-se uma nova versão do questionário e seus resultados. Uma mudança de significado ou agrupamento também exige nova versão sem reescrever os resultados históricos.

Este catálogo descreve o comportamento observado no site e na API atuais. Qualquer mudança de fórmula deve receber uma nova versão de cálculo aplicável somente aos novos semestres. Semestres existentes não são recalculados nem substituídos.
