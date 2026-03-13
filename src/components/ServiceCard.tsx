import type { Service } from '../data/services';
import * as Icons from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
}

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  // @ts-ignore - dynamic icon resolution
  const Icon = Icons[service.iconName] || Icons.Asterisk;

  return (
    <div 
      className="bg-[#141414] border border-[#262626] rounded-2xl p-6 hover:border-[#00f0ff]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all duration-300 cursor-pointer flex flex-col h-full group"
      onClick={() => onSelect(service)}
    >
      <div className="w-12 h-12 rounded-xl bg-[#262626] flex items-center justify-center mb-4 group-hover:bg-[#00f0ff]/10 group-hover:text-[#00f0ff] transition-colors duration-300">
        <Icon className="w-6 h-6 text-gray-400 group-hover:text-[#00f0ff] transition-colors duration-300" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
      <p className="text-gray-400 text-sm flex-1 mb-6">{service.description}</p>
      
      <div className="flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">A partir de</span>
          <span className="text-[#d4af37] font-bold text-xl">R$ {service.price.toFixed(2)}</span>
        </div>
        <div className="text-right">
           <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider block">Duração</span>
           <span className="text-white font-medium text-sm">~{service.durationHours}h</span>
        </div>
      </div>
      
      <div className="mt-6 w-full py-3 rounded-lg bg-[#262626] text-center text-sm font-medium text-white group-hover:bg-[#00f0ff] group-hover:text-black transition-colors duration-300">
        Agendar Serviço
      </div>
    </div>
  );
}
