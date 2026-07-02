import { requireIdentityUser } from '@/lib/require-identity-user';

export async function requireAdminUser(request) {
  const auth = await requireIdentityUser(request);

  if (!auth.ok) {
    return auth;
  }

  if (auth.user.role !== 'admin') {
    return {
      ok: false,
      status: 403,
      error: 'Acesso permitido apenas para administradores',
    };
  }

  return {
    ok: true,
    user: auth.user,
  };
}
