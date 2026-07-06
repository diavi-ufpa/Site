import 'server-only';

import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';

const uniqSorted = (arr = []) => [...new Set((arr || []).filter(Boolean))].sort();

export async function getPresencialReportData() {
  const baseDir = path.join(process.cwd(), 'data', 'avalia');
  const filtersByYear = {};
  const anos = new Set();

  // Tenta carregar CSVs conhecidos
  const candidates = [
    'AUTOAVALIAÇÃO DOS CURSOS DE GRADUAÇÃO A DISTÂNCIA - 2025-2.csv',
    'AUTOAVALIAÇÃO DOS CURSOS DE GRADUAÇÃO A DISTÂNCIA - 2023-4 .csv'
  ];

  for (const file of candidates) {
    try {
      const p = path.join(baseDir, file);
      if (!fs.existsSync(p)) continue;
      const csv = fs.readFileSync(p, 'utf8');
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
      const data = parsed.data || [];
      if (!data.length) continue;
      const anoMatch = (file.match(/(\d{4})/) || [])[0] || file;
      const cursos = uniqSorted(data.map(r => r['Qual é o seu Curso?'] || r['Curso'] || r['curso']));
      const polos = uniqSorted(data.map(r => r['Qual o seu Polo de Vinculação?'] || r['Polo'] || r['polo']));
      filtersByYear[anoMatch] = { hasPolos: polos.length > 0, polos, cursos };
      anos.add(anoMatch);
    } catch (e) {
      console.warn('Falha ao ler', file, e?.message);
    }
  }

  const anosDisponiveis = [...anos].sort((a, b) => Number(b) - Number(a));
  return { filtersByYear, anosDisponiveis };
}

