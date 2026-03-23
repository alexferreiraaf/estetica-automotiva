import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, User, Phone, Car, Tag, MoreVertical, X, Save } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { supabase } from '../../lib/supabase';

interface CustomerRecord {
  id: string;
  name: string;
  whatsapp: string;
  carModel: string;
  licensePlate: string;
  vehicleType: string;
  createdAt: string;
  totalBookings?: number;
  lastVisit?: string;
  isFromSupabase?: boolean;
}

export function Customers() {
  const { bookings } = useBooking();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dbCustomers, setDbCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    carModel: '',
    licensePlate: '',
    vehicleType: 'Carro'
  });

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  useEffect(() => {
    if (user) {
      fetchDbCustomers();
    }
  }, [user]);

  const fetchDbCustomers = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) {
      console.error('Error fetching customers:', error);
    } else if (data) {
      setDbCustomers(data as CustomerRecord[]);
    }
    setIsLoading(false);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if this tenant already has a customer with this WhatsApp
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('whatsapp', formData.whatsapp)
      .eq('user_id', user.id)
      .maybeSingle();

    let error;

    if (existing) {
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          name: formData.name,
          carModel: formData.carModel,
          licensePlate: formData.licensePlate.toUpperCase(),
          vehicleType: formData.vehicleType,
        })
        .eq('id', existing.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('customers')
        .insert([{
          name: formData.name,
          whatsapp: formData.whatsapp,
          carModel: formData.carModel,
          licensePlate: formData.licensePlate.toUpperCase(),
          vehicleType: formData.vehicleType,
          user_id: user.id
        }]);
      error = insertError;
    }

    if (error) {
      console.error('Error adding customer:', error);
      
      // Handle the case where the database schema imposes a strict unique constraint on WhatsApp
      if (error.message?.includes('duplicate key value violates unique constraint')) {
        alert('Este número de WhatsApp já está registrado no banco de dados geral. O esquema atual do banco exige que a restrição de unicidade do WhatsApp seja alterada para a composição (user_id, whatsapp). Contate o suporte técnico para rodar o script de migração do banco.');
      } else {
        alert(`Erro ao salvar no banco: ${error.message}\n\nDetalhes: ${error.details || 'Verifique se a tabela "customers" existe e se as colunas estão corretas.'}`);
      }
    } else {
      fetchDbCustomers();
      setIsModalOpen(false);
      setEditingCustomerId(null);
      setFormData({ name: '', whatsapp: '', carModel: '', licensePlate: '', vehicleType: 'Carro' });
    }
  };

  const handleEditClick = (customer: any) => {
    setFormData({
      name: customer.name,
      whatsapp: customer.whatsapp,
      carModel: customer.lastCar || customer.carModel,
      licensePlate: customer.lastPlate || customer.licensePlate,
      vehicleType: customer.vehicleType || 'Carro'
    });
    setEditingCustomerId(customer.id);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      alert('Erro ao excluir cliente.');
    } else {
      fetchDbCustomers();
      setActiveMenuId(null);
    }
  };

  // Extract unique customers from bookings and merge with DB customers
  const customers = useMemo(() => {
    const uniqueCustomers = new Map();
    
    // 1. Add DB customers first
    dbCustomers.forEach(c => {
      uniqueCustomers.set(c.whatsapp, {
        id: c.id,
        name: c.name,
        whatsapp: c.whatsapp,
        lastCar: c.carModel,
        lastPlate: c.licensePlate,
        vehicleType: c.vehicleType,
        totalBookings: 0,
        lastVisit: c.createdAt,
        isFromSupabase: true
      });
    });

    // 2. Add/Update from bookings (historical data)
    const sortedBookings = [...bookings].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sortedBookings.forEach(booking => {
      const existing = uniqueCustomers.get(booking.whatsapp);
      const total = bookings.filter(b => b.whatsapp === booking.whatsapp).length;
      
      uniqueCustomers.set(booking.whatsapp, {
        id: existing?.id || booking.id,
        name: existing?.name || booking.customerName,
        whatsapp: booking.whatsapp,
        lastCar: existing?.lastCar || booking.carModel,
        lastPlate: existing?.lastPlate || booking.licensePlate,
        vehicleType: existing?.vehicleType || 'Carro',
        totalBookings: total,
        lastVisit: booking.date,
        isFromSupabase: existing?.isFromSupabase || false
      });
    });

    return Array.from(uniqueCustomers.values()).filter((customer: any) => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.whatsapp.includes(searchTerm) ||
      customer.lastPlate.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bookings, searchTerm, dbCustomers]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Clientes</h1>
          <p className="text-text-secondary mt-1">Gerencie a base de clientes do seu negócio</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-gold to-gold-light text-black font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-bg-surface border border-border-main rounded-xl p-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por nome, WhatsApp ou placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-main border border-border-main rounded-lg py-3 pl-10 pr-4 text-text-primary focus:outline-none focus:border-gold transition-colors"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-main border-b border-border-main">
                <th className="px-6 py-4 text-sm font-bold text-text-muted uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-sm font-bold text-text-muted uppercase tracking-wider">Último Veículo</th>
                <th className="px-6 py-4 text-sm font-bold text-text-muted uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-sm font-bold text-text-muted uppercase tracking-wider">Agendamentos</th>
                <th className="px-6 py-4 text-sm font-bold text-text-muted uppercase tracking-wider">Última Visita</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    Carregando clientes...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((customer: any) => (
                  <tr key={customer.whatsapp} className="hover:bg-bg-card transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <p className="text-text-primary font-bold">{customer.name}</p>
                          <p className="text-text-muted text-sm flex items-center">
                            <Phone className="w-3 h-3 mr-1" /> {customer.whatsapp}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-text-primary flex items-center">
                          {customer.vehicleType === 'Moto' ? (
                            <svg className="w-4 h-4 mr-2 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
                            </svg>
                          ) : (
                            <Car className="w-4 h-4 mr-2 text-text-muted" />
                          )}
                          {customer.lastCar}
                        </p>
                        <p className="text-neon-blue text-sm font-mono mt-1 flex items-center">
                          <Tag className="w-3 h-3 mr-1" /> {customer.lastPlate}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        customer.vehicleType === 'Moto' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {customer.vehicleType || 'Carro'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-bg-card text-text-secondary border border-border-main">
                        {customer.totalBookings}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-text-primary text-sm">{new Date(customer.lastVisit).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === customer.whatsapp ? null : customer.whatsapp)}
                        className="p-2 text-text-muted hover:text-text-primary transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {activeMenuId === customer.whatsapp && (
                        <div className="absolute right-0 mt-2 w-48 bg-bg-surface border border-border-main rounded-xl shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <button 
                            onClick={() => handleEditClick(customer)}
                            className="w-full text-left px-4 py-3 text-sm text-text-secondary hover:bg-bg-card hover:text-text-primary transition-colors flex items-center"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Editar Cliente
                          </button>
                          <button 
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center border-t border-border-main"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Excluir Cliente
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-bg-surface border border-border-main rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border-main flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary flex items-center">
                {editingCustomerId ? (
                  <Save className="w-5 h-5 mr-2 text-gold" />
                ) : (
                  <Plus className="w-5 h-5 mr-2 text-gold" />
                )}
                {editingCustomerId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCustomerId(null);
                  setFormData({ name: '', whatsapp: '', carModel: '', licensePlate: '', vehicleType: 'Carro' });
                }}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                  placeholder="Ex: João Silva"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">WhatsApp</label>
                <input 
                  required
                  type="tel" 
                  value={formData.whatsapp}
                  onChange={e => setFormData({...formData, whatsapp: formatWhatsApp(e.target.value)})}
                  className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Tipo de Veículo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, vehicleType: 'Carro'})}
                    className={`py-3 rounded-lg border flex items-center justify-center transition-all ${
                      formData.vehicleType === 'Carro' 
                        ? 'bg-gold/10 border-gold text-gold' 
                        : 'bg-bg-main border-border-main text-text-muted hover:border-text-secondary'
                    }`}
                  >
                    <Car className="w-5 h-5 mr-2" />
                    Carro
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, vehicleType: 'Moto'})}
                    className={`py-3 rounded-lg border flex items-center justify-center transition-all ${
                      formData.vehicleType === 'Moto' 
                        ? 'bg-gold/10 border-gold text-gold' 
                        : 'bg-bg-main border-border-main text-text-muted hover:border-text-secondary'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
                    </svg>
                    Moto
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Modelo do Carro</label>
                  <input 
                    required
                    type="text" 
                    value={formData.carModel}
                    onChange={e => setFormData({...formData, carModel: e.target.value})}
                    className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                    placeholder="Ex: Honda Civic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Placa</label>
                  <input 
                    required
                    type="text" 
                    value={formData.licensePlate}
                    onChange={e => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})}
                    className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold uppercase transition-colors"
                    placeholder="ABC-1234"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCustomerId(null);
                    setFormData({ name: '', whatsapp: '', carModel: '', licensePlate: '', vehicleType: 'Carro' });
                  }}
                  className="flex-1 bg-transparent border border-border-main text-text-primary font-bold py-3 rounded-xl hover:bg-bg-card transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-gold to-gold-light text-black font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center justify-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {editingCustomerId ? 'Atualizar Cliente' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
