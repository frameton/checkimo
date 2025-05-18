export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

// Utility to hydrate a role from a string (optional)
export function parseRole(value: string | null | undefined): Role | null {
  if (!value) {
    return null;
  }
  switch (value.toUpperCase()) {
    case Role.USER:
      return Role.USER;
    case Role.ADMIN:
      return Role.ADMIN;
    default:
      return null;
  }
}

// Example usage in a User model
// import { Role } from './role.model';
// export interface User {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   role: Role;
// }
