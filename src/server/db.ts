import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Report, WardStats, Category, ReportStatus, Comment, UserProfile } from '../types';

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
    const app = getApps().length === 0 ? initializeApp({
      projectId: config.projectId
    }) : getApps()[0];
    
    // Target the clean root database instance
    firestoreDb = getFirestore(app, 'ai-studio-viapulse-9eb3c16f-0fd3-44d8-be73-29ccf536900f');
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
    category: 'water',
    severity: 'high',
    status: 'DISPATCHED',
    description: 'Active high-pressure water leakage from ruptured copper plumbing mains beneath the sidewalk pavement, causing localized pooling and risk of structural undermining.',
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Aria Chen',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ward: 'Ward 1 - Downtown',
    wardEmail: 'sjenkins@city-ward1.gov',
    ombudsmanLetter: `To: Ward 1 - Downtown Office\nAttn: Sarah Jenkins, Public Works Officer\n\nSubject: FORMAL DEMAND FOR REPAIR - PUBLIC WATER LEAKAGE ON MARKET ST`,
    reportCount: 3,
    upvotes: 24,
    duplicateIds: ['dup_1a', 'dup_1b'],
    history: [
      {
        status: 'REPORTED',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'Aria Chen',
        comment: 'Logged active water leakage from sidewalk main lines.'
      },
      {
        status: 'VERIFIED',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: 'WardWatch Sentinel Agent',
        comment: 'AI Triage completed. Water category verified.'
      }
    ],
    comments: []
  },
  {
    id: 'rep_2',
    latitude: 37.7858,
    longitude: -122.4008,
    category: 'pothole',
    severity: 'high',
    status: 'REPORTED',
    description: 'Deep, hazardous pothole in the middle of the road. Vehicles are swerving sharply to avoid it, creating a severe traffic hazard.',
    imageUrl: 'https://images.unsplash.com/photo-1621259182978-f09e5e2ae116?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Marcus Vance',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ward: 'Ward 2 - Eastside Heights',
    wardEmail: 'dmiller@city-ward2.gov',
    ombudsmanLetter: `To: Ward 2 - Eastside Heights Office\nAttn: David Miller, Public Works Officer\n\nSubject: FORMAL DEMAND FOR REPAIR - SEVERE ROADWAY POTHOLE`,
    reportCount: 1,
    upvotes: 8,
    duplicateIds: [],
    history: [],
    comments: []
  },
  {
    id: 'rep_3',
    latitude: 37.7608,
    longitude: -122.4356,
    category: 'garbage',
    severity: 'medium',
    status: 'VERIFIED',
    description: 'Severely overflowing public waste bins with garbage scattered across the sidewalk, creating bad odors and rodent risks.',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    reporterName: 'David Miller',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    ward: 'Ward 3 - Riverdale',
    wardEmail: 'erostova@city-ward3.gov',
    ombudsmanLetter: `To: Ward 3 - Riverdale Office\nAttn: Elena Rostova, Public Works Officer\n\nSubject: FORMAL DEMAND FOR CLEANUP - PUBLIC WASTE OVERFLOW`,
    reportCount: 2,
    upvotes: 14,
    duplicateIds: ['dup_3a'],
    history: [],
    comments: []
  },
  {
    id: 'rep_4',
    latitude: 37.7994,
    longitude: -122.4273,
    category: 'lighting',
    severity: 'medium',
    status: 'REPORTED',
    description: 'Completely dark streetlight fixture and exposed wires at the pole base, causing security concerns during evening hours.',
    imageUrl: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=800&q=80',
    reporterName: 'Elena Rostova',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    ward: 'Ward 4 - North Hills',
    wardEmail: 'mvance@city-ward4.gov',
    ombudsmanLetter: `To: Ward 4 - North Hills Office\nAttn: Marcus Vance, Public Works Officer\n\nSubject: FORMAL DEMAND FOR REPAIR - DAMAGED STREETLIGHT FIXTURE`,
    reportCount: 1,
    upvotes: 5,
    duplicateIds: [],
    history: [],
    comments: []
  }
];

// 3-second execution guard wrapper to stop server fetch stalling
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

