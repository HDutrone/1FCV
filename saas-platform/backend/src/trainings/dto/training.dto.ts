import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateTrainingProgramDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() provider?: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
}

export class EnrollDto {
  @IsString() programId: string;
  @IsString() employeeId: string;
}
