import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto, ReturnGoalDto, ManagerEditGoalDto, SharedGoalDto } from './dto/goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('goals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get('mine')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.ADMIN)
  async getMine(@Request() req, @Query('managerId') managerId?: string) {
    return this.goalsService.findAll(req.user.id, req.user.role, managerId);
  }

  @Post()
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.ADMIN)
  async create(@Request() req, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(req.user.id, req.user.role, dto);
  }

  @Patch(':id')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.ADMIN)
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return this.goalsService.update(id, req.user.id, req.user.role, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.goalsService.remove(id, req.user.id, req.user.role);
  }

  @Post('submit')
  @Roles(Role.EMPLOYEE)
  async submit(@Request() req) {
    return this.goalsService.submitAll(req.user.id);
  }

  @Patch(':id/submit')
  @Roles(Role.EMPLOYEE)
  async submitWork(@Request() req, @Param('id') id: string) {
    return this.goalsService.submitWork(id, req.user.id);
  }

  @Get('team')
  @Roles(Role.MANAGER)
  async getTeam(@Request() req) {
    return this.goalsService.findTeamGoals(req.user.id);
  }

  @Patch(':id/approve')
  @Roles(Role.MANAGER)
  async approve(@Request() req, @Param('id') id: string) {
    return this.goalsService.approve(id, req.user.id);
  }

  @Patch(':id/return')
  @Roles(Role.MANAGER)
  async returnGoal(@Request() req, @Param('id') id: string, @Body() dto: ReturnGoalDto) {
    return this.goalsService.returnForRework(id, req.user.id, dto.reason);
  }

  @Patch(':id/manager-edit')
  @Roles(Role.MANAGER, Role.ADMIN)
  async managerEdit(@Request() req, @Param('id') id: string, @Body() dto: ManagerEditGoalDto) {
    return this.goalsService.managerEdit(id, req.user.id, req.user.role, dto);
  }

  @Post('shared')
  @Roles(Role.MANAGER, Role.ADMIN)
  async createShared(@Request() req, @Body() dto: SharedGoalDto) {
    return this.goalsService.createShared(dto, req.user.id);
  }

  @Patch(':id/unlock')
  @Roles(Role.ADMIN)
  async unlock(@Param('id') id: string) {
    return this.goalsService.unlock(id);
  }
}
