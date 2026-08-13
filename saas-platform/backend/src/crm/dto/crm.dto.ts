import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadStage } from '@prisma/client';

export class CreateCustomerDto {
  @IsString() name: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() company?: string;
}

export class UpdateStageDto {
  @IsEnum(LeadStage) stage: LeadStage;
}

export class AddNoteDto {
  @IsString() content: string;
}
