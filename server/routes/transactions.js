const express = require('express');
const router = express.Router();
const db = require('../db/database');

// ─────────────────────────────────────────────
// GET /api/transactions/summary
// Returns: total income, total expenses, balance
// ─────────────────────────────────────────────
router.get('/summary', (req, res) => {
  try {
    const all = db.get('transactions').value();

    const totalIncome = all
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = all
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    res.json({ totalIncome, totalExpense, balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/transactions
// Returns: all transactions, newest first
// ─────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const transactions = db
      .get('transactions')
      .orderBy(['date', 'created_at'], ['desc', 'desc'])
      .value();

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/transactions
// Body: { type, amount, category, date, note }
// ─────────────────────────────────────────────
router.post('/', (req, res) => {
  const { type, amount, category, date, note } = req.body;

  if (!type || !amount || !category || !date) {
    return res.status(400).json({ error: 'type, amount, category, and date are required' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be "income" or "expense"' });
  }

  try {
    const newTransaction = {
      id: Date.now(), // unique timestamp-based ID
      type,
      amount: parseFloat(amount),
      category,
      date,
      note: note || null,
      created_at: new Date().toISOString()
    };

    db.get('transactions').push(newTransaction).write();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/transactions/:id
// Body: { type, amount, category, date, note }
// ─────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { type, amount, category, date, note } = req.body;

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid transaction id' });
  }

  if (!type || amount === undefined || amount === null || !category || !date) {
    return res.status(400).json({ error: 'type, amount, category, and date are required' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be "income" or "expense"' });
  }

  try {
    const exists = db.get('transactions').find({ id }).value();

    if (!exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount)) {
      return res.status(400).json({ error: 'amount must be a valid number' });
    }

    const updated = {
      ...exists,
      type,
      amount: parsedAmount,
      category,
      date,
      note: note || null,
    };

    db.get('transactions').find({ id }).assign(updated).write();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/transactions/:id
// ─────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const exists = db.get('transactions').find({ id }).value();

    if (!exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    db.get('transactions').remove({ id }).write();
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
