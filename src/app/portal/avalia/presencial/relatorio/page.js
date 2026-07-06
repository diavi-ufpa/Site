'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../../../../../styles/dados.module.css';
import RelatorioPresencialClient from './relatorio-presencial-client';
import { useAuth } from '@/contexts/AuthContext';

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

  if (error) return <div className={styles.mainContent}><p className={styles.errorMessage}>{error}</p></div>;
  if (!data) return <div className={styles.mainContent}><p className={styles.loadingMessage}>Carregando interface do relatório...</p></div>;

  return (
    <div className={styles.mainContent}>
      <h1 className={styles.title}>Gerar Relatório — AVALIA Presencial</h1>
      <RelatorioPresencialClient
        filtersByYear={data.filtersByYear}
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
    <Suspense fallback={<div className={styles.mainContent}><p className={styles.loadingMessage}>Carregando interface do relatório...</p></div>}>
      <ReportPageContent />
    </Suspense>
  );
}
