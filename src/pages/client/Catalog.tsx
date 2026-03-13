import { useNavigate } from 'react-router-dom';
import { services } from '../../data/services';
import type { Service } from '../../data/services';
import { ServiceCard } from '../../components/ServiceCard';

export function Catalog() {
  const navigate = useNavigate();

  const handleSelectService = (service: Service) => {
    navigate(`/booking/${service.id}`);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Estética <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#00b3cc]">Premium</span></h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Eleve o padrão do seu veículo com nossos serviços especializados. Escolha o tratamento ideal abaixo e agende seu horário.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <ServiceCard 
            key={service.id} 
            service={service} 
            onSelect={handleSelectService} 
          />
        ))}
      </div>
    </div>
  );
}
