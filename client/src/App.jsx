import { useState, useEffect, useCallback, useMemo } from 'react';
import SummaryCards from './components/SummaryCards';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import { fetchTransactions, fetchSummary, addTransaction, updateTransaction, deleteTransaction } from './api';
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
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const filteredTransactions = useMemo(() => {
    let rangeStart = fromDate || '';
    let rangeEnd = toDate || '';
    if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
      [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
    }
    return transactions.filter((tx) => {
      if (!rangeStart && !rangeEnd) return true;
      const txDate = normalizeTransactionDate(tx.date);
      if (!txDate) return false;
      if (rangeStart && txDate < rangeStart) return false;
      if (rangeEnd && txDate > rangeEnd) return false;
      return true;
    });
  }, [transactions, fromDate, toDate]);

  const categoryBreakdown = useMemo(() => {
    const expenseCategories = ['Food', 'Rent', 'Transport', 'Bills', 'Shopping', 'Other'];
    const totals = Object.fromEntries(expenseCategories.map((category) => [category, 0]));

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'expense' && totals[tx.category] !== undefined) {
        totals[tx.category] += Number(tx.amount) || 0;
      }
    });

    return expenseCategories.map((category) => ({
      category,
      total: totals[category],
    }));
  }, [filteredTransactions]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [txns, sum] = await Promise.all([fetchTransactions(), fetchSummary()]);
      setTransactions(txns);
      setSummary(sum);
    } catch {
      setError('Cannot connect to server. Make sure the backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

  const handleDeleteRequest = (id) => {
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId == null) return;
    await deleteTransaction(deleteTargetId);
    setEditingTransaction((current) => (current?.id === deleteTargetId ? null : current));
    setDeleteTargetId(null);
    await loadData();
  };

  const handleDeleteCancel = () => {
    setDeleteTargetId(null);
  };

  const handleDeleteModalBackdrop = (e) => {
    if (e.target === e.currentTarget) {
      handleDeleteCancel();
    }
  };

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
        <SummaryCards summary={summary} categoryBreakdown={categoryBreakdown} loading={loading} />
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
