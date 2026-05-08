const express = require('express');
const router = express.Router();
const supabase = require('../db/database');

// ─────────────────────────────────────────────
// GET /api/transactions/summary
// Returns: total income, total expenses, balance
// ─────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const { data: all, error } = await supabase
      .from('transactions')
      .select('type, amount');

    if (error) {
      throw error;
    }

    const totalIncome = all
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = all
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

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
router.get('/', async (req, res) => {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/transactions
// Body: { type, amount, category, date, note }
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { type, amount, category, date, note } = req.body;

  if (!type || !amount || !category || !date) {
    return res.status(400).json({ error: 'type, amount, category, and date are required' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be "income" or "expense"' });
  }

  try {
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount)) {
      return res.status(400).json({ error: 'amount must be a valid number' });
    }

    const payload = {
      type,
      amount: parsedAmount,
      category,
      date,
      note: note || null,
    };

    const { data: inserted, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    const newTransaction = inserted;
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/transactions/:id
// Body: { type, amount, category, date, note }
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { type, amount, category, date, note } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Invalid transaction id' });
  }

  if (!type || amount === undefined || amount === null || !category || !date) {
    return res.status(400).json({ error: 'type, amount, category, and date are required' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be "income" or "expense"' });
  }

  try {
    const { data: exists, error: existsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (existsError) {
      throw existsError;
    }

    if (!exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount)) {
      return res.status(400).json({ error: 'amount must be a valid number' });
    }

    const updatedPayload = {
      type,
      amount: parsedAmount,
      category,
      date,
      note: note || null,
    };

    const { data: updated, error: updateError } = await supabase
      .from('transactions')
      .update(updatedPayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/transactions/:id
// ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const { data: exists, error: existsError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (existsError) {
      throw existsError;
    }

    if (!exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
