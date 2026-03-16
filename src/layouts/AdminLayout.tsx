import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar as CalendarIcon, ListTodo, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Agendamentos', icon: ListTodo, path: '/admin/bookings' },
    { label: 'Calendário', icon: CalendarIcon, path: '/admin/calendar' },
  ];

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#141414] border-r border-[#262626] flex flex-col hidden md:flex">
        <div className="p-6 border-b border-[#262626]">
           <Link to="/" className="flex items-center space-x-2 w-full text-left cursor-pointer">
             <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#d4af37] to-[#f1d570] flex items-center justify-center text-black font-bold">
               AA
             </div>
             <span className="font-bold text-lg text-white">Admin Panel</span>
           </Link>
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
                     ? "bg-[#d4af37]/10 text-[#d4af37]" 
                     : "text-gray-400 hover:text-white hover:bg-[#262626]"
                 )}
               >
                 <item.icon className="w-5 h-5 mr-3" />
                 {item.label}
               </Link>
             )
           })}
        </nav>

        <div className="p-4 border-t border-[#262626]">
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-gray-400 hover:text-white rounded-lg hover:bg-[#262626] transition-colors">
            <LogOut className="w-5 h-5 mr-3" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-[#141414] border-b border-[#262626] p-4 flex items-center justify-between">
           <div className="flex items-center space-x-2">
             <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#d4af37] to-[#f1d570] flex items-center justify-center text-black font-bold">
               AA
             </div>
             <span className="font-bold text-white">Admin</span>
           </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
