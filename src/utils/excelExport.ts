import * as XLSX from 'xlsx';
import { Todo } from '../types/todo';

export const exportToExcel = async (todos: Todo[]) => {
  // Prepare data for Excel export
  const excelData = todos.map((todo, index) => ({
    'No.': index + 1,
    'Task Title': todo.title,
    'Description': todo.description || '',
    'Category': todo.category,
    'Priority': todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1),
    'Due Time': todo.dueTime || '',
    'Status': todo.completed ? 'Completed' : 'Incomplete',
    'Created Date': new Date(todo.createdAt).toLocaleDateString(),
    'Created Time': new Date(todo.createdAt).toLocaleTimeString(),
    'Completed Date': todo.completedAt ? new Date(todo.completedAt).toLocaleDateString() : '',
    'Completed Time': todo.completedAt ? new Date(todo.completedAt).toLocaleTimeString() : '',
  }));

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 5 },   // No.
    { wch: 30 },  // Task Title
    { wch: 40 },  // Description
    { wch: 12 },  // Category
    { wch: 10 },  // Priority
    { wch: 10 },  // Due Time
    { wch: 12 },  // Status
    { wch: 12 },  // Created Date
    { wch: 12 },  // Created Time
    { wch: 12 },  // Completed Date
    { wch: 12 },  // Completed Time
  ];
  worksheet['!cols'] = columnWidths;

  // Style the header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F46E5" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  // Add conditional formatting for status column
  const statusColIndex = 6; // Status column (0-indexed)
  for (let row = 1; row <= excelData.length; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: statusColIndex });
    if (!worksheet[cellAddress]) continue;
    
    const isCompleted = worksheet[cellAddress].v === 'Completed';
    worksheet[cellAddress].s = {
      font: { 
        color: { rgb: isCompleted ? "059669" : "DC2626" },
        bold: true
      },
      fill: { 
        fgColor: { rgb: isCompleted ? "D1FAE5" : "FEE2E2" } 
      },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  // Add conditional formatting for priority column
  const priorityColIndex = 4; // Priority column (0-indexed)
  for (let row = 1; row <= excelData.length; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: priorityColIndex });
    if (!worksheet[cellAddress]) continue;
    
    const priority = worksheet[cellAddress].v;
    let bgColor = "F3F4F6"; // Default gray
    let textColor = "374151";
    
    switch (priority) {
      case 'High':
        bgColor = "FEE2E2";
        textColor = "DC2626";
        break;
      case 'Medium':
        bgColor = "FEF3C7";
        textColor = "D97706";
        break;
      case 'Low':
        bgColor = "D1FAE5";
        textColor = "059669";
        break;
    }
    
    worksheet[cellAddress].s = {
      font: { color: { rgb: textColor }, bold: true },
      fill: { fgColor: { rgb: bgColor } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');

  // Add summary sheet
  const summaryData = [
    { Metric: 'Total Tasks', Value: todos.length },
    { Metric: 'Completed Tasks', Value: todos.filter(t => t.completed).length },
    { Metric: 'Incomplete Tasks', Value: todos.filter(t => !t.completed).length },
    { Metric: 'High Priority', Value: todos.filter(t => t.priority === 'high').length },
    { Metric: 'Medium Priority', Value: todos.filter(t => t.priority === 'medium').length },
    { Metric: 'Low Priority', Value: todos.filter(t => t.priority === 'low').length },
    { Metric: 'Export Date', Value: new Date().toLocaleDateString() },
    { Metric: 'Export Time', Value: new Date().toLocaleTimeString() },
  ];

  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  summaryWorksheet['!cols'] = [{ wch: 20 }, { wch: 15 }];
  
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

  // Generate filename with current date
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `tasks-export-${dateStr}-${timeStr}.xlsx`;

  // Write and download the file
  XLSX.writeFile(workbook, filename);
};