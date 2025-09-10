import type { User } from '@shared/schema';

export interface LoginCredentials {
  username: string;
  password: string;
}

export async function loginUser(credentials: LoginCredentials): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (response.ok) {
      const { user } = await response.json();
      return user;
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  
  // Doctor has all permissions
  if (user.role === 'doctor') return true;
  
  // Receptionist permissions
  const receptionistPermissions = [
    'view_patients',
    'create_patients',
    'edit_patients',
    'view_appointments',
    'create_appointments',
    'edit_appointments',
    'checkin_patients',
    'view_billing',
    'create_billing',
  ];
  
  return receptionistPermissions.includes(permission);
}
