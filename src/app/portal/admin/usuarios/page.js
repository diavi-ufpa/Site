'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './usuarios.module.css';

function formatDate(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { appLoading, authorizedFetch, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (appLoading) return;

    if (!isAdmin) {
      router.replace('/portal');
      return;
    }

    const controller = new AbortController();

    async function loadUsers() {
      try {
        const response = await authorizedFetch('/api/admin/users', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || 'Não foi possível carregar os usuários.');
        }

        setUsers(data.users || []);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Não foi possível carregar os usuários.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadUsers();
    return () => controller.abort();
  }, [appLoading, authorizedFetch, isAdmin, router]);

  if (appLoading || !isAdmin) return null;

  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <div>
          <h1>Usuários</h1>
          <p>Usuários cadastrados no sistema.</p>
        </div>
        {!loading && !error && <span className={styles.count}>{users.length}</span>}
      </div>

      {loading && <p className={styles.message}>Carregando usuários...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th>Último acesso</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || '—'}</td>
                  <td>{user.email}</td>
                  <td>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</td>
                  <td>
                    <span className={`${styles.status} ${styles[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>{formatDate(user.last_login_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
