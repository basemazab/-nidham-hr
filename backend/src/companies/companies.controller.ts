import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCompanyDto, UpdateCompanyDto, CreateFactoryDto } from './dto/company.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'جميع الشركات' })
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'بيانات شركة' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء شركة جديدة' })
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث بيانات شركة' })
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(id, dto);
  }

  @Get(':id/factories')
  @ApiOperation({ summary: 'مصانع الشركة' })
  getFactories(@Param('id') id: string) {
    return this.companiesService.getFactories(id);
  }

  @Post(':id/factories')
  @ApiOperation({ summary: 'إضافة مصنع' })
  createFactory(@Param('id') id: string, @Body() dto: CreateFactoryDto) {
    return this.companiesService.createFactory(id, dto);
  }

  @Get(':id/departments')
  @ApiOperation({ summary: 'أقسام الشركة' })
  getDepartments(@Param('id') id: string) {
    return this.companiesService.getDepartments(id);
  }

  @Post(':id/departments')
  @ApiOperation({ summary: 'إضافة قسم' })
  createDepartment(@Param('id') id: string, @Body() body: { nameAr: string; nameEn: string }) {
    return this.companiesService.createDepartment(id, body);
  }

  @Post('departments/:deptId/positions')
  @ApiOperation({ summary: 'إضافة وظيفة' })
  createPosition(@Param('deptId') deptId: string, @Body() body: { nameAr: string; nameEn: string }) {
    return this.companiesService.createPosition(deptId, body);
  }
}
