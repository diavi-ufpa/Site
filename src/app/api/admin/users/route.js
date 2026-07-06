import { requireAdminUser } from '@/lib/require-admin-user';
import { identitySql } from '@/lib/identity-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const auth = await requireAdminUser(request);

    if (!auth.ok) {
      return Response.json(
        { ok: false, error: auth.error },
        {
          status: auth.status,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    const users = await identitySql`
      SELECT
        id,
        email,
        name,
        role,
        status,
        created_at,
        last_login_at
      FROM identity_users
      ORDER BY created_at DESC
    `;

    return Response.json(
      { ok: true, users },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Erro em /api/admin/users:', error);

    return Response.json(
      { ok: false, error: 'Erro ao consultar usuários' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
