import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DataProvider } from '@/contexts/DataContext';

export default function PortalLayout({ children }) {
  return (
    <ProtectedRoute>
      <DataProvider>
        <div className="appShell">
          <Sidebar />
          <main className="appMain appMainWithFixedSidebar">
            <div className="appMainContent">{children}</div>
            <Footer />
          </main>
        </div>
      </DataProvider>
    </ProtectedRoute>
  );
}
