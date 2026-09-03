import Header from '@/components/ui/Header';
import DiscenteDashboardClient from './DiscenteDashboardClient';
import { queryAvaliaGraphEndpoint } from '@/features/avalia/server/graph-results-repository';
import { isAvaliaGraphDatabaseConfigured } from '@/lib/avalia-graph-db';

export const dynamic = 'force-dynamic';

async function getInitialData() {
  let filtersOptions = {
    anos: [],
    campus: [],
    cursos: [],
    tree: null,
  };

  try {
    if (isAvaliaGraphDatabaseConfigured()) {
      const data = await queryAvaliaGraphEndpoint('/filters/tree');
      if (data?.anos && data.anos.length > 0) {
        filtersOptions.anos = data.anos;
        filtersOptions.tree = data.tree ?? null;
      }
    }
  } catch (err) {
    console.error('[Avalia Presencial] Erro ao pré-carregar árvore de filtros no servidor:', err);
  }

  return {
    summaryData: null,
    mediasData: null,
    proporcoesData: null,
    boxplotData: null,
    atividadesData: null,
    filtersOptions,
  };
}

export default async function DiscentePage() {
  const {
    summaryData,
    mediasData,
    proporcoesData,
    boxplotData,
    atividadesData,
    filtersOptions,
  } = await getInitialData();

  return (
    <div>
      <Header
        title="Visão Geral do Avalia Presencial"
        subtitle="Análise das respostas do questionário dos cursos presenciais da UFPA"
      />
      <DiscenteDashboardClient
        initialData={{
          summary: summaryData,
          medias: mediasData,
          proporcoes: proporcoesData,
          boxplot: boxplotData,
          atividades: atividadesData,
        }}
        filtersOptions={filtersOptions}
      />
    </div>
  );
}
