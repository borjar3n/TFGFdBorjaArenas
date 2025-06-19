import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, UserRole } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    if (!stored || !stored.includes('.')) {
      console.error("Invalid password format, expected hash.salt");
      return false;
    }
    
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'agrogestion-secret-key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 86400000, // 24 hours
      secure: false,
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        
        // Update last login time
        if (user) {
          await storage.updateUser(user.id, {
            lastLogin: new Date()
          });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(null, false);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { accountType, companyName, invitationCode, ...userData } = req.body;
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      let companyId: number;
      let userRole = userData.role || "worker";

      if (accountType === "admin") {
        // Create company for admin
        if (!companyName?.trim()) {
          return res.status(400).json({ message: "El nombre de la empresa es obligatorio para administradores" });
        }
        
        const company = await storage.createCompany({
          name: companyName.trim(),
          description: `Explotación agrícola de ${userData.name}`,
          address: ""
        });
        
        companyId = company.id;
        userRole = "company_admin";
        
      } else if (accountType === "worker") {
        // Validate invitation code and get company
        if (!invitationCode?.trim()) {
          return res.status(400).json({ message: "El código de invitación es obligatorio para trabajadores" });
        }
        
        const invitation = await storage.getInvitationByCode(invitationCode.trim());
        if (!invitation || !invitation.isActive || 
            (invitation.expiresAt && invitation.expiresAt < new Date()) ||
            (invitation.maxUses && invitation.currentUses && invitation.currentUses >= invitation.maxUses)) {
          return res.status(400).json({ message: "Código de invitación inválido, expirado o agotado" });
        }
        
        companyId = invitation.companyId;
        userRole = invitation.role;
        
        // TODO: Increment usage count (temporarily disabled due to SQL issue)
        // await storage.updateInvitationCode(invitation.id, {
        //   currentUses: (invitation.currentUses || 0) + 1,
        // });
        
      } else {
        return res.status(400).json({ message: "Tipo de cuenta inválido" });
      }

      // Create user with company reference
      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password),
        role: userRole,
        currentCompanyId: companyId,
      });

      // Add user to company members
      await storage.createCompanyMember({
        userId: user.id,
        companyId,
        role: userRole,
        joinedAt: new Date(),
      });

      // Worker registration already updated the invitation usage count above

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  // Switch active company
  app.put("/api/user/current-company", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { companyId } = req.body;
    
    try {
      // Verify user has access to this company
      const userCompanies = await storage.getUserCompanies(req.user.id);
      const hasAccess = userCompanies.some(company => company.id === companyId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: "No tienes acceso a esta empresa" });
      }
      
      // Update user's current company
      const updatedUser = await storage.updateUser(req.user.id, { currentCompanyId: companyId });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      // Update session user
      req.user.currentCompanyId = companyId;
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error switching company:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
}
