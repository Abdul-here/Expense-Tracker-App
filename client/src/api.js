import { supabase } from './supabase';

async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || '';
}

export const fetchTransactions = async () => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export const fetchSummary = async () => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  const totalIncome = data
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = data
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
};

export const addTransaction = async (data) => {
  const userId = await getUserId();
  const { data: inserted, error } = await supabase
    .from('transactions')
    .insert({ ...data, user_id: userId })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return inserted;
};

export const updateTransaction = async (id, data) => {
  const userId = await getUserId();
  const { data: updated, error } = await supabase
    .from('transactions')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return updated;
};

export const deleteTransaction = async (id) => {
  const userId = await getUserId();
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return { message: 'Transaction deleted successfully' };
};
