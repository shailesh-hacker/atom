import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CyclePhase } from '@prisma/client';

@Injectable()
export class CyclesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.cycle.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: { select: { goals: true } },
      },
    });
  }

  async getActive() {
    return this.prisma.cycle.findFirst({
      where: { isActive: true },
    });
  }

  async create(data: { name: string; startDate: string; endDate: string }) {
    return this.prisma.cycle.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        phase: CyclePhase.GOAL_SETTING,
        isActive: false,
      },
    });
  }

  async activate(cycleId: string) {
    // Deactivate all others first
    await this.prisma.cycle.updateMany({
      data: { isActive: false },
    });

    return this.prisma.cycle.update({
      where: { id: cycleId },
      data: { isActive: true },
    });
  }

  async updatePhase(cycleId: string, phase: CyclePhase) {
    const cycle = await this.prisma.cycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new NotFoundException('Cycle not found');

    return this.prisma.cycle.update({
      where: { id: cycleId },
      data: { phase },
    });
  }

  async resetData() {
    // 1. Delete all updates
    await this.prisma.goalUpdate.deleteMany({});
    // 2. Delete all goals
    await this.prisma.goal.deleteMany({});
    
    // 3. Reset active cycle to GOAL_SETTING
    const active = await this.getActive();
    if (active) {
      await this.prisma.cycle.update({
        where: { id: active.id },
        data: { phase: CyclePhase.GOAL_SETTING },
      });
    }
    
    return { message: 'System data reset successful' };
  }
}
