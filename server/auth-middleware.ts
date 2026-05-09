import type { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";
import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: string;
    userEmail: string;
    brandId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export type UserRole = "customer" | "admin" | "agent" | "marketing";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const userRole = req.session.userRole as UserRole;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.session.userRole !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}

export function requireAgentOrAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const role = req.session.userRole;
  if (role !== "admin" && role !== "agent") {
    return res.status(403).json({ message: "Agent or admin access required" });
  }
  
  next();
}

export function requireMarketing(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const role = req.session.userRole;
  if (role !== "admin" && role !== "marketing") {
    return res.status(403).json({ message: "Marketing access required" });
  }
  
  next();
}
