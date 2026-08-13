import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @IsString() matricule: string;
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() position: string;
  @IsDateString() hireDate: string;
  @IsString() branchId: string;
  @IsOptional() @IsString() serviceId?: string;
  @IsOptional() @IsString() managerId?: string;
}

export class UpdateEmployeeDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsString() status?: string;
}
