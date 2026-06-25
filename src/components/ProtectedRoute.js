"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const publicRoutes = ["/", "/login"];

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    appLoading,
    identityError,
    identityUser,
    isFirebaseAuthenticated,
    logout,
  } = useAuth();

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!appLoading && !isFirebaseAuthenticated && !isPublicRoute) {
      router.replace("/login");
    }
  }, [appLoading, isFirebaseAuthenticated, isPublicRoute, router]);

  if (isPublicRoute) {
    return children;
  }

  if (appLoading) {
    return <p>Carregando autenticacao...</p>;
  }

  if (!isFirebaseAuthenticated) {
    return null;
  }

  if (isFirebaseAuthenticated && !identityUser) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "#f8fafc",
        }}
      >
        <section
          style={{
            width: "min(520px, 100%)",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "2rem",
            background: "#ffffff",
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
          }}
        >
          <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.5rem" }}>
            Usuario nao autorizado
          </h1>
          <p style={{ margin: "0 0 1.5rem", color: "#475569", lineHeight: 1.6 }}>
            {identityError ||
              "Seu login Firebase foi confirmado, mas seu usuario ainda nao esta ativo na base interna da DIAVI."}
          </p>
          <button
            type="button"
            onClick={logout}
            style={{
              border: "0",
              borderRadius: "6px",
              padding: "0.75rem 1rem",
              background: "#1f2937",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Sair
          </button>
        </section>
      </main>
    );
  }

  return children;
}
