import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupLocalAuth(app: Express) {
  // Set up passport serialization for local users
  passport.serializeUser((user: any, done) => {
    if (user.claims) {
      // Replit user
      done(null, { type: 'replit', id: user.claims.sub });
    } else {
      // Local user
      done(null, { type: 'local', id: user.id });
    }
  });

  passport.deserializeUser(async (obj: any, done) => {
    try {
      if (obj.type === 'replit') {
        const user = await storage.getUser(obj.id);
        done(null, { claims: { sub: obj.id }, ...user });
      } else {
        const user = await storage.getUser(obj.id);
        done(null, user);
      }
    } catch (error) {
      done(error);
    }
  });

  passport.use('local-login',
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || user.authProvider !== 'local' || !user.password) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Local registration route
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user with local auth provider
      const newUser = await storage.createLocalUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        authProvider: 'local',
        isApproved: false, // Requires admin approval
      });

      // Auto-login after registration
      req.login(newUser, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        res.status(201).json({
          message: "Registration successful. Your account is pending approval.",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            isApproved: newUser.isApproved,
            authProvider: newUser.authProvider
          }
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Local login route
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local-login', (err: any, user: SelectUser, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Check if user is approved
        if (!user.isApproved) {
          return res.status(403).json({
            message: "Account pending approval",
            needsApproval: true,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              isApproved: user.isApproved,
              authProvider: user.authProvider
            }
          });
        }

        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isApproved: user.isApproved,
            authProvider: user.authProvider
          }
        });
      });
    })(req, res, next);
  });
}

export { hashPassword, comparePasswords };