# Fundação da importação analítica

## Decisão

A administração de dados fica em `src/app/portal/admin/dados` e reutiliza o portal autenticado. A interface cliente conhece apenas metadados públicos da modalidade e chama APIs protegidas. Conexões, secrets e consultas permanecem no servidor.

O princípio é calcular na ingestão e servir resultados prontos ao dashboard. A fundação não cria schema nem persiste arquivos; ela prepara os limites entre interface, definição da modalidade, processamento e persistência.

## Camadas

- `modalities/registry.js`: catálogo declarativo com identificação, textos, instruções, FAQ, formatos aceitos e fonte de períodos.
- `components/`: navegação e estado visual. O arquivo selecionado não é lido nem enviado.
- `processing/load-contract.js`: vocabulário comum de etapas e estados, sem regra de negócio.
- `persistence/period-repository.js`: adaptadores server-only para leitura do banco.
- `app/api/admin/data-modalities/...`: fronteira autenticada com `requireAdminUser`.

## Como adicionar uma modalidade

1. Declarar metadados e conteúdo no registro.
2. Criar um módulo próprio com parser, normalização, validação e cálculos puros.
3. Criar um adaptador de persistência server-only, com transação e política explícita de duplicidade.
4. Associar os adaptadores à modalidade sem importar implementação server-side em componentes React.
5. Liberar a modalidade removendo o estado `coming-soon` somente quando seu contrato real estiver definido.

O registro é intencionalmente pequeno. Quando a primeira modalidade real for conectada, o vínculo de processador e persistência deve ficar em um registro exclusivamente server-side, evitando que dependências pesadas ou secrets entrem no bundle do navegador.

## Compatibilidade de execução

Os ETLs existentes usam Python, pandas/numpy e arquivos locais. Eles podem ser executados localmente como processos separados, mas não devem ser chamados diretamente por uma função serverless da Vercel sem avaliar tamanho, duração, runtime Python e filesystem efêmero. A fronteira de processamento deve permitir três executores futuros: processo local, worker/fila externa ou implementação Node server-side quando houver justificativa.

## Decisões adiadas

- contrato real dos arquivos e regras da primeira modalidade;
- estratégia de preview e retenção temporária do upload;
- executor local versus worker hospedado;
- schema comum de histórico de cargas e política de substituição;
- unificação do schema legado `avalia` com `avalia_presencial_graph`;
- limite de arquivo, timeout, auditoria e recuperação de falhas.
