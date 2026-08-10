const MODALITIES = [
  {
    id: 'avalia-presencial',
    name: 'Avalia Presencial',
    shortDescription: 'Resultados das avaliações presenciais por período acadêmico.',
    description:
      'Fundação preparada para receber, validar e processar os arquivos DISC e DOC. As regras reais serão conectadas em uma próxima etapa.',
    status: 'foundation',
    statusLabel: 'Estrutura inicial',
    icon: 'chart',
    acceptedFileTypes: '.csv,.xlsx',
    periodsSource: 'avalia-presencial-graph',
    instructions: [
      'Separe os arquivos da modalidade e confirme o período acadêmico antes de iniciar.',
      'Não altere os nomes das colunas até que o contrato definitivo da planilha seja publicado.',
      'A validação e a persistência ainda não estão habilitadas nesta etapa da reestruturação.',
    ],
    faq: [
      {
        question: 'Os dados são gravados assim que o arquivo é selecionado?',
        answer:
          'Não. A seleção é apenas local nesta etapa. O fluxo futuro terá validação, resumo e confirmação antes da persistência.',
      },
      {
        question: 'O que acontecerá se o período já existir?',
        answer:
          'A carga deverá ser interrompida e exigir uma decisão explícita. O ETL atual já recusa semestres duplicados.',
      },
      {
        question: 'CSV e XLSX serão aceitos?',
        answer:
          'O pipeline existente aceita os dois formatos. O contrato definitivo será validado quando esta modalidade for implementada.',
      },
    ],
  },
  {
    id: 'microdados-enade',
    name: 'Microdados Enade',
    shortDescription: 'Carga analítica anual dos microdados do Enade.',
    status: 'coming-soon',
    statusLabel: 'Em breve',
    icon: 'graduation',
  },
  {
    id: 'avaliacao-in-loco',
    name: 'Avaliação In Loco',
    shortDescription: 'Dados históricos de avaliações de cursos.',
    status: 'coming-soon',
    statusLabel: 'Em breve',
    icon: 'clipboard',
  },
];

export function listModalities() {
  return MODALITIES;
}

export function getModality(id) {
  return MODALITIES.find((modality) => modality.id === id) ?? null;
}
