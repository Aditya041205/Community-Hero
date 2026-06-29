export interface Comment {
  id: string;
  author: string;
  text: string;
  evidencePhoto?: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  status: "Reported" | "Verified" | "Assigned" | "In Progress" | "Resolved" | "Closed";
  timestamp: string;
  title: string;
  description: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  urgency: "Low" | "Medium" | "High" | "Critical";
  status: "Reported" | "Verified" | "Assigned" | "In Progress" | "Resolved" | "Closed";
  assignedTeam?: string;
  reporterName: string;
  reporterEmail?: string;
  reporterReputation: number;
  reporterBadge: string;
  upvotes: number;
  upvotedByUser: boolean;
  comments: Comment[];
  timeline: TimelineEvent[];
  duplicateOfId?: string | null;
  duplicateChecked: boolean;
  duplicateReason?: string;
  image?: string; // base64
  isMock: boolean;
  recommendation?: string;
  createdAt: string;
  resolvedAt?: string;
  completedBy?: string;
  assignedAuthorityEmail?: string;
  resolutionNotes?: string;
  resolutionProofImage?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  badge: string;
  issuesReported: number;
  issuesResolved: number;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
}

export interface AnalyticsData {
  total: number;
  resolved: number;
  pending: number;
  resolutionRate: number;
  categories: { [key: string]: number };
  districtDensity: { [key: string]: number };
  predictiveForecast: string;
  communityEngagementScore: number;
}

export type UserRole = "citizen" | "authority" | "admin";

export interface UserProfile {
  id: string;
  uid?: string;
  email: string;
  name: string;
  role: UserRole;
  points: number;
  badge: string;
  reputation: number;
  avatarUrl?: string;
  joinedAt: string;
  isBlocked?: boolean;
  lastLoginAt?: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
