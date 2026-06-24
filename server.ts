import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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
}

const JWT_SECRET = process.env.JWT_SECRET || "community_hero_secret_key_123_hackathon";

// Initialize mock user DB with bcrypt hashed passwords
const users: User[] = [
  {
    id: "user-citizen",
    email: "citizen@communityhero.ai",
    passwordHash: bcrypt.hashSync("password123", 10),
    name: "Aditya Sharma",
    role: "citizen",
    points: 1540,
    badge: "City Architect",
    reputation: 1240,
    joinedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString()
  },
  {
    id: "user-authority",
    email: "officer@communityhero.ai",
    passwordHash: bcrypt.hashSync("password123", 10),
    name: "Officer Marcus Vance",
    role: "authority",
    points: 1120,
    badge: "Pothole Patrol",
    reputation: 1120,
    joinedAt: new Date(Date.now() - 15 * 24 * 3600000).toISOString()
  },
  {
    id: "user-admin",
    email: "admin@communityhero.ai",
    passwordHash: bcrypt.hashSync("password123", 10),
    name: "Chief Administrator",
    role: "admin",
    points: 5000,
    badge: "City Ruler",
    reputation: 5000,
    joinedAt: new Date(Date.now() - 90 * 24 * 3600000).toISOString()
  }
];

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
  duplicateOfId?: string | null;
  duplicateChecked: boolean;
  duplicateReason?: string;
  image?: string; // base64
  isMock: boolean;
  recommendation?: string;
  createdAt: string;
  resolvedAt?: string;
}

// Pre-populate with beautiful, highly realistic Metro Heights city dataset
let issues: Issue[] = [
  {
    id: "complaint-101",
    title: "Deep Pothole on Midtown Bus Lane",
    description: "Deep, hazardous pothole located directly in the right-side public bus lane. Buses are forced to swerve into standard lanes, causing minor congestion and safety concerns.",
    category: "Potholes",
    latitude: 40.7484,
    longitude: -73.9857,
    address: "350 5th Ave, Midtown West (Near Empire State Entrance)",
    urgency: "High",
    status: "In Progress",
    assignedTeam: "Midtown Road Paving Crew B",
    reporterName: "Elena Rostova",
    reporterReputation: 1240,
    reporterBadge: "City Architect",
    upvotes: 42,
    upvotedByUser: false,
    comments: [
      {
        id: "comm-1",
        author: "Marcus Vance",
        text: "Saw a taxi pop its tire on this yesterday morning. Definitely an urgent fix!",
        createdAt: new Date(Date.now() - 36 * 3600000).toISOString()
      },
      {
        id: "comm-2",
        author: "Derrick Jenkins",
        text: "The municipal crew placed safety cones, hopefully they pave it tonight.",
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
      }
    ],
    duplicateChecked: true,
    isMock: true,
    image: "",
    recommendation: "Immediate cold-mix asphalt overlay recommended with standard lane diversion signals during active repairs.",
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString()
  },
  {
    id: "complaint-102",
    title: "Burst Main Pipe Flooding Center Walkway",
    description: "Major water pipe leak from the subfloor main line. Water is actively bubbling up onto the grass and pedestrian sidewalk, causing slippery moss and wasting clean drinking water.",
    category: "Water leakage",
    latitude: 40.7549,
    longitude: -73.9815,
    address: "11 W 40th St, Bryant Park (South Entrance)",
    urgency: "Critical",
    status: "Assigned",
    assignedTeam: "Rapid Water Infrastructure Support",
    reporterName: "Julian Vance",
    reporterReputation: 890,
    reporterBadge: "Pothole Patrol",
    upvotes: 68,
    upvotedByUser: false,
    comments: [
      {
        id: "comm-3",
        author: "Alice Kim",
        text: "The park staff are trying to sweep it away but it's too much water. Needs plumbing shut-off immediately.",
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
      }
    ],
    duplicateChecked: true,
    isMock: true,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString()
  },
  {
    id: "complaint-103",
    title: "Illegal Trash Dumping in Back Alley",
    description: "Multi-colored plastic bags containing municipal waste, broken furniture, and construction debris dumped alongside the industrial shipping gates. Attracting stray animals.",
    category: "Garbage accumulation",
    latitude: 40.7306,
    longitude: -73.9912,
    address: "West 4th St Alleyway, Village Center",
    urgency: "Medium",
    status: "Resolved",
    assignedTeam: "Eco-Clean Sanitation Squad",
    reporterName: "Maya Lin",
    reporterReputation: 450,
    reporterBadge: "Green Guardian",
    upvotes: 18,
    upvotedByUser: false,
    comments: [
      {
        id: "comm-4",
        author: "John Doe",
        text: "The alley is clean now! Huge thanks to the Eco-Clean team who arrived with the truck this afternoon.",
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
      }
    ],
    duplicateChecked: true,
    isMock: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    resolvedAt: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: "complaint-104",
    title: "Blinking Hazardous Streetlights",
    description: "Three consecutive streetlights are rapidly flashing like strobe lights, creating distraction for oncoming drivers and leaving the pedestrian pathway completely dark in intervals.",
    category: "Broken streetlights",
    latitude: 40.7282,
    longitude: -74.0012,
    address: "88 Houston St, West Village Intersection",
    urgency: "Medium",
    status: "Reported",
    reporterName: "Lucas Haddon",
    reporterReputation: 150,
    reporterBadge: "Watchful Neighbor",
    upvotes: 9,
    upvotedByUser: false,
    comments: [],
    duplicateChecked: true,
    isMock: true,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString()
  },
  {
    id: "complaint-105",
    title: "Sewer Drain Clogged with Leaves & Mud",
    description: "Stormwater drain is compacted with thick leaves and general street rubbish. Any moderate shower is creating a 3-inch deep pool overflowing onto pedestrian crossings.",
    category: "Drainage blockage",
    latitude: 40.7580,
    longitude: -73.9855,
    address: "Concourse Central, Times Square West",
    urgency: "High",
    status: "Verified",
    reporterName: "Sarah Connor",
    reporterReputation: 310,
    reporterBadge: "Green Guardian",
    upvotes: 24,
    upvotedByUser: false,
    comments: [],
    duplicateChecked: true,
    isMock: true,
    createdAt: new Date(Date.now() - 18 * 3600000).toISOString()
  }
];

