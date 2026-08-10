export const LOAD_STAGES = Object.freeze([
  { id: 'instructions', label: 'Instruções' },
  { id: 'file', label: 'Arquivo' },
  { id: 'validation', label: 'Validação' },
  { id: 'processing', label: 'Processamento' },
  { id: 'result', label: 'Resultado' },
]);

export const LOAD_STATUS = Object.freeze({
  FILE_SELECTED: 'file-selected',
  VALIDATING: 'validating',
  INVALID: 'invalid',
  READY: 'ready',
  PROCESSING: 'processing',
  PERSISTING: 'persisting',
  COMPLETED: 'completed',
  ERROR: 'error',
});
