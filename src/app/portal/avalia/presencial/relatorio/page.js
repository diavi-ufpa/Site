'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../../../../../styles/dados.module.css';
import RelatorioPresencialClient from './relatorio-presencial-client';
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
        const response = await authorizedFetch('/api/avalia/report', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error || 'Erro ao carregar relatório presencial.');
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
          title="Gerar Relatório — AVALIA Presencial"
          subtitle="Configuração e exportação de relatórios consolidados da autoavaliação"
        />
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.mainContent}>
        <Header
          title="Gerar Relatório — AVALIA Presencial"
          subtitle="Configuração e exportação de relatórios consolidados da autoavaliação"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className={styles.mainContent}>
      <Header
        title="Gerar Relatório — AVALIA Presencial"
        subtitle="Configuração e exportação de relatórios consolidados da autoavaliação"
      />
      <RelatorioPresencialClient
        filtersByYear={data.filtersByYear}
        anosDisponiveis={data.anosDisponiveis}
        initialSelected={{
          ano: searchParams.get('ano') || '',
          campus: searchParams.get('campus') || '',
          curso: searchParams.get('curso') || '',
          consultarBanco: searchParams.get('consultarBanco') === '1',
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
            title="Gerar Relatório — AVALIA Presencial"
            subtitle="Configuração e exportação de relatórios consolidados da autoavaliação"
          />
          <DashboardSkeleton />
        </div>
      }
    >
      <ReportPageContent />
    </Suspense>
  );
}