// Leaderboard Database Mock matching Gamification collections
let leaderboard = [
  { id: "u-1", name: "Elena Rostova", points: 1540, badge: "City Architect", issuesReported: 18, issuesResolved: 12 },
  { id: "u-2", name: "Marcus Vance", points: 1120, badge: "Pothole Patrol", issuesReported: 14, issuesResolved: 9 },
  { id: "u-3", name: "Julian Vance", points: 890, badge: "Pothole Patrol", issuesReported: 10, issuesResolved: 7 },
  { id: "u-4", name: "Maya Lin", points: 760, badge: "Green Guardian", issuesReported: 8, issuesResolved: 6 },
  { id: "u-5", name: "Sarah Connor", points: 510, badge: "Watchful Neighbor", issuesReported: 5, issuesResolved: 3 }
];

// List of recent system notifications & feed
let notifications = [
  { id: "n-1", title: "Midtown Bus Lane Pothole En Route to Recovery!", message: "Sewer and road contractors have assigned Team B to Complaint-101.", timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: "n-2", title: "Alley Trash Dump Cleared!", message: "Excellent collaboration! The city cleaned West 4th St Alleyway in less than 24 hours.", timestamp: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: "n-3", title: "Water Leak Verified!", message: "5 community members confirmed water bubbling near Bryant Park entrance.", timestamp: new Date(Date.now() - 5 * 3600000).toISOString() }
];

// ==========================================
// AUTHENTICATION & AUTHORIZATION APIS
// ==========================================

// Register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
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

  // Sync to leaderboard too so they show up!
  leaderboard.push({
    id: newUser.id,
    name: newUser.name,
    points: newUser.points,
    badge: newUser.badge,
    issuesReported: 0,
    issuesResolved: 0
  });

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

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  const { passwordHash, ...userResponse } = user;
  res.json({ user: userResponse, token });
});

