# Estratégia de Cache e Otimização para Filtros de Consultas (Diavi)

Este documento registra a análise técnica e as opções arquiteturais para otimizar o carregamento dos filtros de consultas no sistema Diavi (anos/semestres, campi, cursos, modalidades e dimensões).

---

## 1. Contexto e Diagnóstico do Cenário Atual

### O Problema
Atualmente, a seleção de filtros nos dashboards opera em **cascata de rede**:
1. O usuário entra na página ➔ O sistema dispara uma requisição para listar os **Anos**.
2. O usuário seleciona um Ano ➔ O sistema dispara outra requisição para buscar os **Campi** daquele ano.
3. O usuário seleciona um Campus ➔ O sistema dispara outra requisição para buscar os **Cursos** daquele campus.

### Por que existe lentidão perceptível?
1. **Natureza dos Dados vs. Frequência de Consulta:**
   - Metadados de filtros são **praticamente estáticos** (só mudam quando novas avaliações/semestres são importados).
   - Porém, a cada clique ou troca de aba, novas queries com `SELECT DISTINCT`, `JOIN` e filtros textuais são disparadas contra o banco de dados (Neon / PostgreSQL).
2. **Ausência de Cache HTTP:**
   - As rotas de API retornam cabeçalhos como `'Cache-Control': 'no-store, max-age=0'`, impedindo que o navegador armazene as respostas em disco local ou memória.
3. **Múltiplos Round-trips de Rede:**
   - Cada etapa da cascata exige tempo de ida e volta (latência de rede + conexão do banco serverless), acumulando atrasos perceptíveis para o usuário final.

---

## 2. Detalhamento das Opções de Solução

```
                    ┌──────────────────────────────────────────────────┐
                    │           Opção 1: Cache HTTP / CDN              │
                    │  (Mantém chamadas em cascata, mas 0ms após 1ª)  │
                    └──────────────────────────────────────────────────┘
                                             ou
                    ┌──────────────────────────────────────────────────┐
                    │      Opção 2: Árvore de Filtros (Batch)          │
                    │  (1 única chamada leve traz todo o mapeamento)   │
                    └──────────────────────────────────────────────────┘
                                             ou
                    ┌──────────────────────────────────────────────────┐
                    │       Estratégia Recomendada (Opção 1 + 2)       │
                    │  (Árvore única com cabeçalho de Cache HTTP)      │
                    └──────────────────────────────────────────────────┘
```

---

### 🔵 Opção 1: Cache HTTP + CDN (`stale-while-revalidate`)

#### Como Funciona
Mantém a lógica e as rotas atuais (`/filters`, `/filters/campus`, `/filters/cursos`), mas instrui o navegador e as camadas de borda (CDN / Vercel) a armazenarem as respostas.

Com a diretiva `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`:
* **1ª consulta:** O navegador busca no servidor normalmente e grava a resposta em cache.
* **Consultas seguintes:** O navegador responde instantaneamente do disco local (0ms).
* **Ao expirar o `max-age`:** O navegador entrega os dados do cache imediatamente para o usuário e atualiza o conteúdo em segundo plano (`stale-while-revalidate`).

#### O que mudaria no código e infraestrutura:
* **Banco de Dados:** Nenhuma alteração. O volume de queries cai em ~90%.
* **Servidor (Next.js API Routes):**
  - Nas rotas de filtro (ex: `src/app/api/avalia-graph/route.js`, `src/app/api/microdados-db/route.js`, `src/app/api/avaliacao-in-loco/filters/route.js`), substituir `no-store` por:
    ```javascript
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    }
    ```
* **Frontend:** Nenhuma mudança visual. Apenas garantir que os `fetch` não utilizem `cache: 'no-store'`.

#### Prós e Contras:
- ✅ **Pró:** Implementação quase imediata (poucas linhas de código).
- ✅ **Pró:** Zero risco de quebrar regras de negócio existentes.
- ❌ **Contra:** A primeiríssima seleção de cada filtro por um novo usuário ainda sofre com a latência de múltiplos round-trips.

---

