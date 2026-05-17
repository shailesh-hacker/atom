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

  async updatePhase(cycleId: string, phase: CyclePhase, adminId?: string) {
    const cycle = await this.prisma.cycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new NotFoundException('Cycle not found');

    if (phase === CyclePhase.Q1_CHECKIN) {
      const unapprovedGoals = await this.prisma.goal.findMany({
        where: {
          cycleId,
          status: { notIn: ['APPROVED', 'COMPLETED'] },
        },
      });

      if (unapprovedGoals.length > 0) {
        await Promise.all(unapprovedGoals.map(async (goal) => {
          await this.prisma.goal.update({
            where: { id: goal.id },
            data: {
              status: 'APPROVED',
              returnReason: 'AUTO_APPROVED_Q1',
            },
          });

          if (adminId) {
            await this.prisma.auditLog.create({
              data: {
                userId: adminId,
                entityType: 'Goal',
                entityId: goal.id,
                action: 'AUTO_APPROVE',
                oldValue: { status: goal.status } as any,
                newValue: { status: 'APPROVED', reason: 'Auto-approved on Q1 Check-in start' } as any,
              },
            });
          }
        }));
      }
    }

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
