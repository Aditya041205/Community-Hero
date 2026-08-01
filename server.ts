import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";

dotenv.config();

// Standard lazy initialization of Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in the environment. AI features will fallback to smart rule-based mock responses.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  role: "citizen" | "authority" | "admin";
  points: number;
  badge: string;
  reputation: number;
  joinedAt: string;
  isBlocked?: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || "community_hero_secret_key_123_hackathon";

const USERS_FILE = path.join(process.cwd(), "users.json");

// Initialize mock user DB with bcrypt hashed passwords
let users: User[] = [];

// Load users from persistent users.json if exists
try {
  if (fs.existsSync(USERS_FILE)) {
    const fileData = fs.readFileSync(USERS_FILE, "utf-8");
    const loadedUsers = JSON.parse(fileData);
    if (Array.isArray(loadedUsers)) {
      // Filter out any mock users
      users = loadedUsers.filter((u: any) => 
        u && 
        u.email && 
        !u.email.toLowerCase().endsWith("@communityhero.ai") &&
        u.id !== "user-citizen" &&
        u.id !== "user-authority" &&
        u.id !== "user-admin"
      );
      if (users.length !== loadedUsers.length) {
        console.log(`[AUTH] Cleaned ${loadedUsers.length - users.length} mock users from persistent storage.`);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
      }
    }
    console.log(`[AUTH] Successfully loaded ${users.length} users from persistent storage (users.json).`);
  } else {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    console.log("[AUTH] Created new users.json persistent storage with default accounts.");
  }
} catch (error) {
  console.error("[AUTH] Failed to initialize users from users.json:", error);
}

// Save users helper
function saveUsersToFile() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    console.log(`[AUTH-PERSIST] Saved ${users.length} users to users.json successfully.`);
  } catch (error) {
    console.error("[AUTH-PERSIST] Failed to write users to users.json:", error);
  }
}

// Middleware for JWT verification
const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).json({ error: "Authorization header missing or malformed" });
  }
};

// Middleware for Role checking
const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }
    next();
  };
};

const app = express();
const PORT = 3000;

// Middleware for parsing requests
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Structuring our data matching typical MongoDB schemas
interface Comment {
  id: string;
  author: string;
  text: string;
  evidencePhoto?: string;
  createdAt: string;
}

interface TimelineEvent {
  id: string;
  status: "Reported" | "Verified" | "Assigned" | "In Progress" | "Resolved" | "Closed";
  timestamp: string;
  title: string;
  description: string;
}

interface Issue {
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
  assignedAuthorityEmail?: string;
  resolutionNotes?: string;
  resolutionProofImage?: string;
}

// Pre-populate with beautiful, highly realistic Metro Heights city dataset
let issues: Issue[] = [];


const ISSUES_FILE = path.join(process.cwd(), "issues.json");

// Load issues from persistent issues.json if exists
try {
  if (fs.existsSync(ISSUES_FILE)) {
    const fileData = fs.readFileSync(ISSUES_FILE, "utf-8");
    issues = JSON.parse(fileData).filter((i: any) => !i.isMock);
    console.log(`[DATA] Successfully loaded ${issues.length} issues from persistent storage (issues.json).`);
  } else {
    fs.writeFileSync(ISSUES_FILE, JSON.stringify(issues, null, 2), "utf-8");
    console.log("[DATA] Created new issues.json persistent storage with default issues.");
  }
} catch (error) {
  console.error("[DATA] Failed to initialize issues from issues.json:", error);
}

// Save issues helper
function saveIssuesToFile() {
  try {
    fs.writeFileSync(ISSUES_FILE, JSON.stringify(issues, null, 2), "utf-8");
    console.log(`[DATA-PERSIST] Saved ${issues.length} issues to issues.json successfully.`);
  } catch (error) {
    console.error("[DATA-PERSIST] Failed to write issues to issues.json:", error);
  }
}

// Leaderboard Database Mock matching Gamification collections
let leaderboard = [
  { id: "u-1", name: "Elena Rostova", points: 1540, badge: "City Architect", issuesReported: 18, issuesResolved: 12 },
  { id: "u-2", name: "Marcus Vance", points: 1120, badge: "Pothole Patrol", issuesReported: 14, issuesResolved: 9 },
  { id: "u-3", name: "Julian Vance", points: 890, badge: "Pothole Patrol", issuesReported: 10, issuesResolved: 7 },
  { id: "u-4", name: "Maya Lin", points: 760, badge: "Green Guardian", issuesReported: 8, issuesResolved: 6 },
  { id: "u-5", name: "Sarah Connor", points: 510, badge: "Watchful Neighbor", issuesReported: 5, issuesResolved: 3 }
];

const LEADERBOARD_FILE = path.join(process.cwd(), "leaderboard.json");

// Load leaderboard from persistent leaderboard.json if exists
try {
  if (fs.existsSync(LEADERBOARD_FILE)) {
    const fileData = fs.readFileSync(LEADERBOARD_FILE, "utf-8");
    leaderboard = JSON.parse(fileData);
    console.log(`[GAMIFICATION] Successfully loaded ${leaderboard.length} leaderboard entries from persistent storage (leaderboard.json).`);
  } else {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), "utf-8");
    console.log("[GAMIFICATION] Created new leaderboard.json persistent storage with default entries.");
  }
} catch (error) {
  console.error("[GAMIFICATION] Failed to initialize leaderboard from leaderboard.json:", error);
}

