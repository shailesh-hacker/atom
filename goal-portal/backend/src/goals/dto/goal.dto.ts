import { IsEnum, IsNumber, IsOptional, IsString, IsArray, Min, Max, IsBoolean } from 'class-validator';
import { UomType } from '@prisma/client';

export class CreateGoalDto {
  @IsString()
  thrustArea: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(UomType)
  uom: UomType;

  @IsNumber()
  target: number;

  @IsNumber()
  @Min(10)
  @Max(100)
  weightage: number;

  @IsOptional()
  @IsBoolean()
  isInverse?: boolean;

  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class UpdateGoalDto {
  @IsOptional() @IsString() thrustArea?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(UomType) uom?: UomType;
  @IsOptional() @IsNumber() target?: number;
  @IsOptional() @IsNumber() @Min(10) @Max(100) weightage?: number;
  @IsOptional() @IsBoolean() isInverse?: boolean;
}

export class ReturnGoalDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ManagerEditGoalDto {
  @IsOptional() @IsNumber() target?: number;
  @IsOptional() @IsNumber() @Min(10) @Max(100) weightage?: number;
}

export class SharedGoalDto {
  @IsString()
  thrustArea: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(UomType)
  uom: UomType;

  @IsNumber()
  target: number;

  @IsNumber()
  @Min(10)
  @Max(100)
  weightage: number;

  @IsOptional()
  @IsBoolean()
  isInverse?: boolean;

  @IsArray()
  @IsString({ each: true })
  employeeIds: string[];

  @IsOptional()
  @IsString()
  primaryOwnerId?: string;
}

