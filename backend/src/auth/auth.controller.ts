import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db.js';
import { User } from '../database/schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'talentflow-enterprise-secret-key-2026';

export class AuthController {
  public static async signup(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, password, company, role } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({
          success: false,
          error: 'Name, email, and password are required'
        });
        return;
      }

      const existing = db.users.findByEmail(email);
      if (existing) {
        res.status(400).json({
          success: false,
          error: 'An account with this email address already exists'
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser: User = {
        id: `USR-${uuidv4().substring(0, 8).toUpperCase()}`,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: role === 'ADMIN' ? 'ADMIN' : 'BUYER',
        company: company ? company.trim() : 'Enterprise Client',
        passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const created = db.users.create(newUser);
      const token = jwt.sign(
        { id: created.id, email: created.email, role: created.role, name: created.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { passwordHash: _, ...userProfile } = created;

      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: {
          user: userProfile,
          token
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Internal server error during registration'
      });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      const user = db.users.findByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
        return;
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { passwordHash: _, ...userProfile } = user;

      res.json({
        success: true,
        message: 'Logged in successfully',
        data: {
          user: userProfile,
          token
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Internal server error during login'
      });
    }
  }

  public static getMe(req: Request, res: Response): void {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = db.users.findById(decoded.id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      const { passwordHash: _, ...userProfile } = user;
      res.json({
        success: true,
        data: userProfile
      });
    } catch (err) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired session token'
      });
    }
  }

  public static getDemoAccounts(req: Request, res: Response): void {
    res.json({
      success: true,
      data: [
        {
          role: 'ADMIN',
          email: 'admin@talentflow.ai',
          password: 'Admin@123',
          name: 'Rohit Sharma',
          title: 'Chief Procurement Officer (Full Admin Rights)'
        },
        {
          role: 'BUYER',
          email: 'dev.buyer@talentflow.ai',
          password: 'Buyer@123',
          name: 'Priya Patel',
          title: 'Senior Lead Architect (Buyer Procurement)'
        }
      ]
    });
  }
}
