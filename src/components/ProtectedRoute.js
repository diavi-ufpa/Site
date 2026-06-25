"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "@/styles/public.module.css";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const {
    appLoading,
    identityError,
    identityUser,
    isFirebaseAuthenticated,
    logout,
  } = useAuth();

  useEffect(() => {
    if (!appLoading && !isFirebaseAuthenticated) {
      router.replace("/login");
    }
  }, [appLoading, isFirebaseAuthenticated, router]);

  if (appLoading) {
    return (
      <main className={styles.authPage}>
        <section className={styles.authCard}>
          <p className={styles.loadingText}>Verificando acesso...</p>
        </section>
      </main>
    );
  }

  if (!isFirebaseAuthenticated) {
    return null;
  }

  if (isFirebaseAuthenticated && !identityUser) {
    return (
      <main className={styles.authPage}>
        <section className={styles.authCard}>
          <h1>Usuário não autorizado</h1>
          <p>
            {identityError ||
              "Seu login Firebase foi confirmado, mas seu usuário ainda não está ativo na base interna da DIAVI."}
          </p>
          <button className={styles.submitButton} type="button" onClick={logout}>
            Sair
          </button>
        </section>
      </main>
    );
  }

  return children;
}
