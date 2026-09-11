import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {formatDisplayDate} from '@shared/dates';
import {formatDurationHuman, formatMeters} from '@shared/geofence';
import {premisesSummaryLine, type PremisesReport} from '@shared/premisesReport';
import {
  reportFilename,
  type EmployeeMonthRow,
  type MonthlyAttendanceReport,
} from './monthlyReport';

const BRAND = {
  ink: [11, 58, 66] as [number, number, number],
  teal: [42, 157, 143] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function summaryHeaders() {
  return [
    'Employee ID',
    'Name',
    'Department',
    'Working days',
    'Present',
    'Absent',
    'Rejected',
    'Attendance %',
  ];
}

function summaryCells(row: EmployeeMonthRow) {
  return [
    row.employeeId,
    row.fullName,
    row.department,
    row.workingDays,
    row.presentDays,
    row.absentDays,
    row.rejectedDays,
    `${row.attendanceRate}%`,
  ];
}

export function exportMonthlyPdf(
  report: MonthlyAttendanceReport,
  exits?: PremisesReport,
) {
  const doc = new jsPDF({orientation: 'portrait', unit: 'mm', format: 'a4'});
  const margin = 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.ink);
  doc.text('CheckIn360 monthly attendance', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.teal);
  doc.text(report.monthLabel, margin, 26);

  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Scope: ${report.subjectName}`, margin, 32);
  doc.text(
    `Weekdays counted through the report date · Generated ${new Date(report.generatedAt).toLocaleString()}`,
    margin,
    37,
  );

  autoTable(doc, {
    startY: 42,
    head: [summaryHeaders()],
    body: report.rows.map(summaryCells),
    styles: {fontSize: 8, cellPadding: 2.2},
    headStyles: {fillColor: BRAND.ink, textColor: 255, fontStyle: 'bold'},
    alternateRowStyles: {fillColor: [239, 249, 248]},
    margin: {left: margin, right: margin},
  });

  if (report.scope === 'individual' && report.rows[0]) {
    const employee = report.rows[0];
    const previous = doc as jsPDF & {lastAutoTable?: {finalY: number}};
    autoTable(doc, {
      startY: (previous.lastAutoTable?.finalY ?? 42) + 8,
      head: [['Date', 'Day', 'Status']],
      body: employee.days.map(day => [
        formatDisplayDate(day.date),
        day.weekday,
        day.status,
      ]),
      styles: {fontSize: 8, cellPadding: 2},
      headStyles: {fillColor: BRAND.teal, textColor: 255, fontStyle: 'bold'},
      margin: {left: margin, right: margin},
      didParseCell(data) {
        if (data.section !== 'body' || data.column.index !== 2) {
          return;
        }
        const status = String(data.cell.raw);
        if (status === 'Present') {
          data.cell.styles.textColor = [22, 101, 52];
        } else if (status === 'Absent') {
          data.cell.styles.textColor = [185, 28, 28];
        } else if (status === 'Rejected') {
          data.cell.styles.textColor = [180, 83, 9];
        }
      },
    });
  }

  if (exits && exits.rows.length > 0) {
    const previous = doc as jsPDF & {lastAutoTable?: {finalY: number}};
    autoTable(doc, {
      startY: (previous.lastAutoTable?.finalY ?? 42) + 10,
      head: [[
        'Employee',
        'Date',
        'Check-in',
        'Exit',
        'Return',
        'Time outside',
        'Distance',
        'Reason',
      ]],
      body: exits.rows.map(row => [
        row.fullName,
        formatDisplayDate(row.date),
        row.checkInTime ?? '—',
        row.exitClock,
        row.open ? 'Still out' : row.returnClock ?? '—',
        formatDurationHuman(row.durationOutside),
        formatMeters(row.distanceFromCentre),
        row.reason,
      ]),
      styles: {fontSize: 7.5, cellPadding: 2},
      headStyles: {fillColor: BRAND.ink, textColor: 255, fontStyle: 'bold'},
      margin: {left: margin, right: margin},
    });
    const after = doc as jsPDF & {lastAutoTable?: {finalY: number}};
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(premisesSummaryLine(exits), margin, (after.lastAutoTable?.finalY ?? 42) + 6);
  }

  doc.save(reportFilename(report, 'pdf'));
}

export function exportMonthlyExcel(
  report: MonthlyAttendanceReport,
  exits?: PremisesReport,
) {
  const workbook = XLSX.utils.book_new();
  const summary = XLSX.utils.aoa_to_sheet([
    ['CheckIn360 monthly attendance'],
    [report.monthLabel],
    [`Scope: ${report.subjectName}`],
    [`Generated: ${new Date(report.generatedAt).toLocaleString()}`],
    [],
    summaryHeaders(),
    ...report.rows.map(summaryCells),
  ]);
  summary['!cols'] = [
    {wch: 14},
    {wch: 22},
    {wch: 18},
    {wch: 14},
    {wch: 10},
    {wch: 10},
    {wch: 10},
    {wch: 14},
  ];
  XLSX.utils.book_append_sheet(workbook, summary, 'Summary');

  if (report.scope === 'individual' && report.rows[0]) {
    const daily = XLSX.utils.aoa_to_sheet([
      ['Date', 'Day', 'Status'],
      ...report.rows[0].days.map(day => [
        formatDisplayDate(day.date),
        day.weekday,
        day.status,
      ]),
    ]);
    daily['!cols'] = [{wch: 22}, {wch: 10}, {wch: 12}];
    XLSX.utils.book_append_sheet(workbook, daily, 'Daily');
  } else {
    const header = ['Employee ID', 'Name', 'Department', ...report.workingDates.map(date => date.slice(8))];
    const body = report.rows.map(row => {
      const byDate = new Map(row.days.map(day => [day.date, day.status[0]]));
      return [
        row.employeeId,
        row.fullName,
        row.department,
        ...report.workingDates.map(date => byDate.get(date) ?? '—'),
      ];
    });
    const matrix = XLSX.utils.aoa_to_sheet([
      ['Daily status: P = Present, A = Absent, R = Rejected. Weekend days are omitted.'],
      header,
      ...body,
    ]);
    matrix['!cols'] = [
      {wch: 14},
      {wch: 22},
      {wch: 16},
      ...report.workingDates.map(() => ({wch: 4})),
    ];
    XLSX.utils.book_append_sheet(workbook, matrix, 'Daily');
  }

  if (exits && exits.rows.length > 0) {
    const premises = XLSX.utils.aoa_to_sheet([
      ['Premises exits'],
      [premisesSummaryLine(exits)],
      [],
      ['Employee', 'Date', 'Check-in', 'Exit', 'Return', 'Time outside', 'Distance from centre', 'Distance from boundary', 'Reason'],
      ...exits.rows.map(row => [
        row.fullName,
        formatDisplayDate(row.date),
        row.checkInTime ?? '—',
        row.exitClock,
        row.open ? 'Still out' : row.returnClock ?? '—',
        formatDurationHuman(row.durationOutside),
        formatMeters(row.distanceFromCentre),
        formatMeters(row.distanceFromBoundary),
        row.reason,
      ]),
    ]);
    premises['!cols'] = [
      {wch: 22},
      {wch: 16},
      {wch: 12},
      {wch: 12},
      {wch: 12},
      {wch: 14},
      {wch: 18},
      {wch: 20},
      {wch: 22},
    ];
    XLSX.utils.book_append_sheet(workbook, premises, 'Premises exits');
  }

  const bytes = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
  downloadBlob(
    new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    reportFilename(report, 'xlsx'),
  );
}
