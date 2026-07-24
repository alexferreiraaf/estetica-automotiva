import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Service } from '../data/services';
import { updateLastLogin } from '../data/aesthetics';

const normalizePhone = (phone: string) => {
  return phone.replace(/\D/g, '');
};

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
  hasDelivery?: boolean;
  deliveryAddress?: string;
  status: BookingStatus;
  createdAt: string;
}

interface BookingContextType {
  bookings: Booking[];
  services: Service[];
  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'> & { status?: BookingStatus }) => Promise<void>;
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
        const aestheticId = localStorage.getItem('aesthetic_id');
        if (aestheticId) updateLastLogin(aestheticId);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
        const aestheticId = localStorage.getItem('aesthetic_id');
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Dedicated Heartbeat Effect
  useEffect(() => {
    const aestheticId = localStorage.getItem('aesthetic_id');
    const isAdminArea = location.pathname.startsWith('/admin');
    
    // Only heartbeat if we have a user, an aesthetic ID, and are in admin area
    if (!user || !aestheticId || !isAdminArea) return;

    // Safety check: ensure this aesthetic belongs to this user (fetched in fetchAesthetic)
    // If the aesthetic isn't loaded yet or belongs to someone else, we wait or skip
    if (aesthetic && aesthetic.id === aestheticId && aesthetic.user_id !== user.id) {
        console.warn('Attempted heartbeat for store not owned by user');
        return;
    }

    // 1. Initial immediate update
    updateLastLogin(aestheticId);

    // 2. Periodic heartbeat every minute
    const interval = setInterval(() => {
      const currentId = localStorage.getItem('aesthetic_id');
      const stillAdmin = window.location.pathname.startsWith('/admin');
      if (currentId && stillAdmin && user) {
        updateLastLogin(currentId);
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [user, location.pathname, aesthetic?.id]); // Also depend on aesthetic data load

  useEffect(() => {
    const aestheticId = localStorage.getItem('aesthetic_id');
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
    const currentAestheticId = aestheticId || localStorage.getItem('aesthetic_id');
    
    if (currentAestheticId) {
      query = query.eq('aesthetic_id', currentAestheticId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // If no ID, prevent leaks and force selection ONLY in admin area
      const adminAuth = localStorage.getItem('admin_auth');
      const isAdminArea = window.location.pathname.startsWith('/admin');
      
      if (isAdminArea && adminAuth === 'true' && !localStorage.getItem('aesthetic_id')) {
        window.location.href = '/login';
        return;
      }
      return;
    }

    const { data, error } = await query;
    
    if (!error && data) {
      setBookings(data as Booking[]);
    }
  };

  const fetchServices = async (userId?: string, aestheticId?: string) => {
    let query = supabase.from('services').select('*').order('name');
    
    const currentAestheticId = aestheticId || localStorage.getItem('aesthetic_id');
    
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
    const aestheticId = localStorage.getItem('aesthetic_id');
    
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

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'status' | 'createdAt'> & { status?: BookingStatus }) => {
    const optimisticId = crypto.randomUUID();
    const currentUserId = user?.id || (bookingData as any).user_id || aesthetic?.user_id;
    const currentAestheticId = localStorage.getItem('aesthetic_id');
    const normalizedWhatsApp = normalizePhone(bookingData.whatsapp || '');
    const initialStatus = bookingData.status || 'Pendente';

    const newBooking: Booking = {
      ...bookingData,
      whatsapp: normalizedWhatsApp,
      id: optimisticId,
      user_id: currentUserId,
      aesthetic_id: currentAestheticId,
      status: initialStatus,
      createdAt: new Date().toISOString()
    };
    
    setBookings((prev) => [...prev, newBooking]);

    // Upsert customer with owner's user_id to ensure visibility in admin panel
    if (currentAestheticId) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('whatsapp', normalizedWhatsApp)
        .eq('aesthetic_id', currentAestheticId)
        .maybeSingle();

      const customerData = {
        name: bookingData.customerName,
        whatsapp: normalizedWhatsApp,
        carModel: bookingData.carModel,
        licensePlate: bookingData.licensePlate.toUpperCase(),
        vehicleType: (bookingData as any).vehicleType || 'Carro',
        user_id: currentUserId,
        aesthetic_id: currentAestheticId
      };

      if (existingCustomer) {
        await supabase
          .from('customers')
          .update(customerData)
          .eq('id', existingCustomer.id);
      } else {
        await supabase.from('customers').insert([customerData]);
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
        whatsapp: normalizedWhatsApp,
        carModel: bookingData.carModel,
        licensePlate: bookingData.licensePlate.toUpperCase(),
        vehicleType: (bookingData as any).vehicleType || 'Carro',
        hasDelivery: bookingData.hasDelivery ?? false,
        deliveryAddress: bookingData.deliveryAddress || null,
        status: initialStatus
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
