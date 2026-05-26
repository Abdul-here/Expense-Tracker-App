import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ACCENT   = [99, 102, 241];   // #6366f1
const ACCENT_L = [238, 242, 255];  // #eef2ff  (light accent for alt rows)
const WHITE    = [255, 255, 255];
const DARK     = [15, 23, 42];     // #0f172a
const MUTED    = [100, 116, 139];  // #64748b
const ROW_ALT  = [248, 250, 252];  // #f8fafc

function formatMoney(amount) {
  return Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function exportToPDF({
  transactions,
  categoryBreakdown,
  monthlySummary,
  selectedMonth,
  selectedYear,
  userName,
  userEmail,
}) {
  const isLandscape = window.innerWidth >= 768;
  const orientation = isLandscape ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 40;
  const marginR = 40;
  const contentW = pageW - marginL - marginR;
  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  // ── Helper: add footer on every page ────────────────────────────────────────
  const addFooters = () => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageW / 2,
        pageH - 18,
        { align: 'center' },
      );
      doc.text(
        `Generated on ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`,
        marginL,
        pageH - 18,
      );
      doc.text('ExpenseTracker', pageW - marginR, pageH - 18, { align: 'right' });
    }
  };

  // ── HEADER BLOCK ─────────────────────────────────────────────────────────────
  let y = 40;

  // Background banner
  doc.setFillColor(...ACCENT);
  doc.roundedRect(marginL, y, contentW, 72, 6, 6, 'F');

  // App title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text('ExpenseTracker', marginL + 18, y + 26);

  // Subtitle: month/year
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report for ${monthLabel}`, marginL + 18, y + 44);

  // User info — right side
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(userName || 'User', pageW - marginR - 18, y + 26, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(userEmail || '', pageW - marginR - 18, y + 42, { align: 'right' });

  y += 90;

  // ── SUMMARY TABLE ────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text('Monthly Summary', marginL, y);
  y += 10;

  const balance = monthlySummary.balance;
  const balanceColor = balance >= 0 ? [5, 150, 105] : [225, 29, 72];

  autoTable(doc, {
    startY: y,
    margin: { left: marginL, right: marginR },
    tableWidth: contentW,
    head: [['Metric', 'Amount']],
    body: [
      ['Total Income',    `+ ${formatMoney(monthlySummary.totalIncome)}`],
      ['Total Expenses',  `− ${formatMoney(monthlySummary.totalExpense)}`],
      ['Net Balance',     `${balance >= 0 ? '+' : '−'} ${formatMoney(Math.abs(balance))}`],
    ],
    headStyles: {
      fillColor: ACCENT,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 8,
    },
    bodyStyles: { fontSize: 10, cellPadding: 7, textColor: DARK },
    columnStyles: {
      0: { cellWidth: contentW * 0.55, fontStyle: 'bold' },
      1: { cellWidth: contentW * 0.45, halign: 'right' },
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    didParseCell(data) {
      if (data.row.index === 2 && data.column.index === 1) {
        data.cell.styles.textColor = balanceColor;
        data.cell.styles.fontStyle = 'bold';
      }
    },
    theme: 'grid',
  });

  y = doc.lastAutoTable.finalY + 24;

  // ── CATEGORY BREAKDOWN ───────────────────────────────────────────────────────
  const activeCats = (categoryBreakdown || []).filter(c => c.total > 0);

  if (activeCats.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text('Expense by Category', marginL, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      margin: { left: marginL, right: marginR },
      tableWidth: contentW,
      head: [['Category', 'Amount']],
      body: activeCats.map(c => [c.category, formatMoney(c.total)]),
      headStyles: {
        fillColor: ACCENT,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 8,
      },
      bodyStyles: { fontSize: 10, cellPadding: 7, textColor: DARK },
      columnStyles: {
        0: { cellWidth: contentW * 0.55, fontStyle: 'bold' },
        1: { cellWidth: contentW * 0.45, halign: 'right', textColor: [225, 29, 72] },
      },
      alternateRowStyles: { fillColor: ROW_ALT },
      theme: 'grid',
    });

    y = doc.lastAutoTable.finalY + 24;
  }

  // ── TRANSACTIONS TABLE ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text('All Transactions', marginL, y);
  y += 10;

  const sorted = [...(transactions || [])].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  const txRows = sorted.map(tx => [
    formatDate(tx.date),
    tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
    tx.category,
    `${tx.type === 'income' ? '+' : '−'} ${formatMoney(tx.amount)}`,
    tx.note || '—',
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: marginL, right: marginR },
    tableWidth: contentW,
    head: [['Date', 'Type', 'Category', 'Amount', 'Note']],
    body: txRows.length > 0 ? txRows : [['—', '—', '—', '—', 'No transactions']],
    headStyles: {
      fillColor: ACCENT,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 8,
    },
    bodyStyles: { fontSize: 9, cellPadding: 6, textColor: DARK },
    columnStyles: {
      0: { cellWidth: contentW * 0.14 },
      1: { cellWidth: contentW * 0.11 },
      2: { cellWidth: contentW * 0.16 },
      3: { cellWidth: contentW * 0.16, halign: 'right' },
      4: { cellWidth: contentW * 0.43 },
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 3 && data.row.index >= 0) {
        const row = sorted[data.row.index];
        if (row) {
          data.cell.styles.textColor =
            row.type === 'income' ? [5, 150, 105] : [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    theme: 'grid',
  });

  // ── FOOTERS (added last so page count is accurate) ───────────────────────────
  addFooters();

  // ── SAVE ─────────────────────────────────────────────────────────────────────
  doc.save(`ExpenseTracker_${monthLabel.replace(' ', '_')}.pdf`);
}
