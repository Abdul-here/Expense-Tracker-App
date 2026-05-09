import { useState, useEffect } from 'react';
import { formatAmountForInput } from '../utils/formatAmount';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Rent', 'Transport', 'Bills', 'Shopping', 'Other'];

const today = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

function TransactionForm({ onSave, editingTransaction, onCancelEdit }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetFormFields = () => {
    setAmount('');
    setCategory('');
    setDate(today());
    setNote('');
  };

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(formatAmountForInput(editingTransaction.amount));
      setCategory(editingTransaction.category ?? '');
      setDate(editingTransaction.date ?? today());
      setNote(editingTransaction.note ?? '');
    } else {
      setType('expense');
      setAmount('');
      setCategory('');
      setDate(today());
      setNote('');
    }
  }, [editingTransaction]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const switchType = (newType) => {
    if (newType === type) return;
    setType(newType);
    resetFormFields();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category || !date) return;
    setSubmitting(true);
    try {
      await onSave({
        id: editingTransaction?.id ?? undefined,
        type,
        amount: parseFloat(amount),
        category,
        date,
        note: note.trim() || null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2200);
      if (!editingTransaction) {
        resetFormFields();
      }
    } catch {
      alert(editingTransaction ? 'Error updating transaction. Is the server running on port 5000?' : 'Error adding transaction. Is the server running on port 5000?');
    } finally {
      setSubmitting(false);
    }
  };

  const isEditing = Boolean(editingTransaction);

  return (
    <div className="form-card">
      <div className="section-header form-card-title-row">
        <div className="form-card-title-inner">
          <i className={isEditing ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-plus-circle'}></i>
          <h2 className="section-title">{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h2>
        </div>
        {isEditing && (
          <button
            type="button"
            id="cancel-edit"
            className="cancel-edit-btn"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Income / Expense Toggle */}
      <div className="type-toggle">
        <button
          id="type-income"
          type="button"
          className={`toggle-btn ${type === 'income' ? 'toggle-income active' : ''}`}
          onClick={() => switchType('income')}
        >
          <i className="fa-solid fa-arrow-up"></i>
          Income
        </button>
        <button
          id="type-expense"
          type="button"
          className={`toggle-btn ${type === 'expense' ? 'toggle-expense active' : ''}`}
          onClick={() => switchType('expense')}
        >
          <i className="fa-solid fa-arrow-down"></i>
          Expense
        </button>
      </div>

      <form onSubmit={handleSubmit} className="transaction-form">

        {/* Amount */}
        <div className="form-group">
          <label className="form-label" htmlFor="amount">
            <i className="fa-solid fa-hashtag"></i>
            Amount
          </label>
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label" htmlFor="category">
            <i className="fa-solid fa-tag"></i>
            Category
          </label>
          <div className="select-wrap">
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label" htmlFor="date">
            <i className="fa-regular fa-calendar"></i>
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="form-label" htmlFor="note">
            <i className="fa-regular fa-note-sticky"></i>
            Note <span className="optional">(optional)</span>
          </label>
          <textarea
            id="note"
            placeholder="e.g. Monthly rent payment..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </div>

        <button
          id="submit-transaction"
          type="submit"
          disabled={submitting}
          className={`submit-btn ${type === 'income' ? 'submit-income' : 'submit-expense'} ${success ? 'success' : ''}`}
        >
          {submitting ? (
            <><i className="fa-solid fa-spinner fa-spin"></i>{isEditing ? 'Saving…' : 'Adding...'}</>
          ) : success ? (
            <><i className="fa-solid fa-check"></i>{isEditing ? 'Saved!' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}</>
          ) : (
            <><i className={`fa-solid ${type === 'income' ? 'fa-plus' : 'fa-minus'}`}></i>
              {isEditing ? 'Save changes' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
            </>
          )}
        </button>
        {!isEditing && success && (
          <p className="add-success-message">Transaction added successfully</p>
        )}
      </form>
    </div>
  );
}

export default TransactionForm;
