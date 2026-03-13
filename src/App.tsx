import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { ClientLayout } from './layouts/ClientLayout';
import { Catalog } from './pages/client/Catalog';
import { Wizard } from './pages/client/Wizard';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { BookingsList } from './pages/admin/BookingsList';
import { CalendarView } from './pages/admin/CalendarView';

function App() {
  return (
    <BookingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ClientLayout />}>
             <Route index element={<Catalog />} />
             <Route path="booking/:serviceId" element={<Wizard />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
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
