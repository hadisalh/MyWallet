import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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

const App: React.FC = () => {
  return (
    <FinanceProvider>
      <HashRouter>
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
          </Route>
        </Routes>
      </HashRouter>
    </FinanceProvider>
  );
};

export default App;