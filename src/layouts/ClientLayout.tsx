import { Outlet, Link } from 'react-router-dom';
import { Car, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ClientLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-primary transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-bg-surface/90 backdrop-blur-md border-b border-border-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/client" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-blue to-neon-blue-dark flex items-center justify-center p-[2px]">
                <div className="w-full h-full bg-bg-surface rounded-full flex items-center justify-center">
                  <Car className="text-neon-blue w-5 h-5" />
                </div>
              </div>
              <span className="font-bold text-xl tracking-wide text-text-primary">Auto<span className="text-neon-blue">Aesthetics</span></span>
            </Link>

            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-bg-card border border-border-main text-text-primary hover:border-gold transition-all"
              title="Trocar tema"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-[#141414] border-t border-[#262626] py-6 text-center">
        <p className="text-sm text-gray-500">© 2026 Auto Aesthetics. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
