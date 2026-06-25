"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, BarChart3, LockKeyhole, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import styles from "@/styles/public.module.css";

export default function HomePage() {
  const router = useRouter();
  const {
    appLoading,
    identityError,
    identityUser,
    isFirebaseAuthenticated,
    logout,
  } = useAuth();

  const isAuthorized = isFirebaseAuthenticated && !!identityUser;
  const isUnauthorized = isFirebaseAuthenticated && !appLoading && !identityUser;

  async function handlePortalAccess() {
    if (appLoading) {
      return;
    }

    if (!isFirebaseAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthorized) {
      router.push("/portal");
    }
  }

  return (
    <main className={styles.publicPage}>
      <header className={styles.publicHeader}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>DIAVI</span>
          <span>CPA / UFPA</span>
        </div>

        {isFirebaseAuthenticated ? (
          <button
            type="button"
            className={styles.headerButton}
            onClick={handlePortalAccess}
            disabled={appLoading}
          >
            {appLoading ? "Verificando..." : "Acessar sistema"}
          </button>
        ) : (
          <Link className={styles.headerButton} href="/login">
            Entrar
          </Link>
        )}
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Avaliação institucional</p>
          <h1>Indicadores para acompanhar e aprimorar a graduação na UFPA.</h1>
          <p>
            O ambiente DIAVI reúne painéis e relatórios de avaliação acadêmica
            para apoiar análises institucionais, acompanhamento de cursos e
            tomada de decisão.
          </p>
          <p className={styles.accessNote}>
            O acesso ao sistema é restrito a usuários autenticados e
            autorizados na base interna.
          </p>

          {isUnauthorized && (
            <div className={styles.notice} role="alert">
              <div>
                <strong>Usuário não autorizado</strong>
                <p>
                  {identityError ||
                    "Seu login Firebase foi confirmado, mas não há autorização ativa no banco interno."}
                </p>
              </div>
              <button type="button" onClick={logout}>
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>

        <div className={styles.summaryPanel} aria-label="Resumo do sistema">
          <div>
            <ShieldCheck size={24} />
            <span>Acesso protegido</span>
          </div>
          <div>
            <BarChart3 size={24} />
            <span>Painéis e relatórios</span>
          </div>
          <div>
            <LockKeyhole size={24} />
            <span>Dados internos preservados</span>
          </div>
        </div>
      </section>
    </main>
  );
}
