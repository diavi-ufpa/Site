import 'server-only';

import { isAvaliaApiDatabaseConfigured, queryAvaliaApi } from '@/lib/neon-api';

const PERIOD_READERS = {
  'avalia-presencial-graph': async () => {
    if (!isAvaliaApiDatabaseConfigured()) {
      return { periods: [], unavailableReason: 'Banco de resultados não configurado neste ambiente.' };
    }

    try {
      const { rows } = await queryAvaliaApi(`
        SELECT codigo, inserido_em
        FROM avalia_presencial_graph.semestre
        ORDER BY ano DESC, periodo DESC
      `);

      return {
        periods: rows.map((row) => ({
          code: row.codigo,
          importedAt: row.inserido_em,
        })),
        unavailableReason: null,
      };
    } catch (error) {
      if (error?.code === '42P01' || error?.code === '3F000') {
        return {
          periods: [],
          unavailableReason: 'O schema de resultados ainda não foi criado neste banco.',
        };
      }
      throw error;
    }
  },
};

export async function listImportedPeriods(modality) {
  const reader = PERIOD_READERS[modality.periodsSource];
  if (!reader) return { periods: [], unavailableReason: 'Consulta de períodos ainda não implementada.' };
  return reader();
}
