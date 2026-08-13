export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE";
export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export interface SafeUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  status: UserStatus;
  companyId: string;
}

export interface AuthResponse {
  accessToken: string;
  user: SafeUser;
}
