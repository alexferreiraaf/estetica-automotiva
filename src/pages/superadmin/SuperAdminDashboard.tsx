import { useState, useEffect } from 'react';
import { Users, Building2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getAesthetics } from '../../data/aesthetics';
import type { Aesthetic } from '../../data/aesthetics';

export function SuperAdminDashboard() {
  const [aesthetics, setAesthetics] = useState<Aesthetic[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAesthetics();
        setAesthetics(data);
        
        // Fetch total customers count
        const { count } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
        
        setCustomerCount(count || 0);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const activeCount = aesthetics.filter(a => a.status === 'active').length;
  const blockedCount = aesthetics.filter(a => a.status === 'blocked').length;

  const stats = [
    { label: 'Total de Estéticas', value: aesthetics.length, icon: Building2, color: 'text-gold', bg: 'bg-gold/10' },
    { label: 'Clientes Ativos', value: activeCount, icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Clientes Bloqueados', value: blockedCount, icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Total de Clientes', value: customerCount, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-text-primary">Painel Geral</h1>
        <p className="text-text-secondary mt-1">Visão geral da sua plataforma de estética automotiva</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-bg-surface border border-border-main p-6 rounded-2xl hover:border-gold/50 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
            <h3 className="text-3xl font-bold text-text-primary mt-1 group-hover:scale-105 transition-transform origin-left">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-bg-surface border border-border-main rounded-2xl p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Atividade Recente</h2>
        <div className="space-y-4">
          {aesthetics.length > 0 ? (
            aesthetics.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-bg-main rounded-xl border border-border-main">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{a.name}</p>
                    <p className="text-xs text-text-muted">Cadastrado em {new Date(a.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                  a.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {a.status === 'active' ? 'ATIVO' : 'BLOQUEADO'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-text-muted text-center py-4">Nenhuma estética cadastrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
