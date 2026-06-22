"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthTestPage() {
  const router = useRouter();
  const { user, authLoading, isAuthenticated, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (authLoading) {
    return <p>Carregando autenticação...</p>;
  }

  if (!isAuthenticated) {
    return (
      <main>
        <h1>Usuário não autenticado</h1>
        <button onClick={() => router.push("/login")}>Ir para login</button>
      </main>
    );
  }

  return (
    <main>
      <h1>Usuário autenticado</h1>

      <p>
        <strong>E-mail:</strong> {user.email}
      </p>

      <p>
        <strong>UID Firebase:</strong> {user.uid}
      </p>

      <button onClick={handleLogout}>Sair</button>
    </main>
  );
}