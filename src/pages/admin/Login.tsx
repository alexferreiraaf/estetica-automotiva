import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Sun, Moon, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { updateLastLogin } from '../../data/aesthetics';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Auth with Supabase Authentication (Now handles everyone)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        // Se falhou o login, verificamos se o usuário já existe na tabela de estéticas
        // Se existir, permitimos que ele "ative" a conta (auto-signUp)
        const { data: aestheticExists } = await supabase
          .from('aesthetics')
          .select('id')
          .eq('email', email)
          .single();

        if (aestheticExists) {
          setShowActivation(true);
          setError('Sua conta ainda não foi ativada ou a senha está incorreta.');
        } else {
          setError('E-mail ou senha incorretos.');
        }
        setIsLoading(false);
        return;
      }

      const user = authData.user;

      // 2. Check Role
      if (user?.email === 'super@plataforma.com') {
        localStorage.setItem('superadmin_auth', 'true');
        navigate('/superadmin');
        return;
      }

      // 3. Fetch Aesthetics (Handle multiple)
      const { data: aesthetics, error: dbError } = await supabase
        .from('aesthetics')
        .select('*')
        .eq('user_id', user?.id);
      
      const aesthetic = aesthetics && aesthetics.length > 0 ? aesthetics[0] : null;

      if (dbError || !aesthetic) {
        // Fallback or Auto-Heal
        const { data: legacyAesthetic } = await supabase
          .from('aesthetics')
          .select('*')
          .eq('email', email)
          .single();
        
        let aestheticData = legacyAesthetic;

        if (!legacyAesthetic) {
          const { data: newAesthetic, error: createError } = await supabase
            .from('aesthetics')
            .insert([{
              name: 'Minha Estética',
              owner: email.split('@')[0],
              email: email,
              user_id: user.id,
              status: 'active'
            }])
            .select()
            .single();

          if (createError) {
            console.error('Erro ao auto-criar perfil:', createError);
            setError('Perfil da estética não encontrado e erro ao gerar acesso automático.');
            setIsLoading(false);
            return;
          }
          aestheticData = newAesthetic;
        } else if (!legacyAesthetic.user_id) {
          // Vincular user_id se estiver faltando
          await supabase
            .from('aesthetics')
            .update({ user_id: user.id })
            .eq('id', legacyAesthetic.id);
        }

        if (aestheticData.status === 'blocked') {
          setError('Este acesso foi bloqueado pelo administrador.');
          setIsLoading(false);
          return;
        }

        localStorage.setItem('admin_auth', 'true');
        sessionStorage.setItem('aesthetic_id', aestheticData.id);
        sessionStorage.setItem('aesthetic_name', aestheticData.name);
        await updateLastLogin(aestheticData.id);
        navigate('/admin');
        return;
      }

      if (aesthetic.status === 'blocked') {
        setError('Sua conta está bloqueada pelo administrador.');
        return;
      }

      localStorage.setItem('admin_auth', 'true');
      sessionStorage.setItem('aesthetic_id', aesthetic.id);
      sessionStorage.setItem('aesthetic_name', aesthetic.name);
      await updateLastLogin(aesthetic.id);
      navigate('/admin');
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) {
        if (signUpError.status === 429) {
          throw new Error('Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar ativar novamente.');
        }
        throw signUpError;
      }

      // Tenta logar imediatamente após o signUp
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      
      // O restante do processo de login será tratado pelo useEffect ou pela continuação do handleLogin
      // Para simplificar, vamos apenas recarregar a página ou chamar o handleLogin novamente
      window.location.reload();

    } catch (err: any) {
      setError(err.message || 'Erro ao ativar conta.');
    } finally {
      setIsLoading(false);
    }
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
              <div className={`p-3 rounded-lg flex items-center gap-2 mb-6 ${showActivation ? 'bg-blue-500/10 border border-blue-500/50 text-blue-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'}`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex flex-col">
                  <p className="text-sm">{error}</p>
                  {showActivation && (
                    <button
                      type="button"
                      onClick={handleActivate}
                      disabled={isLoading}
                      className="text-xs font-bold underline mt-1 text-left hover:text-blue-300 transition-colors"
                    >
                      {isLoading ? 'Ativando...' : 'Clique aqui para ativar sua conta agora'}
                    </button>
                  )}
                </div>
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
                  placeholder="Seu e-mail"
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
        
        <div className="bg-bg-main border-tl border-tr border-border-main p-4 text-center">
          <p className="text-[10px] text-text-muted leading-relaxed uppercase font-bold tracking-widest">
            Acesso Restrito • Sistema de Gestão
          </p>
        </div>
      </div>
    </div>
  );
}
