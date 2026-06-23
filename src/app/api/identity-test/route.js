import { identitySql } from '@/lib/identity-db';

export async function GET() {
  try {
    const result = await identitySql`
      SELECT COUNT(*)::int AS total
      FROM identity_users
    `;

    return Response.json({
      ok: true,
      database: 'connected',
      totalUsers: result[0].total,
    });
  } catch (error) {
    console.error('Erro ao testar banco de identidade:', error);

    return Response.json(
      {
        ok: false,
        error: 'Erro ao conectar ao banco de identidade',
      },
      { status: 500 }
    );
  }
}