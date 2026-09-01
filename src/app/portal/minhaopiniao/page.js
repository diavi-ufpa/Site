'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  Briefcase,
  Building2,
  ArrowRight,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import styles from '../../../styles/page.module.css';

export default function MinhaOpiniaoOverviewPage() {
  return (
    <div className={styles.wrapper}>
      <Header
        title="Minha Opinião • A Voz da Comunidade Acadêmica"
        subtitle="Instrumento institucional de consulta aos discentes, docentes e técnicos da UFPA"
      />

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.kicker}>DIAVI • CPA • UFPA</span>

          <h1>
            Minha Opinião <br />
            A voz da comunidade acadêmica
          </h1>

          <p>
            O <strong>Minha Opinião</strong> é o instrumento institucional da Universidade Federal do Pará (UFPA), coordenado pela <strong>Comissão Própria de Avaliação (CPA)</strong> e pela <strong>Diretoria de Avaliação Institucional (DIAVI)</strong>, voltado para a coleta e análise sistemática da percepção de toda a comunidade acadêmica.
          </p>

          <p>
            O programa reúne as visões de <strong>discentes</strong>, <strong>docentes</strong> e <strong>técnico-administrativos</strong> para diagnosticar potencialidades, planejar intervenções de gestão e subsidiar o Relatório de Autoavaliação Institucional (RAI).
          </p>

          <div className={styles.ctaGroup}>
            <Link href="/portal/minhaopiniao/discente" className={styles.ctaPrimary}>
              <GraduationCap size={18} />
              <span>Discente</span>
              <ArrowRight size={16} />
            </Link>

            <Link href="/portal/minhaopiniao/docente" className={styles.ctaPrimary}>
              <Users size={18} />
              <span>Docente</span>
              <ArrowRight size={16} />
            </Link>

            <Link href="/portal/minhaopiniao/tecnico" className={styles.ctaPrimary}>
              <Briefcase size={18} />
              <span>Técnico</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* ILUSTRAÇÃO INSTITUCIONAL */}
        <div className={styles.heroArt} aria-hidden="true">
          <svg width="380" height="300" viewBox="0 0 380 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="150" width="34" height="110" rx="8" fill="#1D556F" />
            <rect x="104" y="110" width="34" height="150" rx="8" fill="#288FB4" />
            <rect x="158" y="70" width="34" height="190" rx="8" fill="#FF8E29" />
            <rect x="212" y="120" width="34" height="140" rx="8" fill="#1D556F" />
            <rect x="266" y="90" width="34" height="170" rx="8" fill="#288FB4" />
            <rect x="36" y="264" width="280" height="6" rx="3" fill="#E2E8F0" />
          </svg>
        </div>
      </section>

      <hr className={styles.divider} />

      {/* SEGMENTOS DA COMUNIDADE */}
      <div>
        <h2 className={styles.sectionTitle}>
          <Building2 size={22} color="#FF8E29" />
          <span>Segmentos e Áreas de Avaliação</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          Cada segmento da comunidade universitária possui questionários específicos e adaptados à sua realidade de atuação institucional:
        </p>

        <div className={styles.dimensionsGrid}>
          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD1}`}>Discentes</span>
              <h3 className={styles.cardTitle}>Corpo Discente</h3>
            </div>
            <p className={styles.cardText}>
              Avaliação das condições de ensino, vivência universitária, serviços de apoio ao estudante, infraestrutura dos campi, bibliotecas e organização acadêmica geral.
            </p>
          </div>

          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD2}`}>Docentes</span>
              <h3 className={styles.cardTitle}>Corpo Docente</h3>
            </div>
            <p className={styles.cardText}>
              Percepção sobre as condições de trabalho, políticas de fomento a ensino, pesquisa e extensão, governança universitária, planejamento e suporte institucional.
            </p>
          </div>

          <div className={styles.dimensionCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.badge} ${styles.badgeD3}`}>Técnicos</span>
              <h3 className={styles.cardTitle}>Técnico-Administrativos</h3>
            </div>
            <p className={styles.cardText}>
              Análise do ambiente laboral, capacitação profissional, infraestrutura física e tecnológica, fluxos operacionais e satisfação institucional.
            </p>
          </div>
        </div>
      </div>

      {/* METODOLOGIA E ANONIMATO */}
      <div className={styles.methodologyCard}>
        <h3 className={styles.sectionTitle}>
          <ShieldCheck size={20} color="#1D556F" />
          <span>Metodologia, Anonimato e Análise Comparativa</span>
        </h3>
        <p className={styles.cardText}>
          O Minha Opinião é aplicado periodicamente em ambiente digital seguro. O sistema oferece recursos de <strong>filtragem avançada</strong> e <strong>modo de comparação lado a lado</strong> entre diferentes unidades acadêmicas, cursos e campi.
        </p>

        <div className={styles.calloutBox}>
          <strong>Garantia de Sigilo e Anonimato:</strong> Todas as informações são coletadas com sigilo integral das identidades dos respondentes. Os relatórios gerados apresentam exclusivamente dados agregados e métricas estatísticas consolidadas.
        </div>
      </div>
    </div>
  );
}
