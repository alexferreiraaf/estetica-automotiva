import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar as CalendarIcon, ListTodo, LogOut, Settings as SettingsIcon, Users, Briefcase, ExternalLink, Share2, Sun, Moon, Menu, X, PlusCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { QuickBookingModal } from '../components/QuickBookingModal';
import { updateLastLogin, setOffline } from '../data/aesthetics';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);

  useEffect(() => {
    const aestheticId = localStorage.getItem('aesthetic_id');
    if (!aestheticId) {
      console.log('Sem aestheticId no localStorage, heartbeat ignorado.');
      return;
    }

    const runUpdate = async () => {
      const result = await updateLastLogin(aestheticId);
      if (result?.error) {
        console.warn('Falha no heartbeat do status online. Pode ser necessário ajustar o RLS no Supabase.', result.error);
      }
    };

    // Update immediately on mount
    runUpdate();

    // Set up heartbeat every 4 minutes (to stay within the 5-min 'Online agora' window)
    const interval = setInterval(runUpdate, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    const aestheticId = localStorage.getItem('aesthetic_id');
    if (aestheticId) {
      await setOffline(aestheticId);
    }
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('aesthetic_id');
    localStorage.removeItem('aesthetic_name');
    await import('../lib/supabase').then(({ supabase }) => supabase.auth.signOut());
    navigate('/login');
  };

  const handleShare = async () => {
    const aestheticId = localStorage.getItem('aesthetic_id');
    const url = `${window.location.origin}/client/${aestheticId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Auto Aesthetics - Agendamento',
          text: 'Agende seu serviço automotivo na Auto Aesthetics!',
          url: url
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link da loja copiado para a área de transferência!');
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Agendamentos', icon: ListTodo, path: '/admin/bookings' },
    { label: 'Calendário', icon: CalendarIcon, path: '/admin/calendar' },
    { label: 'Clientes', icon: Users, path: '/admin/customers' },
    { label: 'Serviços', icon: Briefcase, path: '/admin/services' },
    { label: 'Configurações', icon: SettingsIcon, path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen flex bg-bg-main text-text-primary transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-surface border-r border-border-main flex flex-col hidden md:flex">
        <div className="p-6 border-b border-border-main flex items-center justify-between">
           <Link to="/admin" className="flex items-center space-x-2 cursor-pointer">
             <div className="w-8 h-8 rounded bg-gradient-to-tr from-gold to-gold-light flex items-center justify-center text-black font-bold">
               AA
             </div>
             <span className="font-bold text-lg text-text-primary">Admin Panel</span>
           </Link>
           
           <button 
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-bg-card border border-border-main text-text-primary hover:border-gold transition-all"
              title="Trocar tema"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
        </div>

        <div className="p-4 border-b border-border-main">
          <button 
            onClick={() => setIsQuickBookingOpen(true)}
            className="w-full bg-gradient-to-r from-neon-blue to-neon-blue-dark text-black font-extrabold py-3 px-4 rounded-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Novo Agendamento</span>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
           {navItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
               <Link 
                 key={item.path} 
                 to={item.path}
                 className={cn(
                   "flex items-center px-4 py-3 rounded-lg font-medium transition-colors",
                   isActive 
                     ? "bg-gold/10 text-gold" 
                     : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                 )}
               >
                 <item.icon className="w-5 h-5 mr-3" />
                 {item.label}
               </Link>
             )
           })}
        </nav>

        <div className="p-4 space-y-2 border-t border-border-main">
          <Link 
            to={`/client/${localStorage.getItem('aesthetic_id')}`}
            target="_blank"
            className="w-full flex items-center px-4 py-3 text-text-secondary hover:text-gold rounded-lg hover:bg-gold/5 transition-colors"
          >
            <ExternalLink className="w-5 h-5 mr-3" /> Ver Loja
          </Link>
          <button 
            onClick={handleShare}
            className="w-full flex items-center px-4 py-3 text-text-secondary hover:text-gold rounded-lg hover:bg-gold/5 transition-colors text-left"
          >
            <Share2 className="w-5 h-5 mr-3" /> Compartilhar Loja
          </button>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center px-4 py-3 text-text-secondary hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors border-t border-border-main mt-2 pt-4"
          >
            <LogOut className="w-5 h-5 mr-3" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-bg-surface border-b border-border-main p-4 flex items-center justify-between">
           <div className="flex items-center space-x-2">
             <button
               onClick={() => setIsMobileMenuOpen(true)}
               className="p-2 -ml-2 rounded-lg text-text-primary hover:bg-bg-card transition-colors"
               aria-label="Abrir menu"
             >
               <Menu className="w-6 h-6" />
             </button>
             <div className="w-8 h-8 rounded bg-gradient-to-tr from-gold to-gold-light flex items-center justify-center text-black font-bold">
               AA
             </div>
             <span className="font-bold text-text-primary">Admin</span>
           </div>

           <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-bg-card border border-border-main text-text-primary hover:border-gold transition-all"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
        </header>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-bg-surface border-r border-border-main text-text-primary h-full shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="p-4 border-b border-border-main flex items-center justify-between">
                 <Link to="/admin" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                   <div className="w-8 h-8 rounded bg-gradient-to-tr from-gold to-gold-light flex items-center justify-center text-black font-bold">
                     AA
                   </div>
                   <span className="font-bold text-lg">Admin Panel</span>
                 </Link>
                 <button
                   onClick={() => setIsMobileMenuOpen(false)}
                   className="p-2 -mr-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors"
                 >
                   <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="p-4 border-b border-border-main">
                <button 
                  onClick={() => { setIsQuickBookingOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full bg-gradient-to-r from-neon-blue to-neon-blue-dark text-black font-extrabold py-3 px-4 rounded-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Novo Agendamento</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <nav className="p-4 space-y-2">
                   {navItems.map((item) => {
                     const isActive = location.pathname === item.path;
                     return (
                       <Link 
                         key={item.path} 
                         to={item.path}
                         onClick={() => setIsMobileMenuOpen(false)}
                         className={cn(
                           "flex items-center px-4 py-3 rounded-lg font-medium transition-colors",
                           isActive 
                             ? "bg-gold/10 text-gold" 
                             : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                         )}
                       >
                         <item.icon className="w-5 h-5 mr-3" />
                         {item.label}
                       </Link>
                     )
                   })}
                </nav>
              </div>

              <div className="p-4 space-y-2 border-t border-border-main">
                <Link 
                  to={`/client/${localStorage.getItem('aesthetic_id')}`}
                  target="_blank"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center px-4 py-3 text-text-secondary hover:text-gold rounded-lg hover:bg-gold/5 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 mr-3" /> Ver Loja
                </Link>
                <button 
                  onClick={() => { handleShare(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center px-4 py-3 text-text-secondary hover:text-gold rounded-lg hover:bg-gold/5 transition-colors text-left"
                >
                  <Share2 className="w-5 h-5 mr-3" /> Compartilhar Loja
                </button>
                <button 
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center px-4 py-3 text-text-secondary hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors border-t border-border-main mt-2 pt-4"
                >
                  <LogOut className="w-5 h-5 mr-3" /> Sair
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Quick Booking Modal available everywhere in Admin */}
      <QuickBookingModal 
        isOpen={isQuickBookingOpen}
        onClose={() => setIsQuickBookingOpen(false)}
      />
    </div>
  );
}
