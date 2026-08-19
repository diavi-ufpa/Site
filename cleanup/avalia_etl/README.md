# ETL de resultados — Avalia Presencial

Este diretório calcula localmente todos os dados usados pelos gráficos do Avalia Presencial e grava somente resultados agregados em um PostgreSQL independente. Respostas individuais, matrículas, ofertas e planilhas brutas não são persistidas.

O código agora integra o aplicativo local em `cleanup/`. Para o fluxo operacional, use a interface PySide6 descrita em `../README.md`; a execução por linha de comando continua disponível para diagnóstico técnico.

## Componentes

- `graficos.md`: contrato funcional dos gráficos e das fórmulas.
- `config/questionarios.json`: versões do questionário por vigência semestral.
- `config/entidades.json`: nomes canônicos e aliases de campi e cursos.
- `sql/schema.sql`: DDL do banco dedicado de resultados.
- `scripts/load_graph_db.py`: leitura, validação, pré-cálculo e carga atômica.
- `help/db_model.md`: explicação da modelagem, chaves, índices e crescimento.

O script anterior, `scripts/etl_load_db.py`, pertence ao modelo legado de respostas individuais e não deve ser usado no novo banco.

## Configuração

Instale as dependências:

```bash
pip install -r requirements.txt
```

Defina no `.env` a URL exclusiva do novo banco:

```dotenv
AVALIA_PRESENCIAL_GRAPH_DATABASE_URL=postgresql://...
```

Crie o esquema executando `sql/schema.sql` no banco de gráficos.

## Entrada

Cada semestre exige exatamente dois arquivos, um `DISC` e um `DOC`, em CSV ou XLSX. Um XLSX deve conter exatamente uma planilha; mais de uma provoca erro.

Quando os caminhos não forem informados, os arquivos são descobertos em `data/` pelos nomes:

- `DISC_<ANO>_<PERIODO>.csv|xlsx`
- `DOC_<ANO>_<PERIODO>.csv|xlsx`

## Execução

Com descoberta automática:

```bash
python scripts/load_graph_db.py --semester 2024-2
```

Com caminhos explícitos:

```bash
python scripts/load_graph_db.py --semester 2024-2 --disc caminho/DISC_2024_2.xlsx --doc caminho/DOC_2024_2.xlsx
```

Somente cálculo e validação local:

```bash
python scripts/load_graph_db.py --semester 2024-2 --dry-run
```

## Garantias da carga

- O semestre é imutável: se `(ano, período)` já existir, a carga é recusada.
- A gravação ocorre em uma única transação; erro em qualquer etapa não deixa semestre parcial.
- Uma trava transacional impede duas inserções concorrentes do mesmo semestre.
- Os hashes SHA-256, nomes dos arquivos, quantidades de linhas, versão do questionário e versão do cálculo ficam registrados no semestre.
- Campi, cursos e perguntas desconhecidos interrompem a carga e exigem atualização explícita dos catálogos.
- Rankings armazenam somente o top 20 final, incluindo posição e critérios de desempate.

## Evolução

Para um novo semestre com o mesmo questionário, basta fornecer os novos arquivos. Quando perguntas, agrupamentos ou textos mudarem, adicione uma nova entrada em `config/questionarios.json` com `vigente_desde` e um novo `codigo`; resultados históricos continuam ligados à versão anterior.
