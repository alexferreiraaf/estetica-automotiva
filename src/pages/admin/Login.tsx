import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#d4af37]/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#d4af37]/5 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl z-10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#d4af37] to-[#f1d570] flex items-center justify-center shadow-lg shadow-[#d4af37]/20">
               <ShieldCheck className="w-8 h-8 text-black" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white text-center mb-2">Acesso Restrito</h2>
          <p className="text-gray-400 text-center mb-8">Área exclusiva para administração</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-all placeholder:text-gray-600"
                  placeholder="admin@autocenter.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-[#262626] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] transition-all placeholder:text-gray-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-600 bg-gray-700 text-[#d4af37] focus:ring-[#d4af37]" />
                <span className="text-gray-400">Lembrar-me</span>
              </label>
              <a href="#" className="text-[#d4af37] hover:text-[#f1d570] transition-colors">
                Esqueceu a senha?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#d4af37] to-[#f1d570] hover:from-[#c5a030] hover:to-[#eecf60] text-black font-bold rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
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
        
        <div className="bg-[#0a0a0a] border-t border-[#262626] p-4 text-center">
          <p className="text-xs text-gray-500">
            Dica: use <strong className="text-gray-300">admin@autocenter.com</strong> / <strong className="text-gray-300">admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
