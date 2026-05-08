const express = require('express');
const cors = require('cors');
const transactionsRouter = require('./routes/transactions');

const app = express();
const PORT = 5000;

app.use(cors({
  origin: [
    'https://expense-tracker-app-psi-ten.vercel.app',
    'https://expense-tracker-app-production-ad40.up.railway.app',
    'http://localhost:5173',
  ],
}));
app.use(express.json());

// Routes
app.use('/api/transactions', transactionsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Expense Tracker API is running' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📦 Database: SQLite (expense_tracker.db)\n`);
});
