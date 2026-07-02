import { getAvaliacaoInLocoFilters } from '@/lib/avaliacaoInLocoData';
import { requireIdentityUser } from '@/lib/require-identity-user';

export async function GET(request) {
  try {
    const auth = await requireIdentityUser(request);
    if (!auth.ok) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);

    const data = getAvaliacaoInLocoFilters({
      ano: searchParams.get('ano') ?? '',
      undAcad: searchParams.get('undAcad') ?? '',
      modalidade: searchParams.get('modalidade') ?? '',
      campus: searchParams.get('campus') ?? '',
    });

    return Response.json({
      anos: data.anos,
      undAcad: data.undAcad,
      campi: data.campi,
      cursos: data.cursos,
      modalidades: data.modalidades,
    });
  } catch (error) {
    console.error('Erro na API:', error);
    return Response.json(
      { error: 'Erro ao processar dados' },
      { status: 500 }
    );
  }
}