// Save leaderboard helper
function saveLeaderboardToFile() {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), "utf-8");
    console.log(`[GAMIFICATION-PERSIST] Saved ${leaderboard.length} leaderboard entries to leaderboard.json successfully.`);
  } catch (error) {
    console.error("[GAMIFICATION-PERSIST] Failed to write leaderboard to leaderboard.json:", error);
  }
}

// List of recent system notifications & feed
let notifications = [
  { id: "n-1", title: "Midtown Bus Lane Pothole En Route to Recovery!", message: "Sewer and road contractors have assigned Team B to Complaint-101.", timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: "n-2", title: "Alley Trash Dump Cleared!", message: "Excellent collaboration! The city cleaned West 4th St Alleyway in less than 24 hours.", timestamp: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: "n-3", title: "Water Leak Verified!", message: "5 community members confirmed water bubbling near Bryant Park entrance.", timestamp: new Date(Date.now() - 5 * 3600000).toISOString() }
];

// ==========================================
// AUTHENTICATION & AUTHORIZATION APIS
// ==========================================

// Helper to get role and badge by email
function getRoleAndBadgeByEmail(email: string): { role: "citizen" | "authority" | "admin"; badge: string } {
  const normEmail = email.toLowerCase().trim();
  if (normEmail === "adityasharma01021@gmail.com") {
    return { role: "admin", badge: "City Admin" };
  } else if (normEmail === "adityaksharma00412@gmail.com") {
    return { role: "authority", badge: "Chief Dispatcher" };
  } else {
    return { role: "citizen", badge: "Civic Novice" };
  }
}

// Firebase auth sync endpoint
app.post("/api/auth/firebase-sync", (req, res) => {
  const { uid, email, name, role } = req.body;
  console.log(`[AUTH-FIREBASE-SYNC] Sync request received for UID: "${uid}", email: "${email}", name: "${name}", role: "${role}"`);

  const safeEmail = typeof email === "string" ? email : String(email || "");

  if (!uid || !safeEmail) {
    console.warn("[AUTH-FIREBASE-SYNC] Failed: Missing uid or email.");
    return res.status(400).json({ error: "Firebase UID and email are required" });
  }

  const { role: assignedRole, badge: assignedBadge } = getRoleAndBadgeByEmail(safeEmail);

  // Helper to determine badge from role
  const getBadgeByRole = (r: string): string => {
    if (r === "admin") return "City Admin";
    if (r === "authority") return "Chief Dispatcher";
    return "Civic Novice";
  };

  // Find user by email or by id
  let user = users.find(u => u.email.toLowerCase() === safeEmail.toLowerCase() || u.id === uid);

  if (user && user.isBlocked) {
    console.warn(`[AUTH-FIREBASE-SYNC] Blocked user attempt: ${email}`);
    return res.status(403).json({ error: "Your account has been blocked by an administrator. Please contact municipal support." });
  }

  if (!user) {
    // If not found, create new user profile
    const displayName = name || email.split("@")[0];
    const finalRole = role || assignedRole;
    const finalBadge = getBadgeByRole(finalRole);

    user = {
      id: uid, // Use Firebase UID directly as the persistent user ID
      email: email.toLowerCase(),
      name: displayName,
      role: finalRole,
      points: 100, // starting bonus
      badge: finalBadge,
      reputation: 100,
      joinedAt: new Date().toISOString()
    };

    users.push(user);
    saveUsersToFile();

    // Add to leaderboard if citizen/authority
    const existsOnLeaderboard = leaderboard.some(l => l.id === user!.id);
    if (!existsOnLeaderboard) {
      leaderboard.push({
        id: user.id,
        name: user.name,
        points: user.points,
        badge: user.badge,
        issuesReported: 0,
        issuesResolved: 0
      });
      saveLeaderboardToFile();
    }

    console.log(`[AUTH-FIREBASE-SYNC] Created and saved new synchronized profile for user "${user.name}" (ID: ${user.id}, Role: ${user.role}).`);
  } else {
    // User already exists, update details but do NOT overwrite their role with deterministic email role.
    // Instead, if the client sent a role (loaded directly from Firestore), sync it into our cache.
    let updated = false;
    
    if (role && user.role !== role) {
      user.role = role;
      user.badge = getBadgeByRole(role);
      updated = true;
    }

    if (name && user.name !== name) {
      user.name = name;
      updated = true;
    }
    // ensure the id matches uid for easy routing consistency
    if (user.id !== uid) {
      const oldId = user.id;
      user.id = uid;
      updated = true;

      // sync leaderboard id
      const lEntry = leaderboard.find(l => l.id === oldId);
      if (lEntry) {
         lEntry.id = uid;
         saveLeaderboardToFile();
      }
    }

    if (updated) {
      saveUsersToFile();
      console.log(`[AUTH-FIREBASE-SYNC] Updated profile for existing user "${user.name}" (ID: ${user.id}, Role: ${user.role}).`);
    } else {
      console.log(`[AUTH-FIREBASE-SYNC] Matched existing user "${user.name}" (ID: ${user.id}, Role: ${user.role}).`);
    }
  }

  // Create local Express session JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  const { passwordHash, ...userResponse } = user;
  res.json({ user: userResponse, token });
});

