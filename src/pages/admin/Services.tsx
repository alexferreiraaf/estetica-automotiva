import React, { useState, useEffect } from 'react';
import { Plus, Search, Sparkles, Clock, DollarSign, MoreVertical, Droplets, Car, Wind, Shield, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Service } from '../../data/services';

const iconMap: Record<string, any> = {
  Droplets,
  Car,
  Sparkles,
  Wind,
  Shield
};

export function Services() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    durationHours: '',
    iconName: 'Sparkles'
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching services:', error);
    } else if (data) {
      setDbServices(data as Service[]);
    }
    setIsLoading(false);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const serviceData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      durationHours: parseFloat(formData.durationHours),
      iconName: formData.iconName
    };

    const { error } = await supabase
      .from('services')
      .upsert(
        editingServiceId 
          ? { id: editingServiceId, ...serviceData }
          : serviceData
      );

    if (error) {
      console.error('Error saving service:', error);
      alert(`Erro ao salvar serviço: ${error.message}\n\nCertifique-se de que criou a tabela "services" no Supabase.`);
    } else {
      fetchServices();
      closeModal();
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço?')) return;

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service:', error);
      alert('Erro ao excluir serviço.');
    } else {
      fetchServices();
      setActiveMenuId(null);
    }
  };

  const openEditModal = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      durationHours: service.durationHours.toString(),
      iconName: service.iconName
    });
    setEditingServiceId(service.id);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingServiceId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      durationHours: '',
      iconName: 'Sparkles'
    });
  };

  const filteredServices = dbServices.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Serviços</h1>
          <p className="text-gray-400 mt-1">Gerencie os tratamentos oferecidos pela sua loja</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-[#00f0ff] to-[#00b3cc] text-black font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all duration-300 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Serviço
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => {
            const Icon = iconMap[service.iconName] || Sparkles;
            return (
              <div key={service.id} className="bg-[#141414] border border-[#262626] rounded-2xl p-6 hover:border-[#00f0ff]/50 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#00f0ff]/10 flex items-center justify-center group-hover:bg-[#00f0ff]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#00f0ff]" />
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === service.id ? null : service.id)}
                      className="p-2 text-gray-500 hover:text-white transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {activeMenuId === service.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#262626] rounded-xl shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <button 
                          onClick={() => openEditModal(service)}
                          className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-[#262626] hover:text-white transition-colors flex items-center"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Editar Serviço
                        </button>
                        <button 
                          onClick={() => handleDeleteService(service.id)}
                          className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center border-t border-[#262626]"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Excluir Serviço
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-6">
                  {service.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-[#262626]">
                  <div className="flex items-center text-white font-bold text-lg">
                    <DollarSign className="w-5 h-5 text-green-500 mr-1" />
                    <span>R$ {service.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{service.durationHours}h</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-[#141414] border border-dashed border-[#262626] rounded-2xl">
            <div className="w-16 h-16 bg-[#00f0ff]/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00f0ff]/10">
              <Plus className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500 font-medium">
              {isLoading ? 'Carregando serviços...' : 'Nenhum serviço encontrado.'}
            </p>
            {!isLoading && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-4 text-[#00f0ff] hover:underline transition-all text-sm font-bold"
              >
                Cadastrar o primeiro serviço
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-[#262626] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center">
                {editingServiceId ? (
                  <Save className="w-5 h-5 mr-2 text-[#00f0ff]" />
                ) : (
                  <Plus className="w-5 h-5 mr-2 text-[#00f0ff]" />
                )}
                {editingServiceId ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveService} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Serviço</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
                  placeholder="Ex: Lavagem Premium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                <textarea 
                  required
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors resize-none"
                  placeholder="Descreva o que está incluso no serviço..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Preço (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Duração (Horas)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      required
                      type="number" 
                      step="0.5"
                      value={formData.durationHours}
                      onChange={e => setFormData({...formData, durationHours: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
                      placeholder="1.0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Ícone Representativo</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.keys(iconMap).map(iconName => {
                    const Icon = iconMap[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({...formData, iconName})}
                        className={`p-3 rounded-lg border flex items-center justify-center transition-all ${
                          formData.iconName === iconName 
                            ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]' 
                            : 'bg-[#0a0a0a] border-[#262626] text-gray-500 hover:border-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-transparent border border-[#262626] text-white font-bold py-3 rounded-xl hover:bg-[#262626] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#00f0ff] to-[#00b3cc] text-black font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all duration-300 flex items-center justify-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {editingServiceId ? 'Atualizar Serviço' : 'Salvar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
