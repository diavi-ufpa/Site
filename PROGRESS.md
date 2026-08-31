# 🎯 Objetivo Atual
Reestruturar a interface gráfica e a UX das buscas e carregamento no AVALIA Presencial e AVALIA EAD na branch `fix/ui-consulta`:
1. Eliminar o carregamento em tela cheia (fullscreen overlay) que cobria a barra lateral/menu.
2. Substituir o padrão antigo de filtros por um fluxo de **Disclosure Progressivo com Stepper Visual**, removendo gaveteiros colapsáveis e opções desabilitadas confusas.
3. Aplicar o componente **DashboardSkeleton** para carregamento fluido em conteúdo no Avalia Presencial e Avalia EAD (preservando o menu lateral intacto).
4. Criar um **Empty State** receptivo orientando a seleção dos filtros.

## 📍 Estado Atual (Onde paramos)
- [x] Branch `fix/ui-consulta` criada a partir da `main` atualizada.
- [x] **Substituição do Fullscreen Loading por In-Content Skeleton:**
  - `LoadingOverlay.js` atualizado para padrão de escopo por container (`isFullScreen = false`).
  - Criado o componente `DashboardSkeleton.js` com animação de shimmer para cards de estatística, abas e área de gráficos.
  - Aplicado `DashboardSkeleton` nas páginas do Avalia Presencial e Avalia EAD (`src/app/portal/ead/page.js`), mantendo o menu lateral 100% visível.
- [x] **Redesenho dos Filtros (`DiscenteFilterAvalia.js` & `EadFilters.js`):**
  - Removido o botão colapsável que escondia os filtros necessários.
  - Implementado fluxo em passos numéricos (`1. Ano` -> `2. Polo/Campus` -> `3. Curso` -> `4. Disciplina` -> `Dimensão opcional`).
  - Adicionado botão **"Limpar filtros"** com 1 clique e indicadores visuais de progresso (badges de status `✓`).
- [x] **Validação e Build:**
  - Executado `npm run build` com sucesso (100% das 25 páginas estáticas e rotas dinâmicas compiladas sem erros).

## ⏳ Próximos Passos
- Commit semântico das alterações do Avalia EAD sem coautor.
- Apresentar a nova UX/UI unificada do Presencial e EAD ao usuário.

## ⚠️ Decisões & Observações Importantes
- O menu lateral (`Sidebar`) permanece 100% visível, clicável e responsivo em qualquer estado de carregamento do conteúdo.
- Toda a lógica matemática, agregadores e componentes de gráficos ApexCharts e Chart.js do EAD permaneceram 100% intactos.
