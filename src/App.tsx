import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LibraryPage from './pages/LibraryPage';
import AddBookPage from './pages/AddBookPage';
import EditBookPage from './pages/EditBookPage';
import ExportPage from './pages/ExportPage';
import ImportPage from './pages/ImportPage';
import DashboardPage from './pages/DashboardPage';
import { useAuth } from './contexts/AuthContext';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter basename="/MyLibrary">
      <Layout>
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/add"
            element={
              <AdminRoute>
                <AddBookPage />
              </AdminRoute>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <AdminRoute>
                <EditBookPage />
              </AdminRoute>
            }
          />
          <Route
            path="/export"
            element={
              <AdminRoute>
                <ExportPage />
              </AdminRoute>
            }
          />
          <Route
            path="/import"
            element={
              <AdminRoute>
                <ImportPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
