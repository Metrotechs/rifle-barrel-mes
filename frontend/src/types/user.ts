// User types and interfaces

export type UserRole = 'operator' | 'supervisor' | 'admin';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  created_at: string;
}

export interface LoginSession {
  user: User;
  tabletId: string;
  loginTime: string;
}

export interface CreateUserInput {
  username: string;
  fullName: string;
  role: UserRole;
  department: string;
  isActive: boolean;
}
