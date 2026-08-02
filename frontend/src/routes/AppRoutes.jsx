import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { TripList } from '../features/trips/TripList';
import { FundSummaryView } from '../features/funds/FundSummaryView';
import { ExpenseList } from '../features/expenses/ExpenseList';
import { SettlementDashboard } from '../features/settlement/SettlementDashboard';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Private Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<TripList />} />
            <Route path="funds" element={<FundSummaryView />} />
            <Route path="expenses" element={<ExpenseList />} />
            <Route path="settlement" element={<SettlementDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
