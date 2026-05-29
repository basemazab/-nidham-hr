import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'أحمد محمد علي' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'Ahmed Mohamed Ali' })
  @IsString()
  nameEn: string;

  @ApiProperty({ example: '28501011234567' })
  @IsString()
  nationalId: string;

  @ApiProperty({ example: '1985-01-01' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: 'male' })
  @IsString()
  gender: string;

  @ApiProperty({ required: false, enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'] })
  @IsOptional()
  @IsEnum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'])
  maritalStatus?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  dependentsCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addressAr?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addressEn?: string;

  @ApiProperty()
  @IsString()
  companyId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  factoryId?: string;

  @ApiProperty()
  @IsString()
  departmentId: string;

  @ApiProperty()
  @IsString()
  positionId: string;

  @ApiProperty({ example: '2020-01-01' })
  @IsDateString()
  hireDate: string;

  @ApiProperty({ required: false, enum: ['PERMANENT', 'FIXED_TERM', 'TEMPORARY', 'PROBATION'] })
  @IsOptional()
  contractType?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  @ApiProperty({ enum: ['MONTHLY', 'WEEKLY', 'HOURLY'] })
  @IsString()
  category: any;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  basicSalary: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? Number(value) : undefined)
  hourlyRate?: number;

  @ApiProperty({ example: 4500 })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  insurableSalary: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  socialInsuranceNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
