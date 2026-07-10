export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  USER = 'USER'
}

/**
 * Checks if a user's current role is authorized against an allowed access list.
 * @param userRole Current role of the session user
 * @param allowedRoles Array of roles permitted to view the route/component
 */
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Convenience guard check to verify if a role belongs to an Administrator.
 * @param userRole Role string to test
 */
export function isAdmin(userRole: string): boolean {
  return userRole === UserRole.ADMIN;
}

/**
 * Checks if a role belongs to staff (ADMIN or STAFF).
 * @param userRole Role string to test
 */
export function isStaff(userRole: string): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
}
