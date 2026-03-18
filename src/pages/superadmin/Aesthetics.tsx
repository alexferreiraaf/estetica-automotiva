import { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Shield, ShieldOff, X, Save, Building2, Edit2 } from 'lucide-react';
import { getAesthetics, saveAesthetic, updateAesthetic, toggleAestheticStatus, deleteAesthetic } from '../../data/aesthetics';
import type { Aesthetic } from '../../data/aesthetics';
import { supabase } from '../../lib/supabase';

export function Aesthetics() {
  const [aesthetics, setAesthetics] = useState<Aesthetic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    email: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAesthetics();
      setAesthetics(data);
    } catch (error) {
      console.error('Error loading aesthetics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'blocked') => {
    try {
      await toggleAestheticStatus(id, currentStatus);
      await loadData();
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta estética? Isso removerá o acesso dela à plataforma.')) {
      try {
        await deleteAesthetic(id);
        await loadData();
      } catch (error) {
        alert('Erro ao excluir estética.');
      }
    }
  };

  const handleEdit = (aesthetic: Aesthetic) => {
    setEditingId(aesthetic.id);
    setFormData({
      name: aesthetic.name,
      owner: aesthetic.owner,
      email: aesthetic.email,
      phone: aesthetic.phone,
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
        await updateAesthetic(editingId, {
          name: formData.name,
          owner: formData.owner,
          email: formData.email,
          phone: formData.phone
        });
      } else {
        // 1. Criar usuário no Auth do Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        });

        if (authError && authError.status !== 400) throw authError;

        // 2. Salvar metadados vinculando o user_id
        await saveAesthetic({
          name: formData.name,
          owner: formData.owner,
          email: formData.email,
          phone: formData.phone,
          user_id: authData.user?.id
        }, formData.password);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', owner: '', email: '', phone: '', password: '' });
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('security purposes')) {
        alert('Erro: Por segurança, o Supabase exige um intervalo de alguns segundos entre cadastros. Tente novamente em 20 segundos.');
      } else {
        alert(`Erro ao salvar: ${msg || 'Verifique se a tabela existe no Supabase.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 15);
    }
    return value.substring(0, 15);
  };

  const filteredAesthetics = aesthetics.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary">Minhas Estéticas</h1>
          <p className="text-text-secondary mt-1">Gerencie as empresas que utilizam sua plataforma</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-gold to-gold-light text-black font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Estética
        </button>
      </div>

      {/* Search */}
      <div className="bg-bg-surface border border-border-main rounded-xl p-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input 
            type="text" 
            placeholder="Buscar por nome, proprietário ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-main border border-border-main rounded-lg py-3 pl-10 pr-4 text-text-primary focus:outline-none focus:border-gold transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-main border-b border-border-main">
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Estética</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Proprietário</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Contato / Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                    Carregando estéticas...
                  </td>
                </tr>
              ) : filteredAesthetics.length > 0 ? (
                filteredAesthetics.map((aesthetic) => (
                  <tr key={aesthetic.id} className="hover:bg-bg-card transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mr-3">
                          <Building2 className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <p className="text-text-primary font-bold">{aesthetic.name}</p>
                          <p className="text-text-muted text-xs">Desde {new Date(aesthetic.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-text-secondary">
                        <User className="w-4 h-4 mr-2 text-text-muted" />
                        {aesthetic.owner}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-text-primary flex items-center">
                          <Phone className="w-3 h-3 mr-2 text-text-muted" />
                          {aesthetic.phone}
                        </p>
                        {aesthetic.status === 'blocked' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 w-fit">
                            <ShieldOff className="w-3 h-3 mr-1" /> Bloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 w-fit">
                            <Shield className="w-3 h-3 mr-1" /> Ativo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEdit(aesthetic)}
                          className="p-2 text-text-muted hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(aesthetic.id, aesthetic.status)}
                          className={`p-2 rounded-lg transition-colors ${
                            aesthetic.status === 'active'
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-green-400 hover:bg-green-500/10'
                          }`}
                          title={aesthetic.status === 'active' ? 'Bloquear Acesso' : 'Liberar Acesso'}
                        >
                          {aesthetic.status === 'active' ? <ShieldOff className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(aesthetic.id)}
                          className="p-2 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                    Nenhuma estética encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-bg-surface border border-border-main rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-border-main flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary flex items-center">
                {editingId ? <Edit2 className="w-5 h-5 mr-2 text-gold" /> : <Plus className="w-5 h-5 mr-2 text-gold" />}
                {editingId ? 'Editar Estética' : 'Cadastrar Nova Estética'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setFormData({ name: '', owner: '', email: '', phone: '', password: '' });
                }}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome da Estética</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                  placeholder="Ex: Brilho Car Estética"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome do Proprietário</label>
                <input 
                  required
                  type="text" 
                  value={formData.owner}
                  onChange={e => setFormData({...formData, owner: e.target.value})}
                  className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                  placeholder="Ex: Carlos Silva"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">E-mail (Usuário)</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    disabled={!!editingId}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors disabled:opacity-50"
                    placeholder="ex: contato@aesthetic.com"
                  />
                </div>
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Senha de Acesso</label>
                    <input 
                      required
                      type="password" 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Telefone</label>
                <input 
                  required
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})}
                  className="w-full bg-bg-main border border-border-main rounded-lg p-3 text-text-primary focus:outline-none focus:border-gold transition-colors"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-transparent border border-border-main text-text-primary font-bold py-3 rounded-xl hover:bg-bg-card transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-gold to-gold-light text-black font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 flex items-center justify-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Estética
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