// Register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  console.log(`[AUTH-REGISTER] Request received for name: "${name}", email: "${email}"`);
  
  if (!name || !email || !password) {
    console.warn("[AUTH-REGISTER] Registration failed: Missing required fields.");
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  // Email validation regex
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    console.warn(`[AUTH-REGISTER] Registration failed: Invalid email format "${email}"`);
    return res.status(400).json({ error: "Please enter a valid email address" });
  }

  // Password validation length
  if (password.length < 6) {
    console.warn("[AUTH-REGISTER] Registration failed: Password too short.");
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    console.warn(`[AUTH-REGISTER] Registration failed: Email "${email}" already registered.`);
    return res.status(400).json({ error: "Email already registered" });
  }

  const newUser: User = {
    id: "user-" + Math.random().toString(36).substr(2, 9),
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    name,
    role: "citizen", // Default role
    points: 100, // Starting bonus points!
    badge: "Civic Novice",
    reputation: 100,
    joinedAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsersToFile();

  // Sync to leaderboard too so they show up!
  leaderboard.push({
    id: newUser.id,
    name: newUser.name,
    points: newUser.points,
    badge: newUser.badge,
    issuesReported: 0,
    issuesResolved: 0
  });
  saveLeaderboardToFile();

  console.log(`[AUTH-REGISTER] Success: User "${newUser.name}" (ID: ${newUser.id}) successfully created and saved.`);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  const { passwordHash, ...userResponse } = newUser;
  res.status(201).json({ user: userResponse, token });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  console.log(`[AUTH-LOGIN] Attempting login for email: "${email}"`);

  if (!email || !password) {
    console.warn("[AUTH-LOGIN] Failed: Email or password not provided.");
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.warn(`[AUTH-LOGIN] Failed: No user found with email "${email}"`);
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (!user.passwordHash) {
    console.warn(`[AUTH-LOGIN] Failed: User "${email}" was registered via Google OAuth and does not have a direct password set.`);
    return res.status(401).json({ error: "Please log in using Google for this account" });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    console.warn(`[AUTH-LOGIN] Failed: Incorrect password for user "${email}"`);
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  console.log(`[AUTH-LOGIN] Success: User "${user.name}" (ID: ${user.id}, Role: ${user.role}) logged in successfully.`);

  const { passwordHash, ...userResponse } = user;
  res.json({ user: userResponse, token });
});

// Google OAuth Simulation
app.post("/api/auth/google", (req, res) => {
  const { email, name, googleId, avatarUrl } = req.body;
  console.log(`[AUTH-GOOGLE] Request for email: "${email}", name: "${name}"`);

  if (!email || !name) {
    console.warn("[AUTH-GOOGLE] Failed: Missing email or name in payload.");
    return res.status(400).json({ error: "Google profile email and name are required" });
  }

  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    // Create new google user
    user = {
      id: "user-g-" + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      name,
      role: "citizen",
      points: 100,
      badge: "Civic Novice",
      reputation: 100,
      joinedAt: new Date().toISOString()
    };
    users.push(user);
    saveUsersToFile();

    // Sync to leaderboard
    leaderboard.push({
      id: user.id,
      name: user.name,
      points: user.points,
      badge: user.badge,
      issuesReported: 0,
      issuesResolved: 0
    });
    saveLeaderboardToFile();

    console.log(`[AUTH-GOOGLE] Created and saved new user account for "${user.name}" (ID: ${user.id}).`);
  } else {
    console.log(`[AUTH-GOOGLE] Existing user account found for "${user.name}" (ID: ${user.id}).`);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  const { passwordHash, ...userResponse } = user;
  res.json({ user: userResponse, token });
});

// Forgot Password
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // Return standard success to avoid email enumeration
    return res.json({ message: "If that email exists in our system, we have sent a password reset link to it." });
  }

  // Generate a mock reset token
  const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });
  const resetLink = `/reset-password?token=${resetToken}`;

  // Log in server console for easy retrieval in hackathon environment!
  console.log(`🔑 PASSWORD RESET REQUEST for ${email}: Link is ${resetLink}`);

  res.json({ 
    message: "If that email exists in our system, we have sent a password reset link to it.",
    demoResetLink: resetLink // Return for easier hackathon testing/sandbox environment
  });
});

// Get profile (me)
app.get("/api/auth/me", authenticateJWT, (req: any, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { passwordHash, ...userResponse } = user;
  res.json(userResponse);
});

// Admin User Management routes

// Get all users (Admin only)
app.get("/api/admin/users", authenticateJWT, requireRole(["admin"]), (req, res) => {
  const usersResponse = users.map(({ passwordHash, ...user }) => user);
  res.json(usersResponse);
});

