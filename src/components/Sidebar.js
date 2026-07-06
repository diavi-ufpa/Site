'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  BookCopy,
  Download,
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

  // CORREÇÃO AQUI: presencial precisa estar true
  const reportEnabled = {
    ead: true,
    presencial: true,
    minhaOpiniao: false,
  };

  const inAvalRoutes =
    pathname === '/portal' || pathname.startsWith('/portal/');

  const selectedEvaluation = pathname.startsWith('/portal/minhaopiniao')
    ? 'minhaopiniao'
    : pathname.startsWith('/portal/avaliacaoInLoco')
    ? 'avaliacaoInLoco'
    : pathname.startsWith('/portal/avalia') ||
      pathname.startsWith('/portal/ead')
    ? 'avalia'
    : null;

  const inModalidade =
    (featureFlags.presencialEnabled &&
      pathname.startsWith('/portal/avalia/presencial')) ||
    pathname.startsWith('/portal/ead') ||
    pathname.startsWith('/portal/avaliacaoInLoco') ||
    (pathname.startsWith('/portal/minhaopiniao/') &&
      !pathname.startsWith('/portal/minhaopiniao/relatorio'));

  const isReportPage =
    pathname.startsWith('/portal/ead/relatorioEAD') ||
    pathname.startsWith('/portal/minhaopiniao/relatorio') ||
    pathname.startsWith('/portal/avalia/presencial/relatorio');

  const getInitialOpenMenus = useCallback(() => {
    const initial = { avaliacao: false, modalidade: false };
    if (inAvalRoutes) initial.avaliacao = true;
    if (selectedEvaluation) initial.modalidade = true;
    return initial;
  }, [inAvalRoutes, selectedEvaluation]);

  const [openMenus, setOpenMenus] = useState(getInitialOpenMenus);

  useEffect(() => {
    setOpenMenus(getInitialOpenMenus());
  }, [getInitialOpenMenus]);

  useEffect(() => {
    if (selectedEvaluation) {
      setOpenMenus((prev) => ({
        ...prev,
        avaliacao: true,
        modalidade: true,
      }));
    }
  }, [selectedEvaluation]);

  const handleMenuClick = (menuName) => {
    setOpenMenus((prev) => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const showModalidade = !!selectedEvaluation;

  const avaliacaoHeaderClass =
    inAvalRoutes && !inModalidade ? styles.activeParent : '';

  const modalidadeHeaderClass =
    inModalidade && !isReportPage ? styles.activeParent : '';

  const showGenerateButton =
    pathname === '/portal' ||
    (pathname.startsWith('/portal/ead') && reportEnabled.ead) ||
    (pathname.startsWith('/portal/avalia/presencial') &&
      reportEnabled.presencial) ||
    (pathname.startsWith('/portal/minhaopiniao') &&
      reportEnabled.minhaOpiniao);

  const isReportActive = isReportPage;

  const activeReportBtnStyle = isReportActive
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
        <LoadingOverlay
          isFullScreen={true}
          message="Carregando dados..."
        />
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
          <ul>
            <li className={pathname === '/portal' ? styles.activeParent : ''}>
              <Link href="/portal" className={styles.menuHeader}>
                <Home size={18} />
                <span>Página Inicial</span>
              </Link>
            </li>

            <li className={avaliacaoHeaderClass}>
              <div
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
              </div>

              {openMenus.avaliacao && (
                <ul className={styles.subMenu}>
                  <li
                    className={
                      (pathname.startsWith('/portal/avalia/') || pathname === '/portal/avalia')
                        ? styles.subMenuItemActive
                        : styles.subMenuItem
                    }
                  >
                    <Link href="/portal/avalia">Avalia</Link>
                  </li>

                  {featureFlags.minhaOpiniaoEnabled && (
                    <li
                      className={
                        pathname.startsWith('/portal/minhaopiniao')
                          ? styles.subMenuItemActive
                          : styles.subMenuItem
                      }
                    >
                      <Link href="/portal/minhaopiniao">Minha Opinião</Link>
                    </li>
                  )}

                  <li
                    className={
                      pathname.startsWith('/portal/avaliacaoInLoco')
                        ? styles.subMenuItemActive
                        : styles.subMenuItem
                    }
                  >
                    <Link href="/portal/avaliacaoInLoco">Avaliação In Loco</Link>
                  </li>
                </ul>
              )}
            </li>

            {showModalidade && (
              <li className={modalidadeHeaderClass}>
                <div
                  className={styles.menuHeader}
                  onClick={() => handleMenuClick('modalidade')}
                >
                  <BookCopy size={18} />
                  <span>Modalidade</span>
                  {openMenus.modalidade ? (
                    <ChevronUp size={16} className={styles.chevron} />
                  ) : (
                    <ChevronDown size={16} className={styles.chevron} />
                  )}
                </div>

                {openMenus.modalidade && (
                  <ul className={styles.subMenu}>
                    {selectedEvaluation === 'minhaopiniao' ? (
                      <>
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
                      </>
                    ) : selectedEvaluation === 'avaliacaoInLoco' ? (
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
                    ) : (
                      <>
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
                      </>
                    )}
                  </ul>
                )}
              </li>
            )}
          </ul>

          {isAdmin && (
            <ul>
              <li className={pathname.startsWith('/portal/admin') ? styles.activeParent : ''}>
                <Link href="/portal/admin/usuarios" className={styles.menuHeader}>
                  <Users size={18} />
                  <span>Usuários</span>
                </Link>
              </li>
            </ul>
          )}

          {showGenerateButton && (
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
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
