import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Report, WardStats, Category, ReportStatus, Comment } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  const jsonString = JSON.stringify(errInfo);
  console.error('Firestore Error: ', jsonString);
  throw new Error(jsonString);
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Firebase local configuration flags
let firestoreDb: any = null;
let isFirebaseConnected = false;

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Prevent multiple core app initialization crashes during development reloads
    if (getApps().length === 0) {
      initializeApp({
        projectId: config.projectId
      });
    }
    
    // Target the clean root default database instance
    firestoreDb = getFirestore();
    firestoreDb.settings({ ignoreUndefinedProperties: true });
    
    isFirebaseConnected = true;
    console.log(`🚀 Firebase Admin SDK synchronized with project database: ${config.projectId}`);
  } else {
    console.warn('firebase-applet-config.json missing. Defaulting to local file persistence.');
  }
} catch (error) {
  console.error('Failed to bind remote database engine, using local cache:', error);
}

// Predefined Wards with Officers and geographic centers
export const WARDS = [
  { name: 'Ward 1 - Downtown', officer: 'Sarah Jenkins', email: 'sjenkins@city-ward1.gov', lat: 37.7749, lng: -122.4194 },
  { name: 'Ward 2 - Eastside Heights', officer: 'David Miller', email: 'dmiller@city-ward2.gov', lat: 37.7858, lng: -122.4008 },
  { name: 'Ward 3 - Riverdale', officer: 'Elena Rostova', email: 'erostova@city-ward3.gov', lat: 37.7608, lng: -122.4356 },
  { name: 'Ward 4 - North Hills', officer: 'Marcus Vance', email: 'mvance@city-ward4.gov', lat: 37.7994, lng: -122.4273 }
];

// Seed Reports fallback parameters
const SEED_REPORTS: Report[] = [
  {
    id: 'rep_1',
    latitude: 37.7752,
    longitude: -122.4199,
    category: 'pothole',
    severity: 'high',
    status: 'DISPATCHED',
    description: 'Deep, dangerous pothole right in the middle of the bike lane on Market St. Multiple cyclists have nearly crashed trying to avoid it.',
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Aria Chen',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ward: 'Ward 1 - Downtown',
    wardEmail: 'sjenkins@city-ward1.gov',
    ombudsmanLetter: `To: Ward 1 - Downtown Office\nAttn: Sarah Jenkins, Public Works Officer\n\nSubject: FORMAL DEMAND FOR REPAIR - ROADWAY HAZARD ON MARKET ST`,
    reportCount: 3,
    upvotes: 24,
    duplicateIds: ['dup_1a', 'dup_1b'],
    history: [],
    comments: []
  }
];

// 10-second execution guard wrapper to stop server fetch stalling
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Database pipeline execution timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

/**
 * Wraps a Firestore Promise to intercept and log raw Firestore errors (like PERMISSION_DENIED,
 * DOCUMENT_TOO_LARGE, etc.) immediately before any timeout racer can reject.
 */
async function wrapFirestore<T>(promise: Promise<T>, operationType: OperationType, path: string | null): Promise<T> {
  try {
    return await promise;
  } catch (err: any) {
    console.error(`[RAW FIRESTORE EXCEPTION] Operation: ${operationType}, Path: ${path}`, err);
    throw err;
  }
}

class LocalDB {
  private reports: Report[] = [];

  constructor() {
    this.init().catch(err => console.error('DB Async lifecycle boot failure:', err));
  }

  private async init() {
    try {
      if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
      if (fs.existsSync(DB_FILE)) {
        this.reports = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } else {
        this.reports = [...SEED_REPORTS];
        this.saveLocal();
      }
    } catch (e) {
      this.reports = [...SEED_REPORTS];
    }

    if (isFirebaseConnected && firestoreDb) {
      try {
        console.log('Fetching remote records from active Cloud collection...');
        const snapshot = await withTimeout(
          wrapFirestore(firestoreDb.collection('reports').get(), OperationType.LIST, 'reports'),
          10000
        ) as any;
        
        if (!snapshot.empty) {
          const firestoreReports: Report[] = [];
          snapshot.forEach((docSnap: any) => firestoreReports.push(docSnap.data() as Report));
          firestoreReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.reports = firestoreReports;
          this.saveLocal();
        } else {
          console.log('Remote instance empty. Propagating initial cache batch...');
          const batch = firestoreDb.batch();
          for (const rep of this.reports) {
            batch.set(firestoreDb.collection('reports').doc(rep.id), rep);
          }
          await withTimeout(
            wrapFirestore(batch.commit(), OperationType.WRITE, 'batch_commit'),
            10000
          );
        }
      } catch (error) {
        console.warn('Firestore sync routed to local fallback cache core:', error);
      }
    }
  }