// Sync users cache with Firestore (Admin only)
app.post("/api/admin/sync-users-cache", authenticateJWT, requireRole(["admin"]), (req, res) => {
  const { users: incomingUsers } = req.body;
  if (!Array.isArray(incomingUsers)) {
    return res.status(400).json({ error: "Invalid payload: users array is required" });
  }

  // Update or insert incoming users into our local cache
  incomingUsers.forEach((incoming) => {
    const existingIndex = users.findIndex(u => u.id === incoming.id || u.email.toLowerCase() === incoming.email.toLowerCase());
    const mappedUser: User = {
      id: incoming.uid || incoming.id,
      email: incoming.email,
      name: incoming.name || incoming.displayName || "Civic Connect User",
      role: incoming.role || "citizen",
      points: incoming.points || 0,
      badge: incoming.badge || "Civic Novice",
      reputation: incoming.reputation || incoming.points || 0,
      joinedAt: incoming.joinedAt || new Date().toISOString(),
      isBlocked: !!incoming.isBlocked
    };

    if (existingIndex !== -1) {
      users[existingIndex] = { ...users[existingIndex], ...mappedUser };
    } else {
      users.push(mappedUser);
    }
  });

  // Remove any mock users or users not present in incoming list unless they are local auth users with passwordHash
  users = users.filter(u => 
    u.passwordHash || 
    incomingUsers.some(incoming => incoming.id === u.id || incoming.email.toLowerCase() === u.email.toLowerCase())
  );

  saveUsersToFile();
  res.json({ success: true, count: users.length });
});

// Update user role (Admin only)
app.post("/api/admin/users/:id/role", authenticateJWT, requireRole(["admin"]), (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !["citizen", "authority", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.role = role;
  console.log(`Role updated by admin: user "${user.name}" (ID: ${id}) changed to ${role}`);
  saveUsersToFile();
  const { passwordHash, ...userResponse } = user;
  res.json(userResponse);
});

// Delete user (Admin only)
app.delete("/api/admin/users/:id", authenticateJWT, requireRole(["admin"]), (req, res) => {
  const { id } = req.params;
  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  users.splice(userIndex, 1);
  saveUsersToFile();
  res.json({ success: true, message: "User deleted successfully" });
});

// Block a user (Admin only)
app.post("/api/admin/users/:id/block", authenticateJWT, requireRole(["admin"]), (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (user.role === "admin") {
    return res.status(400).json({ error: "Administrators cannot be blocked" });
  }
  user.isBlocked = true;
  saveUsersToFile();
  const { passwordHash, ...userResponse } = user;
  res.json(userResponse);
});

// Unblock a user (Admin only)
app.post("/api/admin/users/:id/unblock", authenticateJWT, requireRole(["admin"]), (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  user.isBlocked = false;
  saveUsersToFile();
  const { passwordHash, ...userResponse } = user;
  res.json(userResponse);
});

// Add Authority (Admin only)
app.post("/api/admin/authorities", authenticateJWT, requireRole(["admin"]), (req, res) => {
  const { name, email, badge } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  // Check if email already exists
  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Email is already registered" });
  }

  const newAuth: User = {
    id: "auth-" + Math.floor(1000 + Math.random() * 9000),
    email: email.toLowerCase(),
    name,
    role: "authority",
    points: 1000, // standard officer starting bonus
    badge: badge || "Chief Dispatcher",
    reputation: 1000,
    joinedAt: new Date().toISOString()
  };

  users.push(newAuth);
  saveUsersToFile();
  res.json(newAuth);
});

// Edit Authority (Admin only)
app.post("/api/admin/authorities/:id", authenticateJWT, requireRole(["admin"]), (req, res) => {
  const { id } = req.params;
  const { name, email, badge } = req.body;
  
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "Authority not found" });
  }

  if (name) user.name = name;
  if (email) {
    const duplicate = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== id);
    if (duplicate) {
      return res.status(400).json({ error: "Email is already in use by another user" });
    }
    user.email = email.toLowerCase();
  }
  if (badge) user.badge = badge;

  saveUsersToFile();
  const { passwordHash, ...userResponse } = user;
  res.json(userResponse);
});

// 1. API: Get all issues
app.get("/api/issues", (req, res) => {
  res.json(issues);
});

// 2. API: Upvote issue
app.post("/api/issues/:id/vote", (req, res) => {
  const { id } = req.params;
  const issue = issues.find((i) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Civic Issue not found" });
  }

  if (issue.upvotedByUser) {
    issue.upvotes -= 1;
    issue.upvotedByUser = false;
  } else {
    issue.upvotes += 1;
    issue.upvotedByUser = true;
    // Add real-time feed notification
    notifications.unshift({
      id: "n-" + Math.random().toString(36).substr(2, 9),
      title: "Issue Gained Community Support",
      message: `Someone upvoted "${issue.title}". Keep pushing for public resolution!`,
      timestamp: new Date().toISOString()
    });
  }
  saveIssuesToFile();
  res.json(issue);
});

