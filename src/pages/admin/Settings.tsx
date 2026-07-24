import React, { useState, useEffect } from 'react';
import { Save, Building2, MapPin, Clock, CheckCircle2, Car, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface StoreSettings {
  companyName: string;
  address: string;
  whatsapp: string;
  acceptsCars: boolean;
  acceptsMotos: boolean;
  offersDelivery: boolean;
  operatingHours: {
    [key: string]: string;
  };
}

export const defaultSettings: StoreSettings = {
  companyName: 'Auto Aesthetics',
  address: 'Rua das Estéticas, 123 - Centro',
  whatsapp: '5511999999999',
  acceptsCars: true,
  acceptsMotos: true,
  offersDelivery: true,
  operatingHours: {
    'Segunda - Sexta': '08:00 - 18:00',
    'Sábado': '08:00 - 13:00',
    'Domingo': 'Fechado',
  }
};

export function getStoreSettings(aestheticId?: string | null): StoreSettings {
  if (!aestheticId) return defaultSettings;
  const saved = localStorage.getItem(`store_settings_${aestheticId}`);
  if (saved) {
    try {
      return { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) {
      return defaultSettings;
    }
  }
  return defaultSettings;
}

export function Settings() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const aestheticId = localStorage.getItem('aesthetic_id');
      if (!aestheticId) return;

      const saved = localStorage.getItem(`store_settings_${aestheticId}`);
      let localSettings = defaultSettings;
      
      if (saved) {
        try {
          localSettings = { ...defaultSettings, ...JSON.parse(saved) };
        } catch (e) {
          console.error('Failed to parse local settings', e);
        }
      }

      // Fetch from Supabase based on ID
      const { data, error } = await supabase
        .from('aesthetics')
        .select('name, phone')
        .eq('id', aestheticId)
        .single();
        
      if (data && !error) {
        setSettings({
          ...localSettings,
          companyName: data.name || localSettings.companyName,
          whatsapp: data.phone || localSettings.whatsapp
        });
      } else {
        setSettings(localSettings);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const aestheticId = localStorage.getItem('aesthetic_id');
    
    if (aestheticId) {
      // Save to localStorage using isolated aesthetic namespace
      localStorage.setItem(`store_settings_${aestheticId}`, JSON.stringify(settings));

      // Sync specific fields back to Supabase
      const { error } = await supabase
        .from('aesthetics')
        .update({
          name: settings.companyName,
          phone: settings.whatsapp
        })
        .eq('id', aestheticId);
      
      if (error) {
        console.error('Error syncing to Supabase:', error);
      }
    }
    
    setTimeout(() => {
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
  };  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-text-primary">Configurações da Loja</h1>
        
        {showSuccess && (
          <div className="flex items-center text-green-400 bg-green-400/10 px-4 py-2 rounded-lg border border-green-400/20 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Salvo com sucesso!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Basic Info */}
        <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border-main bg-bg-main/50">
            <h2 className="text-lg font-bold text-text-primary flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-gold" />
              Informações Gerais
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1 text-left">Nome da Empresa</label>
              <input 
                type="text" 
                value={settings.companyName}
                onChange={e => setSettings({...settings, companyName: e.target.value})}
                className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1 text-left">WhatsApp (com DDD)</label>
                <input 
                  type="text" 
                  value={settings.whatsapp}
                  onChange={e => setSettings({...settings, whatsapp: e.target.value})}
                  className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                  placeholder="5511999999999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1 text-left">Endereço</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    value={settings.address}
                    onChange={e => setSettings({...settings, address: e.target.value})}
                    className="w-full bg-bg-main border border-border-main rounded-lg p-3 pl-10 text-text-primary focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Types and Services Settings */}
        <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border-main bg-bg-main/50">
            <h2 className="text-lg font-bold text-text-primary flex items-center">
              <Car className="w-5 h-5 mr-2 text-gold" />
              Tipos de Veículos e Serviços Oferecidos
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Escolha os tipos de veículos que sua estética atende e se oferece o serviço Leva e Traz.
            </p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Accepts Cars */}
            <div 
              onClick={() => setSettings(prev => ({ ...prev, acceptsCars: !prev.acceptsCars }))}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                settings.acceptsCars 
                  ? 'bg-neon-blue/10 border-neon-blue text-text-primary' 
                  : 'bg-bg-main border-border-main text-text-muted opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-bg-card flex items-center justify-center">
                  <Car className="w-5 h-5 text-neon-blue" />
                </div>
                <div>
                  <p className="font-bold text-sm">Atender Carros</p>
                  <p className="text-xs text-text-secondary">{settings.acceptsCars ? 'Habilitado' : 'Desabilitado'}</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.acceptsCars} 
                onChange={() => {}} 
                className="w-5 h-5 accent-neon-blue cursor-pointer"
              />
            </div>

            {/* Accepts Motos */}
            <div 
              onClick={() => setSettings(prev => ({ ...prev, acceptsMotos: !prev.acceptsMotos }))}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                settings.acceptsMotos 
                  ? 'bg-neon-blue/10 border-neon-blue text-text-primary' 
                  : 'bg-bg-main border-border-main text-text-muted opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-bg-card flex items-center justify-center">
                  <span className="text-lg">🏍️</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Atender Motos</p>
                  <p className="text-xs text-text-secondary">{settings.acceptsMotos ? 'Habilitado' : 'Desabilitado'}</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.acceptsMotos} 
                onChange={() => {}} 
                className="w-5 h-5 accent-neon-blue cursor-pointer"
              />
            </div>

            {/* Offers Delivery */}
            <div 
              onClick={() => setSettings(prev => ({ ...prev, offersDelivery: !prev.offersDelivery }))}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                settings.offersDelivery 
                  ? 'bg-gold/10 border-gold text-text-primary' 
                  : 'bg-bg-main border-border-main text-text-muted opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-bg-card flex items-center justify-center">
                  <Truck className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="font-bold text-sm">Serviço Leva e Traz</p>
                  <p className="text-xs text-text-secondary">{settings.offersDelivery ? 'Habilitado' : 'Desabilitado'}</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.offersDelivery} 
                onChange={() => {}} 
                className="w-5 h-5 accent-gold cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border-main bg-bg-main/50">
            <h2 className="text-lg font-bold text-text-primary flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gold" />
              Horário de Funcionamento
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.keys(settings.operatingHours).map(day => (
              <div key={day}>
                <label className="block text-sm font-medium text-text-secondary mb-1 text-left">{day}</label>
                <input 
                  type="text" 
                  value={settings.operatingHours[day]}
                  onChange={e => updateOperatingHour(day, e.target.value)}
                  className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
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
            className="bg-gradient-to-r from-gold to-gold-light text-black font-bold py-3 px-10 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center disabled:opacity-50"
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
