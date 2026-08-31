# 🎯 Objetivo Atual
Reestruturar a interface gráfica e a UX das buscas e carregamento no AVALIA Presencial na nova branch `fix/ui-consulta`:
1. Eliminar o carregamento em tela cheia (fullscreen overlay) que cobria a barra lateral/menu.
2. Substituir o padrão antigo de filtros por um fluxo de **Disclosure Progressivo com Stepper Visual** (Ano -> Campus -> Curso), removendo opções desabilitadas confusas e adicionando ação de limpar filtros.
3. Adicionar componente **DashboardSkeleton** para carregamento fluido em conteúdo (preservando o menu lateral intacto).
4. Criar um **Empty State** receptivo orientando a seleção dos filtros.

## 📍 Estado Atual (Onde paramos)
- [x] Branch `fix/ui-consulta` criada a partir da `main` atualizada.
- [x] **Substituição do Fullscreen Loading por In-Content Skeleton:**
  - `LoadingOverlay.js` atualizado para padrão de escopo por container (`isFullScreen = false`).
  - Criado o componente `DashboardSkeleton.js` com animação de shimmer para cards de estatística, abas e área de gráficos.
  - `DiscenteDashboardClient.js` ajustado para manter o menu lateral e o cabeçalho 100% visíveis e funcionais durante qualquer carregamento.
- [x] **Redesenho do Componente de Filtros (`DiscenteFilterAvalia.js`):**
  - Removido o botão colapsável que escondia os filtros necessários.
  - Implementado fluxo em passos numéricos (`1. Ano` -> `2. Campus` -> `3. Curso` -> `Dimensão opcional`).
  - Passos bloqueados mostram placeholders claros ("Aguardando seleção do ano/campus") em vez de selects desabilitados com texto de erro estático.
  - Adicionado botão **"Limpar filtros"** com 1 clique e indicadores visuais de progresso (badges de status `✓`).
- [x] **Novo Empty State Informativo:**
  - Substituído a mensagem de erro vermelha no quadro de gráficos por um card de boas-vindas receptivo orientando o usuário.
- [x] **Validação e Build:**
  - Executado `npm run build` com sucesso (100% das 25 páginas estáticas e rotas dinâmicas compiladas sem erros).

## ⏳ Próximos Passos
- Apresentar a nova UX e UI do Avalia Presencial ao usuário.
- Caso aprovado, expandir o novo padrão de UI/UX de busca e carregamento para os demais módulos do portal.

## ⚠️ Decisões & Observações Importantes
- O menu lateral (`Sidebar`) permanece 100% visível, clicável e responsivo em qualquer estado de carregamento do conteúdo.
- Toda a reestruturação foi focada estritamente no AVALIA Presencial nesta primeira fase conforme solicitado.