// Firestore SDK helper functions as requested by Lead Platform Engineer
export async function getDoc(docRef: any): Promise<any> {
  return await docRef.get();
}

export async function setDoc(docRef: any, data: any): Promise<any> {
  return await docRef.set(data);
}

export async function addDoc(collectionRef: any, data: any): Promise<any> {
  return await collectionRef.add(data);
}

// Global server-side memory fallback caches to prevent permission or rate-limiting exceptions
let localReportsCache: Report[] = [];
let localProfilesCache: UserProfile[] = [];

class LocalDB {
  private reports: Report[] = [];
  private profiles: UserProfile[] = [];

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

    try {
      const PROFILES_FILE = path.join(DB_DIR, 'profiles.json');
      if (fs.existsSync(PROFILES_FILE)) {
        this.profiles = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf-8'));
      }
    } catch (e) {
      this.profiles = [];
    }

    if (isFirebaseConnected && firestoreDb) {
      try {
        console.log('Fetching remote records from active Cloud collection...');
        const snapshot = await withTimeout(firestoreDb.collection('reports').get(), 3000) as any;
        
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
          await withTimeout(batch.commit(), 3000);
        }
      } catch (error) {
        console.warn('Firestore sync routed to local fallback cache core:', error);
      }

      try {
        console.log('Fetching remote profiles from active Cloud collection...');
        const profileSnapshot = await withTimeout(firestoreDb.collection('profiles').get(), 3000) as any;
        if (!profileSnapshot.empty) {
          const firestoreProfiles: UserProfile[] = [];
          profileSnapshot.forEach((docSnap: any) => firestoreProfiles.push(docSnap.data() as UserProfile));
          this.profiles = firestoreProfiles;
          this.saveProfilesLocal();
        }
      } catch (error) {
        console.warn('Firestore profiles sync failed:', error);
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

  private saveProfilesLocal() {
    try {
      if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
      const PROFILES_FILE = path.join(DB_DIR, 'profiles.json');
      fs.writeFileSync(PROFILES_FILE, JSON.stringify(this.profiles, null, 2), 'utf-8');
    } catch (e) {
      console.error('Local profiles persistence save error:', e);
    }
  }

  public async saveProfile(profile: UserProfile): Promise<UserProfile> {
    const existingIndex = this.profiles.findIndex(p => p.email === profile.email);
    let existingProfile: any = null;

    if (isFirebaseConnected && firestoreDb) {
      try {
        const docRef = firestoreDb.collection('profiles').doc(profile.email);
        const docSnap = await withTimeout(getDoc(docRef), 3000);
        if (docSnap.exists) {
          existingProfile = docSnap.data();
        }
      } catch (err) {
        console.warn(`Firestore profile read failed for ${profile.email}:`, err);
      }
    }

    if (!existingProfile && existingIndex >= 0) {
      existingProfile = this.profiles[existingIndex];
    }

    const updatedProfile = { 
      ...(existingProfile || {}),
      ...profile,
      createdAt: existingProfile?.createdAt || new Date().toISOString()
    };

    if (existingIndex >= 0) {
      this.profiles[existingIndex] = updatedProfile;
    } else {
      this.profiles.push(updatedProfile);
    }
    this.saveProfilesLocal();

    if (isFirebaseConnected && firestoreDb) {
      try {
        const docRef = firestoreDb.collection('profiles').doc(profile.email);
        await withTimeout(setDoc(docRef, updatedProfile), 3000);
      } catch (err: any) {
        console.warn("⚠️ Firestore Cloud write blocked. Routing data to sandbox memory array instead...", err);
        const localIdx = localProfilesCache.findIndex(p => p.email === profile.email);
        if (localIdx >= 0) {
          localProfilesCache[localIdx] = updatedProfile;
        } else {
          localProfilesCache.push(updatedProfile);
        }
      }
    } else {
      const localIdx = localProfilesCache.findIndex(p => p.email === profile.email);
      if (localIdx >= 0) {
        localProfilesCache[localIdx] = updatedProfile;
      } else {
        localProfilesCache.push(updatedProfile);
      }
    }
    return updatedProfile;
  }

  public async getProfiles(): Promise<UserProfile[]> {
    let profilesList = [...this.profiles];
    if (isFirebaseConnected && firestoreDb) {
      try {
        const snapshot = await withTimeout(firestoreDb.collection('profiles').get(), 3000) as any;
        if (!snapshot.empty) {
          const remoteProfiles: UserProfile[] = [];
          snapshot.forEach((docSnap: any) => remoteProfiles.push(docSnap.data() as UserProfile));
          this.profiles = remoteProfiles;
          this.saveProfilesLocal();
          profilesList = [...remoteProfiles];
        }
      } catch (error) {
        console.warn('Firestore profiles fetch failed, using local/fallback caches:', error);
      }
    }

    // Merge in-memory localProfilesCache
    (localProfilesCache || []).forEach(localProf => {
      const exists = (profilesList || []).some(p => p?.email === localProf?.email);
      if (!exists) {
        profilesList.push(localProf);
      } else {
        const idx = (profilesList || []).findIndex(p => p?.email === localProf?.email);
        if (idx >= 0) {
          profilesList[idx] = { ...(profilesList[idx] || {}), ...localProf };
        }
      }
    });

    this.profiles = profilesList;
    return profilesList;
  }

  public async compileLeaderboard() {
    const reports = await this.getReports();
    const profiles = await this.getProfiles();

    const usersMap: Record<string, { name: string; email: string; reportCount: number; upvoteCount: number }> = {};

    (profiles || []).forEach(p => {
      if (p && p.email) {
        usersMap[p.email] = {
          name: p.displayName || p.email.split('@')[0] || 'Citizen',
          email: p.email,
          reportCount: 0,
          upvoteCount: 0
        };
      }
    });

    (reports || []).forEach(r => {
      const email = r?.reporterEmail || '';
      if (!email) return;

      if (!usersMap[email]) {
        usersMap[email] = {
          name: r?.reporterName || email.split('@')[0] || 'Citizen',
          email,
          reportCount: 0,
          upvoteCount: 0
        };
      }

      usersMap[email].reportCount += 1;
      usersMap[email].upvoteCount += (r?.upvotes || 0);
    });

    const standings = Object.values(usersMap).map(u => {
      const points = ((u?.reportCount || 0) * 50) + ((u?.upvoteCount || 0) * 10);
      const badges: string[] = [];
      
      if ((u?.reportCount || 0) >= 5) badges.push('Road Hero 🏆');
      if ((u?.upvoteCount || 0) >= 15) badges.push('Civic Sentinel 🌟');
      if (points >= 200) badges.push('Clean City Champion 💪');

      const profile = (profiles || []).find(p => p?.email === u?.email);
      const name = profile?.displayName || u?.name || 'Anonymous';
      const photoURL = profile?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u?.email || 'user'}`;

      return {
        name,
        email: u?.email || '',
        reportCount: u?.reportCount || 0,
        upvoteCount: u?.upvoteCount || 0,
        points,
        badges,
        photoURL
      };
    });

    standings.sort((a, b) => b.points - a.points);
    return standings;
  }

  public async getReports(): Promise<Report[]> {
    let reportsList = [...this.reports];
    if (isFirebaseConnected && firestoreDb) {
      try {
        const snapshot = await withTimeout(firestoreDb.collection('reports').get(), 3000) as any;
        if (!snapshot.empty) {
          const remoteReports: Report[] = [];
          snapshot.forEach((docSnap: any) => remoteReports.push(docSnap.data() as Report));
          this.reports = remoteReports;
          this.saveLocal();
          reportsList = [...remoteReports];
        }
      } catch (error) {
        console.warn('Firestore reports fetch failed, using local/fallback caches:', error);
      }
    }
    
    // Merge in-memory localReportsCache, avoiding duplicates by ID
    (localReportsCache || []).forEach(localRep => {
      const exists = (reportsList || []).some(r => r?.id === localRep?.id);
      if (!exists) {
        reportsList.unshift(localRep);
      } else {
        const idx = (reportsList || []).findIndex(r => r?.id === localRep?.id);
        if (idx >= 0) {
          reportsList[idx] = { ...(reportsList[idx] || {}), ...localRep };
        }
      }
    });

    reportsList.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
    this.reports = reportsList;
    return reportsList;
  }

  public async getReportById(id: string): Promise<Report | undefined> {
    const reports = await this.getReports();
    return reports.find(r => r.id === id);
  }

  public async createReport(report: Report): Promise<void> {
    if (isFirebaseConnected && firestoreDb) {
      try {
        const collectionRef = firestoreDb.collection('reports');
        // Use addDoc for incident report submissions
        const docRef = await withTimeout(addDoc(collectionRef, report), 3000);
        
        // Ensure consistency between doc ID and the id field inside the document
        report.id = docRef.id;
        await docRef.set({ ...report, id: docRef.id });

        const existingIndex = this.reports.findIndex(r => r.id === report.id);
        if (existingIndex >= 0) {
          this.reports[existingIndex] = report;
        } else {
          this.reports.unshift(report);
        }
        this.saveLocal();
        return;
      } catch (err: any) {
        console.warn("⚠️ Firestore Cloud write blocked. Routing data to sandbox memory array instead...", err);
        
        if (!report.id || report.id.startsWith('temp_') || report.id === '') {
          report.id = report.id || `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        const localIdx = localReportsCache.findIndex(r => r.id === report.id);
        if (localIdx >= 0) {
          localReportsCache[localIdx] = report;
        } else {
          localReportsCache.unshift(report);
        }
      }
    } else {
      if (!report.id || report.id === '') {
        report.id = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      const localIdx = localReportsCache.findIndex(r => r.id === report.id);
      if (localIdx >= 0) {
        localReportsCache[localIdx] = report;
      } else {
        localReportsCache.unshift(report);
      }
    }

    const existingIndex = this.reports.findIndex(r => r.id === report.id);
    if (existingIndex >= 0) {
      this.reports[existingIndex] = report;
    } else {
      this.reports.unshift(report);
    }
    this.saveLocal();
  }

  public async updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    const reports = await this.getReports();
    const reportIndex = reports.findIndex(r => r.id === id);
    if (reportIndex === -1) return undefined;

    const updatedReport = { ...reports[reportIndex], ...updates, updatedAt: new Date().toISOString() };
    
    const internalIdx = this.reports.findIndex(r => r.id === id);
    if (internalIdx >= 0) {
      this.reports[internalIdx] = updatedReport;
    } else {
      this.reports.push(updatedReport);
    }
    this.saveLocal();

    if (isFirebaseConnected && firestoreDb) {
      try {
        const docRef = firestoreDb.collection('reports').doc(id);
        await withTimeout(setDoc(docRef, updatedReport), 3000);
      } catch (err: any) {
        console.warn("⚠️ Firestore Cloud write blocked. Routing data to sandbox memory array instead...", err);
        const localIdx = localReportsCache.findIndex(r => r.id === id);
        if (localIdx >= 0) {
          localReportsCache[localIdx] = updatedReport;
        } else {
          localReportsCache.push(updatedReport);
        }
      }
    } else {
      const localIdx = localReportsCache.findIndex(r => r.id === id);
      if (localIdx >= 0) {
        localReportsCache[localIdx] = updatedReport;
      } else {
        localReportsCache.push(updatedReport);
      }
    }
    return updatedReport;
  }

  public async deleteReport(id: string): Promise<boolean> {
    const reports = await this.getReports();
    const reportIndex = reports.findIndex(r => r.id === id);
    if (reportIndex === -1) return false;

    const cacheIdx = localReportsCache.findIndex(r => r.id === id);
    if (cacheIdx >= 0) {
      localReportsCache.splice(cacheIdx, 1);
    }

    const internalIdx = this.reports.findIndex(r => r.id === id);
    if (internalIdx >= 0) {
      this.reports.splice(internalIdx, 1);
    }
    this.saveLocal();

    if (isFirebaseConnected && firestoreDb) {
      try {
        await withTimeout(firestoreDb.collection('reports').doc(id).delete(), 3000);
      } catch (err: any) {
        console.warn("⚠️ Firestore Cloud write blocked. Routing data to sandbox memory array instead...", err);
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