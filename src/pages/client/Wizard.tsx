import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { services } from '../../data/services';
import { useBooking } from '../../context/BookingContext';
import { ChevronLeft, Calendar as CalendarIcon, Clock, CheckCircle2, User, Car } from 'lucide-react';
import { format, addDays, startOfToday, isSunday, isPast, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Wizard() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { addBooking, getOccupiedSlots } = useBooking();
  
  const service = services.find(s => s.id === serviceId);
  
  const [step, setStep] = useState(1); // 1: Date, 2: Time, 3: Form, 4: Success
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    whatsapp: '',
    carModel: '',
    licensePlate: ''
  });

  if (!service) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Serviço não encontrado.</h2>
        <button onClick={() => navigate('/')} className="text-[#00f0ff] hover:underline">Voltar ao catálogo</button>
      </div>
    );
  }

  // --- Step 1: Date Selection ---
  // Generate next 30 days
  const upcomingDays = useMemo(() => {
    const today = startOfToday();
    const days = [];
    for (let i = 0; i < 30; i++) {
        const d = addDays(today, i);
        if (!isSunday(d)) {
            days.push(d);
        }
    }
    return days;
  }, []);

  // --- Step 2: Time Selection ---
  const timeSlots = useMemo(() => {
     if (!selectedDate) return [];
     const dateStr = format(selectedDate, 'yyyy-MM-dd');
     const occupied = getOccupiedSlots(dateStr);
     
     const slots = [];
     for (let h = 8; h <= 17; h++) {
       const slotLabel = `${h.toString().padStart(2, '0')}:00`;
       // Block logic: Needs service.durationHours consecutive free slots starting at `h`
       // But wait, the prompt says "block already booked slots". 
       // For simplicity, we just check if any slot required for the duration is occupied.
       // However, 1h is typical, but we must check durationHours.
       let canFit = true;
       // Also if current time is past today's time, disable it
       const slotTime = new Date(selectedDate);
       slotTime.setHours(h, 0, 0, 0);
       
       if (isPast(slotTime)) {
           canFit = false;
       } else {
           for (let i = 0; i < service.durationHours; i++) {
             const checkHour = h + i;
             if (checkHour >= 18) { canFit = false; break; } // Ends after closing time
             const checkSlot = `${checkHour.toString().padStart(2, '0')}:00`;
             if (occupied.includes(checkSlot)) { canFit = false; break; }
           }
       }
       
       slots.push({ time: slotLabel, available: canFit });
     }
     return slots;
  }, [selectedDate, getOccupiedSlots, service.durationHours]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTimeSlot) return;
    
    addBooking({
      serviceId: service.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      timeSlot: selectedTimeSlot,
      ...formData
    });
    
    setStep(4);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      {step < 4 && (
        <div className="mb-8 flex items-center justify-between border-b border-[#262626] pb-4">
           {step > 1 ? (
             <button onClick={handleBack} className="text-gray-400 hover:text-white flex items-center transition-colors">
               <ChevronLeft className="w-5 h-5 mr-1" />
               Voltar
             </button>
           ) : (
             <Link to="/" className="text-gray-400 hover:text-white flex items-center transition-colors">
               <ChevronLeft className="w-5 h-5 mr-1" />
               Catálogo
             </Link>
           )}
           <div className="text-sm font-medium text-[#d4af37]">Passo {step} de 3</div>
        </div>
      )}

      {/* Selected Service Info Banner */}
      {step < 4 && (
         <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Serviço Selecionado</p>
              <h3 className="text-lg font-bold text-white">{service.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-[#d4af37] font-bold text-lg">R$ {service.price.toFixed(2)}</p>
              <p className="text-sm text-gray-400">{service.durationHours}h de duração</p>
            </div>
         </div>
      )}

      {/* Step 1: Date */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <CalendarIcon className="mr-3 text-[#00f0ff]" /> Escolha a Data
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
             {upcomingDays.map((date, idx) => {
               const isSelected = selectedDate && isSameDay(date, selectedDate);
               return (
                 <button
                   key={idx}
                   onClick={() => setSelectedDate(date)}
                   className={cn(
                     "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
                     isSelected 
                       ? "bg-[#00f0ff]/10 border-[#00f0ff] ring-1 ring-[#00f0ff]" 
                       : "bg-[#141414] border-[#262626] hover:border-gray-500"
                   )}
                 >
                   <span className={cn("text-sm", isSelected ? "text-[#00f0ff]" : "text-gray-400")}>
                     {format(date, 'eee', { locale: ptBR })}
                   </span>
                   <span className={cn("text-xl font-bold mt-1", isSelected ? "text-[#00f0ff]" : "text-white")}>
                     {format(date, 'dd')}
                   </span>
                   <span className={cn("text-xs mt-1", isSelected ? "text-[#00f0ff]" : "text-gray-500")}>
                     {format(date, 'MMM', { locale: ptBR })}
                   </span>
                 </button>
               )
             })}
          </div>
          <div className="mt-8 flex justify-end">
             <button 
               disabled={!selectedDate}
               onClick={handleNext}
               className="bg-[#00f0ff] text-black font-bold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00b3cc] transition-colors"
             >
               Próximo Passo
             </button>
          </div>
        </div>
      )}

      {/* Step 2: Time */}
      {step === 2 && (
        <div>
           <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Clock className="mr-3 text-[#00f0ff]" /> Escolha o Horário
          </h2>
          <p className="text-gray-400 mb-6">
            Data selecionada: <span className="text-white font-medium">{selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : ''}</span>
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
             {timeSlots.map(({ time, available }, idx) => {
                const isSelected = selectedTimeSlot === time;
                return (
                  <button
                    key={idx}
                    disabled={!available}
                    onClick={() => setSelectedTimeSlot(time)}
                    className={cn(
                      "py-3 rounded-lg border font-medium transition-all duration-200",
                      !available 
                        ? "bg-[#1f1f1f] border-transparent text-gray-600 cursor-not-allowed line-through" 
                        : isSelected
                          ? "bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37] ring-1 ring-[#d4af37]"
                          : "bg-[#141414] border-[#262626] text-white hover:border-gray-500"
                    )}
                  >
                    {time}
                  </button>
                )
             })}
          </div>
          <div className="mt-8 flex justify-end">
             <button 
               disabled={!selectedTimeSlot}
               onClick={handleNext}
               className="bg-[#00f0ff] text-black font-bold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00b3cc] transition-colors"
             >
               Preencher Detalhes
             </button>
          </div>
        </div>
      )}

      {/* Step 3: Identification */}
      {step === 3 && (
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <User className="mr-3 text-[#00f0ff]" /> Seus Dados
          </h2>
          
          <div className="space-y-5 bg-[#141414] border border-[#262626] p-6 rounded-xl">
             <div>
               <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
               <input 
                 required
                 type="text" 
                 value={formData.customerName}
                 onChange={e => setFormData({...formData, customerName: e.target.value})}
                 className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
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
                 className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
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
                   className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#00f0ff] transition-colors"
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
                   className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#00f0ff] uppercase transition-colors"
                   placeholder="ABC-1234"
                 />
               </div>
             </div>
          </div>

          <div className="mt-8">
             <button 
               type="submit"
               className="w-full bg-gradient-to-r from-[#00f0ff] to-[#00b3cc] text-black font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all duration-300 text-lg flex justify-center items-center"
             >
               Confirmar Agendamento <CheckCircle2 className="ml-2 w-5 h-5" />
             </button>
          </div>
        </form>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="text-center py-10 bg-[#141414] border border-[#00f0ff]/30 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f0ff] to-[#d4af37]"></div>
          
          <div className="w-20 h-20 bg-[#00f0ff]/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <CheckCircle2 className="w-10 h-10 text-[#00f0ff]" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-white mb-2">Agendamento Confirmado!</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Seu horário foi reservado com sucesso. Entraremos em contato via WhatsApp caso seja necessário.
          </p>
          
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-xl p-6 text-left mb-8 divide-y divide-[#262626]">
             <div className="pb-4 flex items-start">
                <Car className="w-5 h-5 text-gray-500 mr-3 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Serviço</p>
                  <p className="text-lg font-bold text-white">{service.name}</p>
                </div>
             </div>
             
             <div className="py-4 flex items-start">
                <CalendarIcon className="w-5 h-5 text-gray-500 mr-3 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Data e Horário</p>
                   <p className="text-lg font-bold text-white">
                     {selectedDate && format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                     {" • "}
                     <span className="text-[#d4af37]">{selectedTimeSlot}</span>
                   </p>
                </div>
             </div>
             
             <div className="pt-4 flex items-start">
                <User className="w-5 h-5 text-gray-500 mr-3 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Para</p>
                  <p className="text-lg font-bold text-white">{formData.customerName}</p>
                  <p className="text-gray-400">{formData.carModel} - {formData.licensePlate}</p>
                </div>
             </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <button 
                onClick={() => {
                  const dataFormatada = selectedDate ? format(selectedDate, "dd/MM/yyyy") : '';
                  const mensagem = `Olá! Acabei de realizar um agendamento pelo site.\n\n*Detalhes do Agendamento:*\n🚗 *Serviço:* ${service.name}\n📅 *Data:* ${dataFormatada}\n⏰ *Horário:* ${selectedTimeSlot}\n👤 *Nome:* ${formData.customerName}\n🚘 *Veículo:* ${formData.carModel} (${formData.licensePlate})\n\nAguardo a confirmação!`;
                  
                  // Replace with actual shop owner phone number
                  const numeroLoja = "5511999999999"; 
                  const url = `https://wa.me/${numeroLoja}?text=${encodeURIComponent(mensagem)}`;
                  window.open(url, '_blank');
                }}
                className="bg-[#25D366] text-black hover:bg-[#20b858] font-bold py-3 px-8 rounded-lg transition-colors flex items-center w-full sm:w-auto justify-center"
             >
               <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
               </svg>
               Enviar no WhatsApp
             </button>

             <button 
                onClick={() => navigate('/')}
                className="bg-transparent border border-[#262626] text-white hover:bg-[#262626] font-medium py-3 px-8 rounded-lg transition-colors w-full sm:w-auto"
             >
               Voltar ao Início
             </button>
          </div>
        </div>
      )}

    </div>
  );
}