// 3. API: Add comment
app.post("/api/issues/:id/comment", (req, res) => {
  const { id } = req.params;
  const { author, text, evidencePhoto } = req.body;
  const issue = issues.find((i) => i.id === id);
  
  if (!issue) {
    return res.status(404).json({ error: "Civic Issue not found" });
  }

  const newComment: Comment = {
    id: "comm-" + Math.random().toString(36).substr(2, 9),
    author: author || "Anonymous Hero",
    text: text || "",
    evidencePhoto,
    createdAt: new Date().toISOString()
  };

  issue.comments.push(newComment);
  
  // If evidence is attached, let's bump the upvote or status to Verified
  if (evidencePhoto && issue.status === "Reported") {
    issue.status = "Verified";
    issue.timeline = issue.timeline || [];
    issue.timeline.push({
      id: "tl-" + Math.random().toString(36).substr(2, 9),
      status: "Verified",
      title: "Evidence Uploaded",
      description: `Citizen ${author || "Anonymous Hero"} uploaded photo evidence. Status upgraded to Verified.`,
      timestamp: new Date().toISOString()
    });
    notifications.unshift({
      id: "n-" + Math.random().toString(36).substr(2, 9),
      title: "Complaint Status Upgraded to Verified",
      message: `"${issue.title}" has new evidence uploaded by ${author}. Added to city priority pool.`,
      timestamp: new Date().toISOString()
    });
  }

  saveIssuesToFile();
  res.json(issue);
});

// 4. API: Update Status & Assign team (Authority Action)
app.post("/api/issues/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, assignedTeam } = req.body;
  const issue = issues.find((i) => i.id === id);

  if (!issue) {
    return res.status(404).json({ error: "Civic Issue not found" });
  }

  const oldStatus = issue.status;
  const oldTeam = issue.assignedTeam;

  if (status) {
    issue.status = status;
    if (status === "Resolved") {
      issue.resolvedAt = new Date().toISOString();
      
      // Reward points to the creator!
      const reporter = leaderboard.find(u => u.name === issue.reporterName);
      if (reporter) {
        reporter.points += 150; // 150 Hero points for successfully resolving!
        reporter.issuesResolved += 1;
      }
    }
  }
  if (assignedTeam) {
    issue.assignedTeam = assignedTeam;
  }

  // Create timeline event if status or team changed
  if ((status && status !== oldStatus) || (assignedTeam && assignedTeam !== oldTeam)) {
    const finalStatus = status || oldStatus;
    let titleStr = `Status Updated: ${finalStatus}`;
    let descStr = `Municipal authorities changed status to ${finalStatus}.`;
    
    if (assignedTeam && assignedTeam !== oldTeam) {
      titleStr = `Team Dispatched: ${assignedTeam}`;
      descStr = `Assigned to ${assignedTeam} and status set to ${finalStatus}.`;
    } else if (assignedTeam) {
      descStr += ` Team assigned: ${assignedTeam}.`;
    }

    issue.timeline = issue.timeline || [];
    issue.timeline.push({
      id: "tl-" + Math.random().toString(36).substr(2, 9),
      status: finalStatus,
      title: titleStr,
      description: descStr,
      timestamp: new Date().toISOString()
    });
  }

  notifications.unshift({
    id: "n-" + Math.random().toString(36).substr(2, 9),
    title: `Issue ${status || 'Updated'}!`,
    message: `Municipal team has updated "${issue.title}" to status ${status}. Team assigned: ${assignedTeam || 'None'}.`,
    timestamp: new Date().toISOString()
  });

  saveIssuesToFile();
  if (status === "Resolved") {
    saveLeaderboardToFile();
  }

  res.json(issue);
});

// Resolve an issue with notes and proof (Authority/Admin only)
app.post("/api/issues/:id/resolve", authenticateJWT, requireRole(["authority", "admin"]), (req, res) => {
  const { id } = req.params;
  const { resolutionNotes, resolutionProofImage } = req.body;
  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Civic issue not found" });
  }

  issue.status = "Resolved";
  issue.resolvedAt = new Date().toISOString();
  if (resolutionNotes) {
    issue.resolutionNotes = resolutionNotes;
  }
  if (resolutionProofImage) {
    issue.resolutionProofImage = resolutionProofImage;
  }

  // Create timeline event
  issue.timeline = issue.timeline || [];
  issue.timeline.push({
    id: "tl-" + Math.random().toString(36).substr(2, 9),
    status: "Resolved",
    title: "Complaint Resolved",
    description: resolutionNotes || "Municipal authorities successfully resolved this issue and provided certification.",
    timestamp: new Date().toISOString()
  });

  // Reward points to the creator!
  const reporter = leaderboard.find(u => u.name === issue.reporterName);
  if (reporter) {
    reporter.points += 150; // 150 Hero points for successfully resolving!
    reporter.issuesResolved += 1;
  }

  notifications.unshift({
    id: "n-" + Math.random().toString(36).substr(2, 9),
    title: "Complaint Resolved!",
    message: `Municipal team completed "${issue.title}". Proof of resolution has been logged.`,
    timestamp: new Date().toISOString()
  });

  saveIssuesToFile();
  saveLeaderboardToFile();
  res.json(issue);
});

// Helper: Calculate distance in meters between two lat/lng pairs
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

