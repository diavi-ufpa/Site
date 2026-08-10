import { NextResponse } from 'next/server';

import { getModality } from '@/features/data-admin/modalities/registry';
import { listImportedPeriods } from '@/features/data-admin/persistence/period-repository';
import { requireAdminUser } from '@/lib/require-admin-user';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const auth = await requireAdminUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { modalityId } = await params;
  const modality = getModality(modalityId);
  if (!modality) return NextResponse.json({ error: 'Modalidade não encontrada.' }, { status: 404 });

  try {
    const result = await listImportedPeriods(modality);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[admin-data-periods] Falha ao consultar períodos:', error);
    return NextResponse.json({ error: 'Não foi possível consultar os períodos.' }, { status: 500 });
  }
}
