'use client';

import Link from 'next/link';
import {
  BookCopy,
  ClipboardCheck,
  Database,
  GraduationCap,
  MapPinned,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import styles from './portal-home.module.css';

const shortcuts = [
  {
    href: '/portal/avalia',
    title: 'Avalia',
    description: 'Autoavaliação dos cursos de graduação presenciais e a distância (EAD).',
    icon: BookCopy,
  },
  {
    href: '/portal/minhaopiniao',
    title: 'Minha Opinião',
    description: 'Consulta institucional da percepção de discentes, docentes e técnicos.',
    icon: GraduationCap,
  },
  {
    href: '/portal/avaliacaoInLoco',
    title: 'Avaliação In Loco',
    description: 'Avaliações externas do MEC/INEP, médias das dimensões e histórico.',
    icon: MapPinned,
  },
  {
    href: '/portal/microdados',
    title: 'Microdados Enade',
    description: 'Análise comparativa do Enade, taxa de acerto por tema e ranking.',
    icon: Database,
  },
];

export default function PortalIndexPage() {
  return (
    <section className={styles.page}>
      <Header
        title="Painel de Avaliação Institucional"
        subtitle="Portal integrado de dados e indicadores da DIAVI / CPA • UFPA"
      />

      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <ClipboardCheck size={28} />
        </div>
        <div>
          <p className={styles.kicker}>Portal DIAVI • CPA • UFPA</p>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px 0', color: '#0f172a' }}>
            Visão Geral das Áreas de Avaliação
          </h2>
          <p style={{ margin: 0, color: '#64748b' }}>
            Selecione uma das 4 áreas principais abaixo para conhecer as dimensões avaliadas e acessar os painéis de indicadores.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {shortcuts.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className={styles.shortcut}>
            <Icon size={24} />
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
