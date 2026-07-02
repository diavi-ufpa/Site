"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

const AuthContext = createContext(null);
const IDENTITY_REQUEST_TIMEOUT_MS = 20000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [identityUser, setIdentityUser] = useState(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityError, setIdentityError] = useState(null);

  const identityRequestId = useRef(0);

  const refreshIdentity = useCallback(
    async (firebaseUser = user) => {
      const requestId = identityRequestId.current + 1;
      identityRequestId.current = requestId;

      if (!firebaseUser) {
        setIdentityUser(null);
        setIdentityError(null);
        setIdentityLoading(false);
        return null;
      }

      setIdentityLoading(true);
      setIdentityError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, IDENTITY_REQUEST_TIMEOUT_MS);

      try {
        const token = await firebaseUser.getIdToken();

        const response = await fetch("/api/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (identityRequestId.current !== requestId) {
          return null;
        }

        if (!response.ok) {
          const message =
            data?.error ||
            "Usuario autenticado, mas nao autorizado internamente.";

          setIdentityUser(null);
          setIdentityError(message);

          return null;
        }

        const internalUser =
          data?.user ||
          data?.identityUser ||
          data?.identity_user ||
          data?.data ||
          null;

        if (!internalUser) {
          throw new Error("Resposta invalida da rota /api/me");
        }

        setIdentityUser(internalUser);
        setIdentityError(null);

        return internalUser;
      } catch (error) {
        if (identityRequestId.current !== requestId) {
          return null;
        }

        setIdentityUser(null);
        setIdentityError(
          error?.name === "AbortError"
            ? "Tempo esgotado ao validar autorizacao interna."
            : error?.message || "Erro ao validar autorizacao interna."
        );

        return null;
      } finally {
        clearTimeout(timeoutId);

        if (identityRequestId.current === requestId) {
          setIdentityLoading(false);
        }
      }
    },
    [user]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    refreshIdentity(user);
  }, [user, authLoading, refreshIdentity]);

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    setIdentityUser(null);
    setIdentityError(null);
    setIdentityLoading(false);

    return signOut(auth);
  }

  const authorizedFetch = useCallback(
    async (input, init = {}) => {
      if (!user) {
        throw new Error("Usuario nao autenticado.");
      }

      const token = await user.getIdToken();
      const headers = new Headers(init.headers);
      headers.set("Authorization", `Bearer ${token}`);

      return fetch(input, {
        ...init,
        headers,
      });
    },
    [user]
  );

  const value = {
    user,
    authLoading,

    identityUser,
    identityLoading,
    identityError,
    refreshIdentity,

    isFirebaseAuthenticated: !!user,
    isAuthenticated: !!user,
    isAuthorized: !!user && !!identityUser,
    isAdmin: identityUser?.role === "admin",

    appLoading: authLoading || identityLoading,

    login,
    logout,
    authorizedFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
