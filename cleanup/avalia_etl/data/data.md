# Fontes do Avalia Presencial

## Organização

Cada semestre fornece dois arquivos oficiais:

- `DISC_<ANO>_<PERIODO>.csv|xlsx`;
- `DOC_<ANO>_<PERIODO>.csv|xlsx`.

Os arquivos podem ficar em qualquer subdiretório de `data/`. A descoberta automática exige exatamente um arquivo de cada instrumento para o semestre informado. Arquivos `*_SNTZD` são derivados legados e não são aceitos como fonte.

## Formatos

### CSV

- UTF-8 com ou sem BOM;
- delimitador `;`;
- uma linha de cabeçalho.

### XLSX

- exatamente uma planilha;
- mais de uma planilha interrompe a execução;
- os mesmos cabeçalhos lógicos do CSV.

## Normalização

O ETL trabalha em memória e não altera a fonte:

- remove espaços periféricos dos cabeçalhos;
- remove acentos, usa caixa alta e `_` nos nomes técnicos das colunas;
- normaliza espaços, caixa e acentos para localizar campi e cursos;
- substitui aliases pelos nomes canônicos de `config/entidades.json`;
- descarta linhas completamente vazias antes das validações e dos cálculos;
- converte vírgula decimal nas colunas `MEDIAP...`;
- trata vazios de atividades como zero;
- interpreta `X` como checkbox marcado (`1`) nas atividades;
- trata os campos textuais de outra atividade como participação quando preenchidos:
  `4.1.1.R` em DISC e `4.1.1.P` em DOC.

Campi, cursos ou itens desconhecidos provocam erro. Novas entidades devem ser adicionadas ao catálogo; novas perguntas exigem uma nova versão em `config/questionarios.json`.

## Colunas de contexto

Ambas as fontes precisam de `CAMPUS` e `CURSO`.

DISC também exige:

- `MATRICULA`, usada somente em memória para contagem distinta;
- `ID`, usado somente em memória para identificar oferta nos boxplots;
- itens Likert e respectivas colunas `MEDIAP...` da versão vigente;
- atividades definidas no questionário.

DOC também exige:

- `ANO` e `PERIODO`; valores preenchidos devem coincidir com a execução, e células
  vazias são aceitas quando não há declaração divergente no arquivo;
- `CODIGO`, `CODIGO_TURMA` e/ou `DOCENTE` para identificar a oferta;
- itens Likert e atividades da versão vigente.

Nenhuma dessas linhas ou identificadores é enviada ao PostgreSQL. Somente os resultados descritos em `graficos.md` são persistidos.
