import * as XLSX from 'xlsx';
import { InternetRecord, InternetStats } from '../types/internet';

export const exportInternetDataToExcel = async (records: InternetRecord[], stats: InternetStats) => {
  // Prepare main data for Excel export
  const excelData = records.map((record, index) => ({
    'No.': index + 1,
    'Date': new Date(record.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    'Start Balance (₦)': record.startBalance.toFixed(2),
    'End Balance (₦)': record.endBalance.toFixed(2),
    'Usage (₦)': record.usage.toFixed(2),
    'Work Hours': record.workHours,
    'Usage per Hour (₦)': (record.usage / record.workHours).toFixed(2),
    'Notes': record.notes || '',
    'Created': new Date(record.createdAt).toLocaleDateString(),
    'Last Updated': new Date(record.updatedAt).toLocaleDateString()
  }));

  // Create workbook and main worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 5 },   // No.
    { wch: 20 },  // Date
    { wch: 15 },  // Start Balance
    { wch: 15 },  // End Balance
    { wch: 12 },  // Usage
    { wch: 12 },  // Work Hours
    { wch: 15 },  // Usage per Hour
    { wch: 30 },  // Notes
    { wch: 12 },  // Created
    { wch: 12 },  // Last Updated
  ];
  worksheet['!cols'] = columnWidths;

  // Style the header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  // Add conditional formatting for usage amounts
  const usageColIndex = 4; // Usage column (0-indexed)
  for (let row = 1; row <= excelData.length; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: usageColIndex });
    if (!worksheet[cellAddress]) continue;
    
    const usage = parseFloat(worksheet[cellAddress].v);
    let bgColor = "FEE2E2"; // Light red for high usage
    let textColor = "DC2626"; // Red text
    
    if (usage < 500) {
      bgColor = "D1FAE5"; // Light green for low usage
      textColor = "059669"; // Green text
    } else if (usage < 1000) {
      bgColor = "FEF3C7"; // Light yellow for medium usage
      textColor = "D97706"; // Yellow text
    }
    
    worksheet[cellAddress].s = {
      font: { color: { rgb: textColor }, bold: true },
      fill: { fgColor: { rgb: bgColor } },
      alignment: { horizontal: "right", vertical: "center" }
    };
  }

  // Add the main worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Internet Records');

  // Create summary sheet
  const summaryData = [
    { Metric: 'Total Records', Value: stats.totalRecords },
    { Metric: 'Total Usage (₦)', Value: stats.totalUsage.toFixed(2) },
    { Metric: 'Average Daily Usage (₦)', Value: stats.averageUsage.toFixed(2) },
    { Metric: 'Average Work Hours', Value: stats.averageWorkHours.toFixed(1) },
    { Metric: 'Current Month Usage (₦)', Value: stats.currentMonthUsage.toFixed(2) },
    { Metric: 'Last Week Usage (₦)', Value: stats.lastWeekUsage.toFixed(2) },
    { Metric: 'Export Date', Value: new Date().toLocaleDateString() },
    { Metric: 'Export Time', Value: new Date().toLocaleTimeString() },
  ];

  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  
  // Style summary sheet header
  ['A1', 'B1'].forEach(cell => {
    if (summaryWorksheet[cell]) {
      summaryWorksheet[cell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "059669" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
  });

  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

  // Create monthly breakdown sheet
  const monthlyData = records.reduce((acc, record) => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        Month: monthName,
        'Total Usage (₦)': 0,
        'Total Work Hours': 0,
        'Number of Days': 0,
        'Average Daily Usage (₦)': 0,
        'Usage per Hour (₦)': 0
      };
    }
    
    acc[monthKey]['Total Usage (₦)'] += record.usage;
    acc[monthKey]['Total Work Hours'] += record.workHours;
    acc[monthKey]['Number of Days'] += 1;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages for monthly data
  Object.values(monthlyData).forEach((month: any) => {
    month['Average Daily Usage (₦)'] = (month['Total Usage (₦)'] / month['Number of Days']).toFixed(2);
    month['Usage per Hour (₦)'] = (month['Total Usage (₦)'] / month['Total Work Hours']).toFixed(2);
    month['Total Usage (₦)'] = month['Total Usage (₦)'].toFixed(2);
  });

  const monthlyWorksheet = XLSX.utils.json_to_sheet(Object.values(monthlyData));
  monthlyWorksheet['!cols'] = [
    { wch: 20 }, // Month
    { wch: 15 }, // Total Usage
    { wch: 15 }, // Total Work Hours
    { wch: 15 }, // Number of Days
    { wch: 20 }, // Average Daily Usage
    { wch: 15 }, // Usage per Hour
  ];

  // Style monthly sheet header
  const monthlyHeaderRange = XLSX.utils.decode_range(monthlyWorksheet['!ref'] || 'A1');
  for (let col = monthlyHeaderRange.s.c; col <= monthlyHeaderRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!monthlyWorksheet[cellAddress]) continue;
    
    monthlyWorksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "7C3AED" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  XLSX.utils.book_append_sheet(workbook, monthlyWorksheet, 'Monthly Breakdown');

  // Generate filename with current date
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `internet-monitoring-${dateStr}-${timeStr}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, filename);
};