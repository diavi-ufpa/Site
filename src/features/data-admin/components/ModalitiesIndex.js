'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, ClipboardList, GraduationCap } from 'lucide-react';

import AdminGuard from './AdminGuard';
import styles from './data-admin.module.css';

const ICONS = {
  chart: BarChart3,
  graduation: GraduationCap,
  clipboard: ClipboardList,
};

export default function ModalitiesIndex({ modalities }) {
  return (
    <AdminGuard>
      <section className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.context}>Administração</p>
            <h1>Administração de Dados</h1>
            <p>Selecione uma modalidade para consultar cargas e iniciar uma nova importação.</p>
          </div>
        </header>

        <div className={styles.modalityList}>
          {modalities.map((modality) => {
            const Icon = ICONS[modality.icon] ?? ClipboardList;
            const available = modality.status !== 'coming-soon';
            const content = (
              <>
                <span className={styles.modalityIcon}><Icon size={21} aria-hidden="true" /></span>
                <span className={styles.modalityCopy}>
                  <span className={styles.modalityHeading}>
                    <strong>{modality.name}</strong>
                    <span className={available ? styles.foundationStatus : styles.soonStatus}>
                      {modality.statusLabel}
                    </span>
                  </span>
                  <span>{modality.shortDescription}</span>
                </span>
                {available && <ArrowRight size={19} aria-hidden="true" />}
              </>
            );

            return available ? (
              <Link className={styles.modalityRow} href={`/portal/admin/dados/${modality.id}`} key={modality.id}>
                {content}
              </Link>
            ) : (
              <div className={`${styles.modalityRow} ${styles.disabledRow}`} key={modality.id}>
                {content}
              </div>
            );
          })}
        </div>
      </section>
    </AdminGuard>
  );
}
