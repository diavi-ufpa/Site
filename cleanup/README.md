# DIAVI Cleanup

Aplicativo desktop local para validar e publicar dados consumidos pelo site da DIAVI. A primeira integração disponível é o **Avalia Presencial**.

O processamento pesado permanece no computador do operador. O aplicativo usa o ETL localizado em `avalia_etl/`, valida o par DISC/DOC sem tocar no banco e, após confirmação, grava somente resultados agregados no PostgreSQL do site.

## Requisitos

- Python 3.11 ou superior;
- acesso de rede ao PostgreSQL de resultados;
- arquivos brutos DISC e DOC em CSV ou XLSX.

## Instalação

No diretório `cleanup/`, crie e ative um ambiente virtual e instale as dependências:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Copie `.env.example` para `.env` e informe a conexão, ou cole a URL apenas durante a sessão do aplicativo:

```dotenv
AVALIA_PRESENCIAL_GRAPH_DATABASE_URL=postgresql://...
```

O aplicativo também reconhece a variável equivalente em `Site/.env.local`. Arquivos `.env` não são versionados.

## Uso

Inicie a interface a partir de `cleanup/`:

```powershell
python app.py
```

Fluxo recomendado:

1. informe a conexão e clique em **Verificar conexão**;
2. na primeira utilização do banco, clique em **Criar estrutura do banco**;
3. selecione ano, período e os arquivos `DISC_AAAA_P` e `DOC_AAAA_P`;
4. clique em **Validar arquivos** — essa etapa não acessa nem altera o banco;
5. revise o registro, confirme a imutabilidade e clique em **Publicar no site**.

## Garantias

- a URL do banco não é escrita no registro;
- a publicação só é habilitada depois de uma validação bem-sucedida dos mesmos arquivos;
- tamanho e data de modificação são conferidos novamente antes da publicação;
- semestres existentes são recusados;
- a gravação do semestre ocorre em uma única transação;
- fechar a janela durante uma publicação é bloqueado;
- arquivos brutos e respostas individuais não são persistidos no banco de gráficos.

## Estrutura

- `app.py`: ponto de entrada da interface PySide6;
- `cleanup_app/`: componentes da interface e integração local;
- `avalia_etl/`: código de cálculo e persistência movido do repositório `Trata-Dados`;
- `avalia_etl/sql/schema.sql`: estrutura do banco de resultados.

O script legado `avalia_etl/scripts/etl_load_db.py` foi preservado apenas como referência e não é chamado pelo aplicativo.

