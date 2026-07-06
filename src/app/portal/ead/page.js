'use client';

import { Suspense, useEffect, useState } from 'react';
import EadDashboardClient from './EadDashboardClient';
import styles from '../../../styles/dados.module.css';
import { useAuth } from '@/contexts/AuthContext';

export default function EadPage() {
  const { authorizedFetch } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const response = await authorizedFetch('/api/ead/dashboard', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error || 'Erro ao carregar dados EAD.');
        setData(payload);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      }
    }

    loadData();
    return () => controller.abort();
  }, [authorizedFetch]);

  if (error) {
    return <div className={styles.mainContent}><h1 className={styles.title}>Avalia EAD</h1><p className={styles.errorMessage}>{error}</p></div>;
  }

  if (!data) {
    return <div className={styles.mainContent}><p className={styles.loading}>Carregando dashboard...</p></div>;
  }

  const {
    summaryData,
    dimensoesData,
    filtersOptions,
    autoavaliacaoItensData,
    acaoDocenteAtitudeData,
    acaoDocenteGestaoData,
    acaoDocenteProcessoData,
    infraestruturaItensData,
    byYear,
    defaultYear,
  } = data;

  return (
    <div className={styles.mainContent}>
      <h1 className={styles.title}>Avaliação EAD</h1>
      <Suspense fallback={<p className={styles.loading}>Carregando dashboard...</p>}>
        <EadDashboardClient
          initialData={{
            summary: summaryData,
            dimensoes: dimensoesData,
            autoavaliacaoItens: autoavaliacaoItensData,
            acaoDocenteAtitude: acaoDocenteAtitudeData,
            acaoDocenteGestao: acaoDocenteGestaoData,
            acaoDocenteProcesso: acaoDocenteProcessoData,
            infraestruturaItens: infraestruturaItensData,
          }}
          initialDataByYear={byYear}
          defaultYear={defaultYear}
          filtersOptions={filtersOptions}
        />
      </Suspense>
    </div>
  );
}
