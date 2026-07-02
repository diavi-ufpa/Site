import { getAvaliacaoInLocoEvolucaoAnual } from '@/lib/avaliacaoInLocoData';
import { requireIdentityUser } from '@/lib/require-identity-user';

export async function GET(request) {
  try {
    const auth = await requireIdentityUser(request);
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const data = getAvaliacaoInLocoEvolucaoAnual({
      undAcad: searchParams.get('undAcad') ?? '',
      curso: searchParams.get('curso') ?? '',
    });
    return Response.json(data);
  } catch (error) {
    console.error('Erro na API de gráfico de evolução:', error);
    return Response.json(
      { error: 'Erro ao processar gráfico de evolução' },
      { status: 500 }
    );
  }
}
