import { useMemo } from 'react';
import { useBooking } from '../../context/BookingContext';
import type { BookingStatus, Booking } from '../../context/BookingContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const { bookings, services, updateBookingStatus } = useBooking();

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => 
      new Date(`${b.date}T${b.timeSlot}`).getTime() - new Date(`${a.date}T${a.timeSlot}`).getTime()
    );
  }, [bookings]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-extrabold text-white mb-8">Gestão de Agendamentos</h1>

      <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-[#1f1f1f] border-b border-[#262626]">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente/Veículo</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Serviço</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data/Hora</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#262626]">
                 {sortedBookings.length === 0 ? (
                    <tr>
                       <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                          Nenhum agendamento encontrado.
                       </td>
                    </tr>
                 ) : (
                    sortedBookings.map((b: Booking) => {
                      const service = services.find(s => s.id === b.serviceId);
                      return (
                        <tr key={b.id} className="hover:bg-[#1f1f1f] transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div>
                                  <p className="font-bold text-white">{b.customerName}</p>
                                  <p className="text-sm text-gray-400">
                                    <span className={cn(
                                      "inline-block w-2 h-2 rounded-full mr-2",
                                      b.vehicleType === 'Moto' ? "bg-blue-400" : "bg-green-400"
                                    )}></span>
                                    {b.carModel} • {b.licensePlate}
                                  </p>
                                  <p className="text-xs text-gray-500">{b.whatsapp}</p>
                                </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <p className="font-medium text-white">{service?.name}</p>
                              <p className="text-sm text-[#d4af37]">R$ {service?.price.toFixed(2)}</p>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-white">{format(parseISO(b.date), "dd/MM/yyyy", { locale: ptBR })}</p>
                              <p className="text-sm text-gray-400">{b.timeSlot}</p>
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
                              <select
                                value={b.status}
                                onChange={(e) => updateBookingStatus(b.id, e.target.value as BookingStatus)}
                                className="bg-[#0a0a0a] border border-[#262626] text-white text-sm rounded-lg focus:ring-[#00f0ff] focus:border-[#00f0ff] block w-full p-2.5 outline-none cursor-pointer"
                              >
                                {Object.keys(statusColors).map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
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
