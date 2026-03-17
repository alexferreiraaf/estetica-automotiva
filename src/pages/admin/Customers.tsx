import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, User, Phone, Car, Tag, MoreVertical, X, Save } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { supabase } from '../../lib/supabase';

interface CustomerRecord {
  id: string;
  name: string;
  whatsapp: string;
  car_model: string;
  license_plate: string;
  created_at: string;
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
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    carModel: '',
    licensePlate: ''
  });

  useEffect(() => {
    fetchDbCustomers();
  }, []);

  const fetchDbCustomers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
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
    
    const { error } = await supabase
      .from('customers')
      .insert([
        {
          name: formData.name,
          whatsapp: formData.whatsapp,
          car_model: formData.carModel,
          license_plate: formData.licensePlate.toUpperCase()
        }
      ]);

    if (error) {
      console.error('Error adding customer:', error);
      alert('Erro ao salvar no banco. Verifique se o WhatsApp já está cadastrado ou se a tabela "customers" foi criada.');
    } else {
      fetchDbCustomers();
      setIsModalOpen(false);
      setFormData({ name: '', whatsapp: '', carModel: '', licensePlate: '' });
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
        lastCar: c.car_model,
        lastPlate: c.license_plate,
        totalBookings: 0,
        lastVisit: c.created_at,
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
          <h1 className="text-3xl font-extrabold text-white">Clientes</h1>
          <p className="text-gray-400 mt-1">Gerencie a base de clientes do seu negócio</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-[#d4af37] to-[#f1d570] text-black font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome, WhatsApp ou placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1a1a] border-b border-[#262626]">
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Último Veículo</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Agendamentos</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Última Visita</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Carregando clientes...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((customer: any) => (
                  <tr key={customer.whatsapp} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-[#d4af37]" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{customer.name}</p>
                          <p className="text-gray-500 text-sm flex items-center">
                            <Phone className="w-3 h-3 mr-1" /> {customer.whatsapp}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white flex items-center">
                          <Car className="w-4 h-4 mr-2 text-gray-400" /> {customer.lastCar}
                        </p>
                        <p className="text-[#00f0ff] text-sm font-mono mt-1 flex items-center">
                          <Tag className="w-3 h-3 mr-1" /> {customer.lastPlate}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1a1a1a] text-gray-300 border border-[#262626]">
                        {customer.totalBookings}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{new Date(customer.lastVisit).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
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
          <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-[#262626] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Plus className="w-5 h-5 mr-2 text-[#d4af37]" />
                Cadastrar Novo Cliente
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                  placeholder="Ex: João Silva"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">WhatsApp</label>
                <input 
                  required
                  type="tel" 
                  value={formData.whatsapp}
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Modelo do Carro</label>
                  <input 
                    required
                    type="text" 
                    value={formData.carModel}
                    onChange={e => setFormData({...formData, carModel: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                    placeholder="Ex: Honda Civic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Placa</label>
                  <input 
                    required
                    type="text" 
                    value={formData.licensePlate}
                    onChange={e => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4af37] uppercase transition-colors"
                    placeholder="ABC-1234"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-transparent border border-[#262626] text-white font-bold py-3 rounded-xl hover:bg-[#262626] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#f1d570] text-black font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center justify-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
