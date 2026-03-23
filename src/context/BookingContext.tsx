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
  aesthetic: any | null;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [user, setUser] = useState<any>(null);
  const [aesthetic, setAesthetic] = useState<any | null>(null);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_IN') {
        // Force refetch on sign in
        fetchBookings(session?.user.id);
        fetchServices(session?.user.id);
        fetchAesthetic(session?.user.id);
      } else if (_event === 'SIGNED_OUT') {
        setBookings([]);
        setDbServices([]);
        setAesthetic(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchBookings(user?.id);
    fetchServices(user?.id);

    // Subscribe to realtime changes
    const channel = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings(user?.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchBookings = async (userId?: string) => {
    let query = supabase
      .from('bookings')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // If no user, and not in a specific aesthetic's public view, return nothing or public data
      // For now, if no userId, we only return nothing to prevent leaks in admin panel
      // (Client view handles its own fetching or passes aestheticId)
      const adminAuth = localStorage.getItem('admin_auth');
      if (adminAuth === 'true') {
        // If we think we are admin but have no user.id, wait for auth
        return;
      }
    }

    const { data, error } = await query;
    
    if (!error && data) {
      setBookings(data as Booking[]);
    }
  };

  const fetchServices = async (userId?: string, aestheticId?: string) => {
    let query = supabase.from('services').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (aestheticId) {
      // Fetch services for a specific aesthetic (Public View)
      // We need to join or have aestheticId in services
      // For now, services has user_id which links to aesthetic.user_id
      const { data: aesthetic } = await supabase
        .from('aesthetics')
        .select('user_id')
        .eq('id', aestheticId)
        .single();
      
      if (aesthetic?.user_id) {
        query = query.eq('user_id', aesthetic.user_id);
      }
    } else {
      const adminAuth = localStorage.getItem('admin_auth');
      if (adminAuth === 'true') return;
    }

    const { data, error } = await query;
    
    if (!error && data) {
      setDbServices(data as Service[]);
    }
  };

  const fetchAesthetic = async (userId?: string) => {
    const currentUserId = userId || user?.id;
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('aesthetics')
      .select('*')
      .eq('user_id', currentUserId)
      .single();
    
    if (error) {
      console.error('Error fetching aesthetic:', error);
    } else {
      setAesthetic(data);
    }
  };

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
    const optimisticId = crypto.randomUUID();
    const currentUserId = user?.id || (bookingData as any).user_id;

    const newBooking: Booking = {
      ...bookingData,
      id: optimisticId,
      user_id: currentUserId,
      status: 'Pendente',
      createdAt: new Date().toISOString()
    };
    
    setBookings((prev) => [...prev, newBooking]);

    // Upsert customer with user_id manually to respect tenant isolation
    if (currentUserId) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('whatsapp', bookingData.whatsapp)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (existingCustomer) {
        await supabase
          .from('customers')
          .update({
            name: bookingData.customerName,
            carModel: bookingData.carModel,
            licensePlate: bookingData.licensePlate.toUpperCase(),
            vehicleType: (bookingData as any).vehicleType || 'Carro',
          })
          .eq('id', existingCustomer.id);
      } else {
        await supabase.from('customers').insert([{
          name: bookingData.customerName,
          whatsapp: bookingData.whatsapp,
          carModel: bookingData.carModel,
          licensePlate: bookingData.licensePlate.toUpperCase(),
          vehicleType: (bookingData as any).vehicleType || 'Carro',
          user_id: currentUserId
        }]);
      }
    }

    const { error } = await supabase
      .from('bookings')
      .insert([{
        id: optimisticId,
        serviceId: bookingData.serviceId,
        user_id: currentUserId,
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
      fetchBookings(user?.id);
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

    if (error) fetchBookings(user?.id);
  };
  
  const deleteBooking = async (id: string) => {
    setBookings((prev) => prev.filter(b => b.id !== id));
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) fetchBookings(user?.id);
  };

  const getOccupiedSlots = (date: string) => {
    const dayBookings = bookings.filter(b => b.date === date);
    let occupied: string[] = [];
    
    dayBookings.forEach(booking => {
      const service = dbServices.find(s => s.id === booking.serviceId);
      if (!service) return;
      
      const startHour = parseInt(booking.timeSlot.split(':')[0]);
      for (let i = 0; i < service.durationHours; i++) {
        occupied.push(`${(startHour + i).toString().padStart(2, '0')}:00`);
      }
    });
    
    return occupied;
  };

  return (
    <BookingContext.Provider value={{ 
      bookings, 
      services: dbServices, 
      addBooking, 
      updateBookingStatus, 
      deleteBooking, 
      getOccupiedSlots,
      aesthetic
    }}>
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
