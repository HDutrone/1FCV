import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() roleId?: string;
  @IsOptional() @IsString() branchId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
