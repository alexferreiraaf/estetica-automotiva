import { useState } from 'react';
import { Plus, Search, Sparkles, Clock, DollarSign, MoreVertical, Droplets, Car, Wind, Shield } from 'lucide-react';
import { services as initialServices } from '../../data/services';

const iconMap: Record<string, any> = {
  Droplets,
  Car,
  Sparkles,
  Wind,
  Shield
};

export function Services() {
  const [searchTerm, setSearchTerm] = useState('');
  const [servicesList] = useState(initialServices);

  const filteredServices = servicesList.filter(service =>
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
        
        <button className="bg-gradient-to-r from-[#00f0ff] to-[#00b3cc] text-black font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all duration-300 flex items-center justify-center">
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
                  <button className="p-2 text-gray-500 hover:text-white transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
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
          <div className="col-span-full py-12 text-center text-gray-500 bg-[#141414] border border-dashed border-[#262626] rounded-2xl">
            Nenhum serviço encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
