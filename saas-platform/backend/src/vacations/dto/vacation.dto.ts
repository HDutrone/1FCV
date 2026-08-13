import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { VacationType } from '@prisma/client';

export class CreateVacationRequestDto {
  @IsString() employeeId: string;
  @IsEnum(VacationType) type: VacationType;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsString() reason?: string;
}

export class DecideVacationDto {
  @IsString() decision: 'APPROVED' | 'REJECTED';
}
