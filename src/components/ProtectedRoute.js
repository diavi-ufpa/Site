"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const publicRoutes = ["/login"];

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { authLoading, isAuthenticated } = useAuth();

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!authLoading && !isAuthenticated && !isPublicRoute) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, isPublicRoute, router]);

  if (authLoading) {
    return <p>Carregando autenticação...</p>;
  }

  if (!isAuthenticated && !isPublicRoute) {
    return null;
  }

  return children;
}