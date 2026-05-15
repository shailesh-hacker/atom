import { IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
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
}

export class UpdateGoalDto {
  @IsOptional() @IsString() thrustArea?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(UomType) uom?: UomType;
  @IsOptional() @IsNumber() target?: number;
  @IsOptional() @IsNumber() @Min(10) @Max(100) weightage?: number;
}
