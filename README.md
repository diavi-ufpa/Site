# Portal da Diretoria de Avaliação Institucional da UFPA

Este repositório é uma aplicação **Next.js (App Router)** para análise e geração de relatórios de avaliações institucionais (Avalia Presencial, Avalia EAD, Minha Opinião e Microdados), com:


- Dashboards interativos (gráficos, filtros e indicadores)
- Rotas de API para leitura de CSV e cache
- Módulos de relatório com geração/preview de PDF
- Componentes compartilhados de layout e navegação

Stack principal identificada em `package.json`:

- `next@16`, `react@19`, `react-dom@19`
- `chart.js`, `react-chartjs-2`, `chartjs-plugin-datalabels`, `@sgratzl/chartjs-chart-boxplot`, `apexcharts`
- `jspdf`, `jspdf-autotable`, `pdf-lib`, `html-to-image`
- `papaparse`, `pg`, `@vercel/blob`
