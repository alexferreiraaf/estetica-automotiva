import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Service } from '../data/services';

export type BookingStatus = 'Pendente' | 'Confirmado' | 'Em Execução' | 'Concluído';

export interface Booking {
  id: string;
  serviceId: string;
  user_id?: string | null;
  date: string; // ISO string for the date part
  timeSlot: string; // HH:mm format
  customerName: string;
  whatsapp: string;
  carModel: string;
  licensePlate: string;
  vehicleType: string;
  status: BookingStatus;
  createdAt: string;
}

interface BookingContextType {
  bookings: Booking[];
  services: Service[];
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  getOccupiedSlots: (date: string) => string[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dbServices, setDbServices] = useState<Service[]>([]);

  useEffect(() => {
    fetchBookings();
    fetchServices();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings();
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
    
    if (!error && data) {
      setBookings(data as Booking[]);
    }
  };

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*');
    
    if (!error && data) {
      setDbServices(data as Service[]);
    }
  };

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
    const optimisticId = crypto.randomUUID();
    const newBooking: Booking = {
      ...bookingData,
      id: optimisticId,
      status: 'Pendente',
      createdAt: new Date().toISOString()
    };
    
    setBookings((prev) => [...prev, newBooking]);

    await supabase.from('customers').upsert({
      name: bookingData.customerName,
      whatsapp: bookingData.whatsapp,
      carModel: bookingData.carModel,
      licensePlate: bookingData.licensePlate.toUpperCase(),
      vehicleType: (bookingData as any).vehicleType || 'Carro'
    }, { onConflict: 'whatsapp' });

    const { error } = await supabase
      .from('bookings')
      .insert([{
        id: optimisticId,
        serviceId: bookingData.serviceId,
        user_id: (bookingData as any).user_id,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        customerName: bookingData.customerName,
        whatsapp: bookingData.whatsapp,
        carModel: bookingData.carModel,
        licensePlate: bookingData.licensePlate.toUpperCase(),
        vehicleType: (bookingData as any).vehicleType || 'Carro',
        status: 'Pendente'
      }]);

    if (error) {
      fetchBookings();
    }
  };

  const updateBookingStatus = async (id: string, status: BookingStatus) => {
    setBookings((prev) => 
      prev.map(b => b.id === id ? { ...b, status } : b)
    );

    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (error) fetchBookings();
  };
  
  const deleteBooking = async (id: string) => {
    setBookings((prev) => prev.filter(b => b.id !== id));
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) fetchBookings();
  };

  const getOccupiedSlots = (date: string) => {
    const dayBookings = bookings.filter(b => b.date === date);
    let occupied: string[] = [];
    
    dayBookings.forEach(booking => {
      // Usar a lista de serviços do banco de dados
      const service = dbServices.find(s => s.id === booking.serviceId);
      
      // Proteção contra erro se o serviço não for encontrado
      if (!service) return;
      
      const startHour = parseInt(booking.timeSlot.split(':')[0]);
      for (let i = 0; i < service.durationHours; i++) {
        occupied.push(`${(startHour + i).toString().padStart(2, '0')}:00`);
      }
    });
    
    return occupied;
  };

  return (
    <BookingContext.Provider value={{ bookings, services: dbServices, addBooking, updateBookingStatus, deleteBooking, getOccupiedSlots }}>
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
