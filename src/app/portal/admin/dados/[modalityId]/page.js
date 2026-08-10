import { notFound } from 'next/navigation';

import ModalityWorkspace from '@/features/data-admin/components/ModalityWorkspace';
import { getModality } from '@/features/data-admin/modalities/registry';

export default async function DataModalityPage({ params }) {
  const { modalityId } = await params;
  const modality = getModality(modalityId);
  if (!modality || modality.status === 'coming-soon') notFound();
  return <ModalityWorkspace modality={modality} />;
}
