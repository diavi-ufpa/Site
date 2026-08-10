'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Check, FileSpreadsheet, Plus, Upload } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { LOAD_STAGES } from '../processing/load-contract';
import AdminGuard from './AdminGuard';
import styles from './data-admin.module.css';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export default function ModalityWorkspace({ modality }) {
  const { authorizedFetch } = useAuth();
  const inputRef = useRef(null);
  const [periodState, setPeriodState] = useState({ loading: true, periods: [], reason: '', error: '' });
  const [showLoad, setShowLoad] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadPeriods() {
      try {
        const response = await authorizedFetch(`/api/admin/data-modalities/${modality.id}/periods`, {
          cache: 'no-store', signal: controller.signal,
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || 'Não foi possível consultar os períodos.');
        setPeriodState({ loading: false, periods: data.periods || [], reason: data.unavailableReason || '', error: '' });
      } catch (error) {
        if (error.name !== 'AbortError') {
          setPeriodState({ loading: false, periods: [], reason: '', error: error.message });
        }
      }
    }
    loadPeriods();
    return () => controller.abort();
  }, [authorizedFetch, modality.id]);

  function selectFile(event) {
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  return (
    <AdminGuard>
      <section className={styles.page}>
        <Link href="/portal/admin/dados" className={styles.backLink}><ArrowLeft size={17} /> Modalidades</Link>
        <header className={styles.workspaceHeader}>
          <div>
            <p className={styles.context}>Administração de Dados</p>
            <h1>{modality.name}</h1>
            <p>{modality.description}</p>
          </div>
          <button className={styles.primaryButton} type="button" onClick={() => setShowLoad(true)}>
            <Plus size={18} /> Adicionar nova carga
          </button>
        </header>

        <section className={styles.periodSection} aria-labelledby="period-title">
          <div className={styles.sectionHeading}>
            <div><h2 id="period-title">Períodos disponíveis</h2><p>Cargas já registradas no banco analítico.</p></div>
            {!periodState.loading && <span className={styles.periodCount}>{periodState.periods.length}</span>}
          </div>
          {periodState.loading && <div className={styles.periodSkeleton} aria-label="Consultando períodos" />}
          {periodState.error && <p className={styles.errorMessage}><AlertCircle size={17} /> {periodState.error}</p>}
          {!periodState.loading && !periodState.error && periodState.periods.length > 0 && (
            <div className={styles.periodList}>
              {periodState.periods.map((period) => <span key={period.code}>{period.code}</span>)}
            </div>
          )}
          {!periodState.loading && !periodState.error && periodState.periods.length === 0 && (
            <div className={styles.emptyState}>
              <strong>Nenhum período exibido</strong>
              <span>{periodState.reason || 'Ainda não há cargas registradas para esta modalidade.'}</span>
            </div>
          )}
        </section>

        {showLoad && (
          <section className={styles.loadSection} aria-labelledby="load-title">
            <div className={styles.sectionHeading}>
              <div><h2 id="load-title">Nova carga</h2><p>Leia as orientações e selecione os arquivos para a validação futura.</p></div>
              <span className={styles.foundationStatus}>Fluxo demonstrativo</span>
            </div>

            <ol className={styles.stepper}>
              {LOAD_STAGES.map((stage, index) => (
                <li className={index < 2 ? styles.activeStep : styles.futureStep} key={stage.id}>
                  <span>{index === 0 ? <Check size={14} /> : index + 1}</span>{stage.label}
                </li>
              ))}
            </ol>

            <div className={styles.loadColumns}>
              <div className={styles.instructions}>
                <h3>Antes de selecionar a planilha</h3>
                <ol>{modality.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol>
              </div>

              <div className={styles.uploadPanel}>
                <FileSpreadsheet size={28} aria-hidden="true" />
                <h3>Selecione o arquivo</h3>
                <p>O arquivo permanecerá no navegador. Nenhum dado será enviado ou persistido agora.</p>
                <input ref={inputRef} className={styles.visuallyHidden} type="file" accept={modality.acceptedFileTypes} onChange={selectFile} />
                <button className={styles.secondaryButton} type="button" onClick={() => inputRef.current?.click()}>
                  <Upload size={17} /> Selecionar arquivo
                </button>
                {selectedFile && (
                  <div className={styles.selectedFile}>
                    <span><strong>{selectedFile.name}</strong><small>{formatBytes(selectedFile.size)}</small></span>
                    <span className={styles.localBadge}>Selecionado localmente</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.faqSection}>
              <h3>Dúvidas frequentes</h3>
              {modality.faq.map((item) => (
                <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>
              ))}
            </div>
          </section>
        )}
      </section>
    </AdminGuard>
  );
}
