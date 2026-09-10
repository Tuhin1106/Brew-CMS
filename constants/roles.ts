import type { UserRole } from '../types/cms';

export type AppSection = 'Dashboard' | 'Floor' | 'POS' | 'Kitchen' | 'Reports';

export const USER_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'WAITER', 'CHEF'];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  WAITER: 'Waiter',
  CHEF: 'Chef',
};

const ALLOWED_SECTIONS: Record<UserRole, AppSection[]> = {
  ADMIN: ['Dashboard', 'Floor', 'POS', 'Kitchen', 'Reports'],
  MANAGER: ['Dashboard', 'Floor', 'POS', 'Kitchen'],
  WAITER: ['Floor', 'POS', 'Kitchen'],
  CHEF: ['Kitchen'],
};

export function roleLabel(role: string) {
  return ROLE_LABELS[role as UserRole] ?? 'Staff';
}

export function canAccessSection(role: UserRole | undefined, section: AppSection) {
  if (!role) {
    return false;
  }
  return ALLOWED_SECTIONS[role].includes(section);
}

export function homeSection(role: UserRole | undefined): AppSection {
  if (role === 'CHEF') {
    return 'Kitchen';
  }
  if (role === 'WAITER') {
    return 'Floor';
  }
  return 'Dashboard';
}

export function migrateUserRole(role: string): UserRole {
  if (role === 'ADMIN' || role === 'MANAGER' || role === 'WAITER' || role === 'CHEF') {
    return role;
  }
  if (role === 'BARISTA') {
    return 'CHEF';
  }
  if (role === 'CASHIER') {
    return 'WAITER';
  }
  return 'WAITER';
}
