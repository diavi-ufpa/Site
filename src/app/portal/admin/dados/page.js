import ModalitiesIndex from '@/features/data-admin/components/ModalitiesIndex';
import { listModalities } from '@/features/data-admin/modalities/registry';

export default function DataAdminPage() {
  return <ModalitiesIndex modalities={listModalities()} />;
}
