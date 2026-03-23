import { useMemo, useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { Calendar, CheckCircle2, DollarSign, Clock, Filter } from 'lucide-react';
import { 
  parseISO, 
  startOfWeek, 
  endOfWeek, 
  isWithinInterval, 
  startOfMonth, 
  endOfMonth, 
  subDays,
  format,
  startOfDay,
  endOfDay
} from 'date-fns';

export function Dashboard() {
  const { bookings, services, aesthetic } = useBooking();
  
  // State for date range
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const handleQuickFilter = (type: 'today' | 'week' | 'month' | 'last30' | 'all') => {
    const today = new Date();
    let start = today;
    let end = today;

    switch (type) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'last30':
        start = subDays(today, 30);
        end = today;
        break;
      case 'all':
        start = new Date(2020, 0, 1);
        end = new Date(2030, 11, 31);
        break;
    }

    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  };

  const stats = useMemo(() => {
    const rangeStart = startOfDay(parseISO(dateRange.start));
    const rangeEnd = endOfDay(parseISO(dateRange.end));

    let periodCount = 0;
    let pendingCount = 0;
    let periodRevenue = 0;
    let totalBookingsInRange = 0;

    const serviceCounts: Record<string, number> = {};
    const revenueByDay: Record<string, number> = {};

    bookings.forEach(b => {
      const bookingDate = parseISO(b.date);
      const service = services.find(s => s.id === b.serviceId);
      const price = service ? service.price : 0;
      const serviceName = service ? service.name : 'Desconhecido';

      const isInRange = isWithinInterval(bookingDate, { start: rangeStart, end: rangeEnd });

      if (isInRange) {
        totalBookingsInRange++;
        
        if (b.status === 'Concluído') {
          periodCount++;
          periodRevenue += price;
          
          // Data for revenue chart
          const dayKey = b.date; // already YYYY-MM-DD
          revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + price;
        }

        if (b.status === 'Pendente') {
          pendingCount++;
        }

        // Data for services chart (all bookings in range)
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
      }
    });

    const topServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const revenueTimeline = Object.entries(revenueByDay)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total: totalBookingsInRange,
      completed: periodCount,
      pending: pendingCount,
      revenue: periodRevenue,
      topServices,
      revenueTimeline
    };
  }, [bookings, services, dateRange]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-text-primary">Dashboard</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-bg-surface border border-border-main rounded-lg px-3 py-2 shadow-sm">
            <Filter className="w-4 h-4 text-text-muted" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent text-sm font-medium text-text-primary outline-none focus:ring-0"
            />
            <span className="text-text-muted text-sm">até</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-sm font-medium text-text-primary outline-none focus:ring-0"
            />
          </div>

          <div className="flex bg-bg-card border border-border-main rounded-lg p-1">
            <button 
              onClick={() => handleQuickFilter('today')}
              className="px-3 py-2 text-xs font-semibold rounded-md transition-all hover:bg-bg-surface text-text-secondary hover:text-text-primary"
            >
              Hoje
            </button>
            <button 
              onClick={() => handleQuickFilter('week')}
              className="px-3 py-2 text-xs font-semibold rounded-md transition-all hover:bg-bg-surface text-text-secondary hover:text-text-primary"
            >
              Semana
            </button>
            <button 
              onClick={() => handleQuickFilter('month')}
              className="px-3 py-2 text-xs font-semibold rounded-md transition-all hover:bg-bg-surface text-text-secondary hover:text-text-primary"
            >
              Mês
            </button>
            <button 
              onClick={() => handleQuickFilter('all')}
              className="px-3 py-2 text-xs font-semibold rounded-md transition-all hover:bg-bg-surface text-text-secondary hover:text-text-primary"
            >
              Tudo
            </button>
          </div>
        </div>
      </div>
      
      {/* Public Store Link Banner */}
      {aesthetic && (
        <div className="mb-10 relative group">
          <div className="absolute -inset-0.5 bg-linear-to-r from-neon-blue to-gold rounded-2xl blur-xs opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-bg-surface border border-border-main rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-neon-blue/5 rounded-full blur-3xl"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 bg-linear-to-br from-neon-blue/20 to-neon-blue/5 rounded-xl flex items-center justify-center border border-neon-blue/20 shadow-inner">
                {aesthetic.user_id ? (
                  <CheckCircle2 className="w-7 h-7 text-neon-blue" />
                ) : (
                  <Clock className="w-7 h-7 text-gold animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-1">
                  {aesthetic.user_id ? 'Seu Link de Agendamento' : 'Configuração Necessária'}
                </h3>
                <p className="text-sm text-text-secondary">
                  {aesthetic.user_id 
                    ? 'Seu catálogo premium está online e pronto para receber clientes.' 
                    : 'Sua loja ainda não está visível para clientes. Salve um serviço para ativar seu catálogo.'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10">
              <div className="relative flex-1 sm:w-80 group/input">
                <input 
                  readOnly
                  value={`${window.location.origin}/client/${aesthetic.id}`}
                  className="w-full bg-bg-main border border-border-main rounded-xl px-4 py-3 text-sm font-mono text-text-primary focus:outline-none focus:border-neon-blue transition-colors"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-muted">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/client/${aesthetic.id}`);
                  // Note: In a real app we'd use a toast notification
                  alert('Link copiado para a área de transferência!');
                }}
                className="w-full sm:w-auto bg-neon-blue text-black font-extrabold py-3 px-8 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Copiar Link
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        
        <div className="bg-bg-surface border border-border-main rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
           <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary font-medium">Agendamentos</span>
              <div className="w-10 h-10 rounded-lg bg-neon-blue/10 flex items-center justify-center transition-transform group-hover:scale-110">
                 <Calendar className="w-5 h-5 text-neon-blue" />
              </div>
           </div>
           <p className="text-3xl font-bold text-text-primary">{stats.total}</p>
           <p className="text-sm text-text-muted mt-2">No período selecionado</p>
        </div>

        <div className="bg-bg-surface border border-border-main rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
           <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary font-medium">Concluídos</span>
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center transition-transform group-hover:scale-110">
                 <CheckCircle2 className="w-5 h-5 text-gold" />
              </div>
           </div>
           <p className="text-3xl font-bold text-text-primary">{stats.completed}</p>
           <p className="text-sm text-text-muted mt-2">Serviços realizados</p>
        </div>

        <div className="bg-bg-surface border border-border-main rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
           <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary font-medium">Pendentes</span>
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                 <Clock className="w-5 h-5 text-red-500" />
              </div>
           </div>
           <p className="text-3xl font-bold text-text-primary">{stats.pending}</p>
           <p className="text-sm text-text-muted mt-2">Aguardando atendimento</p>
        </div>

        <div className="bg-bg-surface border border-border-main rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
           <div className="flex items-center justify-between mb-4">
              <span className="text-text-secondary font-medium">Receita</span>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center transition-transform group-hover:scale-110">
                 <DollarSign className="w-5 h-5 text-green-500" />
              </div>
           </div>
           <p className="text-3xl font-bold text-text-primary">
             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.revenue)}
           </p>
           <p className="text-sm text-text-muted mt-2">Total concluído no período</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Requested Services Chart */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-neon-blue rounded-full"></div>
            Serviços Mais Pedidos
          </h3>
          
          {stats.topServices.length > 0 ? (
            <div className="space-y-6">
              {stats.topServices.map((service) => {
                const percentage = (service.count / stats.total) * 100;
                return (
                  <div key={service.name} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-text-primary">{service.name}</span>
                      <span className="text-text-secondary">{service.count} agendamentos</span>
                    </div>
                    <div className="h-3 bg-bg-card rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-linear-to-r from-neon-blue to-neon-blue-dark rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-text-muted text-sm border-2 border-dashed border-border-main rounded-lg">
              <Calendar className="w-8 h-8 mb-2 opacity-20" />
              Sem dados para este período
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-gold rounded-full"></div>
            Tendência de Receita
          </h3>
          
          {stats.revenueTimeline.length > 0 ? (
            <div className="h-64 flex items-end gap-2 pt-4">
              {stats.revenueTimeline.map((day) => {
                const maxRevenue = Math.max(...stats.revenueTimeline.map(d => d.amount));
                const height = (day.amount / maxRevenue) * 100;
                return (
                  <div key={day.date} className="flex-1 group relative flex flex-col items-center">
                    <div 
                      className="w-full bg-linear-to-t from-gold/50 to-gold rounded-t-sm transition-all duration-1000 ease-out min-h-[4px]"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-bg-surface border border-border-main px-2 py-1 rounded text-[10px] font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(day.amount)}
                      </div>
                    </div>
                    <span className="text-[8px] text-text-muted mt-2 rotate-45 origin-left whitespace-nowrap">
                      {format(parseISO(day.date), 'dd/MM')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-text-muted text-sm border-2 border-dashed border-border-main rounded-lg">
              <DollarSign className="w-8 h-8 mb-2 opacity-20" />
              Sem receita confirmada neste período
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


