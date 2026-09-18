# 🎯 Objetivo Atual
Substituir a animação de carregamento com ícone girando por placeholders (Skeleton UI) na alternância entre abas no Avalia Presencial.

## 📍 Estado Atual (Onde paramos)
- [x] **Criação do componente `TabContentSkeleton`:**
  - Criado `src/components/ui/TabContentSkeleton.js` com layout em cards brancos, shimmer animation, placeholders para títulos, gráficos de barras e tabelas/distribuições.
- [x] **Substituição do `LoadingOverlay` giratório no Avalia Presencial:**
  - Em `DiscenteDashboardClient.js`, removido o `<LoadingOverlay />` com spinner circular.
  - Inserido `<TabContentSkeleton />` como placeholder nativo exibido imediatamente durante a transição das abas (*Dimensões Gerais*, *Autoavaliação Discente*, *Avaliação da Ação Docente*, *Instalações Físicas* e *Atividades Acadêmicas*).
  - Adicionado placeholder skeleton para carregamento de rankings contextuais (`RankingSkeleton`).
  - Atualizado `DashboardSkeleton.js` para reaproveitar `TabContentSkeleton`.
- [x] **Validação e Build:**
  - Executado `npm run build` com sucesso (código de saída 0).

## ⏳ Próximos Passos
- Apresentar o resultado ao usuário para validação visual.

## ⚠️ Decisões & Observações Importantes
- Cards de estatísticas e a barra de abas permanecem visíveis e estáveis durante a alternância entre abas.
- Zero layout shift (CLS) ou piscar de tela ("flicker"): o placeholder surge instantaneamente enquanto a API responde.
