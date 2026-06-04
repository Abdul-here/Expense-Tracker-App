import { useState, useEffect, useRef, useCallback } from 'react';
import { formatAmountForInput } from '../utils/formatAmount';
import { fetchCategories, addCategory, deleteCategory } from '../api';

const DEFAULT_INCOME_CATEGORIES  = ['Salary', 'Freelance', 'Investment', 'Other'];
const DEFAULT_EXPENSE_CATEGORIES = ['Food', 'Rent', 'Transport', 'Bills', 'Shopping', 'Other'];

const today = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

// ─────────────────────────────────────────────
// Custom category dropdown component
// ─────────────────────────────────────────────
function CategorySelect({ value, onChange, defaultCategories, customCategoryObjects, onDeleteCustom }) {
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const customNames = customCategoryObjects.map(c => c.name);
  const displayLabel = value || 'Select a category...';
  const isPlaceholder = !value;

  const handleSelect = (cat) => {
    onChange(cat);
    setOpen(false);
  };

  const handleDelete = async (e, catObj) => {
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(catObj.id);
    try {
      await onDeleteCustom(catObj);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="cat-select" ref={wrapperRef}>
      {/* Trigger – looks like a native <select> */}
      <button
        type="button"
        id="category"
        className={`cat-select-trigger ${open ? 'cat-select-trigger--open' : ''} ${isPlaceholder ? 'cat-select-trigger--placeholder' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="cat-select-trigger-label">{displayLabel}</span>
        <i className="fa-solid fa-chevron-down cat-select-chevron"></i>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="cat-select-dropdown" role="listbox" aria-label="Category options">

          {/* Placeholder row */}
          <div
            className={`cat-select-option cat-select-option--placeholder ${!value ? 'cat-select-option--selected' : ''}`}
            role="option"
            aria-selected={!value}
            onClick={() => handleSelect('')}
          >
            <span className="cat-select-option-name">Select a category…</span>
          </div>

          {/* Default group */}
          <div className="cat-select-group-label">Default</div>
          {defaultCategories.map(cat => (
            <div
              key={cat}
              className={`cat-select-option ${value === cat ? 'cat-select-option--selected' : ''}`}
              role="option"
              aria-selected={value === cat}
              onClick={() => handleSelect(cat)}
            >
              <span className="cat-select-option-name">{cat}</span>
            </div>
          ))}

          {/* Custom group */}
          {customCategoryObjects.length > 0 && (
            <>
              <div className="cat-select-group-label">Custom</div>
              {customCategoryObjects.map(catObj => (
                <div
                  key={catObj.id}
                  className={`cat-select-option cat-select-option--custom ${value === catObj.name ? 'cat-select-option--selected' : ''}`}
                  role="option"
                  aria-selected={value === catObj.name}
                  onClick={() => handleSelect(catObj.name)}
                >
                  <span className="cat-select-option-name">{catObj.name}</span>
                  <button
                    type="button"
                    className="cat-select-delete-btn"
                    title={`Delete "${catObj.name}"`}
                    aria-label={`Delete category ${catObj.name}`}
                    disabled={deletingId === catObj.id}
                    onClick={(e) => handleDelete(e, catObj)}
                  >
                    {deletingId === catObj.id
                      ? <i className="fa-solid fa-spinner fa-spin"></i>
                      : <i className="fa-solid fa-trash"></i>
                    }
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main form
// ─────────────────────────────────────────────
function TransactionForm({ onSave, editingTransaction, onCancelEdit }) {
  const [type, setType]             = useState('expense');
  const [amount, setAmount]         = useState('');
  const [category, setCategory]     = useState('');
  const [date, setDate]             = useState(today());
  const [note, setNote]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);

  // Custom categories state
  const [customCategories, setCustomCategories] = useState([]); // full objects from Supabase
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [savingCat, setSavingCat]   = useState(false);
  const [catError, setCatError]     = useState('');
  const addCatInputRef = useRef(null);

  // Load custom categories on mount
  useEffect(() => {
    fetchCategories()
      .then(setCustomCategories)
      .catch(() => {});
  }, []);

  // Focus new-category input when panel opens
  useEffect(() => {
    if (showAddCat && addCatInputRef.current) addCatInputRef.current.focus();
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

  // Derived lists for current type
  const defaultCategories = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  // Custom objects filtered by type, excluding any that clash with defaults
  const customForType = customCategories.filter(
    c => c.type === type && !defaultCategories.includes(c.name)
  );

  const switchType = (newType) => {
    if (newType === type) return;
    setType(newType);
    resetFormFields();
    setShowAddCat(false);
    setNewCatName('');
    setCatError('');
  };

  // All names for duplicate check
  const allCategoryNames = [
    ...defaultCategories,
    ...customForType.map(c => c.name),
  ];

  // ── Add new category ──
  const handleSaveNewCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) { setCatError('Name cannot be empty.'); return; }
    if (allCategoryNames.map(n => n.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCatError('Category already exists.');
      return;
    }
    setSavingCat(true);
    setCatError('');
    try {
      const saved = await addCategory({ name: trimmed, type });
      setCustomCategories(prev => [...prev, saved]);
      setCategory(saved.name);
      setNewCatName('');
      setShowAddCat(false);
    } catch {
      setCatError('Failed to save. Please try again.');
    } finally {
      setSavingCat(false);
    }
  };

  const handleNewCatKeyDown = (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); handleSaveNewCategory(); }
    if (e.key === 'Escape') { setShowAddCat(false); setNewCatName(''); setCatError(''); }
  };

  // ── Delete custom category ──
  const handleDeleteCustom = useCallback(async (catObj) => {
    await deleteCategory(catObj.id);
    setCustomCategories(prev => prev.filter(c => c.id !== catObj.id));
    // If the deleted category was selected, clear the selection
    setCategory(prev => prev === catObj.name ? '' : prev);
  }, []);

  // ── Submit transaction ──
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
      if (!editingTransaction) resetFormFields();
    } catch {
      alert(editingTransaction
        ? 'Error updating transaction.'
        : 'Error adding transaction.');
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
          <button type="button" id="cancel-edit" className="cancel-edit-btn" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>

      {/* Income / Expense Toggle */}
      <div className="type-toggle">
        <button
          id="type-income" type="button"
          className={`toggle-btn ${type === 'income' ? 'toggle-income active' : ''}`}
          onClick={() => switchType('income')}
        >
          <i className="fa-solid fa-arrow-up"></i>Income
        </button>
        <button
          id="type-expense" type="button"
          className={`toggle-btn ${type === 'expense' ? 'toggle-expense active' : ''}`}
          onClick={() => switchType('expense')}
        >
          <i className="fa-solid fa-arrow-down"></i>Expense
        </button>
      </div>

      <form onSubmit={handleSubmit} className="transaction-form">

        {/* Amount */}
        <div className="form-group">
          <label className="form-label" htmlFor="amount">
            <i className="fa-solid fa-hashtag"></i>Amount
          </label>
          <input
            id="amount" type="number" min="0.01" step="0.01" placeholder="0"
            value={amount} onChange={(e) => setAmount(e.target.value)} required
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label" htmlFor="category">
            <i className="fa-solid fa-tag"></i>Category
          </label>

          <div className="category-row-wrap">
            {/* Custom dropdown replaces native <select> */}
            <div className="category-select-wrap">
              <CategorySelect
                value={category}
                onChange={setCategory}
                defaultCategories={defaultCategories}
                customCategoryObjects={customForType}
                onDeleteCustom={handleDeleteCustom}
              />
            </div>

            {/* + button */}
            <button
              type="button" id="add-category-btn"
              className={`add-cat-btn ${showAddCat ? 'add-cat-btn--active' : ''}`}
              title="Add a custom category"
              aria-expanded={showAddCat}
              onClick={() => { setShowAddCat(v => !v); setCatError(''); setNewCatName(''); }}
            >
              <i className={`fa-solid ${showAddCat ? 'fa-xmark' : 'fa-plus'}`}></i>
            </button>
          </div>

          {/* Inline new-category input */}
          {showAddCat && (
            <div className="new-cat-inline" role="group" aria-label="Add custom category">
              <input
                ref={addCatInputRef}
                id="new-category-input" type="text" className="new-cat-input"
                placeholder={`New ${type} category…`}
                value={newCatName} maxLength={40}
                onChange={e => { setNewCatName(e.target.value); setCatError(''); }}
                onKeyDown={handleNewCatKeyDown}
              />
              <button
                type="button" id="save-new-category" className="new-cat-save-btn"
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
          {catError && (
            <p className="cat-error-msg">
              <i className="fa-solid fa-circle-exclamation"></i> {catError}
            </p>
          )}
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label" htmlFor="date">
            <i className="fa-regular fa-calendar"></i>Date
          </label>
          <input
            id="date" type="date"
            value={date} onChange={(e) => setDate(e.target.value)} required
          />
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="form-label" htmlFor="note">
            <i className="fa-regular fa-note-sticky"></i>
            Note <span className="optional">(optional)</span>
          </label>
          <textarea
            id="note" placeholder="e.g. Monthly rent payment..."
            value={note} onChange={(e) => setNote(e.target.value)} rows={2}
          />
        </div>

        <button
          id="submit-transaction" type="submit" disabled={submitting}
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