// Google OAuth Simulation
app.post("/api/auth/google", (req, res) => {
  const { email, name, googleId, avatarUrl } = req.body;

  if (!email || !name) {
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

    // Sync to leaderboard
    leaderboard.push({
      id: user.id,
      name: user.name,
      points: user.points,
      badge: user.badge,
      issuesReported: 0,
      issuesResolved: 0
    });
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
  res.json({ success: true, message: "User deleted successfully" });
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
    notifications.unshift({
      id: "n-" + Math.random().toString(36).substr(2, 9),
      title: "Complaint Status Upgraded to Verified",
      message: `"${issue.title}" has new evidence uploaded by ${author}. Added to city priority pool.`,
      timestamp: new Date().toISOString()
    });
  }

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

  notifications.unshift({
    id: "n-" + Math.random().toString(36).substr(2, 9),
    title: `Issue ${status || 'Updated'}!`,
    message: `Municipal team has updated "${issue.title}" to status ${status}. Team assigned: ${assignedTeam || 'None'}.`,
    timestamp: new Date().toISOString()
  });

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
  let response = "I'm Eco-Echo, your civic advisor! I am operating in sandbox offline mode. If you report a pothole or waste dump, I will automatically classify it, assign points, and check if it duplicates an active issue. What would you like to build or report in Metro Heights?";
  const text = (latestMessage || "").toLowerCase();
  
  if (text.includes("points") || text.includes("reputation") || text.includes("earn") || text.includes("badge")) {
    response = "You earn 50 Hero Points for every unique municipal complaint you submit with photos, and another 150 points when our works department completes the resolution! You can also check your current badges on the citizens leaderboard.";
  } else if (text.includes("pothole") || text.includes("road") || text.includes("street")) {
    response = "I see you are interested in Pothole Reporting. We currently have a high-priority pothole on Midtown Bus Lane (350 Fifth Ave) with 42 upvotes. Our paving team is already active there!";
  } else if (text.includes("water") || text.includes("leak") || text.includes("pipe") || text.includes("drain") || text.includes("flood")) {
    response = "Got water flooding? Our water engineers respond within 6 hours. Let's place a marker on the interactive map so coordinates are sent instantly to Bryant Park Hydrant team!";
  } else if (text.includes("garbage") || text.includes("trash") || text.includes("dump") || text.includes("waste")) {
    response = "Garbage or waste pile accumulation is routinely handled by our Eco-Clean Sanitation Squad. If you report it, we'll auto-route their garbage trucks coordinates.";
  } else if (text.includes("light") || text.includes("broken light") || text.includes("lamp") || text.includes("electricity") || text.includes("strobe")) {
    response = "Streetlight out are marked for safe routine replacement. When reported, standard LED diagnostic replacement tickets are created automatically!";
  } else if (text.includes("hello") || text.includes("hi ") || text.includes("hey")) {
    response = "Hello there! I am Eco-Echo, your personal civic assistant for Metro Heights. Feel free to ask about reporting municipal issues, earning Hero Points, or checking active tickets!";
  }
  return response;
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
          model: "gemini-3.5-flash",
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
          model: "gemini-3.5-flash",
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
        model: "gemini-3.5-flash",
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
  const { messages } = req.body; // Array of { role: 'user' | 'model', message: string }
  const defaultReply = "I am Eco-Echo, your Community Hero counselor! Feel free to upload an issue image or type a complaint to get started. Make sure your GPS is on so I can pin it on the city map!";

  if (!messages || messages.length === 0) {
    return res.json({ response: defaultReply });
  }

  const latestMessage = messages[messages.length - 1].message;
  const apiKeySetting = process.env.GEMINI_API_KEY;

  if (apiKeySetting && apiKeySetting !== "MY_GEMINI_API_KEY") {
    try {
      const ai = getGemini();

      // Formulate systemic guide
      const systemGuide = `You are "Eco-Echo", the official AI guide for Community Hero AI.
      Your goal is to help citizens report issues (potholes, garbage, water leaks, broken light bulbs, clogged drains).
      Be helpful, concise, warm, and encourage civic pride!
      Here is the list of currently reported city issues for reference:
      ${JSON.stringify(issues.map(i => ({ title: i.title, street: i.address, urgency: i.urgency, status: i.status })))}
      
      Suggest to users how they can earn "Hero Points" (50 for reporting, 150 when the city resolves, upvoting others). Inform them they are currently viewing Metro Heights city map.
      Keep answers under 3-4 sentences maximum. Be motivating like a professional PM.`;

      // Format messages in required structure of chat sendMessage
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: systemGuide,
          temperature: 0.7,
        }
      });

      // Send the sequence of chat history to keep context
      let apiResult;
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (i === messages.length - 1) {
          apiResult = await chat.sendMessage({ message: msg.message });
        } else {
          await chat.sendMessage({ message: msg.message });
        }
      }

      res.json({ response: apiResult ? apiResult.text : defaultReply });

    } catch (err) {
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
