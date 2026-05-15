import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UomType } from '@prisma/client';

@Injectable()
export class CheckinsService {
  constructor(private prisma: PrismaService) {}

  async createUpdate(goalId: string, achievement: number, quarter: string, statusUpdate: string, comment?: string) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');

    let progressScore = 0;
    switch (goal.uom) {
      case UomType.NUMERIC:
      case UomType.PERCENTAGE:
        // Assuming target is the goal to reach (Min logic)
        progressScore = goal.target !== 0 ? achievement / goal.target : 0;
        break;
      case UomType.TIMELINE:
        // Simplified: achievement 1 = on time, 0 = late
        progressScore = achievement >= goal.target ? 1.0 : 0.0;
        break;
      case UomType.ZERO_BASED:
        // Zero-based: target is usually 0 (errors, etc.)
        progressScore = achievement === 0 ? 1.0 : 0.0;
        break;
    }

    return this.prisma.goalUpdate.create({
      data: {
        goalId,
        achievement,
        quarter,
        statusUpdate,
        comment,
        progressScore,
      },
    });
  }

  async getHistory(goalId: string) {
    return this.prisma.goalUpdate.findMany({
      where: { goalId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
