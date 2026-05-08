const BASE_URL = 'https://expense-tracker-app-production-ad40.up.railway.app/api';

export const fetchTransactions = async () => {
  const res = await fetch(`${BASE_URL}/transactions`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export const fetchSummary = async () => {
  const res = await fetch(`${BASE_URL}/transactions/summary`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export const addTransaction = async (data) => {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add');
  return res.json();
};

export const updateTransaction = async (id, data) => {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update');
  return res.json();
};

export const deleteTransaction = async (id) => {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
};
