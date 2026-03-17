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
      className="bg-bg-surface border border-border-main rounded-2xl p-6 hover:border-neon-blue/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all duration-300 cursor-pointer flex flex-col h-full group"
      onClick={() => onSelect(service)}
    >
      <div className="w-12 h-12 rounded-xl bg-bg-card flex items-center justify-center mb-4 group-hover:bg-neon-blue/10 group-hover:text-neon-blue transition-colors duration-300">
        <Icon className="w-6 h-6 text-text-muted group-hover:text-neon-blue transition-colors duration-300" />
      </div>
      
      <h3 className="text-xl font-bold text-text-primary mb-2">{service.name}</h3>
      <p className="text-text-secondary text-sm flex-1 mb-6">{service.description}</p>
      
      <div className="flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-xs text-text-muted uppercase font-semibold tracking-wider">A partir de</span>
          <span className="text-gold font-bold text-xl">R$ {service.price.toFixed(2)}</span>
        </div>
        <div className="text-right">
           <span className="text-xs text-text-muted uppercase font-semibold tracking-wider block">Duração</span>
           <span className="text-text-primary font-medium text-sm">~{service.durationHours}h</span>
        </div>
      </div>
      
      <div className="mt-6 w-full py-3 rounded-lg bg-bg-card text-center text-sm font-medium text-text-primary group-hover:bg-neon-blue group-hover:text-black transition-colors duration-300">
        Agendar Serviço
      </div>
    </div>
  );
}
