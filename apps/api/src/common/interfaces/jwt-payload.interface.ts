import { UserRole, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId: string;
}
