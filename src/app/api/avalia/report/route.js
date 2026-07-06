import { requireIdentityUser } from '@/lib/require-identity-user';
import { getPresencialReportData } from '@/lib/presencial-report-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const auth = await requireIdentityUser(request);
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

    const data = await getPresencialReportData();
    return Response.json(data, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Erro em /api/avalia/report:', error);
    return Response.json({ error: 'Erro ao carregar relatório presencial' }, { status: 500 });
  }
}
