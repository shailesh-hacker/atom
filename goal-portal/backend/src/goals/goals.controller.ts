import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('goals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get('mine')
  @Roles(Role.EMPLOYEE)
  async getMine(@Request() req) {
    return this.goalsService.findAll(req.user.id, req.user.role);
  }

  @Post()
  @Roles(Role.EMPLOYEE)
  async create(@Request() req, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(req.user.id, dto);
  }

  @Patch(':id')
  @Roles(Role.EMPLOYEE)
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return this.goalsService.update(id, req.user.id, dto);
  }

  @Post('submit')
  @Roles(Role.EMPLOYEE)
  async submit(@Request() req) {
    return this.goalsService.submitAll(req.user.id);
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
  async return(@Request() req, @Param('id') id: string) {
    return this.goalsService.returnForRework(id, req.user.id);
  }

  @Patch(':id/unlock')
  @Roles(Role.ADMIN)
  async unlock(@Param('id') id: string) {
    return this.goalsService.unlock(id);
  }
}