  private saveLocal() {
    try {
      if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(this.reports, null, 2), 'utf-8');
    } catch (e) {
      console.error('Local persistence save error:', e);
    }
  }

  public getReports(): Report[] { return this.reports; }
  public getReportById(id: string): Report | undefined { return this.reports.find(r => r.id === id); }

  public async createReport(report: Report): Promise<void> {
    this.reports.unshift(report);
    this.saveLocal();
    if (isFirebaseConnected && firestoreDb) {
      try {
        await withTimeout(
          wrapFirestore(
            firestoreDb.collection('reports').doc(report.id).set(report),
            OperationType.WRITE,
            `reports/${report.id}`
          ),
          10000
        );
      } catch (err: any) {
        console.error(`Cloud write failure for report ${report.id}:`, err);
        handleFirestoreError(err, OperationType.WRITE, `reports/${report.id}`);
      }
    }
  }

  public async updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    const reportIndex = this.reports.findIndex(r => r.id === id);
    if (reportIndex === -1) return undefined;

    const updatedReport = { ...this.reports[reportIndex], ...updates, updatedAt: new Date().toISOString() };
    this.reports[reportIndex] = updatedReport;
    this.saveLocal();

    if (isFirebaseConnected && firestoreDb) {
      try {
        await withTimeout(
          wrapFirestore(
            firestoreDb.collection('reports').doc(id).set(updatedReport),
            OperationType.WRITE,
            `reports/${id}`
          ),
          10000
        );
      } catch (err: any) {
        console.error(`Cloud edit sync failed for report ${id}:`, err);
        handleFirestoreError(err, OperationType.WRITE, `reports/${id}`);
      }
    }
    return updatedReport;
  }

  public async deleteReport(id: string): Promise<boolean> {
    const reportIndex = this.reports.findIndex(r => r.id === id);
    if (reportIndex === -1) return false;

    this.reports.splice(reportIndex, 1);
    this.saveLocal();

    if (isFirebaseConnected && firestoreDb) {
      try {
        await withTimeout(
          wrapFirestore(
            firestoreDb.collection('reports').doc(id).delete(),
            OperationType.DELETE,
            `reports/${id}`
          ),
          10000
        );
      } catch (err: any) {
        console.error(`Cloud removal sync error for report ${id}:`, err);
        handleFirestoreError(err, OperationType.DELETE, `reports/${id}`);
      }
    }
    return true;
  }

  public findNearbyDuplicate(lat: number, lng: number, category: Category, thresholdMeters: number = 150): Report | undefined {
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; 
      const phi1 = (lat1 * Math.PI) / 180;
      const phi2 = (lat2 * Math.PI) / 180;
      const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
      const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))); 
    };

    return this.reports.find(report => {
      if (report.category !== category || report.status === 'CLOSED_VERIFIED') return false;
      return getDistance(lat, lng, report.latitude, report.longitude) <= thresholdMeters;
    });
  }

  public findWard(lat: number, lng: number) {
    let closestWard = WARDS[0];
    let minDistance = Infinity;
    for (const ward of WARDS) {
      const dist = Math.sqrt(Math.pow(lat - ward.lat, 2) + Math.pow(lng - ward.lng, 2));
      if (dist < minDistance) { minDistance = dist; closestWard = ward; }
    }
    return closestWard;
  }

  public getWardStats(): WardStats[] {
    return WARDS.map(w => {
      const wardReports = this.reports.filter(r => r.ward === w.name);
      const total = wardReports.length;
      const resolved = wardReports.filter(r => r.status === 'CLOSED_VERIFIED').length;
      const resRate = total > 0 ? (resolved / total) * 100 : 80;
      return {
        wardName: w.name,
        officerName: w.officer,
        email: w.email,
        totalReports: total,
        resolvedReports: resolved,
        pendingReports: total - resolved,
        avgResolutionTimeHours: 24.5,
        score: Math.min(100, Math.max(10, Math.round(resRate * 0.7 + 23.5)))
      };
    });
  }
}

export const db = new LocalDB();