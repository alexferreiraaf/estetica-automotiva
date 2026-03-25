import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Service } from '../data/services';
import { updateLastLogin } from '../data/aesthetics';

export type BookingStatus = 'Pendente' | 'Confirmado' | 'Em Execução' | 'Concluído';

export interface Booking {
  id: string;
  serviceId: string;
  user_id?: string | null;
  aesthetic_id?: string | null;
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
      if (session?.user) {
        const aestheticId = sessionStorage.getItem('aesthetic_id');
        if (aestheticId) updateLastLogin(aestheticId);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
        const aestheticId = sessionStorage.getItem('aesthetic_id');
        if (aestheticId) updateLastLogin(aestheticId);
        // Force refetch on sign in
        fetchBookings(session?.user.id, aestheticId || undefined);
        fetchServices(session?.user.id, aestheticId || undefined);
        fetchAesthetic(session?.user.id);
      } else if (_event === 'SIGNED_OUT') {
        setBookings([]);
        setDbServices([]);
        setAesthetic(null);
      }
    });

    // Heartbeat: Update last login every 1 minute while active
    const heartbeat = setInterval(() => {
      const aestheticId = sessionStorage.getItem('aesthetic_id');
      if (aestheticId) updateLastLogin(aestheticId);
    }, 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(heartbeat);
    };
  }, []);

  useEffect(() => {
    const aestheticId = sessionStorage.getItem('aesthetic_id');
    fetchBookings(user?.id, aestheticId || undefined);
    fetchServices(user?.id, aestheticId || undefined);

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

  const fetchBookings = async (userId?: string, aestheticId?: string) => {
    let query = supabase
      .from('bookings')
      .select('*')
      .order('createdAt', { ascending: false });
    
    // Prioritize aesthetic_id for isolation
    const currentAestheticId = aestheticId || sessionStorage.getItem('aesthetic_id');
    
    if (currentAestheticId) {
      query = query.eq('aesthetic_id', currentAestheticId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // If no ID, prevent leaks
      const adminAuth = localStorage.getItem('admin_auth');
      if (adminAuth === 'true') return;
    }

    const { data, error } = await query;
    
    if (!error && data) {
      setBookings(data as Booking[]);
    }
  };

  const fetchServices = async (userId?: string, aestheticId?: string) => {
    let query = supabase.from('services').select('*').order('name');
    
    const currentAestheticId = aestheticId || sessionStorage.getItem('aesthetic_id');
    
    if (currentAestheticId) {
      // Always prioritize aesthetic_id for fetching
      query = query.eq('aesthetic_id', currentAestheticId);
    } else if (userId) {
      query = query.eq('user_id', userId);
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
    const aestheticId = sessionStorage.getItem('aesthetic_id');
    
    if (!currentUserId || !aestheticId) return;

    // Fetch by ID (source of truth for which store we are managing)
    const { data: aestheticData, error } = await supabase
      .from('aesthetics')
      .select('*')
      .eq('id', aestheticId)
      .single();
    
    if (aestheticData) {
      updateLastLogin(aestheticId);
    }
    
    if (error) {
      console.error('Error fetching aesthetic:', error);
      return;
    }

    // Sync user_id ONLY IF it is currently null (first-time claim)
    if (aestheticData && !aestheticData.user_id && currentUserId) {
      console.log('Syncing initial user_id for aesthetic:', aestheticId);
      await supabase
        .from('aesthetics')
        .update({ user_id: currentUserId })
        .eq('id', aestheticId);
      
      // Update local state with the synced data
      setAesthetic({ ...aestheticData, user_id: currentUserId });
    } else {
      setAesthetic(aestheticData);
    }
  };

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
    const optimisticId = crypto.randomUUID();
    const currentUserId = user?.id || (bookingData as any).user_id;
    const currentAestheticId = sessionStorage.getItem('aesthetic_id');

    const newBooking: Booking = {
      ...bookingData,
      id: optimisticId,
      user_id: currentUserId,
      aesthetic_id: currentAestheticId,
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
        .eq('aesthetic_id', currentAestheticId)
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
          user_id: currentUserId,
          aesthetic_id: currentAestheticId
        }]);
      }
    }

    const { error } = await supabase
      .from('bookings')
      .insert([{
        id: optimisticId,
        serviceId: bookingData.serviceId,
        user_id: currentUserId,
        aesthetic_id: currentAestheticId,
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
      
      if (!booking.timeSlot || typeof booking.timeSlot !== 'string') return;
      
      const parts = booking.timeSlot.split(':');
      if (parts.length < 1) return;
      
      const startHour = parseInt(parts[0]);
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
