import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { services } from '../data/services';

export type BookingStatus = 'Pendente' | 'Confirmado' | 'Em Execução' | 'Concluído';

export interface Booking {
  id: string;
  serviceId: string;
  date: string; // ISO string for the date part
  timeSlot: string; // HH:mm format
  customerName: string;
  whatsapp: string;
  carModel: string;
  licensePlate: string;
  status: BookingStatus;
  createdAt: string;
}

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'>) => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  getOccupiedSlots: (date: string) => string[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('@auto-aesthetics:bookings');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('@auto-aesthetics:bookings', JSON.stringify(bookings));
  }, [bookings]);

  const addBooking = (bookingData: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: crypto.randomUUID(),
      status: 'Pendente',
      createdAt: new Date().toISOString()
    };
    setBookings((prev) => [...prev, newBooking]);
  };

  const updateBookingStatus = (id: string, status: BookingStatus) => {
    setBookings((prev) => 
      prev.map(b => b.id === id ? { ...b, status } : b)
    );
  };

  const getOccupiedSlots = (date: string) => {
    // Returns array of 'HH:mm' for a given YYYY-MM-DD that are already booked
    const dayBookings = bookings.filter(b => b.date === date);
    
    let occupied: string[] = [];
    dayBookings.forEach(booking => {
      const service = services.find(s => s.id === booking.serviceId);
      if (!service) return;
      
      const startHour = parseInt(booking.timeSlot.split(':')[0]);
      for (let i = 0; i < service.durationHours; i++) {
        occupied.push(`${(startHour + i).toString().padStart(2, '0')}:00`);
      }
    });
    
    return occupied;
  };

  return (
    <BookingContext.Provider value={{ bookings, addBooking, updateBookingStatus, getOccupiedSlots }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
