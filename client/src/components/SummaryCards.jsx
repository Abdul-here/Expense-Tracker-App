import { formatMoneyDisplay } from '../utils/formatAmount';

function SummaryCards({ summary, categoryBreakdown, loading }) {
  const { totalIncome, totalExpense, balance } = summary;

  const isNegBalance = balance < 0;

  const cards = [
    {
      id: 'income',
      label: 'Total Income',
      value: formatMoneyDisplay(totalIncome),
      icon: 'fa-solid fa-arrow-trend-up',
      colorClass: 'card-income',
    },
    {
      id: 'expense',
      label: 'Total Expenses',
      value: formatMoneyDisplay(totalExpense),
      icon: 'fa-solid fa-arrow-trend-down',
      colorClass: 'card-expense',
    },
    {
      id: 'balance',
      label: 'Net Balance',
      value: (isNegBalance ? '-' : '') + formatMoneyDisplay(Math.abs(balance)),
      icon: isNegBalance ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-scale-balanced',
      colorClass: isNegBalance ? 'card-balance-neg' : 'card-balance-pos',
    },
  ];

  return (
    <>
      <div className="summary-grid">
        {cards.map((card) => (
          <div key={card.id} className={`summary-card ${card.colorClass}`}>
            <div className="card-icon-wrap">
              <i className={card.icon}></i>
            </div>
            <div className="card-body">
              <p className="card-label">{card.label}</p>
              {loading
                ? <div className="skeleton-value" />
                : <p className="card-value">{card.value}</p>
              }
            </div>
          </div>
        ))}
      </div>

      <div className="category-breakdown-card">
        <div className="section-header">
          <i className="fa-solid fa-chart-pie"></i>
          <h2 className="section-title">Category Breakdown</h2>
        </div>
        <div className="category-breakdown-list">
          {categoryBreakdown.map((item) => (
            <div key={item.category} className="category-row">
              <span className="category-name">{item.category}</span>
              <span className="category-total">{formatMoneyDisplay(item.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default SummaryCards;
