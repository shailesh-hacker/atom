import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CyclesService } from './cycles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, CyclePhase } from '@prisma/client';

@Controller('cycles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return this.cyclesService.findAll();
  }

  @Get('active')
  async getActive() {
    return this.cyclesService.getActive();
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() body: { name: string; startDate: string; endDate: string }) {
    return this.cyclesService.create(body);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  async activate(@Param('id') id: string) {
    return this.cyclesService.activate(id);
  }

  @Patch(':id/phase')
  @Roles(Role.ADMIN)
  async updatePhase(@Req() req, @Param('id') id: string, @Body() body: { phase: CyclePhase }) {
    return this.cyclesService.updatePhase(id, body.phase, req.user.id);
  }

  @Post('reset')
  @Roles(Role.ADMIN)
  async resetData() {
    return this.cyclesService.resetData();
  }
}
