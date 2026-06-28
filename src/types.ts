export type Category = 'pothole' | 'garbage' | 'water' | 'lighting';
export type Severity = 'low' | 'medium' | 'high';
export type ReportStatus = 'REPORTED' | 'VERIFIED' | 'DISPATCHED' | 'RESOLVED' | 'CLOSED_VERIFIED';

export interface HistoryItem {
  status: ReportStatus;
  timestamp: string;
  updatedBy: string;
  comment?: string;
  imageUrl?: string;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Report {
  id: string;
  latitude: number;
  longitude: number;
  category: Category;
  severity: Severity;
  status: ReportStatus;
  description: string;
  imageUrl: string;
  reporterName: string;
  reporterEmail?: string;
  createdAt: string;
  updatedAt: string;
  ward: string;
  wardEmail: string;
  ombudsmanLetter: string;
  reportCount: number;
  upvotes: number;
  history: HistoryItem[];
  comments: Comment[];
  duplicateIds: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt?: string;
}

export interface WardStats {
  wardName: string;
  officerName: string;
  email: string;
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  avgResolutionTimeHours: number;
  score: number; // 0 to 100 rating
}

export interface DashboardStats {
  totalActive: number;
  totalResolved: number;
  potholeCount: number;
  garbageCount: number;
  waterCount: number;
  lightingCount: number;
  wardStats: WardStats[];
}
