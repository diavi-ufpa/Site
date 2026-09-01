'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookCopy,
  GraduationCap,
  MonitorPlay,
  ArrowRight,
  BookOpen,
  Users,
  Building,
  CheckCircle2,
  HelpCircle,
  Award,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import styles from '../../../styles/page.module.css';

export default function AvaliaOverviewPage() {
  return (
    <div className={styles.wrapper}>
      <Header
        title="Avalia • Avaliação dos Cursos de Graduação"
        subtitle="Instrumento de autoavaliação institucional dos cursos presenciais e a distância da UFPA"
      />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.kicker}>PROEG • CPA • DIAVI • UFPA</span>

          <h1>
            Avalia UFPA <br />
            A autoavaliação dos cursos de graduação
          </h1>

          <p>
            O <strong>Avalia</strong> é o instrumento institucional elaborado pela <strong>Pró-Reitoria de Ensino de Graduação (PROEG)</strong> em parceria com a <strong>Comissão Própria de Avaliação (CPA)</strong> e a <strong>Diretoria de Avaliação Institucional (DIAVI)</strong>, com o objetivo de conhecer a percepção dos discentes sobre as atividades curriculares de cada período letivo.
          </p>

          <p>
            A avaliação contempla a autoavaliação discente, o desempenho da ação docente e as condições de infraestrutura. Os resultados fundamentam o aprimoramento pedagógico e o planejamento institucional.
          </p>

          <div className={styles.ctaGroup}>
            <Link href="/portal/avalia/presencial" className={styles.ctaPrimary}>
              <BookOpen size={18} />
              <span>Presencial</span>
              <ArrowRight size={16} />
            </Link>

            <Link href="/portal/ead" className={styles.ctaPrimary}>
              <MonitorPlay size={18} />
              <span>EAD</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* ILUSTRAÇÃO INSTITUCIONAL */}
        <div className={styles.heroArt} aria-hidden="true">
          <svg width="380" height="300" viewBox="0 0 380 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="160" width="34" height="100" rx="8" fill="#1D556F" />
            <rect x="104" y="120" width="34" height="140" rx="8" fill="#288FB4" />
            <rect x="158" y="80" width="34" height="180" rx="8" fill="#FF8E29" />
            <rect x="212" y="130" width="34" height="130" rx="8" fill="#1D556F" />
            <rect x="266" y="100" width="34" height="160" rx="8" fill="#288FB4" />
            <rect x="36" y="264" width="280" height="6" rx="3" fill="#E2E8F0" />
          </svg>
        </div>
      </section>

      <hr className={styles.divider} />

      {/* DIMENSÕES AVALIADAS */}
      <div>
        <h2 className={styles.sectionTitle}>
          <BookCopy size={22} color="#FF8E29" />
          <span>Dimensões e Aspectos Avaliados</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          O questionário do Avalia é estruturado em afirmativas que cobrem três dimensões centrais do processo formativo:
        </p>

        <div className={styles.dimensionsGrid}>
          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD1}`}>Dimensão 1</span>
              <h3 className={styles.cardTitle}>Autoavaliação Discente</h3>
            </div>
            <p className={styles.cardText}>
              Verifica a postura, dedicação aos estudos, assiduidade, cumprimento dos prazos e engajamento do próprio discente no percurso da atividade curricular.
            </p>
          </div>

          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD2}`}>Dimensão 2</span>
              <h3 className={styles.cardTitle}>Atuação Docente</h3>
            </div>
            <p className={styles.cardText}>
              Analisa metodologia didática, domínio de conteúdo, pontualidade, clareza das explicações, cumprimento do plano de ensino e critérios de avaliação do docente.
            </p>
          </div>

          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD3}`}>Dimensão 3</span>
              <h3 className={styles.cardTitle}>Infraestrutura e Recursos</h3>
            </div>
            <p className={styles.cardText}>
              Avalia as condições das salas de aula, laboratórios didáticos, recursos tecnológicos, ambiente virtual de aprendizagem (AVA) e materiais disponibilizados.
            </p>
          </div>
        </div>
      </div>

      {/* ESCALA E METODOLOGIA */}
      <div className={styles.methodologyCard}>
        <h3 className={styles.sectionTitle}>
          <Award size={20} color="#1D556F" />
          <span>Escala de Avaliação e Metodologia</span>
        </h3>
        <p className={styles.cardText} style={{ marginBottom: 12 }}>
          As respostas dos discentes são registradas em escala ordinal de <strong>1 a 4</strong> para cada afirmativa avaliada:
        </p>

        <div className={styles.scaleGrid}>
          <div className={styles.scaleItem}>
            <CheckCircle2 size={16} color="#EF4444" />
            <span><strong>Valor 1:</strong> Insuficiente</span>
          </div>
          <div className={styles.scaleItem}>
            <CheckCircle2 size={16} color="#F59E0B" />
            <span><strong>Valor 2:</strong> Regular</span>
          </div>
          <div className={styles.scaleItem}>
            <CheckCircle2 size={16} color="#3B82F6" />
            <span><strong>Valor 3:</strong> Bom / Boa</span>
          </div>
          <div className={styles.scaleItem}>
            <CheckCircle2 size={16} color="#10B981" />
            <span><strong>Valor 4:</strong> Excelente</span>
          </div>
          <div className={styles.scaleItem}>
            <HelpCircle size={16} color="#6B7280" />
            <span><strong>Valor 5:</strong> Não se aplica (apenas EAD)</span>
          </div>
        </div>

        <div className={styles.calloutBox}>
          <strong>Garantia de Anonimato:</strong> A participação é estritamente confidencial e não há identificação individual do respondente na consolidação dos dados. Nos painéis de resultados e no cálculo das médias, o <strong>valor 5 (Não se aplica)</strong> não é contabilizado na nota de qualidade.
        </div>
      </div>
    </div>
  );
}
