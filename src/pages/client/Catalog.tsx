import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Service } from '../../data/services';
import { ServiceCard } from '../../components/ServiceCard';

export function Catalog() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setServices(data as Service[]);
      }
      setIsLoading(false);
    }
    fetchServices();
  }, []);

  const handleSelectService = (service: Service) => {
    navigate(`/client/booking/${service.id}`);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-4 tracking-tight">Estética <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-blue-dark">Premium</span></h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Eleve o padrão do seu veículo com nossos serviços especializados. Escolha o tratamento ideal abaixo e agende seu horário.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-bg-surface border border-border-main rounded-2xl h-64 animate-pulse"></div>
          ))}
        </div>
      ) : services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              onSelect={handleSelectService} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-bg-surface border border-dashed border-border-main rounded-2xl">
          <p className="text-text-muted">Nenhum serviço disponível no momento.</p>
        </div>
      )}
    </div>
  );
}
