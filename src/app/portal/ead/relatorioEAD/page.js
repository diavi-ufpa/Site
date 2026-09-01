'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../../../../styles/dados.module.css';
import RelatorioEadClient from './relatorio-eadead-client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/ui/Header';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';

function ReportPageContent() {
  const searchParams = useSearchParams();
  const { authorizedFetch } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const response = await authorizedFetch('/api/ead/report', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error || 'Erro ao carregar relatório EAD.');
        setData(payload);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      }
    }

    loadData();
    return () => controller.abort();
  }, [authorizedFetch]);

  if (error) {
    return (
      <div className={styles.mainContent}>
        <Header
          title="Gerar Relatório — AVALIA EAD"
          subtitle="Configuração e exportação de relatórios da autoavaliação EAD"
        />
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.mainContent}>
        <Header
          title="Gerar Relatório — AVALIA EAD"
          subtitle="Configuração e exportação de relatórios da autoavaliação EAD"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className={styles.mainContent}>
      <Header
        title="Gerar Relatório — AVALIA EAD"
        subtitle="Configuração e exportação de relatórios da autoavaliação EAD"
      />
      <RelatorioEadClient
        filtersByYear={data.filtersByYear}
        reportDataByYear={data.reportDataByYear}
        anosDisponiveis={data.anosDisponiveis}
        initialSelected={{
          ano: searchParams.get('ano') || '',
          curso: searchParams.get('curso') || '',
          polo: searchParams.get('polo') || '',
        }}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className={styles.mainContent}>
          <Header
            title="Gerar Relatório — AVALIA EAD"
            subtitle="Configuração e exportação de relatórios da autoavaliação EAD"
          />
          <DashboardSkeleton />
        </div>
      }
    >
      <ReportPageContent />
    </Suspense>
  );
}
