import 'server-only';

import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';

const uniqSorted = (arr = []) => [...new Set((arr || []).filter(Boolean))].sort();

export async function getPresencialReportData() {
  const baseDir = path.join(process.cwd(), 'data', 'avalia');
  const filtersByYear = {};
  const anos = new Set();

  // Busca arquivos CSV ou XLSX da avaliação presencial
  if (fs.existsSync(baseDir)) {
    try {
      const files = fs.readdirSync(baseDir).filter((f) => f.endsWith('.csv') && !f.toUpperCase().includes('EAD') && !f.toUpperCase().includes('DISTÂNCIA'));

      for (const file of files) {
        try {
          const p = path.join(baseDir, file);
          const csv = fs.readFileSync(p, 'utf8');
          const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
          const data = parsed.data || [];
          if (!data.length) continue;
          const anoMatch = (file.match(/(\d{4})/) || [])[0] || file;
          const cursos = uniqSorted(data.map((r) => r['Curso'] || r['curso'] || r['CURSO']));
          const campi = uniqSorted(data.map((r) => r['Campus'] || r['campus'] || r['CAMPUS']));
          filtersByYear[anoMatch] = { campi, cursos };
          anos.add(anoMatch);
        } catch (e) {
          console.warn('Falha ao ler', file, e?.message);
        }
      }
    } catch (err) {
      console.warn('Falha ao listar diretório de dados presencial:', err?.message);
    }
  }

  const anosDisponiveis = [...anos].sort((a, b) => Number(b) - Number(a));
  return { filtersByYear, anosDisponiveis };
}


