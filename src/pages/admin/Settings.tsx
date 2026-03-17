import React, { useState, useEffect } from 'react';
import { Save, Building2, MapPin, Clock, CheckCircle2 } from 'lucide-react';

interface StoreSettings {
  companyName: string;
  address: string;
  whatsapp: string;
  operatingHours: {
    [key: string]: string;
  };
}

const defaultSettings: StoreSettings = {
  companyName: 'Auto Aesthetics',
  address: 'Rua das Estéticas, 123 - Centro',
  whatsapp: '5511999999999',
  operatingHours: {
    'Segunda - Sexta': '08:00 - 18:00',
    'Sábado': '08:00 - 13:00',
    'Domingo': 'Fechado',
  }
};

export function Settings() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('store_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(() => {
      localStorage.setItem('store_settings', JSON.stringify(settings));
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  const updateOperatingHour = (day: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: value
      }
    }));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-white">Configurações da Loja</h1>
        
        {showSuccess && (
          <div className="flex items-center text-green-400 bg-green-400/10 px-4 py-2 rounded-lg border border-green-400/20 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Salvo com sucesso!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Basic Info */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[#262626] bg-[#1a1a1a]/50">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-[#d4af37]" />
              Informações Gerais
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 text-left">Nome da Empresa</label>
              <input 
                type="text" 
                value={settings.companyName}
                onChange={e => setSettings({...settings, companyName: e.target.value})}
                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1 text-left">WhatsApp (com DDD)</label>
                <input 
                  type="text" 
                  value={settings.whatsapp}
                  onChange={e => setSettings({...settings, whatsapp: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                  placeholder="5511999999999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1 text-left">Endereço</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    value={settings.address}
                    onChange={e => setSettings({...settings, address: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[#262626] bg-[#1a1a1a]/50">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-[#d4af37]" />
              Horário de Funcionamento
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.keys(settings.operatingHours).map(day => (
              <div key={day}>
                <label className="block text-sm font-medium text-gray-400 mb-1 text-left">{day}</label>
                <input 
                  type="text" 
                  value={settings.operatingHours[day]}
                  onChange={e => updateOperatingHour(day, e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg p-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                  placeholder="Ex: 08:00 - 18:00"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-[#d4af37] to-[#f1d570] text-black font-bold py-3 px-10 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
