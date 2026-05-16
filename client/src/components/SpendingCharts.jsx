import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={500}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function SpendingCharts({ categoryBreakdown, monthlySummary }) {
  const pieData = categoryBreakdown
    .filter(item => item.total > 0)
    .map(item => ({ name: item.category, value: item.total }));

  const barData = [
    { name: 'Income', amount: monthlySummary.totalIncome, fill: '#4ECDC4' },
    { name: 'Expenses', amount: monthlySummary.totalExpense, fill: '#FF6B6B' },
    { name: 'Balance', amount: monthlySummary.balance, fill: monthlySummary.balance >= 0 ? '#45B7D1' : '#FF6B6B' },
  ];

  const hasData = pieData.length > 0;

  return (
    <div className="charts-container">
      <div className="chart-card">
        <h3 className="chart-title">
          <i className="fa-solid fa-chart-pie"></i>
          Spending by Category
        </h3>
        {hasData ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={110}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            <i className="fa-solid fa-chart-pie"></i>
            <p>No expense data for this month</p>
          </div>
        )}
      </div>

      <div className="chart-card">
        <h3 className="chart-title">
          <i className="fa-solid fa-chart-bar"></i>
          Income vs Expenses
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toLocaleString()} />
            <Tooltip formatter={(value) => value.toLocaleString()} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {barData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
