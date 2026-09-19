import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LoanCalculatorPage from './pages/LoanCalculatorPage';
import TaxCalculatorPage from './pages/TaxCalculatorPage';
import BusinessPlanPage from './pages/BusinessPlanPage';
import MarketAnalysisPage from './pages/MarketAnalysisPage';
import TransactionsPage from './pages/TransactionsPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function Admin({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminRoute>
        <Layout>{children}</Layout>
      </AdminRoute>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/transactions" element={<Protected><TransactionsPage /></Protected>} />
      <Route path="/loan-calculator" element={<Protected><LoanCalculatorPage /></Protected>} />
      <Route path="/tax-calculator" element={<Protected><TaxCalculatorPage /></Protected>} />
      <Route path="/business-plan" element={<Protected><BusinessPlanPage /></Protected>} />
      <Route path="/market-analysis" element={<Protected><MarketAnalysisPage /></Protected>} />
      <Route path="/chat" element={<Protected><ChatPage /></Protected>} />
      <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />

      <Route path="/admin" element={<Admin><AdminDashboardPage /></Admin>} />
      <Route path="/admin/users" element={<Admin><AdminUsersPage /></Admin>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}