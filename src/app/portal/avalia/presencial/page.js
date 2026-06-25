import Header from '@/components/ui/Header';
import DiscenteDashboardClient from './DiscenteDashboardClient';

export const dynamic = 'force-dynamic';

async function getInitialData() {
  return {
    summaryData: null,
    mediasData: null,
    proporcoesData: null,
    boxplotData: null,
    atividadesData: null,
    filtersOptions: {
      anos: [],
      campus: [],
      cursos: [],
    },
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
        date="17 de setembro de 2025"
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
