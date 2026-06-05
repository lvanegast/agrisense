import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ZoneDetail from './pages/ZoneDetail';
import Alerts from './pages/Alerts';
import Rules from './pages/Rules';
import WorkOrders from './pages/WorkOrders';

function ProtectedRoute({ children }) {
  const { authenticated } = useAuth();
  if (!authenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="zones/:zoneId" element={<ZoneDetail />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="rules" element={<Rules />} />
            <Route path="work-orders" element={<WorkOrders />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