### 🟢 Opção 2: Carga Única da Árvore de Filtros (Tree Payload / Batch)

#### Como Funciona
Elimina a cascata de rede. Em vez de fazer 3 requisições separadas para saber quais opções estão disponíveis, o frontend faz **uma única requisição inicial** que retorna toda a árvore de relacionamentos do semestre/ano.

#### Estrutura do Payload (Exemplo):
```json
{
  "2024.2": {
    "campi": ["Belém", "Cametá", "Castanhal"],
    "cursosPorCampus": {
      "Cametá": ["Agronomia", "Sistemas de Informação"],
      "Belém": ["Ciência da Computação", "Engenharia Civil", "Medicina"]
    }
  },
  "2023.4": {
    "campi": ["Belém", "Abaetetuba"],
    "cursosPorCampus": {
      "Belém": ["Ciência da Computação"],
      "Abaetetuba": ["Engenharia Industrial"]
    }
  }
}
```
*Tamanho estimado para a UFPA (todos os semestres): **15 a 30 KB comprimido**.*

#### O que mudaria no código e infraestrutura:
* **Banco de Dados:**
  - Uma query agrupada ou montagem via JSON agregando `semestre -> campus -> curso`.
  - *(Opcional)* Pré-salvar essa estrutura pronta em tabela de lookup durante a execução do script de ETL.
* **Servidor (Next.js API Routes):**
  - Criar/adaptar um endpoint (ex: `GET /api/avalia-graph?endpoint=/filters/tree`).
  - O backend processa e retorna a árvore consolidada.
* **Frontend (React / Componentes de Filtro):**
  - Na montagem do dashboard, busca a `filterTree` uma única vez e guarda no estado (`useState` ou Context).
  - Quando o usuário altera o dropdown de **Ano**, o React lê os campi disponíveis diretamente da memória:
    ```javascript
    const availableCampi = filterTree[selectedAno]?.campi || [];
    ```
  - Quando altera o **Campus**, lê os cursos diretamente da memória:
    ```javascript
    const availableCursos = filterTree[selectedAno]?.cursosPorCampus[selectedCampus] || [];
    ```
  - Removem-se todos os estados de `loadingCampus` e `loadingCurso`.

#### Prós e Contras:
- ✅ **Pró:** Experiência do usuário (UX) perfeita: dropdowns 100% instantâneos sem nenhum tempo de espera.
- ✅ **Pró:** Reduz o número de requisições disparadas pelo frontend.
- ❌ **Contra:** Exige uma refatoração moderada no gerenciamento de estado dos componentes de filtro.

---

## 3. A Estratégia Recomendada (Opção 1 + Opção 2)

A abordagem com melhor custo-benefício e performance no ecossistema Next.js/React é a união das duas:

1. **Backend:** Fornece o endpoint consolidado da **Árvore de Filtros** (Opção 2).
2. **Cabeçalhos HTTP:** Esse endpoint responde com `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` (Opção 1).
3. **Frontend:** Carrega a árvore uma única vez por sessão e realiza as trocas de dropdown de forma síncrona em memória.

### Resultado Esperado:
- **Latência percebida nos selects:** **0 ms**.
- **Carga de queries de metadados no banco:** Próxima de **zero**.
- **Resiliência:** Mesmo em conexões lentas (3G / mobile), após abrir o portal, a navegação entre filtros não sofre engasgos.

---

## 4. Política de Invalidação de Cache

Como os dados de filtros são atualizados esporadicamente (apenas quando novos semestres são cadastrados via Admin ou ETL):

1. **Invalidação por Versão / Timestamp (URL versioning):**
   - Incluir um parâmetro de versão ou hash da base na URL de filtros (ex: `/api/.../filters?v=2026.1`).
   - Quando um novo lote de dados for inserido, o valor de versão muda e todos os clientes buscam os filtros atualizados instantaneamente.
2. **Invalidação no Servidor:**
   - Caso use Next.js App Router Data Cache, disparar `revalidateTag('filters')` ao finalizar a importação de uma nova planilha/CSV.
