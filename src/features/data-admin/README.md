# Fundação da importação analítica

A área fica em `/portal/admin/dados`, reutiliza a autenticação do portal e aplica `requireAdminUser` em toda API. Metadados públicos podem chegar ao cliente; conexões, consultas, processamento e secrets permanecem no servidor.

## Camadas

- `modalities/registry.js`: identificação, textos, instruções, FAQ, formatos e fonte de períodos.
- `components/`: navegação e estado visual; nesta etapa o arquivo não é lido nem enviado.
- `processing/load-contract.js`: etapas e estados comuns, sem regras de negócio.
- `persistence/period-repository.js`: leitura server-only do banco.
- `app/api/admin/data-modalities/...`: fronteira autenticada.

## Nova modalidade

1. Declarar seus metadados no registro.
2. Criar parser, normalização, validação e cálculos em um módulo próprio.
3. Criar persistência server-only com transação e política explícita de duplicidade.
4. Associar as implementações em um registro exclusivamente server-side.
5. Remover `coming-soon` somente após definir o contrato real.

O vínculo com implementações pesadas deve ficar fora do registro enviado ao navegador.

## Decisões adiadas

- contrato dos arquivos da primeira modalidade;
- upload temporário e preview;
- executor local, worker externo ou implementação Node;
- histórico, versionamento e substituição de cargas;
- eventual convergência dos schemas `avalia` e `avalia_presencial_graph`;
- limites de arquivo, timeout, auditoria e recuperação.

Os ETLs atuais usam Python, pandas e filesystem local. Chamá-los em uma função da Vercel exige avaliação prévia de duração, tamanho, runtime e filesystem efêmero.
