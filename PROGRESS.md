# 🎯 Objetivo Atual
Reestruturar a interface gráfica e a UX das buscas e carregamento no AVALIA Presencial e AVALIA EAD na branch `fix/ui-consulta`:
1. Eliminar o carregamento em tela cheia (fullscreen overlay) que cobria a barra lateral/menu.
2. Substituir o padrão antigo de filtros por um fluxo de **Disclosure Progressivo com Stepper Visual** (Ano -> Polo/Campus -> Curso -> Disciplina), removendo a carga automática antes de o usuário selecionar os filtros.
3. Aplicar o componente **DashboardSkeleton** para carregamento fluido em conteúdo no Avalia Presencial e Avalia EAD (preservando o menu lateral intacto).
4. Criar um **Empty State** receptivo orientando a seleção dos filtros no Presencial e EAD.

## 📍 Estado Atual (Onde paramos)
- [x] Branch `fix/ui-consulta` criada a partir da `main` atualizada.
- [x] **Substituição do Fullscreen Loading por In-Content Skeleton:**
  - `LoadingOverlay.js` atualizado para padrão de escopo por container (`isFullScreen = false`).
  - Criado o componente `DashboardSkeleton.js` com animação de shimmer para cards de estatística, abas e área de gráficos.
  - Aplicado `DashboardSkeleton` nas páginas do Avalia Presencial e Avalia EAD, mantendo a Sidebar 100% visível.
- [x] **Redesenho & Lógica Sequencial de Filtros EAD (`EadFilters.js` & `EadDashboardClient.js`):**
  - Removido o carregamento automático inicial de dados do EAD antes da seleção dos filtros.
  - Implementada a seleção em passos encadeados: `1. Ano` -> `2. Polo` -> `3. Curso` -> `4. Disciplina`.
  - Passos bloqueados exibem placeholders claros ("Aguardando seleção do ano/polo/curso") com ícone visual.
  - Adicionado card informativo de **Empty State** quando a seleção dos filtros obrigatórios ainda não foi concluída.
  - Adicionado botão **"Limpar filtros"** para reset rápido.
- [x] **Validação e Build:**
  - Executado `npm run build` com sucesso (100% das 25 páginas estáticas e rotas dinâmicas compiladas sem erros).

## ⏳ Próximos Passos
- Commit semântico das alterações do Avalia EAD sem coautor.
- Apresentar a nova UX/UI unificada com fluxo sequencial e sem carga automática prévia.

## ⚠️ Decisões & Observações Importantes
- O menu lateral (`Sidebar`) permanece 100% visível, clicável e responsivo em qualquer estado de carregamento do conteúdo.
- O EAD agora segue estritamente a mesma lógica do Presencial: requer seleção de Ano, Polo (quando aplicável) e Curso antes de exibir os gráficos.
