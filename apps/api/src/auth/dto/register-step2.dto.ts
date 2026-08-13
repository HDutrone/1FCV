import { IsNotEmpty, IsOptional, IsPhoneNumber } from 'class-validator';

export class RegisterStep2Dto {
  @IsNotEmpty()
  fullName!: string;

  @IsOptional()
  @IsPhoneNumber(undefined, {
    message: 'Enter a valid phone number, e.g. +243812345678',
  })
  phone?: string;
}
