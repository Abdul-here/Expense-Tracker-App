import { useState, useEffect, useRef } from 'react';
import { formatAmountForInput } from '../utils/formatAmount';
import { fetchCategories, addCategory } from '../api';

const DEFAULT_INCOME_CATEGORIES   = ['Salary', 'Freelance', 'Investment', 'Other'];
const DEFAULT_EXPENSE_CATEGORIES  = ['Food', 'Rent', 'Transport', 'Bills', 'Shopping', 'Other'];

const today = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

function TransactionForm({ onSave, editingTransaction, onCancelEdit }) {
  const [type, setType]           = useState('expense');
  const [amount, setAmount]       = useState('');
  const [category, setCategory]   = useState('');
  const [date, setDate]           = useState(today());
  const [note, setNote]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(false);

  // Custom categories state
  const [customCategories, setCustomCategories] = useState([]);  // all from Supabase
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [savingCat, setSavingCat]   = useState(false);
  const [catError, setCatError]     = useState('');
  const addCatInputRef = useRef(null);

  // Load custom categories once on mount
  useEffect(() => {
    fetchCategories()
      .then(setCustomCategories)
      .catch(() => {}); // silently ignore if table doesn't exist yet
  }, []);

  // Focus the new-category input when it appears
  useEffect(() => {
    if (showAddCat && addCatInputRef.current) {
      addCatInputRef.current.focus();
    }
  }, [showAddCat]);

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

  // Merged category list for the current type
  const defaultCategories = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  const userCategories = customCategories
    .filter(c => c.type === type)
    .map(c => c.name);
  // Deduplicate: put defaults first, then user's custom ones not already in defaults
  const categories = [
    ...defaultCategories,
    ...userCategories.filter(n => !defaultCategories.includes(n)),
  ];

  const switchType = (newType) => {
    if (newType === type) return;
    setType(newType);
    resetFormFields();
    setShowAddCat(false);
    setNewCatName('');
    setCatError('');
  };

  // Save a brand-new custom category
  const handleSaveNewCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) { setCatError('Name cannot be empty.'); return; }
    if (categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCatError('Category already exists.');
      return;
    }
    setSavingCat(true);
    setCatError('');
    try {
      const saved = await addCategory({ name: trimmed, type });
      setCustomCategories(prev => [...prev, saved]);
      setCategory(saved.name);   // auto-select the new category
      setNewCatName('');
      setShowAddCat(false);
    } catch {
      setCatError('Failed to save. Please try again.');
    } finally {
      setSavingCat(false);
    }
  };

  const handleNewCatKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSaveNewCategory(); }
    if (e.key === 'Escape') { setShowAddCat(false); setNewCatName(''); setCatError(''); }
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
      alert(editingTransaction
        ? 'Error updating transaction. Is the server running on port 5000?'
        : 'Error adding transaction. Is the server running on port 5000?');
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

          <div className="category-row-wrap">
            <div className="select-wrap category-select-wrap">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select a category...</option>
                <optgroup label="Default">
                  {defaultCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
                {userCategories.filter(n => !defaultCategories.includes(n)).length > 0 && (
                  <optgroup label="Custom">
                    {userCategories
                      .filter(n => !defaultCategories.includes(n))
                      .map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* + button to open the inline new-category input */}
            <button
              type="button"
              id="add-category-btn"
              className={`add-cat-btn ${showAddCat ? 'add-cat-btn--active' : ''}`}
              title="Add a custom category"
              onClick={() => {
                setShowAddCat(v => !v);
                setCatError('');
                setNewCatName('');
              }}
              aria-expanded={showAddCat}
            >
              <i className={`fa-solid ${showAddCat ? 'fa-xmark' : 'fa-plus'}`}></i>
            </button>
          </div>

          {/* Inline new-category input */}
          {showAddCat && (
            <div className="new-cat-inline" role="group" aria-label="Add custom category">
              <input
                ref={addCatInputRef}
                id="new-category-input"
                type="text"
                className="new-cat-input"
                placeholder={`New ${type} category…`}
                value={newCatName}
                maxLength={40}
                onChange={e => { setNewCatName(e.target.value); setCatError(''); }}
                onKeyDown={handleNewCatKeyDown}
              />
              <button
                type="button"
                id="save-new-category"
                className="new-cat-save-btn"
                disabled={savingCat || !newCatName.trim()}
                onClick={handleSaveNewCategory}
              >
                {savingCat
                  ? <i className="fa-solid fa-spinner fa-spin"></i>
                  : <><i className="fa-solid fa-check"></i> Save</>
                }
              </button>
            </div>
          )}
          {catError && <p className="cat-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {catError}</p>}
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
