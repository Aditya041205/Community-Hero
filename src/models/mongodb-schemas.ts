/**
 * Mongoose Schemas for Community Hero AI
 * Ready for production deployment with MongoDB.
 */

import { Schema, model, Document } from "mongoose";

// ==========================================
// 1. Role Schema & Model
// ==========================================
export interface IRole extends Document {
  name: "citizen" | "authority" | "admin";
  description: string;
  permissions: string[];
}

export const RoleSchema = new Schema<IRole>({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    enum: ["citizen", "authority", "admin"] 
  },
  description: { type: String, required: true },
  permissions: [{ type: String, required: true }]
}, { timestamps: true });

export const RoleModel = model<IRole>("Role", RoleSchema);


// ==========================================
// 2. Points & Badges Schema
// ==========================================
export interface IPointsHistory extends Document {
  pointsEarned: number;
  activityType: "report_issue" | "verify_issue" | "comment_issue" | "upvote_issue" | "status_resolve";
  referenceId?: string; // ID of the issue or action
  description: string;
}

export const PointsHistorySchema = new Schema<IPointsHistory>({
  pointsEarned: { type: Number, required: true },
  activityType: { 
    type: String, 
    required: true, 
    enum: ["report_issue", "verify_issue", "comment_issue", "upvote_issue", "status_resolve"] 
  },
  referenceId: { type: String },
  description: { type: String, required: true }
}, { timestamps: true });


// ==========================================
// 3. User Schema & Model
// ==========================================
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string; // Optional for Google OAuth users
  googleId?: string; // Filled if signed in with Google
  role: "citizen" | "authority" | "admin";
  points: number;
  badge: string;
  reputation: number;
  avatarUrl?: string;
  pointsHistory: IPointsHistory[];
  joinedAt: Date;
}

export const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"]
  },
  passwordHash: { type: String },
  googleId: { type: String },
  role: { 
    type: String, 
    required: true, 
    enum: ["citizen", "authority", "admin"],
    default: "citizen" 
  },
  points: { type: Number, default: 0, min: 0 },
  badge: { type: String, default: "Civic Novice" },
  reputation: { type: Number, default: 100 },
  avatarUrl: { type: String },
  pointsHistory: [PointsHistorySchema],
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Pre-save hook to automatically calculate Badges based on points
UserSchema.pre("save", function(this: any, next: any) {
  const user = this;
  if (user.points >= 2000) {
    user.badge = "City Architect";
  } else if (user.points >= 1000) {
    user.badge = "Pothole Patrol";
  } else if (user.points >= 500) {
    user.badge = "Green Guardian";
  } else if (user.points >= 200) {
    user.badge = "Watchful Neighbor";
  } else {
    user.badge = "Civic Novice";
  }
  next();
});

export const UserModel = model<IUser>("User", UserSchema);


// ==========================================
// 4. Authentication Data (Session/Token Audit Logs)
// ==========================================
export interface IAuthSession extends Document {
  userId: Schema.Types.ObjectId;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  isValid: boolean;
}

export const AuthSessionSchema = new Schema<IAuthSession>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  expiresAt: { type: Date, required: true },
  isValid: { type: Boolean, default: true }
}, { timestamps: true });

export const AuthSessionModel = model<IAuthSession>("AuthSession", AuthSessionSchema);
