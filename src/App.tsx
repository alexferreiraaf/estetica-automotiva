import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { ClientLayout } from './layouts/ClientLayout';
import { Catalog } from './pages/client/Catalog';
import { Wizard } from './pages/client/Wizard';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { BookingsList } from './pages/admin/BookingsList';
import { CalendarView } from './pages/admin/CalendarView';
import { Login } from './pages/admin/Login';

// Simple mock authentication check
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = localStorage.getItem('admin_auth') === 'true';
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <BookingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ClientLayout />}>
             <Route index element={<Catalog />} />
             <Route path="booking/:serviceId" element={<Wizard />} />
          </Route>
          
          <Route path="/admin/login" element={<Login />} />
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
             <Route index element={<Dashboard />} />
             <Route path="bookings" element={<BookingsList />} />
             <Route path="calendar" element={<CalendarView />} />
             <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </BookingProvider>
  );
}

export default App;
