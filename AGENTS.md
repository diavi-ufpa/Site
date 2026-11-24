# Context Router & Workspace Map (`Site/AGENTS.md`)

Este arquivo atua como o **roteador de contexto** e mapa estrutural para agentes de IA que operam no projeto **Site** (Portal da Diretoria de Avaliação Institucional - DIAVI/UFPA).

---

## 🗺️ Mapa Estrutural do Projeto (`Site/`)

| Diretório / Arquivo | Responsabilidade | Tecnologias / Conteúdo |
| :--- | :--- | :--- |
| `src/app/` | Rotas, layouts e páginas da aplicação (App Router) e endpoints de API internos. | Next.js App Router (`/portal`, `/avaliacao`, `/login`, `/api`) |
| `src/components/` | Componentes visuais compartilhados e biblioteca de UI da interface. | React, Tailwind CSS (`charts/`, `ui/`, skeletons, filtros) |
| `src/contexts/` | Gerenciamento de estado global via React Contexts. | Contextos de filtros ativos, dados carregados e estados de sessão |
| `src/features/` | Lógica de negócio, visualizações e componentes específicos por domínio de avaliação. | `avalia/`, `avaliacaoInLoco/`, `minhaopiniao/`, `data-admin/` |
| `src/lib/` | Camada de dados, clientes de banco, transformações e mapeamentos institucionais. | Neon/Postgres, Firebase, DuckDB, mapeamentos de perguntas e dimensões |
| `src/styles/` | Estilos globais e configurações de CSS/Tailwind. | `globals.css`, tokens de design e personalizações |
| `public/` | Arquivos estáticos servidos diretamente pelo Next.js. | Logos institucionais (DIAVI/CPA), questionários em PDF, imagens |
| `data/` | Bases de dados locais de apoio, dados de referência e amostras. | Dados das modalidades (`avalia`, `in-loco`, `minha-opiniao`) |
| `docs/` | Documentação técnica interna de arquitetura e decisões de engenharia. | Autenticação, estratégias de cache de filtros, diagramas |
| `cleanup/` | Módulo utilitário local em Python para validação e sanitização pré-publicação de dados. | Scripts ETL locais, validações e regras de consistência |

---

## 📋 Diretrizes de Operação & Pair Programming

### Protocolo do Documento de Estado (`PROGRESS.md`)
- O arquivo `PROGRESS.md` registra a task ativa e o status atual de execução.
- **Formato Enxuto:** Mantenha o arquivo curto (máx. 35 linhas), focado apenas no estado presente (Objetivo, Onde Paramos, Próximos Passos e Notas).
- **Atualização Cirúrgica:** Atualize o `PROGRESS.md` sempre que concluir etapas relevantes ou trocar de foco.
