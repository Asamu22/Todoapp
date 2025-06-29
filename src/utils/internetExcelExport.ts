import * as XLSX from 'xlsx';
import { InternetRecord, InternetStats } from '../types/internet';

const formatDataUsage = (amount: number) => {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)} TB`;
  }
  return `${amount.toFixed(2)} GB`;
};

export const exportInternetDataToExcel = async (
  records: InternetRecord[], 
  stats: InternetStats, 
  filenameSuffix: string = ''
) => {
  // Prepare main data for Excel export
  const excelData = records.map((record, index) => ({
    'No.': index + 1,
    'Date': new Date(record.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    'Office': record.office,
    'Start Balance (GB)': record.startBalance.toFixed(2),
    'End Balance (GB)': record.endBalance.toFixed(2),
    'Data Used (GB)': record.usage.toFixed(2),
    'Work Hours': record.workHours,
    'Usage per Hour (GB)': (record.usage / record.workHours).toFixed(2),
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
    { wch: 15 },  // Office
    { wch: 15 },  // Start Balance
    { wch: 15 },  // End Balance
    { wch: 12 },  // Data Used
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

  // Add conditional formatting for data usage amounts
  const usageColIndex = 5; // Data Used column (0-indexed)
  for (let row = 1; row <= excelData.length; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: usageColIndex });
    if (!worksheet[cellAddress]) continue;
    
    const usage = parseFloat(worksheet[cellAddress].v);
    let bgColor = "FEE2E2"; // Light red for high usage
    let textColor = "DC2626"; // Red text
    
    if (usage < 5) {
      bgColor = "D1FAE5"; // Light green for low usage
      textColor = "059669"; // Green text
    } else if (usage < 15) {
      bgColor = "FEF3C7"; // Light yellow for medium usage
      textColor = "D97706"; // Yellow text
    }
    
    worksheet[cellAddress].s = {
      font: { color: { rgb: textColor }, bold: true },
      fill: { fgColor: { rgb: bgColor } },
      alignment: { horizontal: "right", vertical: "center" }
    };
  }

  // Add conditional formatting for office column
  const officeColIndex = 2; // Office column (0-indexed)
  const officeColors = [
    { bg: "DBEAFE", text: "1E40AF" }, // Blue
    { bg: "D1FAE5", text: "059669" }, // Green
    { bg: "FEF3C7", text: "D97706" }, // Yellow
    { bg: "FECACA", text: "DC2626" }, // Red
    { bg: "E9D5FF", text: "7C3AED" }, // Purple
    { bg: "FED7D7", text: "E53E3E" }, // Pink
  ];
  
  const uniqueOffices = Array.from(new Set(records.map(r => r.office)));
  for (let row = 1; row <= excelData.length; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: officeColIndex });
    if (!worksheet[cellAddress]) continue;
    
    const office = worksheet[cellAddress].v;
    const officeIndex = uniqueOffices.indexOf(office);
    const colorIndex = officeIndex % officeColors.length;
    const colors = officeColors[colorIndex];
    
    worksheet[cellAddress].s = {
      font: { color: { rgb: colors.text }, bold: true },
      fill: { fgColor: { rgb: colors.bg } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  // Add the main worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Internet Data Records');

  // Create summary sheet
  const summaryData = [
    { Metric: 'Total Records', Value: stats.totalRecords },
    { Metric: 'Total Data Used (GB)', Value: stats.totalUsage.toFixed(2) },
    { Metric: 'Average Daily Usage (GB)', Value: stats.averageUsage.toFixed(2) },
    { Metric: 'Average Work Hours', Value: stats.averageWorkHours.toFixed(1) },
    { Metric: 'Period Usage (GB)', Value: stats.totalUsage.toFixed(2) },
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

  // Create office breakdown sheet if we have multiple offices
  if (Object.keys(stats.officeBreakdown).length > 1) {
    const officeData = Object.entries(stats.officeBreakdown).map(([office, data]) => ({
      'Office': office,
      'Total Records': data.records,
      'Total Data Used (GB)': data.usage.toFixed(2),
      'Average per Record (GB)': (data.usage / data.records).toFixed(2),
      'Percentage of Total Usage': ((data.usage / stats.totalUsage) * 100).toFixed(1) + '%'
    }));

    const officeWorksheet = XLSX.utils.json_to_sheet(officeData);
    officeWorksheet['!cols'] = [
      { wch: 20 }, // Office
      { wch: 15 }, // Total Records
      { wch: 18 }, // Total Data Used
      { wch: 20 }, // Average per Record
      { wch: 22 }, // Percentage of Total
    ];

    // Style office sheet header
    const officeHeaderRange = XLSX.utils.decode_range(officeWorksheet['!ref'] || 'A1');
    for (let col = officeHeaderRange.s.c; col <= officeHeaderRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!officeWorksheet[cellAddress]) continue;
      
      officeWorksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "7C3AED" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Color code office names in the breakdown sheet
    for (let row = 1; row <= officeData.length; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 }); // Office column
      if (!officeWorksheet[cellAddress]) continue;
      
      const office = officeWorksheet[cellAddress].v;
      const officeIndex = uniqueOffices.indexOf(office);
      const colorIndex = officeIndex % officeColors.length;
      const colors = officeColors[colorIndex];
      
      officeWorksheet[cellAddress].s = {
        font: { color: { rgb: colors.text }, bold: true },
        fill: { fgColor: { rgb: colors.bg } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    XLSX.utils.book_append_sheet(workbook, officeWorksheet, 'Office Breakdown');
  }

  // Create monthly breakdown sheet if we have data from multiple periods
  const monthlyData = records.reduce((acc, record) => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        Month: monthName,
        'Total Data Used (GB)': 0,
        'Total Work Hours': 0,
        'Number of Days': 0,
        'Average Daily Usage (GB)': 0,
        'Usage per Hour (GB)': 0,
        'Offices': new Set<string>()
      };
    }
    
    acc[monthKey]['Total Data Used (GB)'] += record.usage;
    acc[monthKey]['Total Work Hours'] += record.workHours;
    acc[monthKey]['Number of Days'] += 1;
    acc[monthKey]['Offices'].add(record.office);
    
    return acc;
  }, {} as Record<string, any>);

  if (Object.keys(monthlyData).length > 1) {
    // Calculate averages and format for export
    const monthlyExportData = Object.values(monthlyData).map((month: any) => ({
      'Month': month.Month,
      'Total Data Used (GB)': month['Total Data Used (GB)'].toFixed(2),
      'Total Work Hours': month['Total Work Hours'],
      'Number of Days': month['Number of Days'],
      'Average Daily Usage (GB)': (month['Total Data Used (GB)'] / month['Number of Days']).toFixed(2),
      'Usage per Hour (GB)': (month['Total Data Used (GB)'] / month['Total Work Hours']).toFixed(2),
      'Offices Involved': Array.from(month['Offices']).join(', ')
    }));

    const monthlyWorksheet = XLSX.utils.json_to_sheet(monthlyExportData);
    monthlyWorksheet['!cols'] = [
      { wch: 20 }, // Month
      { wch: 18 }, // Total Data Used
      { wch: 15 }, // Total Work Hours
      { wch: 15 }, // Number of Days
      { wch: 20 }, // Average Daily Usage
      { wch: 18 }, // Usage per Hour
      { wch: 30 }, // Offices Involved
    ];

    // Style monthly sheet header
    const monthlyHeaderRange = XLSX.utils.decode_range(monthlyWorksheet['!ref'] || 'A1');
    for (let col = monthlyHeaderRange.s.c; col <= monthlyHeaderRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!monthlyWorksheet[cellAddress]) continue;
      
      monthlyWorksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "F59E0B" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    XLSX.utils.book_append_sheet(workbook, monthlyWorksheet, 'Monthly Breakdown');
  }

  // Generate filename with current date and optional suffix
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `internet-data-monitoring${filenameSuffix}-${dateStr}-${timeStr}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, filename);
};