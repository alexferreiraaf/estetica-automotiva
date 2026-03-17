import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Mock authentication
    setTimeout(() => {
      if (email === 'admin@autocenter.com' && password === 'admin123') {
        // Save auth state (mock)
        localStorage.setItem('admin_auth', 'true');
        navigate('/admin');
      } else {
        setError('E-mail ou senha incorretos.');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 relative overflow-hidden">
      {/* Theme Toggle in Login */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-xl bg-bg-surface border border-border-main text-text-secondary hover:text-text-primary transition-all duration-300 shadow-lg"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-gold/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-gold/5 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md bg-bg-surface border border-border-main rounded-2xl shadow-2xl z-10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-gold to-gold-light flex items-center justify-center shadow-lg shadow-gold/20">
               <ShieldCheck className="w-8 h-8 text-black" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-text-primary text-center mb-2">Acesso Restrito</h2>
          <p className="text-text-secondary text-center mb-8">Área exclusiva para administração</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-secondary ml-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-bg-main border border-border-main rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all placeholder:text-text-muted/50"
                  placeholder="admin@autocenter.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-text-secondary ml-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-bg-main border border-border-main rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all placeholder:text-text-muted/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border-main bg-bg-card text-gold focus:ring-gold" />
                <span className="text-text-secondary">Lembrar-me</span>
              </label>
              <a href="#" className="text-gold hover:text-gold-light transition-colors">
                Esqueceu a senha?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-black font-bold rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-bg-main border-t border-border-main p-4 text-center">
          <p className="text-xs text-text-muted">
            Dica: use <strong className="text-text-secondary">admin@autocenter.com</strong> / <strong className="text-text-secondary">admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
