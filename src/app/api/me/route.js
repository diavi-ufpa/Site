import { requireIdentityUser } from '@/lib/require-identity-user';
import { identitySql } from '@/lib/identity-db';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const auth = await requireIdentityUser(request);

    if (!auth.ok) {
      return Response.json(
        {
          ok: false,
          error: auth.error,
          status: auth.userStatus,
        },
        { status: auth.status }
      );
    }

    const identityUser = auth.user;

    await identitySql`
      UPDATE identity_users
      SET
        last_login_at = NOW(),
        updated_at = NOW()
      WHERE id = ${identityUser.id}
    `;

    return Response.json({
      ok: true,
      user: {
        id: identityUser.id,
        email: identityUser.email,
        name: identityUser.name,
        role: identityUser.role,
        status: identityUser.status,
      },
    });
  } catch (error) {
    console.error('Erro em /api/me:', error);

    return Response.json(
      {
        ok: false,
        error: 'Erro ao consultar identidade do usuário',
      },
      { status: 500 }
    );
  }
}
