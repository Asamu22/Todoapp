export interface InternetRecord {
  id: string;
  date: string;
  startBalance: number;
  endBalance: number;
  usage: number;
  workHours: number;
  office: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InternetStats {
  totalRecords: number;
  totalUsage: number;
  averageUsage: number;
  averageWorkHours: number;
  currentMonthUsage: number;
  lastWeekUsage: number;
  officeBreakdown: { [office: string]: { records: number; usage: number } };
}