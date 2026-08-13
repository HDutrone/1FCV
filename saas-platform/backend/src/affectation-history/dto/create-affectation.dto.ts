import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAffectationDto {
  @IsString() employeeId: string;
  @IsOptional() @IsString() toServiceId?: string;
  @IsOptional() @IsString() toBranchId?: string;
  @IsOptional() @IsString() toPosition?: string;
  @IsOptional() @IsString() reason?: string;
  @IsDateString() effectiveAt: string;
}
