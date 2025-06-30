export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface AuditLog {
  id: string;
  userId?: string;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  userEmail?: string;
}

export interface DeletedRecord {
  id: string;
  userId?: string;
  tableName: string;
  recordId: string;
  recordData: any;
  deletedBy?: string;
  deletedAt: Date;
  deletionReason?: string;
  userEmail?: string;
  deletedByEmail?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalTodos: number;
  totalInternetRecords: number;
  totalDeletedRecords: number;
  activeUsersToday: number;
  recentActions: number;
}