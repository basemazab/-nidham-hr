import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'جميع الموظفين' })
  @ApiQuery({ name: 'factoryId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Request() req: any,
    @Query('factoryId') factoryId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.employeesService.findAll(req.user.companyId, { factoryId, departmentId, category, status });
  }

  @Get('stats')
  @ApiOperation({ summary: 'إحصائيات الموظفين' })
  getStats(@Request() req: any) {
    return this.employeesService.getStats(req.user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'بيانات موظف' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'إضافة موظف جديد' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث بيانات موظف' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'إنهاء خدمة موظف' })
  delete(@Param('id') id: string) {
    return this.employeesService.delete(id);
  }
}
