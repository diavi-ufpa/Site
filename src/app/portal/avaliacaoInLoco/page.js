'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPinned,
  BarChart3,
  Building,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Award,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import styles from '../../../styles/page.module.css';

export default function AvaliacaoInLocoPage() {
  return (
    <div className={styles.wrapper}>
      <Header
        title="Avaliação In Loco • SINAES / INEP"
        subtitle="Instrumento de avaliação institucional e de cursos de graduação pelo Ministério da Educação"
      />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.kicker}>SINAES • INEP • MEC • UFPA</span>

          <h1>
            Avaliação In Loco <br />
            Reconhecimento e qualidade institucional
          </h1>

          <p>
            A <strong>Avaliação In Loco</strong> é conduzida por comissões de avaliadores do <strong>Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira (INEP/MEC)</strong> no âmbito do <strong>Sistema Nacional de Avaliação da Educação Superior (SINAES)</strong>.
          </p>

          <p>
            O processo avalia presencialmente as condições de funcionamento e o padrão de qualidade dos cursos de graduação e da universidade, gerando o <strong>Conceito de Curso (CC)</strong> e o <strong>Conceito Institucional (CI)</strong>.
          </p>

          <div className={styles.ctaGroup}>
            <Link href="/portal/avaliacaoInLoco/dados" className={styles.ctaPrimary}>
              <BarChart3 size={18} />
              <span>Dados</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* ILUSTRAÇÃO INSTITUCIONAL */}
        <div className={styles.heroArt} aria-hidden="true">
          <svg width="380" height="300" viewBox="0 0 380 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="140" width="34" height="120" rx="8" fill="#1D556F" />
            <rect x="104" y="100" width="34" height="160" rx="8" fill="#288FB4" />
            <rect x="158" y="60" width="34" height="200" rx="8" fill="#FF8E29" />
            <rect x="212" y="110" width="34" height="150" rx="8" fill="#1D556F" />
            <rect x="266" y="80" width="34" height="180" rx="8" fill="#288FB4" />
            <rect x="36" y="264" width="280" height="6" rx="3" fill="#E2E8F0" />
          </svg>
        </div>
      </section>

      <hr className={styles.divider} />

      {/* DIMENSÕES AVALIATIVAS DO INEP */}
      <div>
        <h2 className={styles.sectionTitle}>
          <Layers size={22} color="#FF8E29" />
          <span>Dimensões Avaliativas (INEP / SINAES)</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          Os instrumentos de avaliação externa do INEP estruturam-se em três dimensões fundamentais:
        </p>

        <div className={styles.dimensionsGrid}>
          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD1}`}>Dimensão 1</span>
              <h3 className={styles.cardTitle}>Organização Didático-Pedagógica</h3>
            </div>
            <p className={styles.cardText}>
              Projeto Pedagógico do Curso (PPC), matriz curricular, metodologias de ensino-aprendizagem, estágio curricular supervisionado, atividades complementares e TCC.
            </p>
          </div>

          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD2}`}>Dimensão 2</span>
              <h3 className={styles.cardTitle}>Corpo Docente e Tutorial</h3>
            </div>
            <p className={styles.cardText}>
              Titulação docente (doutores e mestres), regime de trabalho, experiência profissional e no magistério superior, produção acadêmica e atuação de tutores.
            </p>
          </div>

          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD3}`}>Dimensão 3</span>
              <h3 className={styles.cardTitle}>Infraestrutura</h3>
            </div>
            <p className={styles.cardText}>
              Instalações físicas, salas de aula, laboratórios didáticos e de informática, acervo bibliográfico físico e virtual, recursos de acessibilidade e TI.
            </p>
          </div>
        </div>
      </div>

      {/* ESCALA E CONCEITOS DO INEP */}
      <div className={styles.methodologyCard}>
        <h3 className={styles.sectionTitle}>
          <Award size={20} color="#1D556F" />
          <span>Escala e Conceitos de Avaliação (INEP)</span>
        </h3>
        <p className={styles.cardText} style={{ marginBottom: 12 }}>
          Cada indicador recebe nota de <strong>1 a 5</strong> pelos avaliadores do MEC, resultando na média por dimensão e no Conceito de Curso (CC):
        </p>

        <div className={styles.scaleGrid}>
          <div className={styles.scaleItem}>
            <CheckCircle2 size={16} color="#EF4444" />
            <span><strong>Conceitos 1 e 2:</strong> Insuficiente / Abaixo dos padrões</span>
          </div>
          <div className={styles.scaleItem}>
            <CheckCircle2 size={16} color="#3B82F6" />
            <span><strong>Conceito 3:</strong> Satisfatório / Atende plenamente</span>
          </div>
          <div className={styles.scaleItem}>
            <CheckCircle2 size={16} color="#10B981" />
            <span><strong>Conceitos 4 e 5:</strong> Muito Bom e Excelente (Supera padrões)</span>
          </div>
        </div>

        <div className={styles.calloutBox}>
          <strong>Consulta Histórica:</strong> No painel interativo da DIAVI, é possível analisar o histórico anual de visitas in loco, as médias por dimensão e a evolução dos conceitos obtidos pelos cursos de graduação da UFPA.
        </div>
      </div>
    </div>
  );
}
