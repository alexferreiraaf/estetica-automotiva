import { useState, useMemo } from 'react';
import { useBooking } from '../../context/BookingContext';
import { services } from '../../data/services';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function CalendarView() {
  const { bookings } = useBooking();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const nextWeek = () => setCurrentWeekStart(d => addDays(d, 7));
  const prevWeek = () => setCurrentWeekStart(d => addDays(d, -7));

  // Generate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => addDays(currentWeekStart, i)); // Mon-Sat
  }, [currentWeekStart]);

  // Generate timeslots from 08:00 to 18:00
  const hours = Array.from({ length: 11 }).map((_, i) => i + 8);

  const getBookingForSlot = (date: Date, hour: number) => {
    // A slot should display the booking if it starts at this hour, OR extends into this hour
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBookings = bookings.filter(b => b.date === dateStr);
    
    for (const b of dayBookings) {
      const matchService = services.find(s => s.id === b.serviceId);
      if (!matchService) continue;
      
      const startHour = parseInt(b.timeSlot.split(':')[0]);
      if (hour >= startHour && hour < startHour + matchService.durationHours) {
        return {
           booking: b,
           service: matchService,
           isStart: hour === startHour
        };
      }
    }
    return null;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-white">Calendário</h1>
        
        <div className="flex bg-[#141414] border border-[#262626] rounded-lg overflow-hidden">
          <button onClick={prevWeek} className="px-4 py-2 hover:bg-[#262626] text-gray-400 hover:text-white transition-colors">
            Anterior
          </button>
          <div className="px-4 py-2 border-x border-[#262626] text-white font-medium bg-[#1a1a1a]">
            {format(weekDays[0], "dd MMM", { locale: ptBR })} - {format(weekDays[5], "dd MMM", { locale: ptBR })}
          </div>
          <button onClick={nextWeek} className="px-4 py-2 hover:bg-[#262626] text-gray-400 hover:text-white transition-colors">
            Próxima
          </button>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#262626] rounded-xl flex-1 overflow-auto">
        <div className="min-w-[800px] h-full flex flex-col">
           
           {/* Header */}
           <div className="flex border-b border-[#262626] sticky top-0 bg-[#141414] z-10">
              <div className="w-20 border-r border-[#262626] flex-shrink-0 bg-[#1a1a1a]"></div>
              {weekDays.map(day => (
                 <div key={day.toISOString()} className="flex-1 px-2 py-3 text-center border-r border-[#262626] last:border-0">
                    <p className="text-sm font-medium text-gray-400">{format(day, 'EEEE', { locale: ptBR })}</p>
                    <p className={cn(
                      "text-xl font-bold mt-1",
                      isSameDay(day, new Date()) ? "text-[#00f0ff]" : "text-white"
                    )}>
                      {format(day, 'dd/MM')}
                    </p>
                 </div>
              ))}
           </div>

           {/* Grid */}
           <div className="flex-1 relative">
             {hours.map(hour => (
               <div key={hour} className="flex min-h-[100px] border-b border-[#262626]">
                 {/* Timeline */}
                 <div className="w-20 border-r border-[#262626] flex-shrink-0 flex items-start justify-end pr-2 py-2">
                    <span className="text-sm text-gray-500 block -mt-4 bg-[#141414] px-1">{hour.toString().padStart(2, '0')}:00</span>
                 </div>
                 
                 {/* Day cells */}
                 {weekDays.map(day => {
                    const slotData = getBookingForSlot(day, hour);
                    
                    return (
                      <div key={`${day.toISOString()}-${hour}`} className="flex-1 border-r border-[#262626] last:border-0 relative p-1">
                         {slotData && slotData.isStart && (
                           <div 
                             className={cn(
                               "absolute top-1 left-1 right-1 rounded-lg p-2 z-10 border overflow-hidden",
                               slotData.booking.status === 'Pendente' ? "bg-red-500/10 border-red-500/20" :
                               slotData.booking.status === 'Confirmado' ? "bg-[#00f0ff]/10 border-[#00f0ff]/30" :
                               slotData.booking.status === 'Em Execução' ? "bg-[#d4af37]/10 border-[#d4af37]/30" :
                               "bg-green-500/10 border-green-500/20"
                             )}
                             style={{ height: `calc(${slotData.service.durationHours * 100}% - 8px)` }}
                           >
                              <p className={cn(
                                "text-xs font-bold leading-tight mb-1",
                                slotData.booking.status === 'Pendente' ? "text-red-400" :
                                slotData.booking.status === 'Confirmado' ? "text-[#00f0ff]" :
                                slotData.booking.status === 'Em Execução' ? "text-[#d4af37]" :
                                "text-green-500"
                              )}>
                                {slotData.service.name}
                              </p>
                              <p className="text-xs text-white truncate">{slotData.booking.customerName}</p>
                              <p className="text-[10px] text-gray-400 truncate">{slotData.booking.carModel}</p>
                           </div>
                         )}
                         {/* Visual indicator for occupied cells that aren't the start */}
                         {slotData && !slotData.isStart && (
                           <div className="w-full h-full bg-white/5 rounded pointer-events-none hidden"></div>
                         )}
                      </div>
                    )
                 })}
               </div>
             ))}
           </div>

        </div>
      </div>

    </div>
  );
}
