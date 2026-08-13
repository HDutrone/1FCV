import { IsString } from 'class-validator';

export class CreateDirectionDto {
  @IsString() name: string;
  @IsString() branchId: string;
}

export class CreateDepartmentDto {
  @IsString() name: string;
  @IsString() directionId: string;
}

export class CreateServiceDto {
  @IsString() name: string;
  @IsString() departmentId: string;
}
