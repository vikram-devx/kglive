import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, timingSafeEqual, randomBytes } from "crypto";
import { promisify } from "util";
import * as bcryptjs from "bcryptjs";
import { storage } from "./storage";
import { User as SelectUser, UserRole } from "@shared/schema";
import { AuthInfo } from "passport";

// Promisify the scrypt function
const scryptAsync = promisify(scrypt);

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export async function hashPassword(password: string) {
  // Use our native crypto.scrypt function for password hashing
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    // Ensure we have valid inputs
    if (!supplied || !stored) {
      console.log("Missing password or stored hash");
      return false;
    }

    // Check for bcrypt format first
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
      try {
        console.log("Checking bcrypt password format");
        const result = await bcryptjs.compare(supplied, stored);
        console.log("Bcrypt comparison result:", result ? "success" : "failed");
        return result;
      } catch (err) {
        console.error('Error comparing bcrypt password:', err);
        return false;
      }
    } 
    // Check if it's our crypto.scrypt format (hex.salt)
    else if (stored.includes('.')) {
      try {
        console.log("Checking crypto.scrypt password format");
        const parts = stored.split('.');
        if (parts.length !== 2) {
          console.log("Invalid crypto.scrypt format (not hash.salt)");
          return false;
        }
        
        const [hashedPart, salt] = parts;
        console.log(`Processing hash: ${hashedPart.substring(0, 10)}... with salt: ${salt.substring(0, 8)}...`);
        
        const hashedBuf = Buffer.from(hashedPart, 'hex');
        const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
        
        // Ensure buffers are same length before comparison to avoid error
        if (hashedBuf.length !== suppliedBuf.length) {
          console.log(`Buffer length mismatch: stored=${hashedBuf.length}, supplied=${suppliedBuf.length}`);
          return false;
        }
        
        const result = timingSafeEqual(hashedBuf, suppliedBuf);
        console.log("Crypto.scrypt comparison result:", result ? "success" : "failed");
        return result;
      } catch (err) {
        console.error('Error comparing crypto.scrypt password:', err);
        return false;
      }
    } 
    // Unknown format
    else {
      console.log(`Unsupported password format: ${stored.substring(0, 4)}...`);
      return false;
    }
  } catch (error) {
    console.error("Error in comparePasswords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "coinflip-game-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to false for development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'lax',
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Authenticating user: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`Password verification result: ${passwordMatch ? "success" : "failed"}`);
        
        if (!passwordMatch) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        if (user.isBlocked) {
          return done(null, false, { message: "Account is blocked. Please contact support." });
        }

        return done(null, user);
      } catch (err) {
        console.error("Authentication error:", err);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Set default role to player 
      let role = UserRole.PLAYER;
      
      // Only admins can create users with different roles
      if (req.isAuthenticated() && req.user?.role === UserRole.ADMIN) {
        role = req.body.role || UserRole.PLAYER;
      } else if (req.isAuthenticated() && req.user?.role === UserRole.SUBADMIN) {
        // Subadmins can ONLY create players, override any role passed
        role = UserRole.PLAYER;
      }

      // Assign users to admins/subadmins by default
      let assignedTo = null;
      if (role === UserRole.PLAYER && req.isAuthenticated()) {
        assignedTo = req.user?.id;
      }

      const user = await storage.createUser({
        ...req.body,
        role,
        assignedTo,
        password: await hashPassword(req.body.password),
      });

      // Remove password from the response
      const { password, ...userWithoutPassword } = user;

      // Only auto-login if this is a self-registration (not initiated by admin/subadmin)
      if (!req.isAuthenticated()) {
        // Normal registration flow - log the user in
        req.login(user, (err) => {
          if (err) return next(err);
          res.status(201).json({ ...userWithoutPassword, autoLogin: true });
        });
      } else {
        // Admin/subadmin is creating a user - don't log in as that user
        res.status(201).json({ ...userWithoutPassword, autoLogin: false });
      }
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt:", req.body.username);
    
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info?: AuthInfo) => {
      if (err) {
        console.log("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Authentication failed:", info?.message || "No user");
        return res.status(401).json({ 
          message: info?.message || "Invalid username or password" 
        });
      }
      
      console.log("Authentication successful for:", (user as SelectUser).username);
      
      req.login(user, (err: Error | null) => {
        if (err) {
          console.log("Login error:", err);
          return next(err);
        }
        // Remove password from the response
        const { password, ...userWithoutPassword } = user as SelectUser;
        console.log("Login successful, sending response");
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Login as subadmin - only available to admin users
  app.post("/api/admin/login-as/:userId", async (req, res, next) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized: Please login first" });
      }
      
      if (req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Forbidden: Only admins can use this feature" });
      }
      
      const { userId } = req.params;
      
      // Find the user to login as
      const targetUser = await storage.getUser(parseInt(userId));
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify that the target user is a subadmin
      if (targetUser.role !== UserRole.SUBADMIN) {
        return res.status(403).json({ 
          message: "You can only login as subadmin accounts" 
        });
      }
      
      // Ensure we don't expose the password in the response
      const { password, ...userWithoutPassword } = targetUser as SelectUser;
      
      // Switch the login to the subadmin account
      await new Promise<void>((resolve, reject) => {
        req.logout((err) => {
          if (err) {
            console.error("Logout error during login-as:", err);
            return reject(err);
          }
          resolve();
        });
      });
      
      // After logout completes, login as the target user
      await new Promise<void>((resolve, reject) => {
        req.login(targetUser, (err) => {
          if (err) {
            console.error("Login-as error:", err);
            return reject(err);
          }
          resolve();
        });
      });
      
      console.log(`Admin logged in as subadmin: ${targetUser.username}`);
      
      // Important: Set the response header to JSON to prevent any middleware from changing it
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(userWithoutPassword);
    } catch (err) {
      console.error("Error in login-as functionality:", err);
      // Make sure we return a proper JSON error response
      if (!res.headersSent) {
        res.status(500).json({ message: "Internal server error during login-as operation" });
      } else {
        next(err);
      }
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Remove password from the response
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
  
  // Password change endpoint
  app.patch("/api/user/password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Verify the current password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify the current password
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password in the database
      const updatedUser = await storage.updateUserPassword(req.user.id, hashedPassword);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      // Return success response
      res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
      console.error("Error updating password:", err);
      next(err);
    }
  });
  
  // Admin password reset endpoint - allows admins to reset any user's password
  app.patch("/api/admin/reset-password/:userId", async (req, res, next) => {
    try {
      // Check if user is authenticated and is an admin
      if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: "Forbidden: Only admins can reset passwords" });
      }
      
      const { userId } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }
      
      // Find the user whose password will be reset
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password in the database
      const updatedUser = await storage.updateUserPassword(user.id, hashedPassword);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to reset password" });
      }
      
      // Return success response
      res.status(200).json({ 
        message: `Password for user ${user.username} was reset successfully` 
      });
    } catch (err) {
      console.error("Error resetting password:", err);
      next(err);
    }
  });
  
  // Subadmin password reset endpoint - allows subadmins to reset their players' password
  app.patch("/api/subadmin/reset-password/:userId", async (req, res, next) => {
    try {
      // Check if user is authenticated and is a subadmin
      if (!req.isAuthenticated() || req.user.role !== UserRole.SUBADMIN) {
        return res.status(403).json({ message: "Forbidden: Only subadmins can access this endpoint" });
      }
      
      const { userId } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }
      
      // Find the user whose password will be reset
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify that the user belongs to this subadmin
      if (user.assignedTo !== req.user.id) {
        return res.status(403).json({ 
          message: "You can only reset passwords for players assigned to you" 
        });
      }
      
      // Verify that the user is a player (subadmins can only reset player passwords)
      if (user.role !== UserRole.PLAYER) {
        return res.status(403).json({ 
          message: "You can only reset passwords for player accounts" 
        });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password in the database
      const updatedUser = await storage.updateUserPassword(user.id, hashedPassword);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to reset password" });
      }
      
      // Return success response
      res.status(200).json({ 
        message: `Password for player ${user.username} was reset successfully` 
      });
    } catch (err) {
      console.error("Error resetting password:", err);
      next(err);
    }
  });
}

// Middleware for role-based access control
export function requireRole(roles: UserRole | UserRole[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!allowedRoles.includes(req.user!.role as UserRole)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    next();
  };
}
