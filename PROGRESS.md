# 🎯 Objetivo Atual
Equalizar a feature do Relatório Presencial (`Site`) com o Dashboard AVALIA UFPA (Fonte da Verdade), corrigindo boxplots, tabelas descritivas, quantitativos da Tabela 1 e estilização visual.

## 📍 Estado Atual (Onde paramos)
- [x] Diagnóstico completo das divergências entre `Dashboard AVALIA UFPA` e a feat do Relatório (`Site`).
- [x] Mapeamento dos erros dos boxplots (hastes até o min/max, cores, deduplicação por oferta).
- [x] Mapeamento dos erros de layout (tabelas invertidas, orientação retrato em vez de paisagem).
- [x] **Boxplots:** Reescrito `drawBoxplotDirect` em `relatorio-presencial-client.js` ajustando hastes para `1.5 * IQR`, cor de preenchimento (`#288FB4`), outliers cinzas (`#B4B4B8`) e limites do eixo Y (`1` a `4`).
- [x] **Tabelas Descritivas (T2 a T8):** Ajustado `addDescritivasTable` para manter estatísticas fixas nas linhas (Min, 1º Q., Mediana, Média, 3º Q., Max) e itens/dimensões nas colunas.
- [x] **Tabela 1:** Ajustada contagem de turmas para utilizar `DISCIPLINA` única em vez de `ID` da oferta.
- [x] **Diagramação PDF:** Adicionadas páginas em modo `landscape` (paisagem) para gráficos amplos de proporção e participação em atividades.
- [x] **Limpeza & Roteamento:** Removidas referências a arquivos EAD em `presencial-report-data.js` e validados fluxos de geração.
- [x] **Cálculos de Boxplots e Tabelas Descritivas:** Corrigido `_disc_media_long` em `graph_calculator.py` para utilizar a base discente completa no cálculo das estatísticas descritivas dos boxplots, batendo 100% com as estatísticas de referência do Dashboard R (`relatorio_pdf.Rmd`).

## ⏳ Próximos Passos
- [ ] Executar o reprocessamento dos scripts do ETL (`load_graph_db.py`) para atualizar o banco de dados/planilhas com as novas estatísticas de boxplots corrigidas.
- [ ] Testar e validar a geração completa de relatórios PDF presenciais com dados reais do banco/ETL.

## ⚠️ Decisões & Observações Importantes
- O Dashboard R (`Dashboard AVALIA UFPA`) é a verdade absoluta para construção, aparência e resultados.
- Documento mantido de acordo com as diretrizes do `AGENTS.md` (curto e enxuto).

