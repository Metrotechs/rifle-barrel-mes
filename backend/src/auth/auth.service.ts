/**
 * Auth Service
 * Handles user authentication and JWT token generation
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface UserPayload {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'supervisor' | 'operator';
  department?: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Temporary in-memory users (should be moved to database)
const DEFAULT_USERS: UserPayload[] = [
  { id: '1', username: 'admin', fullName: 'System Admin', role: 'admin', department: 'IT' },
  { id: '2', username: 'supervisor', fullName: 'Floor Supervisor', role: 'supervisor', department: 'Manufacturing' },
  { id: '3', username: 'operator1', fullName: 'John Smith', role: 'operator', department: 'Manufacturing' },
  { id: '4', username: 'operator2', fullName: 'Jane Doe', role: 'operator', department: 'Manufacturing' },
  { id: '5', username: 'operator3', fullName: 'Bob Wilson', role: 'operator', department: 'Manufacturing' },
];

@Injectable()
export class AuthService {
  private users: UserPayload[] = [...DEFAULT_USERS];

  constructor(private jwtService: JwtService) {}

  /**
   * Validate user credentials
   * In production, this should check against a database with hashed passwords
   */
  async validateUser(username: string, password: string): Promise<UserPayload | null> {
    // Demo: accept any password for known users
    // TODO: Replace with proper password validation from database
    const user = this.users.find((u) => u.username === username);
    if (user) {
      return user;
    }
    return null;
  }

  /**
   * Generate JWT token for authenticated user
   */
  async login(user: UserPayload): Promise<{ access_token: string; user: UserPayload }> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  /**
   * Validate JWT token payload
   */
  async validateToken(payload: JwtPayload): Promise<UserPayload | null> {
    const user = this.users.find((u) => u.id === payload.sub);
    return user || null;
  }

  /**
   * Get all users (for admin)
   */
  async getUsers(): Promise<UserPayload[]> {
    return this.users;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserPayload | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<UserPayload, 'id'>): Promise<UserPayload> {
    const newUser: UserPayload = {
      ...userData,
      id: String(Date.now()),
    };
    this.users.push(newUser);
    return newUser;
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: Partial<UserPayload>): Promise<UserPayload | null> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    
    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<boolean> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    
    this.users.splice(index, 1);
    return true;
  }
}
