// Font Awesome icon class for each category
import { formatMoneyDisplay } from '../utils/formatAmount';

const CATEGORY_ICONS = {
  Food:       'fa-solid fa-utensils',
  Rent:       'fa-solid fa-house',
  Transport:  'fa-solid fa-car',
  Bills:      'fa-solid fa-bolt',
  Shopping:   'fa-solid fa-bag-shopping',
  Salary:     'fa-solid fa-briefcase',
  Freelance:  'fa-solid fa-laptop-code',
  Investment: 'fa-solid fa-chart-line',
  Other:      'fa-solid fa-ellipsis',
};

function TransactionList({
  transactions,
  totalStoredCount,
  onDelete,
  onEdit,
  loading,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}) {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="list-card">
        <div className="list-header">
          <div className="section-header" style={{ margin: 0 }}>
            <i className="fa-solid fa-list-ul" style={{ color: 'var(--accent)', fontSize: '1rem' }}></i>
            <h2 className="section-title">Transactions</h2>
          </div>
        </div>
        <div className="skeleton-list">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-item" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="list-card">
      <div className="list-header">
        <div className="list-header-main">
          <div className="section-header" style={{ margin: 0 }}>
            <i className="fa-solid fa-list-ul" style={{ color: 'var(--accent)', fontSize: '1rem' }}></i>
            <h2 className="section-title">Transactions</h2>
          </div>
          <div className="date-filters">
            <label htmlFor="from-date">From</label>
            <input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
            />
            <label htmlFor="to-date">To</label>
            <input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
            />
          </div>
        </div>
        <span className="list-count">
          <i className="fa-solid fa-layer-group" style={{ fontSize: '0.65rem' }}></i>
          &nbsp;{transactions.length} total
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fa-regular fa-folder-open"></i>
          </div>
          <p>
            {(fromDate || toDate) && totalStoredCount > 0
              ? 'No transactions in this date range'
              : 'No transactions yet'}
          </p>
          <p className="empty-sub">
            {(fromDate || toDate) && totalStoredCount > 0
              ? 'Try widening the from / to dates or clear the filters'
              : 'Add your first income or expense using the form'}
          </p>
        </div>
      ) : (
        <div className="transaction-list">
          {transactions.map((tx) => (
            <div key={tx.id} className={`transaction-item ${tx.type}`}>

              {/* Colored left bar */}
              <div className="tx-bar" />

              {/* Category icon */}
              <div className="tx-icon-wrap">
                <i className={CATEGORY_ICONS[tx.category] || 'fa-solid fa-circle-dot'}></i>
              </div>

              {/* Details */}
              <div className="tx-details">
                <div className="tx-top">
                  <span className="tx-category">{tx.category}</span>
                  <span className={`tx-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '−'}{formatMoneyDisplay(tx.amount)}
                  </span>
                </div>
                <div className="tx-bottom">
                  <span className="tx-date">
                    <i className="fa-regular fa-calendar"></i>
                    {formatDate(tx.date)}
                  </span>
                  {tx.note && (
                    <span className="tx-note">
                      <i className="fa-regular fa-note-sticky"></i>
                      {tx.note}
                    </span>
                  )}
                </div>
              </div>

              <div className="tx-actions">
                <button
                  type="button"
                  id={`edit-tx-${tx.id}`}
                  className="edit-btn"
                  onClick={() => onEdit(tx)}
                  title="Edit transaction"
                  aria-label="Edit transaction"
                >
                  <i className="fa-solid fa-pencil"></i>
                </button>
                <button
                  type="button"
                  id={`delete-tx-${tx.id}`}
                  className="delete-btn"
                  onClick={() => onDelete(tx.id)}
                  title="Delete transaction"
                  aria-label="Delete transaction"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TransactionList;
