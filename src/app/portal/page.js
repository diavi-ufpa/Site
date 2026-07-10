import Link from 'next/link';
import {
  BookCopy,
  ClipboardCheck,
  Database,
  GraduationCap,
  MapPinned,
} from 'lucide-react';
import styles from './portal-home.module.css';

const shortcuts = [
  {
    href: '/portal/avalia/presencial',
    title: 'Avalia',
    description: 'Acesse os painéis Presencial e EAD.',
    icon: BookCopy,
  },
  {
    href: '/portal/minhaopiniao/discente',
    title: 'Minha Opinião',
    description: 'Consulte dados Discente, Docente e Técnico.',
    icon: GraduationCap,
  },
  {
    href: '/portal/avaliacaoInLoco/dados',
    title: 'Avaliação In Loco',
    description: 'Veja os dados consolidados das avaliações in loco.',
    icon: MapPinned,
  },
  {
    href: '/portal/microdados',
    title: 'Microdados Enade',
    description: 'Abra a área de consulta dos microdados.',
    icon: Database,
  },
];

export default function PortalIndexPage() {
  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <ClipboardCheck size={28} />
        </div>
        <div>
          <p className={styles.kicker}>Portal DIAVI/CPA</p>
          <h1>Página Inicial</h1>
          <p>
            Escolha uma área na barra lateral ou use os atalhos abaixo para
            acessar os painéis do portal.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {shortcuts.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className={styles.shortcut}>
            <Icon size={22} />
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
