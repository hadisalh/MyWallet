import React, { useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Debts from './pages/Debts';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import Advisor from './pages/Advisor';
import Recurring from './pages/Recurring';
import CalendarView from './pages/CalendarView';

// Component to handle initial redirect to home ONLY ONCE
const ForceHome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);
  
  useEffect(() => {
    // Check if we haven't redirected yet
    if (!hasRedirected.current) {
        hasRedirected.current = true;
        // Only redirect if we are not already at the root
        if (location.pathname !== '/') {
            navigate('/', { replace: true });
        }
    }
  }, [navigate, location]);

  return null;
};

const App: React.FC = () => {
  return (
    <FinanceProvider>
      <HashRouter>
        <ForceHome />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="recurring" element={<Recurring />} />
            <Route path="calendar" element={<CalendarView />} />
            <Route path="debts" element={<Debts />} />
            <Route path="budget" element={<Budget />} />
            <Route path="goals" element={<Goals />} />
            <Route path="advisor" element={<Advisor />} />
            <Route path="settings" element={<Settings />} />
            {/* Catch-all route to redirect any unknown paths to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </FinanceProvider>
  );
};

export default App;