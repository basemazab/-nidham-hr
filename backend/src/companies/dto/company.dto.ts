import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'مجموعة الاتحاد' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'Al-Ittihad Group' })
  @IsString()
  nameEn: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  socialInsuranceNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false, default: 6 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(7)
  workDaysPerWeek?: number;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class CreateFactoryDto {
  @ApiProperty({ example: 'مصنع أبواب WPC' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 'WPC Doors Factory' })
  @IsString()
  nameEn: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;
}
