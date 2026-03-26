import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Users, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { updateLastLogin, setOffline } from '../data/aesthetics';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function SuperAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const aestheticId = localStorage.getItem('aesthetic_id');
    if (!aestheticId) return;

    const runUpdate = async () => {
      const result = await updateLastLogin(aestheticId);
      if (result?.error) {
        console.warn('Falha no heartbeat do status online (SuperAdmin).', result.error);
      }
    };

    // Update immediately on mount
    runUpdate();

    // Set up heartbeat every 4 minutes
    const interval = setInterval(runUpdate, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    const aestheticId = localStorage.getItem('aesthetic_id');
    if (aestheticId) {
      await setOffline(aestheticId);
    }
    localStorage.removeItem('superadmin_auth');
    localStorage.removeItem('aesthetic_id');
    localStorage.removeItem('aesthetic_name');
    await import('../lib/supabase').then(({ supabase }) => supabase.auth.signOut());
    navigate('/login');
  };

  const navItems = [
    { label: 'Painel Geral', icon: LayoutDashboard, path: '/superadmin' },
    { label: 'Minhas Estéticas', icon: Users, path: '/superadmin/aesthetics' },
  ];

  return (
    <div className="min-h-screen flex bg-bg-main text-text-primary transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-surface border-r border-border-main flex flex-col hidden md:flex">
        <div className="p-6 border-b border-border-main flex items-center justify-between">
           <Link to="/superadmin" className="flex items-center space-x-2 cursor-pointer">
             <div className="w-8 h-8 rounded bg-gradient-to-tr from-gold to-gold-light flex items-center justify-center text-black font-bold text-xs">
               SUPER
             </div>
             <span className="font-bold text-lg text-text-primary">Plataforma</span>
           </Link>
           
           <button 
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-bg-card border border-border-main text-text-primary hover:border-gold transition-all"
              title="Trocar tema"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
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
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center px-4 py-3 text-text-secondary hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
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
             <div className="w-8 h-8 rounded bg-gradient-to-tr from-gold to-gold-light flex items-center justify-center text-black font-bold text-xs">
               SA
             </div>
             <span className="font-bold text-text-primary">Super Admin</span>
           </div>

           <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-bg-card border border-border-main text-text-primary hover:border-gold transition-all"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
