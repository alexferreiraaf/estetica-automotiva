import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { services } from '../data/services';
import { supabase } from '../lib/supabase';

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
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  getOccupiedSlots: (date: string) => string[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetchBookings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings(); // refresh the list when change happens
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching bookings:', error);
    } else if (data) {
      // Data matches our interface exactly due to table schema
      setBookings(data as Booking[]);
    }
  };

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
    // Generate optimistic ID for immediate UI update (optional, but good for UX)
    const optimisticId = crypto.randomUUID();
    const newBooking: Booking = {
      ...bookingData,
      id: optimisticId,
      status: 'Pendente',
      createdAt: new Date().toISOString()
    };
    
    // Optimistic update
    setBookings((prev) => [...prev, newBooking]);

    const { error } = await supabase
      .from('bookings')
      .insert([bookingData]);

    if (error) {
      console.error('Error adding booking:', error);
      // Revert optimistic update if needed
      fetchBookings();
    }
  };

  const updateBookingStatus = async (id: string, status: BookingStatus) => {
    // Optimistic update
    setBookings((prev) => 
      prev.map(b => b.id === id ? { ...b, status } : b)
    );

    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating booking status:', error);
      // Revert optimistic update on failure
      fetchBookings();
    }
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
