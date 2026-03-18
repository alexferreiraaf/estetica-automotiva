import { supabase } from '../lib/supabase';

export interface Aesthetic {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  user_id?: string;
  status: 'active' | 'blocked';
  createdAt: string;
}

export const getAesthetics = async (): Promise<Aesthetic[]> => {
  const { data, error } = await supabase
    .from('aesthetics')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching aesthetics:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    name: item.name,
    owner: item.owner,
    email: item.email,
    phone: item.phone,
    user_id: item.user_id,
    status: item.status,
    createdAt: item.created_at
  }));
};

export const saveAesthetic = async (aesthetic: Omit<Aesthetic, 'id' | 'createdAt' | 'status'>, password?: string) => {
  const { data, error } = await supabase
    .from('aesthetics')
    .insert([
      {
        name: aesthetic.name,
        owner: aesthetic.owner,
        email: aesthetic.email,
        phone: aesthetic.phone,
        user_id: aesthetic.user_id,
        status: 'active'
      }
    ])
    .select();

  if (error) {
    console.error('Error saving aesthetic:', error);
    throw error;
  }

  return data[0];
};

export const updateAesthetic = async (id: string, aesthetic: Partial<Omit<Aesthetic, 'id' | 'createdAt'>>) => {
  const { error } = await supabase
    .from('aesthetics')
    .update(aesthetic)
    .eq('id', id);

  if (error) {
    console.error('Error updating aesthetic:', error);
    throw error;
  }
};

export const toggleAestheticStatus = async (id: string, currentStatus: 'active' | 'blocked') => {
  const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
  
  const { error } = await supabase
    .from('aesthetics')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    console.error('Error toggling status:', error);
    throw error;
  }

  return newStatus;
};

export const deleteAesthetic = async (id: string) => {
  const { error } = await supabase
    .from('aesthetics')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting aesthetic:', error);
    throw error;
  }
};
