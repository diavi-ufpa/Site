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

function AccessEditor({ user, authorizedFetch, onUpdated }) {
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const changed = role !== user.role || status !== user.status;

  async function save() {
    setSaving(true);
    setSaveError('');

    try {
      const response = await authorizedFetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, role, status }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível atualizar o acesso.');
      }

      onUpdated(data.user);
    } catch (requestError) {
      setSaveError(requestError.message || 'Não foi possível atualizar o acesso.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.accessEditor}>
      <select
        aria-label={`Perfil de ${user.email}`}
        value={role}
        onChange={(event) => setRole(event.target.value)}
        disabled={saving}
      >
        <option value="user">Usuário</option>
        <option value="admin">Administrador</option>
      </select>
      <select
        aria-label={`Status de ${user.email}`}
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        disabled={saving}
      >
        <option value="active">Ativo</option>
        <option value="inactive">Inativo</option>
        <option value="pending">Pendente</option>
      </select>
      <button type="button" onClick={save} disabled={!changed || saving}>
        {saving ? 'Salvando...' : 'Salvar'}
      </button>
      {saveError && <span className={styles.rowError}>{saveError}</span>}
    </div>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { appLoading, authorizedFetch, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function updateUser(updatedUser) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === updatedUser.id ? { ...user, ...updatedUser } : user
      )
    );
  }

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
          <p>Contas no Firebase e autorizações de acesso no Neon.</p>
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
                <th>Onde está</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Gerenciar acesso</th>
                <th>Cadastro</th>
                <th>Último acesso</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || '—'}</td>
                  <td>{user.email || '—'}</td>
                  <td>
                    <div className={styles.sources}>
                      {user.sources.firebase && <span className={styles.firebase}>Firebase</span>}
                      {user.sources.neon && <span className={styles.neon}>Neon</span>}
                    </div>
                  </td>
                  <td>
                    {user.sources.neon
                      ? user.role === 'admin' ? 'Administrador' : 'Usuário'
                      : 'Sem acesso ao portal'}
                  </td>
                  <td>
                    <span className={`${styles.status} ${user.status ? styles[user.status] : styles.unlisted}`}>
                      {user.status || (user.firebase_disabled ? 'desativado' : 'só no Firebase')}
                    </span>
                  </td>
                  <td>
                    {user.sources.neon ? (
                      <AccessEditor
                        user={user}
                        authorizedFetch={authorizedFetch}
                        onUpdated={updateUser}
                      />
                    ) : (
                      <span className={styles.noAccess}>Cadastre no Neon para liberar acesso</span>
                    )}
                  </td>
                  <td>{formatDate(user.created_at || user.firebase_created_at)}</td>
                  <td>{formatDate(user.firebase_last_login_at || user.last_login_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
