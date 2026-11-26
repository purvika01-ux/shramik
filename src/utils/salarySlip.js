import { formatINRPlain } from './currency'
import { formatDate, monthLabel, todayISO } from './dateUtils'

/**
 * Creates a one-page salary slip PDF for one labourer for one month.
 * `row` is that labourer's row from GET /api/reports/monthly
 * (full, half, hourly, absent, extraHours, hoursWorked, wages, advances, payments, opening, closing).
 * Text is in English because the built-in PDF fonts cannot draw Hindi/Punjabi letters.
 * Returns the file name.
 */
export async function downloadSalarySlip({ labour, row, month, contractorName, hoursPerDay }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const green = [22, 163, 74]

  // ---- Header ----
  doc.setFillColor(...green)
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setTextColor(255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('ShramikKhata', 14, 13)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Digital Labour Register', 14, 20)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('SALARY SLIP', pageWidth - 14, 13, { align: 'right' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(monthLabel(month), pageWidth - 14, 20, { align: 'right' })

  // ---- Labourer details ----
  const details = [
    ['Labourer Name', labour.name, 'Labour ID', labour.id],
    ['Mobile', labour.mobile || '-', 'Daily Wage', formatINRPlain(labour.dailyWage)],
    ['Contractor', contractorName, 'Slip Date', formatDate(todayISO())],
  ]
  autoTable(doc, {
    startY: 36,
    body: details,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.8, textColor: [30, 41, 59] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 }, 2: { fontStyle: 'bold', cellWidth: 30 } },
  })

  // ---- Attendance ----
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Attendance', 'Count']],
    body: [
      ['Full Days', row.full],
      ['Half Days', row.half],
      ['Worked by Hours (days / total hours)', `${row.hourly} / ${row.hoursWorked} hrs`],
      ['Extra Hours', `${row.extraHours} hrs`],
      ['Absent', row.absent],
      ['Total Days Worked', row.daysWorked],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: { 1: { halign: 'right', cellWidth: 50 } },
  })

  // ---- Payment summary ----
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    head: [['Payment Summary', 'Amount']],
    body: [
      ['Previous Balance (before this month)', formatINRPlain(row.opening)],
      ['(+) Wages Earned this Month', formatINRPlain(row.wages)],
      ['(-) Advances Taken', formatINRPlain(row.advances)],
      ['(-) Payments Received', formatINRPlain(row.payments)],
    ],
    foot: [[
      row.closing >= 0 ? 'Balance Due to Labourer' : 'Excess Paid (to be adjusted)',
      { content: formatINRPlain(Math.abs(row.closing)), styles: { halign: 'right' } },
    ]],
    styles: { fontSize: 10 },
    headStyles: { fillColor: green },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 11 },
    columnStyles: { 1: { halign: 'right', cellWidth: 50 } },
  })

  // ---- Notes and signatures ----
  let y = doc.lastAutoTable.finalY + 8
  doc.setFontSize(8.5)
  doc.setTextColor(100)
  doc.text(
    `Full day = daily wage. Half day = 50% of daily wage. Hourly rate = daily wage / ${hoursPerDay} hours (extra hours are paid at this rate).`,
    14,
    y,
  )
  doc.text('Balance Due = Previous Balance + Wages - Advances - Payments', 14, y + 5)

  y += 32
  doc.setDrawColor(150)
  doc.line(14, y, 74, y)
  doc.line(pageWidth - 74, y, pageWidth - 14, y)
  doc.setFontSize(9)
  doc.setTextColor(60)
  doc.text('Contractor Signature', 14, y + 5)
  doc.text('Labourer Signature / Thumb', pageWidth - 74, y + 5)

  doc.setFontSize(8)
  doc.setTextColor(140)
  doc.text('This is a computer-generated salary slip from ShramikKhata.', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })

  const file = `Salary-Slip-${labour.id}-${month}.pdf`
  doc.save(file)
  return file
}
