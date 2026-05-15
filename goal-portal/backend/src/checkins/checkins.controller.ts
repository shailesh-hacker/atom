import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('checkins')
@UseGuards(JwtAuthGuard)
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

  @Get(':goalId')
  async getHistory(@Param('goalId') goalId: string) {
    return this.checkinsService.getHistory(goalId);
  }
}
