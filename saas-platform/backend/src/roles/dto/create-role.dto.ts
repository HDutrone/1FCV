import { IsEnum, IsString } from 'class-validator';
import { RoleName } from '@prisma/client';

export class CreateRoleDto {
  @IsEnum(RoleName)
  name: RoleName;

  @IsString()
  label: string;
}
