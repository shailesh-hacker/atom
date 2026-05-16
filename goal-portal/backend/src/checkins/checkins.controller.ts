import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('checkins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Post()
  async create(@Body() body: { goalId: string; achievement: number; quarter: string; statusUpdate: string; comment?: string }) {
    return this.checkinsService.createUpdate(
      body.goalId,
      body.achievement,
      body.quarter,
      body.statusUpdate,
      body.comment,
    );
  }

  @Patch(':id/comment')
  @Roles(Role.MANAGER, Role.ADMIN)
  async updateComment(@Param('id') id: string, @Body() body: { comment: string }) {
    return this.checkinsService.updateComment(id, body.comment);
  }

  @Get(':goalId')
  async getHistory(@Param('goalId') goalId: string) {
    return this.checkinsService.getHistory(goalId);
  }
}
