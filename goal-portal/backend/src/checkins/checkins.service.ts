import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UomType } from '@prisma/client';

@Injectable()
export class CheckinsService {
  constructor(private prisma: PrismaService) {}

  async createUpdate(goalId: string, achievement: number, quarter: string, statusUpdate: string, comment?: string) {
    const goal = await this.prisma.goal.findUnique({ 
      where: { id: goalId },
      include: { cycle: true }
    });
    if (!goal) throw new NotFoundException('Goal not found');

    // Enforce Cycle Phase
    if (goal.cycle && goal.cycle.isActive) {
      if (goal.cycle.phase === 'GOAL_SETTING') {
        throw new ForbiddenException('Check-ins are not allowed during Goal Setting phase');
      }
      // Optional: enforce quarter match (e.g. only Q1 updates during Q1_CHECKIN)
      if (goal.cycle.phase.startsWith('Q') && !goal.cycle.phase.includes(quarter)) {
         throw new ForbiddenException(`You can only log ${goal.cycle.phase.split('_')[0]} updates currently`);
      }
    }

    const progressScore = this.computeScore(goal, achievement);

    const update = await this.prisma.goalUpdate.create({
      data: {
        goalId,
        achievement,
        quarter,
        statusUpdate,
        comment,
        progressScore,
      },
    });

    // Achievement sync for shared goals
    if (goal.isShared && goal.sharedGroupId) {
      // Find all goals in same group except the current one
      const linkedGoals = await this.prisma.goal.findMany({
        where: { 
          sharedGroupId: goal.sharedGroupId,
          id: { not: goalId }
        }
      });

      if (linkedGoals.length > 0) {
        await Promise.all(linkedGoals.map(lg => 
          this.prisma.goalUpdate.create({
            data: {
              goalId: lg.id,
              achievement,
              quarter,
              statusUpdate,
              comment: `Synced from Primary Owner: ${comment || ''}`,
              progressScore: this.computeScore(lg, achievement)
            }
          })
        ));
      }
    }

    return update;
  }

  private computeScore(goal: any, achievement: number): number {
    let score = 0;
    const target = goal.target;

    switch (goal.uom) {
      case UomType.NUMERIC:
      case UomType.PERCENTAGE:
        if (goal.isInverse) {
          // Lower is better: Target / Achievement
          score = achievement > 0 ? target / achievement : (achievement === 0 ? 1 : 0);
        } else {
          // Higher is better: Achievement / Target
          score = target !== 0 ? achievement / target : 0;
        }
        break;
      case UomType.TIMELINE:
        // Achievement and target are YYYYMMDD
        // Goal met if achievement date <= target date
        score = achievement <= target ? 1.0 : 0.0;
        break;
      case UomType.ZERO_BASED:
        // Zero = success
        score = achievement === 0 ? 1.0 : 0.0;
        break;
    }

    return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
  }

  async updateComment(updateId: string, comment: string) {
    return this.prisma.goalUpdate.update({
      where: { id: updateId },
      data: { comment },
    });
  }

  async getHistory(goalId: string) {
    return this.prisma.goalUpdate.findMany({
      where: { goalId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
