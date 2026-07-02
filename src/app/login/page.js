"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "@/styles/public.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { appLoading, identityUser, isFirebaseAuthenticated, login, refreshIdentity } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!appLoading && isFirebaseAuthenticated && identityUser) {
      router.replace("/portal");
    }
  }, [appLoading, identityUser, isFirebaseAuthenticated, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const credential = await login(email, password);
      const identity = await refreshIdentity(credential.user);

      if (!identity) {
        setError("Login confirmado, mas a autorizacao interna falhou.");
        return;
      }

      router.push("/portal");
    } catch {
      setError("Email ou senha invalidos.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isFirebaseAuthenticated && (appLoading || identityUser)) {
    return (
      <main className={styles.authPage}>
        <section className={styles.authCard}>
          <p className={styles.loadingText}>Verificando acesso...</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.authPage}>
      <section className={styles.authCard}>
        <Link className={styles.backLink} href="/">
          Voltar para a home
        </Link>
        <h1>Entrar na DIAVI</h1>
        <p>
          Informe suas credenciais para acessar a área restrita do sistema.
        </p>

      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error && <p className={styles.formError}>{error}</p>}

        <button className={styles.submitButton} type="submit" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
      </section>
    </main>
  );
}
