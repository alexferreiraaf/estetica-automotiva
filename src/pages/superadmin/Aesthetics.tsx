import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Shield, 
  ShieldOff, 
  X, 
  Save, 
  Building2, 
  Edit2, 
  BarChart3, 
  Filter, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { getAesthetics, saveAesthetic, updateAesthetic, toggleAestheticStatus, deleteAesthetic } from '../../data/aesthetics';
import type { Aesthetic } from '../../data/aesthetics';
import { supabase } from '../../lib/supabase';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  startOfWeek, 
  endOfWeek, 
  endOfMonth, 
  subDays, 
  isWithinInterval, 
  startOfDay, 
  endOfDay,
  differenceInMinutes,
  differenceInHours,
  differenceInDays
} from 'date-fns';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- Utility for Relative Time ---
function getRelativeTime(dateString?: string) {
  if (!dateString) return 'Nunca acessou';
  
  const date = parseISO(dateString);
  const now = new Date();
  
  const diffMin = differenceInMinutes(now, date);
  if (diffMin < 5) return 'Online agora';
  if (diffMin < 60) return `Há ${diffMin} min`;
  
  const diffHours = differenceInHours(now, date);
  if (diffHours < 24) return `Há ${diffHours}h`;
  
  const diffDays = differenceInDays(now, date);
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  
  return format(date, 'dd/MM/yyyy');
}

