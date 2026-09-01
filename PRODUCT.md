# Product

## Register

product

## Users

Equipes técnicas e administrativas da DIAVI/CPA que preparam, validam, publicam e consultam dados de avaliações institucionais. A ferramenta local de cargas é usada por operadores autorizados em um computador institucional, com atenção à integridade dos arquivos e ao semestre publicado.

## Product Purpose

Centralizar a análise institucional e tornar a ingestão de dados previsível e segura. O site serve resultados consolidados; o aplicativo desktop executa localmente os ETLs pesados, valida as fontes antes de qualquer gravação e publica somente resultados agregados no banco consumido pelo site.

## Brand Personality

Institucional, confiável e direta. A interface deve transmitir controle operacional e clareza sem parecer burocrática ou excessivamente técnica.

## Anti-references

Não deve parecer um painel SaaS promocional, um utilitário de terminal disfarçado ou uma interface decorativa. Evitar excesso de cartões, efeitos visuais gratuitos, linguagem ambígua e ações irreversíveis sem confirmação explícita.

## Design Principles

1. Tornar o estado da carga visível em cada etapa.
2. Validar localmente antes de permitir qualquer publicação.
3. Tratar operações imutáveis como decisões explícitas e informadas.
4. Manter segredos e dados brutos fora da interface web.
5. Preservar a linguagem visual institucional já reconhecida no portal.

## Accessibility & Inclusion

Manter contraste compatível com WCAG AA, foco visível, textos e controles legíveis, navegação completa por teclado e feedback que não dependa apenas de cor. Animações devem ser breves e limitadas a mudanças de estado.

## UI & UX Search Standard (Padrão de Buscas e Filtros)

1. **Card de Filtros (White Card Standard):** Todos os painéis de filtro no portal devem ser renderizados como cards brancos proeminentes com fundo `#ffffff`, bordas `#e5e7eb`, cantos arredondados `16px`, sombra suave (`box-shadow: 0 4px 14px rgba(0,0,0,0.04)`), sem gaveteiros colapsáveis padrão que ocultem seleção obrigatória.
2. **Disclosure Progressivo com Stepper:** Buscas com dependências hierárquicas (ex: Ano ➔ Campus/Polo ➔ Curso ➔ Disciplina) devem utilizar fluxo sequencial em passos numerados (`1`, `2`, `3`), onde opções dependentes só habilitam após preenchimento do pré-requisito e exibem *placeholders* bloqueados amigáveis.
3. **In-Content Loading (Skeleton UI):** O carregamento de consultas deve ocorrer exclusivamente dentro da área de conteúdo (utilizando `DashboardSkeleton` ou overlays delimitados), mantendo a barra lateral (`Sidebar`) e o cabeçalho 100% visíveis e interativos.
4. **Empty State Receptivo:** Quando os filtros obrigatórios não estiverem selecionados, a área de dados deve exibir um card de orientação amigável (Empty State) em vez de mensagens de erro ríspidas ou dados parciais pré-carregados.

