import React, { useState, useMemo } from 'react';
import { useBooking, type BookingStatus } from '../context/BookingContext';
import { X, Calendar, Clock, User, Car, CheckCircle2, PlusCircle, Truck, MapPin, Search } from 'lucide-react';
import { format } from 'date-fns';
import { getStoreSettings } from '../pages/admin/Settings';

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickBookingModal({ isOpen, onClose }: QuickBookingModalProps) {
  const { services, addBooking, getOccupiedSlots } = useBooking();
  const storeSettings = useMemo(() => getStoreSettings(localStorage.getItem('aesthetic_id')), [isOpen]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const initialVehicleType = storeSettings.acceptsCars ? 'Carro' : (storeSettings.acceptsMotos ? 'Moto' : 'Carro');

  const [serviceId, setServiceId] = useState<string>('');
  const [date, setDate] = useState<string>(todayStr);
  const [timeSlot, setTimeSlot] = useState<string>('09:00');
  const [customerName, setCustomerName] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>(initialVehicleType);
  const [carModel, setCarModel] = useState<string>('');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [hasDelivery, setHasDelivery] = useState<boolean>(false);
  const [addressFields, setAddressFields] = useState({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    uf: ''
  });
  const [cepLoading, setCepLoading] = useState<boolean>(false);
  const [cepError, setCepError] = useState<string>('');

  const formatCep = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

  const handleSearchCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepError('Digite 8 números para buscar.');
      return;
    }

    setCepLoading(true);
    setCepError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepError('CEP não encontrado.');
      } else {
        setAddressFields(prev => ({
          ...prev,
          cep: formatCep(cleanCep),
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          uf: data.uf || ''
        }));
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      setCepError('Erro ao consultar o CEP.');
    } finally {
      setCepLoading(false);
    }
  };
  const [status, setStatus] = useState<BookingStatus>('Confirmado');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedService = services.find(s => s.id === serviceId);

  // Time slots generator (8:00 to 18:00)
  const occupiedSlots = getOccupiedSlots(date);
  const allTimeSlots = Array.from({ length: 11 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) {
      alert('Por favor, selecione um serviço.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalAddress = '';
      if (hasDelivery) {
        finalAddress = `${addressFields.street}, ${addressFields.number}${addressFields.complement ? ` (${addressFields.complement})` : ''} - ${addressFields.neighborhood}, ${addressFields.city}/${addressFields.uf}${addressFields.cep ? ` - CEP: ${addressFields.cep}` : ''}`;
      }

      await addBooking({
        serviceId,
        date,
        timeSlot,
        customerName,
        whatsapp,
        carModel,
        licensePlate: licensePlate.toUpperCase(),
        vehicleType,
        hasDelivery,
        deliveryAddress: hasDelivery ? finalAddress : undefined,
        status
      });

      // Reset form & close
      setServiceId('');
      setCustomerName('');
      setWhatsapp('');
      setCarModel('');
      setLicensePlate('');
      setHasDelivery(false);
      setAddressFields({
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        uf: ''
      });
      onClose();
    } catch (err) {
      console.error('Erro ao agendar presencialmente:', err);
      alert('Erro ao realizar o agendamento presencial.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-bg-surface border border-border-main rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border-main flex items-center justify-between bg-bg-card">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-neon-blue" />
              Novo Agendamento Presencial (Balcão)
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Cadastre agendamentos diretos de clientes que chegaram na sua estética
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-bg-surface transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Service Selection */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-neon-blue" />
              Serviço Desejado *
            </label>
            <select
              required
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full bg-bg-main border border-border-main rounded-xl p-3 text-text-primary focus:outline-none focus:border-neon-blue transition-colors cursor-pointer"
            >
              <option value="">-- Selecione o Serviço --</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - R$ {s.price.toFixed(2)} ({s.durationHours}h)
                </option>
              ))}
            </select>

            {selectedService && (
              <div className="mt-2 p-3 bg-neon-blue/10 border border-neon-blue/20 rounded-lg flex items-center justify-between text-xs text-text-primary">
                <span>Duração estimada: <strong>{selectedService.durationHours} hora(s)</strong></span>
                <span className="text-gold font-bold text-sm">R$ {selectedService.price.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-neon-blue" />
                Data *
              </label>
              <input 
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-bg-main border border-border-main rounded-xl p-3 text-text-primary focus:outline-none focus:border-neon-blue transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-text-primary mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-neon-blue" />
                Horário *
              </label>
              <select
                required
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full bg-bg-main border border-border-main rounded-xl p-3 text-text-primary focus:outline-none focus:border-neon-blue transition-colors cursor-pointer"
              >
                {allTimeSlots.map((slot) => {
                  const isOccupied = occupiedSlots.includes(slot);
                  return (
                    <option key={slot} value={slot}>
                      {slot} {isOccupied ? '(Já Ocupado)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Status selection */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2">
              Status Inicial
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Pendente', 'Confirmado', 'Em Execução', 'Concluído'] as BookingStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                    status === st
                      ? 'bg-gold/20 border-gold text-gold shadow-sm'
                      : 'bg-bg-main border-border-main text-text-muted hover:border-text-secondary'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Details */}
          <div className="border-t border-border-main pt-4 space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <User className="w-4 h-4 text-neon-blue" />
              Informações do Cliente
            </h3>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Nome do Cliente *</label>
              <input 
                required
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Carlos Eduardo"
                className="w-full bg-bg-main border border-border-main rounded-xl p-3 text-text-primary focus:outline-none focus:border-neon-blue transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">WhatsApp / Telefone</label>
              <input 
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full bg-bg-main border border-border-main rounded-xl p-3 text-text-primary focus:outline-none focus:border-neon-blue transition-colors"
              />
            </div>

            {/* Vehicle Details */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Tipo de Veículo</label>
              {storeSettings.acceptsCars && storeSettings.acceptsMotos ? (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setVehicleType('Carro')}
                    className={`py-2.5 rounded-xl border flex items-center justify-center text-sm font-medium transition-all ${
                      vehicleType === 'Carro'
                        ? 'bg-neon-blue/15 border-neon-blue text-neon-blue'
                        : 'bg-bg-main border-border-main text-text-muted hover:border-text-secondary'
                    }`}
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Carro
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleType('Moto')}
                    className={`py-2.5 rounded-xl border flex items-center justify-center text-sm font-medium transition-all ${
                      vehicleType === 'Moto'
                        ? 'bg-neon-blue/15 border-neon-blue text-neon-blue'
                        : 'bg-bg-main border-border-main text-text-muted hover:border-text-secondary'
                    }`}
                  >
                    <span className="mr-2">🏍️</span>
                    Moto
                  </button>
                </div>
              ) : (
                <div className="p-2.5 mb-3 bg-bg-main border border-border-main rounded-xl text-xs font-bold text-neon-blue flex items-center gap-2">
                  {storeSettings.acceptsCars ? (
                    <>
                      <Car className="w-4 h-4" />
                      Exclusivo para Carros
                    </>
                  ) : (
                    <>
                      <span>🏍️</span>
                      Exclusivo para Motos
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Modelo do Veículo *</label>
                  <input 
                    required
                    type="text"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    placeholder={vehicleType === 'Moto' ? 'Ex: BMW F850 GS' : 'Ex: Corolla Cross'}
                    className="w-full bg-bg-main border border-border-main rounded-xl p-3 text-text-primary focus:outline-none focus:border-neon-blue transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Placa *</label>
                  <input 
                    required
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="ABC-1234"
                    className="w-full bg-bg-main border border-border-main rounded-xl p-3 text-text-primary focus:outline-none focus:border-neon-blue uppercase transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Leva e Traz */}
            {storeSettings.offersDelivery && (
              <div className="pt-2 border-t border-border-main">
                <label className="block text-xs font-bold text-text-primary mb-2">Modalidade do Atendimento</label>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setHasDelivery(false)}
                  className={`py-2 rounded-xl border flex items-center justify-center text-xs font-medium transition-all ${
                    !hasDelivery
                      ? 'bg-neon-blue/15 border-neon-blue text-neon-blue'
                      : 'bg-bg-main border-border-main text-text-muted hover:border-text-secondary'
                  }`}
                >
                  <Car className="w-3.5 h-3.5 mr-1.5" />
                  No Local
                </button>
                <button
                  type="button"
                  onClick={() => setHasDelivery(true)}
                  className={`py-2 rounded-xl border flex items-center justify-center text-xs font-medium transition-all ${
                    hasDelivery
                      ? 'bg-gold/15 border-gold text-gold'
                      : 'bg-bg-main border-border-main text-text-muted hover:border-text-secondary'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 mr-1.5" />
                  Leva e Traz
                </button>
              </div>

              {hasDelivery && (
                <div className="mt-3 p-4 bg-bg-surface/50 border border-border-main rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  
                  {/* CEP */}
                  <div>
                    <label className="block text-[11px] font-bold text-text-primary mb-1 uppercase tracking-wider">
                      CEP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={addressFields.cep}
                        onChange={(e) => {
                          const formatted = formatCep(e.target.value);
                          setAddressFields(prev => ({ ...prev, cep: formatted }));
                          if (formatted.replace(/\D/g, '').length === 8) {
                            handleSearchCep(formatted);
                          }
                        }}
                        placeholder="Digite o CEP para buscar"
                        maxLength={9}
                        className="w-full bg-bg-main border border-border-main rounded-xl p-2.5 text-text-primary text-xs focus:outline-none focus:border-gold transition-colors pr-9"
                      />
                      {cepLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span className="w-3.5 h-3.5 border-2 border-gold/30 border-t-gold rounded-full animate-spin block"></span>
                        </div>
                      )}
                    </div>
                    {cepError && <p className="text-[11px] text-red-400 mt-1 font-medium">{cepError}</p>}
                  </div>

                  {/* Rua */}
                  <div>
                    <label className="block text-[11px] font-bold text-text-primary mb-1 uppercase tracking-wider">
                      Rua
                    </label>
                    <input
                      required
                      type="text"
                      value={addressFields.street}
                      onChange={(e) => setAddressFields({ ...addressFields, street: e.target.value })}
                      placeholder="Rua, Avenida, etc."
                      className="w-full bg-bg-main border border-border-main rounded-xl p-2.5 text-text-primary text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  {/* Número e Complemento */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-text-primary mb-1 uppercase tracking-wider">
                        Número *
                      </label>
                      <input
                        required
                        type="text"
                        value={addressFields.number}
                        onChange={(e) => setAddressFields({ ...addressFields, number: e.target.value })}
                        placeholder="Ex: 123"
                        className="w-full bg-bg-main border border-border-main rounded-xl p-2.5 text-text-primary text-xs focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-text-primary mb-1 uppercase tracking-wider">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={addressFields.complement}
                        onChange={(e) => setAddressFields({ ...addressFields, complement: e.target.value })}
                        placeholder="Apto, Bloco"
                        className="w-full bg-bg-main border border-border-main rounded-xl p-2.5 text-text-primary text-xs focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>
                  </div>

                  {/* Bairro */}
                  <div>
                    <label className="block text-[11px] font-bold text-text-primary mb-1 uppercase tracking-wider">
                      Bairro
                    </label>
                    <input
                      required
                      type="text"
                      value={addressFields.neighborhood}
                      onChange={(e) => setAddressFields({ ...addressFields, neighborhood: e.target.value })}
                      placeholder="Bairro"
                      className="w-full bg-bg-main border border-border-main rounded-xl p-2.5 text-text-primary text-xs focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  {/* Cidade e UF */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-3">
                      <label className="block text-[11px] font-bold text-text-primary mb-1 uppercase tracking-wider">
                        Cidade
                      </label>
                      <input
                        required
                        type="text"
                        value={addressFields.city}
                        onChange={(e) => setAddressFields({ ...addressFields, city: e.target.value })}
                        placeholder="Cidade"
                        className="w-full bg-bg-main border border-border-main rounded-xl p-2.5 text-text-primary text-xs focus:outline-none focus:border-gold transition-colors"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-text-primary mb-1 uppercase tracking-wider">
                        UF
                      </label>
                      <input
                        required
                        type="text"
                        maxLength={2}
                        value={addressFields.uf}
                        onChange={(e) => setAddressFields({ ...addressFields, uf: e.target.value.toUpperCase() })}
                        placeholder="SP"
                        className="w-full bg-bg-main border border-border-main rounded-xl p-2.5 text-text-primary text-xs focus:outline-none focus:border-gold transition-colors uppercase text-center"
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>
            )}

          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-border-main flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-transparent border border-border-main text-text-primary font-bold py-3.5 rounded-xl hover:bg-bg-card transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-neon-blue to-neon-blue-dark text-black font-extrabold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all duration-300 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
