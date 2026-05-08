const RAILWAY_API_URL = 'https://expense-tracker-app-production-ad40.up.railway.app/api';
const LOCAL_API_URL = 'http://localhost:5000/api';

const BASE_URL = import.meta.env.PROD ? RAILWAY_API_URL : LOCAL_API_URL;

export const fetchTransactions = async () => {
  const res = await fetch(`${BASE_URL}/transactions`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
};

export const fetchSummary = async () => {
  const res = await fetch(`${BASE_URL}/transactions/summary`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
};

export const addTransaction = async (data) => {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add transaction');
  return res.json();
};

export const updateTransaction = async (id, data) => {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update transaction');
  return res.json();
};

export const deleteTransaction = async (id) => {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete transaction');
  return res.json();
};
