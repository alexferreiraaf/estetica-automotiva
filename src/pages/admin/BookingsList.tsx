import { useMemo } from 'react';
import { useBooking } from '../../context/BookingContext';
import type { BookingStatus, Booking } from '../../context/BookingContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Truck, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const statusColors: Record<BookingStatus, string> = {
  'Pendente': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Confirmado': 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/20',
  'Em Execução': 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/20',
  'Concluído': 'bg-green-500/10 text-green-500 border-green-500/20',
};

export function BookingsList() {
  const { bookings, services, updateBookingStatus, deleteBooking } = useBooking();

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => 
      new Date(`${b.date}T${b.timeSlot}`).getTime() - new Date(`${a.date}T${a.timeSlot}`).getTime()
    );
  }, [bookings]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-extrabold text-text-primary mb-8">Gestão de Agendamentos</h1>

      <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-bg-card border-b border-border-main">
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Cliente/Veículo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Serviço</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Data/Hora</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border-main">
                 {sortedBookings.length === 0 ? (
                    <tr>
                       <td colSpan={5} className="px-6 py-10 text-center text-text-muted">
                          Nenhum agendamento encontrado.
                       </td>
                    </tr>
                 ) : (
                    sortedBookings.map((b: Booking) => {
                      const service = services.find(s => s.id === b.serviceId);
                      return (
                        <tr key={b.id} className="hover:bg-bg-card transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div>
                                  <p className="font-bold text-text-primary">{b.customerName}</p>
                                  <p className="text-sm text-text-secondary">
                                    <span className={cn(
                                      "inline-block w-2 h-2 rounded-full mr-2",
                                      b.vehicleType === 'Moto' ? "bg-blue-400" : "bg-green-400"
                                    )}></span>
                                    {b.carModel} • {b.licensePlate}
                                  </p>
                                  <p className="text-xs text-text-muted">{b.whatsapp}</p>
                                  {b.hasDelivery ? (
                                    <div className="mt-1.5 flex items-center text-xs text-gold gap-1 bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-md w-fit">
                                      <Truck className="w-3.5 h-3.5 shrink-0" />
                                      <span className="font-bold">Leva e Traz:</span>
                                      <span className="text-text-secondary truncate max-w-[180px]" title={b.deliveryAddress}>{b.deliveryAddress || 'Endereço informado'}</span>
                                    </div>
                                  ) : (
                                    <div className="mt-1 flex items-center text-[11px] text-text-muted gap-1">
                                      <MapPin className="w-3 h-3 shrink-0" />
                                      <span>Entrega no Local</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <p className="font-medium text-text-primary">{service?.name}</p>
                              <p className="text-sm text-gold">R$ {service?.price.toFixed(2)}</p>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-text-primary">{format(parseISO(b.date), "dd/MM/yyyy", { locale: ptBR })}</p>
                              <p className="text-sm text-text-secondary">{b.timeSlot}</p>
                           </td>
                           <td className="px-6 py-4">
                              <span className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                statusColors[b.status]
                              )}>
                                {b.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                 <select
                                   value={b.status}
                                   onChange={(e) => updateBookingStatus(b.id, e.target.value as BookingStatus)}
                                   className="bg-bg-main border border-border-main text-text-primary text-sm rounded-lg focus:ring-neon-blue focus:border-neon-blue block p-2.5 outline-none cursor-pointer min-w-[140px]"
                                 >
                                   {Object.keys(statusColors).map(status => (
                                     <option key={status} value={status}>{status}</option>
                                   ))}
                                 </select>
                                 <button
                                   onClick={() => {
                                     if (confirm('Tem certeza que deseja excluir este agendamento?')) {
                                       deleteBooking(b.id);
                                     }
                                   }}
                                   className="p-2.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                   title="Excluir agendamento"
                                 >
                                   <Trash2 className="w-5 h-5" />
                                 </button>
                              </div>
                           </td>
                        </tr>
                      )
                    })
                 )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
