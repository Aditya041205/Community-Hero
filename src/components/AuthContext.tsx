import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile, AuthState } from "../types";
import { 
  auth, 
  db,
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

interface AuthContextType extends AuthState {
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem("ch_token"),
    loading: true,
    error: null,
  });

  // Keep track of mounted status to avoid setting state after unmount
  useEffect(() => {
    let isMounted = true;

    // Log configuration details for diagnostic auditing
    console.log("[AUTH-INIT] Diagnostics: Checking Firebase Auth configuration...");
    if (auth && auth.app) {
      console.log("[AUTH-INIT] App Name:", auth.app.name);
      console.log("[AUTH-INIT] Project ID:", auth.app.options.projectId);
      console.log("[AUTH-INIT] API Key presence:", !!auth.app.options.apiKey);
      console.log("[AUTH-INIT] Auth Domain:", auth.app.options.authDomain);
    } else {
      console.error("[AUTH-INIT] Firebase auth object is uninitialized!");
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        try {
          console.log(`[AUTH-CLIENT] Firebase user authenticated: ${firebaseUser.email}`);
          
          // Determine Role and create/update Firestore document
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let role = "";
          const displayName = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Civic Connect User";
          const photoURL = firebaseUser.photoURL || "";
          
          if (!userDocSnap.exists()) {
            // First login: Determine role from email if needed, default to citizen
            const getRoleByEmail = (email: string): string => {
              const normalized = email.toLowerCase().trim();
              if (normalized === "adityasharma01021@gmail.com") return "admin";
              if (normalized === "adityaksharma00412@gmail.com") return "authority";
              return "citizen";
            };
            role = getRoleByEmail(firebaseUser.email || "");
            
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              displayName,
              email: firebaseUser.email || "",
              photoURL,
              role,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp()
            });
            console.log(`[AUTH-CLIENT] New user created with role: ${role}`);
          } else {
            // Subsequent logins: Do NOT overwrite the existing role. Load the stored role.
            const existingData = userDocSnap.data();
            role = existingData && existingData.role ? existingData.role : "citizen";
            
            console.log(`[AUTH-CLIENT] Existing user found: ${firebaseUser.email}`);
            console.log(`[AUTH-CLIENT] Existing role loaded: ${role}`);
            
            // Update only displayName, photoURL, lastLoginAt so existing fields are preserved
            await setDoc(userDocRef, {
              displayName,
              photoURL,
              lastLoginAt: serverTimestamp()
            }, { merge: true });
            console.log("[AUTH-CLIENT] Firestore user profile lastLoginAt updated.");
          }
          
          // Obtain client Firebase ID Token
          const idToken = await firebaseUser.getIdToken();
          
          // Synchronize with our backend to retrieve role & local JWT
          const syncRes = await fetch("/api/auth/firebase-sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Civic Connect User",
              role: role
            })
          });

          if (syncRes.ok) {
            const data = await syncRes.json();
            
            // Persist Express JWT token locally
            localStorage.setItem("ch_token", data.token);

            setState({
              user: data.user,
              token: data.token,
              loading: false,
              error: null
            });
          } else {
            const errorData = await syncRes.json();
            console.error("[AUTH-CLIENT] Failed to sync user with backend:", errorData);
            
            setState({
              user: null,
              token: null,
              loading: false,
              error: errorData.error || "Failed to synchronize profile with server."
            });
          }
        } catch (syncErr) {
          console.error("[AUTH-CLIENT] Network error syncing user:", syncErr);
          setState({
            user: null,
            token: null,
            loading: false,
            error: "Network error during server profile synchronization."
          });
        }
      } else {
        console.log("[AUTH-CLIENT] No Firebase user detected. Clearing local session.");
        localStorage.removeItem("ch_token");
        setState({
          user: null,
          token: null,
          loading: false,
          error: null
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // 1. Create firebase user credentials
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Update display name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // State and local sync will be automatically triggered by onAuthStateChanged!
      return { success: true };
    } catch (err: any) {
      console.error("[AUTH-CLIENT] Firebase registration failed:", err);
      let errorMsg = "Registration failed. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        errorMsg = "This email is already in use.";
      } else if (err.code === "auth/invalid-email") {
        errorMsg = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        errorMsg = "Password must be at least 6 characters long.";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMsg = "Email/Password authentication is not enabled in your Firebase Console. Please go to your Firebase Console, click 'Authentication' -> 'Sign-in method', and enable 'Email/Password'.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Sign in using email/password
      await signInWithEmailAndPassword(auth, email, password);
      // State and local sync will be automatically triggered by onAuthStateChanged!
      return { success: true };
    } catch (err: any) {
      console.error("[AUTH-CLIENT] Firebase email login failed:", err);
      let errorMsg = "Invalid email or password.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        errorMsg = "Invalid email or password.";
      } else if (err.code === "auth/too-many-requests") {
        errorMsg = "Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMsg = "Email/Password authentication is not enabled in your Firebase Console. Please go to your Firebase Console, click 'Authentication' -> 'Sign-in method', and enable 'Email/Password'.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Launch standard Google OAuth interactive Sign-In popup
      await signInWithPopup(auth, googleProvider);
      // State and local sync will be automatically triggered by onAuthStateChanged!
      return { success: true };
    } catch (err: any) {
      console.error("[AUTH-CLIENT] Firebase Google Sign-In failed:", err);
      let errorMsg = "Google authentication failed. Please try again.";
      if (err.code === "auth/popup-closed-by-user") {
        errorMsg = "The sign-in window was closed before finishing authentication. Please click 'Continue with Google' to try again.";
      } else if (err.code === "auth/blocked-by-popup-resolver") {
        errorMsg = "Sign-in popup blocked by your browser. Please allow popups.";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMsg = "Google Sign-In is not enabled in your Firebase Console. Please go to your Firebase Console, click 'Authentication' -> 'Sign-in method', add the 'Google' provider, and enable it.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return "A password reset email has been sent. Please check your inbox.";
    } catch (err: any) {
      console.error("[AUTH-CLIENT] Forgot password failed:", err);
      if (err.code === "auth/user-not-found") {
        return "No account exists with this email address.";
      } else if (err.code === "auth/invalid-email") {
        return "Please enter a valid email address.";
      }
      return "Unable to send password reset email. Please try again.";
    }
  };

  const logout = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await signOut(auth);
      // State and local sync will be automatically triggered by onAuthStateChanged!
    } catch (err) {
      console.error("[AUTH-CLIENT] Sign out failed:", err);
      // Fallback manual state clear
      localStorage.removeItem("ch_token");
      setState({
        user: null,
        token: null,
        loading: false,
        error: null
      });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, register, login, loginWithGoogle, forgotPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
