import Header from '@/components/ui/Header';
import MicrodadosClient from './MicrodadosClient';

export const dynamic = 'force-dynamic';

export default function MicrodadosPage() {
  return (
    <div>
      <Header
        title="Microdados Enade"
        date="Enade 2023"
      />
      <MicrodadosClient />
    </div>
  );
}
