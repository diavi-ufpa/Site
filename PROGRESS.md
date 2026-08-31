# 🎯 Objetivo Atual
Reestruturar a interface gráfica e a UX das buscas e carregamento no AVALIA Presencial e AVALIA EAD na branch `fix/ui-consulta`:
1. Eliminar o carregamento em tela cheia (fullscreen overlay) que cobria a barra lateral/menu.
2. Padronizar o card de filtros para card branco proeminente (`#ffffff`, bordas `#e5e7eb`, cantos `16px`, sombra suave) no Presencial e EAD.
3. Substituir o padrão antigo de filtros por um fluxo de **Disclosure Progressivo com Stepper Visual** (Ano -> Polo/Campus -> Curso -> Disciplina).
4. Registrar o padrão no `PRODUCT.md`.

## 📍 Estado Atual (Onde paramos)
- [x] Branch `fix/ui-consulta` criada a partir da `main` atualizada.
- [x] **Substituição do Fullscreen Loading por In-Content Skeleton:**
  - `LoadingOverlay.js` atualizado para padrão de escopo por container (`isFullScreen = false`).
  - Criado o componente `DashboardSkeleton.js` com animação de shimmer para cards de estatística, abas e área de gráficos.
  - Aplicado `DashboardSkeleton` nas páginas do Avalia Presencial e Avalia EAD, mantendo a Sidebar 100% visível.
- [x] **Padronização de Card Branco nos Filtros (`DiscenteFilterAvalia.js` & `EadFilters.js`):**
  - Corrigida a classe `filtersContainer` no Presencial para aplicar o card branco idêntico ao EAD (`background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.04)`).
  - Registrado o padrão oficial em `PRODUCT.md` sob a seção **UI & UX Search Standard**.
- [x] **Validação e Build:**
  - Executado `npm run build` com sucesso.

## ⏳ Próximos Passos
- Commit semântico das alterações sem coautor.

## ⚠️ Decisões & Observações Importantes
- O menu lateral (`Sidebar`) permanece 100% visível, clicável e responsivo em qualquer estado de carregamento do conteúdo.
- Registrado oficialmente o padrão visual e comportamental para consultas no documento de produto (`PRODUCT.md`).
