'use client';

import React from 'react';
import Link from 'next/link';
import {
  Database,
  BarChart3,
  Percent,
  Award,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import styles from '../../../styles/page.module.css';

export default function MicrodadosOverviewPage() {
  return (
    <div className={styles.wrapper}>
      <Header
        title="Microdados Enade • Indicadores e Desempenho"
        subtitle="Análise comparativa do desempenho discente e percepção no Exame Nacional de Desempenho dos Estudantes"
      />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.kicker}>ENADE • INEP • MEC • DIAVI</span>

          <h1>
            Microdados Enade <br />
            Diagnóstico e desempenho acadêmico
          </h1>

          <p>
            Os <strong>Microdados do Enade</strong> reúnem os registros analíticos do <strong>Exame Nacional de Desempenho dos Estudantes</strong>, aplicado pelo <strong>INEP/MEC</strong> para avaliar os conhecimentos, competências e habilidades desenvolvidas pelos concluintes dos cursos de graduação.
          </p>

          <p>
            O painel analítico da <strong>DIAVI</strong> permite avaliar o desempenho relativo da UFPA frente à média brasileira em cada componente curricular, examinar as taxas de acerto por tema e analisar o <strong>Questionário do Estudante (QE)</strong>.
          </p>

          <div className={styles.ctaGroup}>
            <Link href="/portal/microdados/dados" className={styles.ctaPrimary}>
              <BarChart3 size={18} />
              <span>Dados</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* ILUSTRAÇÃO INSTITUCIONAL */}
        <div className={styles.heroArt} aria-hidden="true">
          <svg width="380" height="300" viewBox="0 0 380 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="130" width="34" height="130" rx="8" fill="#1D556F" />
            <rect x="104" y="90" width="34" height="170" rx="8" fill="#288FB4" />
            <rect x="158" y="50" width="34" height="210" rx="8" fill="#FF8E29" />
            <rect x="212" y="100" width="34" height="160" rx="8" fill="#1D556F" />
            <rect x="266" y="70" width="34" height="190" rx="8" fill="#288FB4" />
            <rect x="36" y="264" width="280" height="6" rx="3" fill="#E2E8F0" />
          </svg>
        </div>
      </section>

      <hr className={styles.divider} />

      {/* INDICADORES E COMPONENTES ANALÍTICOS */}
      <div>
        <h2 className={styles.sectionTitle}>
          <Database size={22} color="#FF8E29" />
          <span>Indicadores e Eixos de Análise dos Microdados</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          A consulta aos microdados do Enade na DIAVI é estruturada em quatro perspectivas complementares:
        </p>

        <div className={styles.dimensionsGrid}>
          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD1}`}>Razão Relativa</span>
              <h3 className={styles.cardTitle}>Razão UFPA / Brasil</h3>
            </div>
            <p className={styles.cardText}>
              Compara a taxa de acerto dos alunos da UFPA com a média nacional por conteúdo programático. Valores acima de 1,00 indicam desempenho superior da universidade.
            </p>
          </div>

          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD2}`}>Desempenho</span>
              <h3 className={styles.cardTitle}>Percentual de Acerto</h3>
            </div>
            <p className={styles.cardText}>
              Mapeia a porcentagem absoluta de acertos nos temas avaliados na Formação Geral e no Componente Específico, identificando forças e temas que demandam revisão.
            </p>
          </div>

          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD3}`}>Percepção QE</span>
              <h3 className={styles.cardTitle}>Questionário do Estudante</h3>
            </div>
            <p className={styles.cardText}>
              Respostas dos estudantes sobre Organização Didático-Pedagógica, Infraestrutura e Ampliação da Formação, avaliadas em escala de concordância de 1 a 6.
            </p>
          </div>

          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD4}`}>Posicionamento</span>
              <h3 className={styles.cardTitle}>Tabela de Ranking</h3>
            </div>
            <p className={styles.cardText}>
              Classificação comparativa do desempenho do curso da UFPA em relação a todas as Instituições Federais e Públicas de Ensino Superior do país.
            </p>
          </div>
        </div>
      </div>

      {/* METODOLOGIA E FILTROS */}
      <div className={styles.methodologyCard}>
        <h3 className={styles.sectionTitle}>
          <FileSpreadsheet size={20} color="#1D556F" />
          <span>Base de Dados e Metodologia de Consulta</span>
        </h3>
        <p className={styles.cardText} style={{ marginBottom: 12 }}>
          O painel de microdados processa bases oficiais disponibilizadas pelo INEP. A consulta permite estratificação direta por:
        </p>

        <div className={styles.scaleGrid}>
          <div className={styles.scaleItem}>
            <CheckCircle2 size={16} color="#FF8E29" />
            <span><strong>Ano de Aplicação:</strong> Edições do Enade</span>
          </div>
          <div className={styles.scaleItem}>
            <CheckCircle2 size={16} color="#1D556F" />
            <span><strong>Município:</strong> Filtro por campus/localidade</span>
          </div>
          <div className={styles.scaleItem}>
            <CheckCircle2 size={16} color="#288FB4" />
            <span><strong>Curso de Graduação:</strong> Recorte específico</span>
          </div>
        </div>

        <div className={styles.calloutBox}>
          <strong>Filtros Integrados:</strong> No painel de dados, os filtros de seleção encontram-se dispostos em linha única contínua para agilizar a alternância entre cursos, permitindo consultas instantâneas e visualização de gráficos dinâmicos.
        </div>
      </div>
    </div>
  );
}
