import { useState, useEffect, useCallback, useMemo } from 'react';
import SummaryCards from './components/SummaryCards';
import SpendingCharts from './components/SpendingCharts';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import { fetchTransactions, addTransaction, updateTransaction, deleteTransaction } from './api';
import { supabase } from './supabase';
import './App.css';

function normalizeTransactionDate(dateVal) {
  if (dateVal == null || dateVal === '') return '';
  const s = String(dateVal).trim();
  const isoDay = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDay) return isoDay[1];
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return '';
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ── Data ──
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = normalizeTransactionDate(tx.date);
      if (!txDate) return false;
      const [txYear, txMonth] = txDate.split('-').map(Number);
      if (txYear !== selectedYear || txMonth !== selectedMonth) return false;
      let rangeStart = fromDate || '';
      let rangeEnd = toDate || '';
      if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
        [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
      }
      if (rangeStart && txDate < rangeStart) return false;
      if (rangeEnd && txDate > rangeEnd) return false;
      return true;
    });
  }, [transactions, selectedYear, selectedMonth, fromDate, toDate]);

  const categoryBreakdown = useMemo(() => {
    const expenseCategories = ['Food', 'Rent', 'Transport', 'Bills', 'Shopping', 'Other'];
    const totals = Object.fromEntries(expenseCategories.map((category) => [category, 0]));
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'expense' && totals[tx.category] !== undefined) {
        totals[tx.category] += Number(tx.amount) || 0;
      }
    });
    return expenseCategories.map((category) => ({ category, total: totals[category] }));
  }, [filteredTransactions]);

  const monthlySummary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [filteredTransactions]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const txns = await fetchTransactions();
      setTransactions(txns);
    } catch {
      setError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleSaveTransaction = async (payload) => {
    const { id, type, amount, category, date, note } = payload;
    const body = { type, amount, category, date, note: note || null };
    if (id != null) {
      await updateTransaction(id, body);
    } else {
      await addTransaction(body);
    }
    setEditingTransaction(null);
    await loadData();
  };

  const handleDeleteRequest = (id) => setDeleteTargetId(id);

  const handleDeleteConfirm = async () => {
    if (deleteTargetId == null) return;
    await deleteTransaction(deleteTargetId);
    setEditingTransaction((current) => (current?.id === deleteTargetId ? null : current));
    setDeleteTargetId(null);
    await loadData();
  };

  const handleDeleteCancel = () => setDeleteTargetId(null);

  const handleDeleteModalBackdrop = (e) => {
    if (e.target === e.currentTarget) handleDeleteCancel();
  };

  // ── Auth loading screen ──
  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-box">
          <div className="auth-loading-icon">
            <i className="fa-solid fa-wallet"></i>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // ── Login screen ──
  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-box">
          <div className="login-logo">
            <div className="login-logo-icon">
            <i className="fa-solid fa-wallet"></i>
          </div>
            <h1 className="login-title">ExpenseTracker</h1>
            <p className="login-sub">Personal Finance Manager</p>
          </div>
          <div className="login-divider" />
          <p className="login-desc">
            Sign in to manage your income and expenses securely. Your data is private and tied to your account.
          </p>
          <button onClick={handleGoogleLogin} className="google-btn">
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // ── Main app ──
  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon-box">
              <i className="fa-solid fa-wallet"></i>
            </div>
            <div className="logo-text">
              <span className="logo-title">ExpenseTracker</span>
              <span className="logo-sub">Personal Finance Manager</span>
            </div>
          </div>
          <div className="header-user">
            <button className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              <i className={darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
            </button>
            <div className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)}>
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="user-avatar"
                />
              )}
              <span className="user-name">{user.user_metadata?.full_name || user.email}</span>
              <i className="fa-solid fa-chevron-down" style={{color: 'white', fontSize: '12px'}}></i>
            </div>
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-menu-info">
                  <strong>{user.user_metadata?.full_name}</strong>
                  <span>{user.email}</span>
                </div>
                <div className="user-menu-divider"/>
                <button onClick={handleLogout} className="user-menu-logout">
                  <i className="fa-solid fa-right-from-bracket"></i>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="app-main">
        {error && (
          <div className="error-banner">
            <i className="fa-solid fa-triangle-exclamation"></i>
            {error}
          </div>
        )}
        <div className="month-selector">
          <div className="month-selector-inner">
            <i className="fa-solid fa-calendar"></i>
            <select
              value={selectedYear}
              onChange={e => { setSelectedYear(Number(e.target.value)); setFromDate(''); setToDate(''); }}
              className="month-select"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={e => { setSelectedMonth(Number(e.target.value)); setFromDate(''); setToDate(''); }}
              className="month-select"
            >
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <SummaryCards summary={monthlySummary} categoryBreakdown={categoryBreakdown} loading={loading} />
        <SpendingCharts categoryBreakdown={categoryBreakdown} monthlySummary={monthlySummary} />
        <div className="content-grid">
          <TransactionForm
            onSave={handleSaveTransaction}
            editingTransaction={editingTransaction}
            onCancelEdit={() => setEditingTransaction(null)}
          />
          <TransactionList
            transactions={filteredTransactions}
            totalStoredCount={transactions.length}
            onDelete={handleDeleteRequest}
            onEdit={setEditingTransaction}
            loading={loading}
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
          />
        </div>
      </main>

      {/* ── Delete modal ── */}
      {deleteTargetId != null && (
        <div className="modal-backdrop" onClick={handleDeleteModalBackdrop}>
          <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <div className="confirm-modal-icon">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 id="delete-modal-title">Delete Transaction</h3>
            <p>Are you sure you want to delete this transaction?</p>
            <div className="confirm-modal-actions">
              <button type="button" className="modal-btn modal-btn-cancel" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button type="button" className="modal-btn modal-btn-delete" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;