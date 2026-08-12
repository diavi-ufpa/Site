# Modelagem do banco de resultados do Avalia Presencial

## Objetivo

O PostgreSQL é dedicado ao Avalia Presencial, possui limite de 500 MB e serve exclusivamente como fonte dos gráficos. Todo cálculo pesado ocorre localmente. O banco guarda resultados tipados, pequenos e imediatamente consultáveis, nunca respostas individuais.

O DDL executável está em `sql/schema.sql`, no schema `avalia_presencial_graph`.

## Estrutura

### Catálogos

- `questionario_versao`: versão imutável do questionário, início da vigência e hash do catálogo.
- `item_questionario`: coluna de origem, código, enunciado, dimensão, subdimensão e ordem de cada item.
- `agrupador`: dimensões, subdimensões, itens e atividades que aparecem nas saídas.
- `campus` e `curso`: entidades canônicas usadas nos filtros.

Os catálogos no repositório são a fonte da configuração; as tabelas preservam o significado histórico dos resultados.

### Semestre e procedência

`semestre` tem chave única `(ano, periodo)` e referencia exatamente uma versão de questionário. Também registra:

- versão da função de cálculo;
- versão e SHA-256 do catálogo de campi/cursos;
- nome e SHA-256 dos arquivos DISC e DOC;
- quantidade de linhas de cada fonte;
- momento da inserção.

Não existem estados de carga, versões ativa/candidata ou histórico de substituições. Um semestre existente nunca é atualizado.

### Recortes

`recorte` evita repetir semestre, campus e curso em toda linha de resultado. Existem quatro níveis, protegidos por `CHECK` e índices únicos parciais:

| Nível | Campus | Curso | Uso |
|---|---|---|---|
| `SEMESTRE` | nulo | nulo | Todos os campi e todos os cursos |
| `CAMPUS` | preenchido | nulo | Campus e todos os seus cursos |
| `CURSO` | nulo | preenchido | Curso somado em todos os campi onde existe |
| `CAMPUS_CURSO` | preenchido | preenchido | Curso em um campus específico |

Não se grava `TODOS` como entidade fictícia.

### Resultados

- `resultado_resumo`: total de participantes e campi melhor/pior avaliados.
- `resultado_media_likert`: soma, quantidade e média por agrupador.
- `resultado_proporcao_likert`: uma linha para cada valor `1..4`, inclusive quantidade zero.
- `resultado_boxplot`: mínimo, Q1, mediana, média, Q3, máximo e N.
- `resultado_boxplot_outlier`: valores individuais dos outliers, ligados à estatística.
- `resultado_atividade`: quantidade positiva, total e percentual.
- `ranking_media_curso`: top 20 final por média, com posição.
- `ranking_atividade_curso`: top 20 final por participação, com posição.

As tabelas armazenam numeradores e denominadores além do valor exibido. Isso permite validar os resultados e mudar apenas a apresentação sem voltar aos microdados.

## Chaves e integridade

- Todas as FKs usam chaves numéricas pequenas para reduzir índices e armazenamento.
- Resultados comuns usam PK `(recorte_id, agrupador_id)`.
- Proporções acrescentam `valor_likert` à PK.
- Outliers acrescentam `sequencia` e possuem FK composta para o boxplot correspondente.
- Rankings usam PK `(recorte_id, agrupador/instrumento, posicao)` e `UNIQUE` por curso.
- `CHECK`s limitam Likert a `1..4`, percentuais a `0..100`, posições a `1..20` e garantem a ordem dos quartis.
- FKs de resultados usam `ON DELETE RESTRICT`: dados publicados não são apagados em cascata.

## Índices

O caminho principal de leitura é:

1. localizar `semestre` por `(ano, periodo)` usando sua restrição única;
2. localizar `recorte` pelo índice `(semestre_id, campus_id, curso_id, nivel)`;
3. ler cada família pela PK iniciada em `recorte_id`;
4. juntar `agrupador` para rótulos e ordenação.

Índices adicionais nas métricas seriam redundantes para esse padrão e consumiriam espaço do limite de 500 MB. O catálogo tem um índice de ordenação por versão, instrumento, família e nível.

## Estratégia de carga

1. Resolver os arquivos e calcular seus hashes antes da gravação.
2. Selecionar a versão do questionário vigente para o semestre.
3. Normalizar cabeçalhos, campi e cursos e recusar valores fora dos catálogos.
4. Validar as duas fontes e calcular localmente os quatro recortes.
5. Produzir médias, proporções, atividades, boxplots, outliers, resumos e top 20.
6. Validar totais, faixas, quatro opções Likert e monotonicidade dos quartis.
7. Abrir uma transação, obter trava por semestre e verificar a inexistência de `(ano, periodo)`.
8. Inserir catálogos ausentes, semestre, recortes e resultados.
9. Confirmar a transação somente após a última tabela; qualquer erro desfaz tudo.

Não há `UPSERT` de semestre nem de resultados. Os únicos `ON CONFLICT` são dos catálogos imutáveis/reutilizáveis.

## Limite de 500 MB e crescimento

O volume cresce com a quantidade de combinações de filtros e itens, não com a quantidade de respostas individuais. Um novo semestre adiciona aproximadamente:

- quatro tipos de recorte para as combinações existentes de campus/curso;
- algumas linhas por agrupador para médias, boxplots e atividades;
- quatro linhas por agrupador para proporções;
- no máximo 20 linhas por ranking e escopo;
- outliers, que são a única parcela variável com a distribuição.

Esse crescimento é de ordens de grandeza menor que armazenar dezenas de respostas por participante. Particionamento físico não é indicado neste estágio: aumentaria objetos e índices sem benefício para o volume previsto. O tamanho deve ser acompanhado por semestre com `pg_total_relation_size`; se os outliers passarem a dominar o banco, eles são o primeiro candidato a uma política mais compacta.

Nas fontes atuais há 11 campi, 96 cursos canônicos e 154 combinações campus/curso, totalizando 262 recortes. Mesmo no limite superior de grupos presentes em todos os recortes, isso representa cerca de 115 mil linhas tipadas por semestre antes dos outliers. Dez semestres ficam na ordem de 1,15 milhão de linhas, volume compatível com 500 MB para este desenho enxuto. O script também consulta `pg_database_size` dentro da transação e desfaz a inserção se o banco ultrapassar 500 MB.
