'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookCopy,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Database,
  Download,
  GraduationCap,
  Home,
  MapPinned,
  Users,
} from 'lucide-react';
import styles from '../styles/Sidebar.module.css';
import { useAuth } from '@/contexts/AuthContext';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

const Sidebar = () => {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const featureFlags = {
    minhaOpiniaoEnabled: true,
    presencialEnabled: true,
  };

  const reportEnabled = {
    ead: true,
    presencial: true,
    minhaOpiniao: false,
  };

  const isReportPage =
    pathname.startsWith('/portal/ead/relatorioEAD') ||
    pathname.startsWith('/portal/minhaopiniao/relatorio') ||
    pathname.startsWith('/portal/avalia/presencial/relatorio');

  const getInitialOpenMenus = useCallback(() => {
    const initial = {
      avaliacao: true,
      avalia: false,
      minhaOpiniao: false,
      avaliacaoInLoco: false,
    };

    if (
      pathname.startsWith('/portal/avalia') ||
      pathname.startsWith('/portal/ead')
    ) {
      initial.avalia = true;
    }

    if (pathname.startsWith('/portal/minhaopiniao')) {
      initial.minhaOpiniao = true;
    }

    if (pathname.startsWith('/portal/avaliacaoInLoco')) {
      initial.avaliacaoInLoco = true;
    }

    return initial;
  }, [pathname]);

  const [openMenus, setOpenMenus] = useState(getInitialOpenMenus);

  useEffect(() => {
    setOpenMenus(getInitialOpenMenus());
  }, [getInitialOpenMenus]);

  const handleMenuClick = (menuName) => {
    setOpenMenus((prev) => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const showGenerateButton =
    pathname === '/portal' ||
    (pathname.startsWith('/portal/ead') && reportEnabled.ead) ||
    (pathname.startsWith('/portal/avalia/presencial') &&
      reportEnabled.presencial) ||
    (pathname.startsWith('/portal/minhaopiniao') &&
      reportEnabled.minhaOpiniao);

  const activeReportBtnStyle = isReportPage
    ? {
        backgroundColor: '#ff8a1e',
        color: '#fff',
        borderColor: 'transparent',
      }
    : undefined;

  let reportHref = '/portal/ead/relatorioEAD';
  if (pathname.startsWith('/portal/minhaopiniao')) {
    reportHref = '/portal/minhaopiniao/relatorio';
  } else if (pathname.startsWith('/portal/avalia/presencial')) {
    reportHref = '/portal/avalia/presencial/relatorio';
  } else if (pathname.startsWith('/portal/ead')) {
    reportHref = '/portal/ead/relatorioEAD';
  }

  const avaliaActive =
    pathname === '/portal/avalia' ||
    pathname.startsWith('/portal/avalia/') ||
    pathname.startsWith('/portal/ead');

  const minhaOpiniaoActive = pathname.startsWith('/portal/minhaopiniao');
  const avaliacaoInLocoActive = pathname.startsWith('/portal/avaliacaoInLoco');
  const microdadosActive = pathname.startsWith('/portal/microdados');
  const avaliacaoActive =
    avaliaActive ||
    minhaOpiniaoActive ||
    avaliacaoInLocoActive ||
    microdadosActive;

  const minhaOpiniaoDiscenteActive =
    pathname === '/portal/minhaopiniao/discente' ||
    pathname.startsWith('/portal/minhaopiniao/discente/');
  const minhaOpiniaoDocenteActive =
    pathname === '/portal/minhaopiniao/docente' ||
    pathname.startsWith('/portal/minhaopiniao/docente/');
  const minhaOpiniaoTecnicoActive =
    pathname === '/portal/minhaopiniao/tecnico' ||
    pathname.startsWith('/portal/minhaopiniao/tecnico/');

  return (
    <>
      {isLoading && (
        <LoadingOverlay isFullScreen={true} message="Carregando dados..." />
      )}

      <aside className={styles.sidebar}>
        <div
          className={styles.logoContainer}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <Image
            src="/DIAVI_logo.png"
            alt="Logo DIAVI"
            width={150}
            height={45}
            priority
            style={{ height: 'auto' }}
          />
          <Image
            src="/CPA%20logo.jpg"
            alt="Logo CPA"
            width={120}
            height={45}
            priority
            style={{ height: 'auto', objectFit: 'contain' }}
          />
        </div>

        <nav className={styles.nav}>
          <p className={styles.sectionLabel}>Principal</p>
          <ul>
            <li className={pathname === '/portal' ? styles.activeParent : ''}>
              <Link href="/portal" className={styles.menuHeader}>
                <Home size={18} />
                <span>Página Inicial</span>
              </Link>
            </li>
          </ul>

          <p className={styles.sectionLabel}>Avaliação</p>
          <ul>
            <li className={avaliacaoActive ? styles.activeGroup : ''}>
              <button
                type="button"
                className={styles.menuHeader}
                onClick={() => handleMenuClick('avaliacao')}
              >
                <ClipboardCheck size={18} />
                <span>Avaliação</span>
                {openMenus.avaliacao ? (
                  <ChevronUp size={16} className={styles.chevron} />
                ) : (
                  <ChevronDown size={16} className={styles.chevron} />
                )}
              </button>

              {openMenus.avaliacao && (
                <ul className={styles.subMenu}>
                  <li className={styles.menuGroup}>
                    <div
                      className={`${styles.subMenuToggle} ${
                        avaliaActive ? styles.subMenuToggleActive : ''
                      }`}
                    >
                      <Link href="/portal/avalia" className={styles.groupLink}>
                        <BookCopy size={16} />
                        <span>Avalia</span>
                      </Link>
                      <button
                        type="button"
                        className={styles.groupChevron}
                        aria-label="Alternar menu Avalia"
                        onClick={() => handleMenuClick('avalia')}
                      >
                        {openMenus.avalia ? (
                          <ChevronUp size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                      </button>
                    </div>

                    {openMenus.avalia && (
                      <ul className={styles.nestedSubMenu}>
                        {featureFlags.presencialEnabled && (
                          <li
                            className={
                              pathname.startsWith('/portal/avalia/presencial')
                                ? styles.subMenuItemActive
                                : styles.subMenuItem
                            }
                          >
                            <Link
                              href="/portal/avalia/presencial"
                              onClick={() => setIsLoading(true)}
                            >
                              Presencial
                            </Link>
                          </li>
                        )}

                        <li
                          className={
                            pathname.startsWith('/portal/ead')
                              ? styles.subMenuItemActive
                              : styles.subMenuItem
                          }
                        >
                          <Link
                            href="/portal/ead"
                            onClick={() => setIsLoading(true)}
                          >
                            EAD
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>

                  {featureFlags.minhaOpiniaoEnabled && (
                    <li className={styles.menuGroup}>
                      <div
                        className={`${styles.subMenuToggle} ${
                          minhaOpiniaoActive ? styles.subMenuToggleActive : ''
                        }`}
                      >
                        <Link
                          href="/portal/minhaopiniao"
                          className={styles.groupLink}
                        >
                          <GraduationCap size={16} />
                          <span>Minha Opinião</span>
                        </Link>
                        <button
                          type="button"
                          className={styles.groupChevron}
                          aria-label="Alternar menu Minha Opinião"
                          onClick={() => handleMenuClick('minhaOpiniao')}
                        >
                          {openMenus.minhaOpiniao ? (
                            <ChevronUp size={15} />
                          ) : (
                            <ChevronDown size={15} />
                          )}
                        </button>
                      </div>

                      {openMenus.minhaOpiniao && (
                        <ul className={styles.nestedSubMenu}>
                          <li
                            className={
                              minhaOpiniaoDiscenteActive
                                ? styles.subMenuItemActive
                                : styles.subMenuItem
                            }
                          >
                            <Link href="/portal/minhaopiniao/discente">
                              Discente
                            </Link>
                          </li>
                          <li
                            className={
                              minhaOpiniaoDocenteActive
                                ? styles.subMenuItemActive
                                : styles.subMenuItem
                            }
                          >
                            <Link href="/portal/minhaopiniao/docente">
                              Docente
                            </Link>
                          </li>
                          <li
                            className={
                              minhaOpiniaoTecnicoActive
                                ? styles.subMenuItemActive
                                : styles.subMenuItem
                            }
                          >
                            <Link href="/portal/minhaopiniao/tecnico">
                              Técnico
                            </Link>
                          </li>
                        </ul>
                      )}
                    </li>
                  )}

                  <li className={styles.menuGroup}>
                    <div
                      className={`${styles.subMenuToggle} ${
                        avaliacaoInLocoActive ? styles.subMenuToggleActive : ''
                      }`}
                    >
                      <Link
                        href="/portal/avaliacaoInLoco"
                        className={styles.groupLink}
                      >
                        <MapPinned size={16} />
                        <span>Avaliação In Loco</span>
                      </Link>
                      <button
                        type="button"
                        className={styles.groupChevron}
                        aria-label="Alternar menu Avaliação In Loco"
                        onClick={() => handleMenuClick('avaliacaoInLoco')}
                      >
                        {openMenus.avaliacaoInLoco ? (
                          <ChevronUp size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                      </button>
                    </div>

                    {openMenus.avaliacaoInLoco && (
                      <ul className={styles.nestedSubMenu}>
                        <li
                          className={
                            pathname.startsWith('/portal/avaliacaoInLoco/dados')
                              ? styles.subMenuItemActive
                              : styles.subMenuItem
                          }
                        >
                          <Link href="/portal/avaliacaoInLoco/dados">
                            Dados
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>

                  <li
                    className={
                      microdadosActive
                        ? styles.subMenuItemActive
                        : styles.subMenuItem
                    }
                  >
                    <Link href="/portal/microdados">
                      <Database size={16} />
                      <span>Microdados Enade</span>
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>

          {showGenerateButton && (
            <>
              <p className={styles.sectionLabel}>Relatórios</p>
              <div className={styles.generateReportContainer}>
                <Link
                  href={reportHref}
                  aria-label="Gerar relatório"
                  className={styles.generateReportBtn}
                  style={activeReportBtnStyle}
                  onClick={() => setIsLoading(true)}
                >
                  <Download size={18} />
                  <span>Gerar relatório</span>
                </Link>
              </div>
            </>
          )}

          {isAdmin && (
            <>
              <p className={styles.sectionLabel}>Administração</p>
              <ul>
                <li
                  className={
                    pathname.startsWith('/portal/admin')
                      ? styles.activeParent
                      : ''
                  }
                >
                  <Link
                    href="/portal/admin/usuarios"
                    className={styles.menuHeader}
                  >
                    <Users size={18} />
                    <span>Usuários</span>
                  </Link>
                </li>
              </ul>
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