// --- Financial Report Modal Component ---
function FinancialReportModal({ aesthetic, onClose }: { aesthetic: Aesthetic; onClose: () => void }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let bQuery = supabase.from('bookings').select('*');
        let sQuery = supabase.from('services').select('*');
        
        if (aesthetic.id) {
          // New Isolation: Filter strictly by aesthetic_id
          bQuery = bQuery.eq('aesthetic_id', aesthetic.id);
          sQuery = sQuery.eq('aesthetic_id', aesthetic.id);
        } else if (aesthetic.user_id) {
          // Legacy Fallback
          bQuery = bQuery.or(`user_id.eq.${aesthetic.user_id},user_id.is.null`);
          sQuery = sQuery.or(`user_id.eq.${aesthetic.user_id},user_id.is.null`);
        }

        const { data: bData } = await bQuery;
        const { data: sData } = await sQuery;

        setBookings(bData || []);
        setServices(sData || []);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [aesthetic.id, aesthetic.user_id]);

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
          const dayKey = b.date;
          revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + price;
        }

        if (b.status === 'Pendente') {
          pendingCount++;
        }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-bg-surface border border-border-main rounded-3xl w-full max-w-6xl my-auto animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-border-main flex items-center justify-between sticky top-0 bg-bg-surface z-10 rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold text-text-primary flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-gold" />
              Relatório Financeiro: {aesthetic.name}
            </h2>
            <p className="text-text-muted text-sm mt-1">Análise detalhada de performance e faturamento</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-card rounded-xl transition-all">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Filters Area */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-bg-main border border-border-main rounded-xl px-4 py-3 shadow-inner">
                <Filter className="w-5 h-5 text-text-muted" />
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent text-sm font-bold text-text-primary outline-none focus:ring-0"
                />
                <span className="text-text-muted text-sm font-medium">até</span>
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent text-sm font-bold text-text-primary outline-none focus:ring-0"
                />
              </div>

              <div className="flex bg-bg-card border border-border-main rounded-xl p-1.5">
                {['today', 'week', 'month', 'all'].map((type) => (
                  <button 
                    key={type}
                    onClick={() => handleQuickFilter(type as any)}
                    className="px-4 py-2 text-xs font-bold rounded-lg transition-all hover:bg-bg-surface text-text-secondary hover:text-text-primary capitalize"
                  >
                    {type === 'today' ? 'Hoje' : type === 'week' ? 'Semana' : type === 'month' ? 'Mês' : 'Tudo'}
                  </button>
                ))}
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center text-gold animate-pulse font-medium">
                <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mr-2" />
                Atualizando...
              </div>
            )}
          </div>

          {!aesthetic.user_id && (
            <div className="bg-gold/10 border border-gold/20 p-4 rounded-xl flex items-center gap-4 mb-6">
              <div className="bg-gold/20 p-2 rounded-lg">
                <BarChart3 className="w-5 h-5 text-gold" />
              </div>
              <div className="text-sm">
                <p className="text-text-primary font-bold">Modo de Resgate Ativado</p>
                <p className="text-text-secondary">Exibindo dados de teste/agendamentos que ainda não foram vinculados a um usuário específico. Isso acontece porque o proprietário ainda não fez o primeiro login.</p>
              </div>
            </div>
          )}

          {!isLoading ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-bg-main border border-border-main p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-secondary text-sm font-medium">Agendamentos</span>
                    <Calendar className="w-5 h-5 text-neon-blue" />
                  </div>
                  <p className="text-3xl font-extrabold text-text-primary">{stats.total}</p>
                </div>
                <div className="bg-bg-main border border-border-main p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-secondary text-sm font-medium">Concluídos</span>
                    <CheckCircle2 className="w-5 h-5 text-gold" />
                  </div>
                  <p className="text-3xl font-extrabold text-text-primary">{stats.completed}</p>
                </div>
                <div className="bg-bg-main border border-border-main p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-secondary text-sm font-medium">Pendentes</span>
                    <Clock className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-3xl font-extrabold text-text-primary">{stats.pending}</p>
                </div>
                <div className="bg-bg-main border border-border-main p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-secondary text-sm font-medium">Receita Total</span>
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-extrabold text-text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.revenue)}
                  </p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-bg-main border border-border-main p-6 rounded-2xl">
                  <h4 className="text-base font-bold text-text-primary mb-6">Serviços Mais Procurados</h4>
                  {stats.topServices.length > 0 ? (
                    <div className="space-y-6">
                      {stats.topServices.map((service) => {
                        const percentage = (service.count / stats.total) * 100;
                        return (
                          <div key={service.name} className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
                              <span className="text-text-primary">{service.name}</span>
                              <span className="text-text-secondary">{service.count}</span>
                            </div>
                            <div className="h-2.5 bg-bg-card rounded-full overflow-hidden">
                              <div className="h-full bg-gold rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-text-muted text-sm border border-dashed border-border-main rounded-xl">
                      Sem dados de serviços
                    </div>
                  )}
                </div>

                <div className="bg-bg-main border border-border-main p-6 rounded-2xl">
                  <h4 className="text-base font-bold text-text-primary mb-6">Faturamento por Período</h4>
                  {stats.revenueTimeline.length > 0 ? (
                    <div className="h-48 flex items-end gap-1.5 pt-4">
                      {stats.revenueTimeline.map((day) => {
                        const max = Math.max(...stats.revenueTimeline.map(d => d.amount));
                        const h = (day.amount / max) * 100;
                        return (
                          <div key={day.date} className="flex-1 group relative flex flex-col items-center">
                            <div className="w-full bg-gradient-to-t from-gold/40 to-gold rounded-t-sm transition-all duration-700 min-h-[2px]" style={{ height: `${h}%` }}>
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-text-primary text-bg-main px-1.5 py-0.5 rounded text-[8px] font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                                R$ {day.amount}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-text-muted text-sm border border-dashed border-border-main rounded-xl">
                      Sem faturamento no período
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
             <div className="py-20 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-4" />
                <p className="text-text-muted font-medium">Consolidando dados financeiros...</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Aesthetics Component ---
export function Aesthetics() {
  const [aesthetics, setAesthetics] = useState<Aesthetic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportAesthetic, setReportAesthetic] = useState<Aesthetic | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    email: '',
    phone: '',
    password: ''
  });
  const [skipAuth, setSkipAuth] = useState(false);

  useEffect(() => {
    loadData();

    // Auto-refresh data every minute
    const dataInterval = setInterval(loadData, 60 * 1000);
    
    // Force re-render of relative times every 30 seconds
    const timeInterval = setInterval(() => setNow(new Date()), 30 * 1000);

    // Subscribe to realtime updates for aesthetics table
    const channel = supabase
      .channel('aesthetics_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'aesthetics' },
        (payload) => {
          setAesthetics(prev => prev.map(a => 
            a.id === payload.new.id 
              ? { 
                  ...a, 
                  lastLogin: payload.new.last_login, // Map DB snake_case to UI camelCase
                  status: payload.new.status,
                  name: payload.new.name
                } 
              : a
          ));
        }
      )
      .subscribe();

    return () => {
      clearInterval(dataInterval);
      clearInterval(timeInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAesthetics();
      setAesthetics(data);
    } catch (error) {
      console.error('Error loading aesthetics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'blocked') => {
    try {
      await toggleAestheticStatus(id, currentStatus);
      await loadData();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta estética? Isso removerá o acesso dela à plataforma.')) {
      try {
        await deleteAesthetic(id);
        await loadData();
      } catch (error) {
        alert('Erro ao excluir estética.');
      }
    }
  };

  const handleEdit = (aesthetic: Aesthetic) => {
    setEditingId(aesthetic.id);
    setFormData({
      name: aesthetic.name,
      owner: aesthetic.owner,
      email: aesthetic.email,
      phone: aesthetic.phone,
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
        await updateAesthetic(editingId, {
          name: formData.name,
          owner: formData.owner,
          email: formData.email,
          phone: formData.phone
        });
      } else {
        let authUserId = null;

        if (!skipAuth) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password
          });

          if (authError) {
            if (authError.status === 429) {
              throw new Error('Limite de tentativas excedido para este e-mail. Marque "Já possui conta" se o usuário já estiver cadastrado.');
            }
            // Se o usuário já existe, ignoramos o erro e prosseguimos com o cadastro da estética
            // O vínculo do user_id será feito automaticamente no primeiro login do usuário
            if (authError.status !== 400) {
              throw authError;
            }
          }
          authUserId = authData?.user?.id;
        }

        await saveAesthetic({
          name: formData.name,
          owner: formData.owner,
          email: formData.email,
          phone: formData.phone,
          user_id: authUserId || undefined
        });
      }
      await loadData();
      setIsModalOpen(false);
      setEditingId(null);
      setSkipAuth(false);
      setFormData({ name: '', owner: '', email: '', phone: '', password: '' });
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('security purposes')) {
        alert('Erro: Por segurança, o Supabase exige um intervalo de alguns segundos entre cadastros. Tente novamente em 20 segundos.');
      } else {
        alert(`Erro ao salvar: ${msg || 'Verifique se a tabela existe no Supabase.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 15);
    }
    return value.substring(0, 15);
  };

  const filteredAesthetics = aesthetics.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Minhas Estéticas</h1>
          <p className="text-text-secondary mt-1">Gerencie as empresas que utilizam sua plataforma</p>
        </div>
        
        <div className="hidden">{now.getTime()}</div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-gold to-gold-light text-black font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Estética
        </button>
      </div>

      {/* Search */}
      <div className="bg-bg-surface border border-border-main rounded-xl p-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por nome, proprietário ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-main border border-border-main rounded-lg py-3 pl-10 pr-4 text-text-primary focus:outline-none focus:border-gold transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-main border-b border-border-main">
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Estética</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Proprietário</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Contato / Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                    Carregando estéticas...
                  </td>
                </tr>
              ) : filteredAesthetics.length > 0 ? (
                filteredAesthetics.map((aesthetic) => (
                  <tr key={aesthetic.id} className="hover:bg-bg-card transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mr-3">
                          <Building2 className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <p className="text-text-primary font-bold">{aesthetic.name}</p>
                          <p className="text-text-muted text-xs">Desde {aesthetic.createdAt ? new Date(aesthetic.createdAt).toLocaleDateString('pt-BR') : '...'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-text-secondary">
                        <User className="w-4 h-4 mr-2 text-text-muted" />
                        {aesthetic.owner}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-text-primary flex items-center">
                          <Phone className="w-3 h-3 mr-2 text-text-muted" />
                          {aesthetic.phone}
                        </p>
                        <div className="flex items-center gap-2">
                          {aesthetic.status === 'blocked' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 w-fit">
                              <ShieldOff className="w-3 h-3 mr-1" /> Bloqueado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 w-fit">
                              <Shield className="w-3 h-3 mr-1" /> Ativo
                            </span>
                          )}
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            getRelativeTime(aesthetic.lastLogin) === 'Online agora' ? "text-neon-blue animate-pulse" : "text-text-muted"
                          )}>
                            • {getRelativeTime(aesthetic.lastLogin)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setReportAesthetic(aesthetic)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-main border border-border-main text-text-primary font-bold text-xs rounded-lg hover:border-gold hover:text-gold transition-all"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Ver Informações
                        </button>
                        <button 
                          onClick={() => handleEdit(aesthetic)}
                          className="p-2 text-text-muted hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(aesthetic.id, aesthetic.status)}
                          className={`p-2 rounded-lg transition-colors ${
                            aesthetic.status === 'active'
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-green-400 hover:bg-green-500/10'
                          }`}
                          title={aesthetic.status === 'active' ? 'Bloquear Acesso' : 'Liberar Acesso'}
                        >
                          {aesthetic.status === 'active' ? <ShieldOff className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(aesthetic.id)}
                          className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                    Nenhuma estética encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Report Modal */}
      {reportAesthetic && (
        <FinancialReportModal 
          aesthetic={reportAesthetic} 
          onClose={() => setReportAesthetic(null)} 
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-bg-surface border border-border-main rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border-main flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary flex items-center">
                {editingId ? <Edit2 className="w-5 h-5 mr-2 text-gold" /> : <Plus className="w-5 h-5 mr-2 text-gold" />}
                {editingId ? 'Editar Estética' : 'Cadastrar Nova Estética'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setSkipAuth(false);
                  setFormData({ name: '', owner: '', email: '', phone: '', password: '' });
                }}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome da Estética</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                  placeholder="Ex: Brilho Car Estética"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome do Proprietário</label>
                <input 
                  required
                  type="text" 
                  value={formData.owner}
                  onChange={e => setFormData({...formData, owner: e.target.value})}
                  className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                  placeholder="Ex: Carlos Silva"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">E-mail (Usuário)</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    disabled={!!editingId}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors disabled:opacity-50"
                    placeholder="ex: contato@aesthetic.com"
                  />
                </div>
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Senha de Acesso</label>
                    <input 
                      required={!skipAuth}
                      type="password" 
                      value={formData.password}
                      disabled={skipAuth}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors disabled:opacity-50"
                      placeholder={skipAuth ? "Já cadastrada" : "Mínimo 6 caracteres"}
                    />
                  </div>
                )}
              </div>

              {!editingId && (
                <div className="flex items-center gap-2 px-1">
                  <input 
                    type="checkbox"
                    id="skipAuth"
                    checked={skipAuth}
                    onChange={e => setSkipAuth(e.target.checked)}
                    className="w-4 h-4 rounded border-border-main bg-bg-main text-gold focus:ring-gold"
                  />
                  <label htmlFor="skipAuth" className="text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                    O usuário já possui conta ou está com limite de tentativas excedido
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Telefone</label>
                <input 
                  required
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})}
                  className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-transparent border border-border-main text-text-primary font-bold py-3 rounded-xl hover:bg-bg-card transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-gold to-gold-light text-black font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center justify-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Estética
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