// Rule-based backup issue routing helper if Gemini API throws 429 quota or fails
function applyBackupIssueRouting(category?: string, title?: string, description?: string) {
  const finalCategory = category || "Potholes";
  const finalTitle = title || `Encountered ${finalCategory || "Public Issue"}`;
  const finalDesc = description || `A Citizen reported an incident categorized under ${finalCategory || "municipal services"}. Requires public works inspection.`;
  
  let finalUrgency: "Low" | "Medium" | "High" | "Critical" = "Medium";
  let autoRecommendation = "Standard urban planning team inspection recommended.";

  if (finalCategory === "Water leakage" || finalCategory === "Drainage blockage") {
    finalUrgency = "High";
    autoRecommendation = "Water valve shutoff and structural piping inspection required immediately.";
  } else if (finalCategory === "Potholes") {
    finalUrgency = "Medium";
    autoRecommendation = "Standard quick asphalt patch routing recommended.";
  } else if (finalCategory === "Broken streetlights") {
    finalUrgency = "Low";
    autoRecommendation = "Schedule electrical utility technician for LED bulb replacement.";
  } else if (finalCategory === "Garbage accumulation") {
    finalUrgency = "Medium";
    autoRecommendation = "Route sanitation pickup loader to location.";
  }
  
  return { finalCategory, finalTitle, finalDesc, finalUrgency, autoRecommendation };
}

// Rule-based backup chatbot response helper if Gemini Chat fails
function getRuleBasedChatResponse(latestMessage: string): string {
  return "I couldn't find that information.";
}

// 5. API: Submit a reported issue with integrated Gemini auto-classification
app.post("/api/issues/report", async (req, res) => {
  const { title, description, category, latitude, longitude, image, reporterName } = req.body;
  const lat = parseFloat(latitude) || 40.7500;
  const lng = parseFloat(longitude) || -73.9800;

  // Step 1: Duplicate Proximity Defense (AI & Geo checks)
  // Look for any issue in the same category within 350 meters
  let duplicateOfId: string | null = null;
  let duplicateReason = "";

  const potentialDuplicates = issues.filter(existingIssue => {
    if (existingIssue.status === "Resolved" || existingIssue.status === "Closed") return false;
    const distance = getDistanceInMeters(lat, lng, existingIssue.latitude, existingIssue.longitude);
    return distance < 350; // 350m radius duplicate trigger zone
  });

  if (potentialDuplicates.length > 0) {
    // Proximity match found
    const target = potentialDuplicates[0];
    duplicateOfId = target.id;
    duplicateReason = `A similar issue ("${target.title}") is already reported at this exact location is currently in status: ${target.status}. Combined into community thread.`;
  }

  let finalCategory = category || "Potholes";
  let finalTitle = title || "Unspecified Municipal Issue";
  let finalDesc = description || "Sent from Community Reporter";
  let finalUrgency: "Low" | "Medium" | "High" | "Critical" = "Medium";
  let autoRecommendation = "Standard highway inspection and cleaning suggested.";

  // Step 2: Use Gemini on image or text if API Key is accessible!
  const apiKeySetting = process.env.GEMINI_API_KEY;
  if (apiKeySetting && apiKeySetting !== "MY_GEMINI_API_KEY") {
    try {
      const ai = getGemini();
      
      let prompt = `You are a municipal urban planning AI expert that classifies citizen complaints to route them quickly to public works departments.
      Evaluate the reported incident. `;

      let mimeType = "image/jpeg";
      let base64Data = "";

      if (image) {
        prompt += "Look at this uploaded citizen evidence photo. ";
        // Clean up base-64 string if it contains data:image/... prefix
        const match = image.match(/^data:([^;]+);base64,(.*)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        } else {
          base64Data = image;
        }
      } else {
        prompt += `Evaluate the citizen's typed request: "${title} - ${description}". `;
      }

      prompt += `Analyze and provide output in strict JSON format matching the following schema structure:
      {
        "category": "Potholes" | "Garbage accumulation" | "Water leakage" | "Broken streetlights" | "Road damage" | "Drainage blockage",
        "title": "A short, highly professional title for the municipal work ticket",
        "description": "An enriched professional summary detailing what municipal repair crews should bring, based on observed issue",
        "urgency": "Low" | "Medium" | "High" | "Critical",
        "recommendation": "Engineered suggestion/action recommendation for the works dispatch team"
      }
      Rules:
      1. If the image is unclear or dark, default to the closest matching category or user details.
      2. Keep titles under 50 characters.
      3. Keep descriptions factual, actionable, and detailed.`;

      let response;
      if (image && base64Data) {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            { text: prompt }
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          }
        });
      } else {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          }
        });
      }

      const jsonStr = response.text ? response.text.trim() : "{}";
      const cleanedJsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/```$/, "");
      const resData = JSON.parse(cleanedJsonStr);
      
      if (resData.category) finalCategory = resData.category;
      if (resData.title) finalTitle = resData.title;
      if (resData.description) finalDesc = resData.description;
      if (resData.urgency) finalUrgency = resData.urgency;
      if (resData.recommendation) autoRecommendation = resData.recommendation;

    } catch (err) {
      console.log("Image/NLP fallback analysis applied.");
      // Fallback details if Gemini fails
      const fallback = applyBackupIssueRouting(category, title, description);
      finalCategory = fallback.finalCategory;
      finalTitle = fallback.finalTitle;
      finalDesc = fallback.finalDesc;
      finalUrgency = fallback.finalUrgency;
      autoRecommendation = fallback.autoRecommendation;
    }
  } else {
    // Fallback: Smart mock pipeline if no API Key
    const fallback = applyBackupIssueRouting(category, title, description);
    finalCategory = fallback.finalCategory;
    finalTitle = fallback.finalTitle;
    finalDesc = fallback.finalDesc;
    finalUrgency = fallback.finalUrgency;
    autoRecommendation = fallback.autoRecommendation;
  }

  const initialTimeline: TimelineEvent[] = [
    {
      id: "tl-" + Math.random().toString(36).substr(2, 9),
      status: "Reported",
      title: "Issue Registered",
      description: `Report filed by resident ${reporterName || "Anonymous Hero"}.`,
      timestamp: new Date().toISOString()
    }
  ];

  if (duplicateOfId) {
    initialTimeline.push({
      id: "tl-" + Math.random().toString(36).substr(2, 9),
      status: "Verified",
      title: "Verified: Proximity Match",
      description: duplicateReason || `Merged with active issue thread due to geographic proximity. Status set to Verified.`,
      timestamp: new Date().toISOString()
    });
  }

  // Create the complete issue entity matching MongoDB properties
  const newIssue: Issue = {
    id: "complaint-" + Math.floor(100 + Math.random() * 900),
    title: finalTitle,
    description: finalDesc,
    category: finalCategory,
    latitude: lat,
    longitude: lng,
    address: `Near Block Coordinates: (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    urgency: finalUrgency,
    status: duplicateOfId ? "Verified" : "Reported",
    reporterName: reporterName || "Anonymous Hero",
    reporterReputation: 100,
    reporterBadge: "Watchful Neighbor",
    upvotes: duplicateOfId ? 5 : 1,
    upvotedByUser: false,
    comments: [],
    timeline: initialTimeline,
    duplicateOfId,
    duplicateChecked: true,
    duplicateReason: duplicateReason || undefined,
    image,
    isMock: false,
    recommendation: autoRecommendation,
    createdAt: new Date().toISOString()
  };

  issues.push(newIssue);

  // Gamification: Reward points for reporting
  const reporter = leaderboard.find(u => u.name === newIssue.reporterName);
  if (reporter) {
    reporter.points += duplicateOfId ? 25 : 50; // Duplicate counts as support, normal gets 50
    reporter.issuesReported += 1;
  } else {
    leaderboard.push({
      id: "u-" + Math.random().toString(36).substr(2, 9),
      name: newIssue.reporterName,
      points: 100,
      badge: "Watchful Neighbor",
      issuesReported: 1,
      issuesResolved: 0
    });
  }

  saveIssuesToFile();
  saveLeaderboardToFile();

  // Set notification feed
  notifications.unshift({
    id: "n-" + Math.random().toString(36).substr(2, 9),
    title: duplicateOfId ? "Duplicate Cleared & Merged!" : "New Smart Ticket Created!",
    message: `${newIssue.reporterName} submitted a issue ticket classified as ${newIssue.category}. Severity: ${newIssue.urgency}`,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(newIssue);
});

