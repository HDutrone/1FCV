import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateAccountDto {
  @IsString() code: string;
  @IsString() name: string;
  @IsString() type: string;
}

class JournalLineDto {
  @IsString() accountId: string;
  @IsOptional() @IsNumber() debit?: number;
  @IsOptional() @IsNumber() credit?: number;
}

export class CreateJournalEntryDto {
  @IsString() reference: string;
  @IsOptional() @IsString() memo?: string;
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}
