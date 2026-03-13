import { useMemo } from 'react';
import { useBooking } from '../../context/BookingContext';
import { services } from '../../data/services';
import { Calendar, CheckCircle2, DollarSign, Clock } from 'lucide-react';
import { isSameDay, startOfToday, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export function Dashboard() {
  const { bookings } = useBooking();

  const stats = useMemo(() => {
    const today = startOfToday();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

    let todayCount = 0;
    let weekCount = 0;
    let pendingCount = 0;
    let totalRevenueEst = 0;

    bookings.forEach(b => {
      const date = parseISO(b.date);
      const service = services.find(s => s.id === b.serviceId);
      const price = service ? service.price : 0;

      if (isSameDay(date, today)) {
        todayCount++;
      }
      
      if (isWithinInterval(date, { start: weekStart, end: weekEnd })) {
        weekCount++;
      }

      if (b.status === 'Pendente') {
        pendingCount++;
      }

      if (b.status !== 'Concluído') {
         // Count all non-canceled/finished as expected revenue? 
         // For simplicity, sum all bookings for total volume, or maybe just concluded? 
         // Let's sum all bookings overall for a simple "Global Volume" stat
         totalRevenueEst += price;
      }
    });

    return {
      today: todayCount,
      week: weekCount,
      pending: pendingCount,
      revenue: totalRevenueEst
    };
  }, [bookings]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-extrabold text-white mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
           <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 font-medium">Hoje</span>
              <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/10 flex items-center justify-center">
                 <Calendar className="w-5 h-5 text-[#00f0ff]" />
              </div>
           </div>
           <p className="text-3xl font-bold text-white">{stats.today}</p>
           <p className="text-sm text-gray-500 mt-2">Agendamentos hoje</p>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
           <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 font-medium">Nesta Semana</span>
              <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
                 <CheckCircle2 className="w-5 h-5 text-[#d4af37]" />
              </div>
           </div>
           <p className="text-3xl font-bold text-white">{stats.week}</p>
           <p className="text-sm text-gray-500 mt-2">Serviços na semana</p>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
           <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 font-medium">Pendentes</span>
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                 <Clock className="w-5 h-5 text-red-500" />
              </div>
           </div>
           <p className="text-3xl font-bold text-white">{stats.pending}</p>
           <p className="text-sm text-gray-500 mt-2">Aguardando confirmação</p>
        </div>

        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
           <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 font-medium">Volume Total</span>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                 <DollarSign className="w-5 h-5 text-green-500" />
              </div>
           </div>
           <p className="text-3xl font-bold text-white">R$ {stats.revenue.toFixed(2)}</p>
           <p className="text-sm text-gray-500 mt-2">Projeção geral de receita</p>
        </div>

      </div>
    </div>
  );
}
