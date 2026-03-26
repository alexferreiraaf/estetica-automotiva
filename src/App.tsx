import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { ThemeProvider } from './context/ThemeContext';
import { ClientLayout } from './layouts/ClientLayout';
import { Catalog } from './pages/client/Catalog';
import { Wizard } from './pages/client/Wizard';
import { AdminLayout } from './layouts/AdminLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { BookingsList } from './pages/admin/BookingsList';
import { CalendarView } from './pages/admin/CalendarView';
import { Login } from './pages/admin/Login';
import { Settings } from './pages/admin/Settings';
import { Customers } from './pages/admin/Customers';
import { Services } from './pages/admin/Services';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { Aesthetics } from './pages/superadmin/Aesthetics';

// Simple mock authentication check
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = localStorage.getItem('admin_auth') === 'true';
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Simple mock super admin authentication check
const SuperAdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = localStorage.getItem('superadmin_auth') === 'true';
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <BookingProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route path="/client/:aestheticId" element={<ClientLayout />}>
               <Route index element={<Catalog />} />
               <Route path="booking/:serviceId" element={<Wizard />} />
            </Route>
            
            <Route path="/login" element={<Login />} />
            
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
               <Route index element={<Dashboard />} />
               <Route path="bookings" element={<BookingsList />} />
               <Route path="calendar" element={<CalendarView />} />
               <Route path="customers" element={<Customers />} />
               <Route path="services" element={<Services />} />
               <Route path="settings" element={<Settings />} />
               <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>

            <Route path="/superadmin" element={
              <SuperAdminProtectedRoute>
                <SuperAdminLayout />
              </SuperAdminProtectedRoute>
            }>
               <Route index element={<SuperAdminDashboard />} />
               <Route path="aesthetics" element={<Aesthetics />} />
               <Route path="*" element={<Navigate to="/superadmin" replace />} />
            </Route>
          </Routes>
        </BookingProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