let cachedForecastText = "AI Forecast: Due to high summer rainfall models, we predict a 25% increase in pothole creation around the Midtown bus corridor next month. Priority cleaning of water culverts is recommended to prevent Bryant Park flooding.";
let lastForecastGeneratedTime = 0;
const FORECAST_CACHE_DURATION = 3 * 60 * 1000; // 3 minutes cache

// 6. API: Get AI Analytics, predictive risk mapping, and resolution rates
app.get("/api/analytics", async (req, res) => {
  // Compute real statistics
  const total = issues.length;
  const resolved = issues.filter(i => i.status === "Resolved" || i.status === "Closed").length;
  const pending = total - resolved;
  const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Most common categories counting
  const categoryCounts: { [key: string]: number } = {};
  issues.forEach(i => {
    categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
  });

  // Calculate coordinates density / neighborhood density
  // Bryant Park / Midtown (~ lat: 40.74 - 40.76) vs West Village/Downtown (~ lat: 40.72 - 40.73)
  let midtownIssuesCount = 0;
  let downtownIssuesCount = 0;
  let otherDistrictCount = 0;

  issues.forEach(i => {
    if (i.latitude >= 40.74) {
      midtownIssuesCount++;
    } else if (i.latitude > 0) {
      downtownIssuesCount++;
    } else {
      otherDistrictCount++;
    }
  });

  // Generate predictive trends and recommendations dynamically using Gemini (with caching)
  const apiKeySetting = process.env.GEMINI_API_KEY;
  const isCacheExpired = (Date.now() - lastForecastGeneratedTime) > FORECAST_CACHE_DURATION;

  if (apiKeySetting && apiKeySetting !== "MY_GEMINI_API_KEY" && isCacheExpired) {
    try {
      const ai = getGemini();
      const prompt = `You are a Municipal Civil Engineer and Public Works Predictive Planner.
      Here is the current real-time city ticket status:
      - Total reported issues: ${total}
      - Resolved cases: ${resolved}
      - Pending items: ${pending}
      - Category breakdown: ${JSON.stringify(categoryCounts)}
      - Area counts -> Midtown District: ${midtownIssuesCount}, Downtown District: ${downtownIssuesCount}
      
      Generate a concise 2-3 sentence technical prediction for next month. Detail which district is at high risk of water flooding or infrastructure failure based on these tickets, and recommend a proactive dispatch plan for the mayor's team. Keep it brief, realistic, and highly professional. Do not use markdown headers or list markers.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
        }
      });
      if (response.text) {
        cachedForecastText = response.text.trim();
        lastForecastGeneratedTime = Date.now();
      }
    } catch (err: any) {
      console.log("Analytics fallback forecast used (Gemini bypassed or quota reached).");
      // Suppress immediate retries on quota exceed errors (circuit breaker style)
      lastForecastGeneratedTime = Date.now();
    }
  }

  res.json({
    total,
    resolved,
    pending,
    resolutionRate: rate,
    categories: categoryCounts,
    districtDensity: {
      "Midtown Hub": midtownIssuesCount,
      "Downtown Village": downtownIssuesCount,
      "Riverdale Outskirts": otherDistrictCount
    },
    predictiveForecast: cachedForecastText,
    communityEngagementScore: issues.reduce((acc, i) => acc + i.upvotes + i.comments.length, 0) * 12
  });
});

// 7. API: Get Leaderboard / Gamification data
app.get("/api/leaderboard", (req, res) => {
  res.json(leaderboard.sort((a, b) => b.points - a.points));
});

// 8. API: Get recent notification feeds
app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

// 9. API: Multi-turn Chat Counselor "Eco-Echo"
app.post("/api/chat", async (req, res) => {
  const { messages, issues: clientIssues = [], users = [], currentUser = null, stats = null } = req.body; 

  const defaultReply = "How can I help you today?";

  if (!messages || messages.length === 0) {
    return res.json({ response: defaultReply });
  }

  const latestMessage = messages[messages.length - 1].message;
  const apiKeySetting = process.env.GEMINI_API_KEY;

  if (apiKeySetting && apiKeySetting !== "MY_GEMINI_API_KEY") {
    try {
      const ai = getGemini();

      const complaintData = clientIssues.length > 0 ? clientIssues : issues;
      const allUsers = users;

      // Formulate systemic guide
      const systemGuide = `# SYSTEM ROLE

You are Eco-Echo, the AI assistant of CivicConnect AI.

You have TWO modes.

----------------------------------------
MODE 1: General Conversation
----------------------------------------

If the user is greeting, chatting, asking general knowledge, coding questions, or casual conversation, answer naturally.

Examples:

User: Hello
AI: Hello! 👋 I'm Eco-Echo. How can I help you today?

User: Hi
AI: Hi! 😊 Nice to see you. What can I help you with?

User: Namaste
AI: Namaste! 🙏 Main Eco-Echo hoon. Aaj main aapki kis tarah madad kar sakta hoon?

User: Kaise ho?
AI: Main bilkul theek hoon 😊 Aap batayiye.

User: Thank you
AI: You're welcome! 😊

User: React kya hai?
AI: React ek JavaScript library hai...

User: Tell me a joke.
AI: 😄 ...

----------------------------------------
MODE 2: CivicConnect AI Questions
----------------------------------------

Only use application data when the user asks about:

• Complaints
• Maps
• Authorities
• Admin
• Hero Points
• Badges
• Analytics
• Complaint Status
• Resolution
• Reports

Examples:

"How many pending complaints?"

"Show water leakage complaints."

"What is my Hero Point balance?"

"Who solved the most complaints?"

Answer using provided data.

----------------------------------------

If the user asks an application-related question and the answer is not available in the data, reply:

English: "I couldn't find that information in the application data."
Hindi: "मुझे एप्लीकेशन डेटा में वह जानकारी नहीं मिली।"
Hinglish: "Mujhe application data mein wo information nahi mili."

Do NOT use this sentence for greetings or general conversation.

----------------------------------------

LANGUAGE DETECTION
Automatically detect the language (English, Hindi, Hinglish) and reply in the same language.

----------------------------------------

Always detect the user's intent first.

If it's normal conversation -> answer naturally.
If it's application-related -> use provided data.
`;

      // Format messages in required structure of chat sendMessage
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemGuide,
          temperature: 0.1,
        }
      });

      // Send the sequence of chat history to keep context
      let apiResult;
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (i === messages.length - 1) {
          const contextPrompt = `
Current User:
${JSON.stringify(currentUser)}

Complaints:
${JSON.stringify(complaintData)}

Users (includes Citizens, Authorities, Admins):
${JSON.stringify(allUsers)}

Statistics:
${JSON.stringify(stats)}

User Question:
${msg.message}`;
          apiResult = await chat.sendMessage({ message: contextPrompt });
        } else {
          await chat.sendMessage({ message: msg.message });
        }
      }

      res.json({ response: apiResult ? apiResult.text : defaultReply });

    } catch (err) {
      console.error("Gemini API Error in /api/chat:", err);
      console.log("Chat rule-based fallback used.");
      res.json({ response: getRuleBasedChatResponse(latestMessage) });
    }
  } else {
    // Rich rule-based fallback responses for offline/keyless testing
    res.json({ response: getRuleBasedChatResponse(latestMessage) });
  }
});


// Mounting static assets or Vite middleware depending on active environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("🚀 Starting development environment server with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Starting production mode. Serving built assets from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 Community Hero AI Backend listening on Port ${PORT}`);
  });
}

startServer();
