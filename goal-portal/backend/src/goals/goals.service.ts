import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';
import { GoalStatus, Role } from '@prisma/client';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDto) {
    const goalCount = await this.prisma.goal.count({ where: { employeeId: userId } });
    if (goalCount >= 8) {
      throw new BadRequestException('Maximum 8 goals allowed per cycle');
    }

    return this.prisma.goal.create({
      data: {
        ...dto,
        employeeId: userId,
        status: GoalStatus.DRAFT,
      },
    });
  }

  async findAll(userId: string, role: Role) {
    if (role === Role.ADMIN) {
      return this.prisma.goal.findMany({ include: { employee: true } });
    }
    return this.prisma.goal.findMany({ where: { employeeId: userId } });
  }

  async findTeamGoals(managerId: string) {
    return this.prisma.goal.findMany({
      where: {
        employee: {
          managerId: managerId,
        },
      },
      include: { employee: true },
    });
  }

  async update(goalId: string, userId: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.employeeId !== userId) throw new ForbiddenException('Not your goal');
    if (goal.locked) throw new ForbiddenException('Goal is locked and cannot be edited');

    if (goal.isShared) {
      // Shared goals: title and target are read-only
      delete dto.title;
      delete dto.target;
    }

    return this.prisma.goal.update({
      where: { id: goalId },
      data: dto,
    });
  }

  async submitAll(userId: string) {
    const goals = await this.prisma.goal.findMany({ where: { employeeId: userId } });
    const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);

    if (totalWeightage !== 100) {
      throw new BadRequestException(`Total weightage must be exactly 100%. Current total: ${totalWeightage}%`);
    }

    return this.prisma.goal.updateMany({
      where: { employeeId: userId, status: GoalStatus.DRAFT },
      data: { status: GoalStatus.SUBMITTED },
    });
  }

  async approve(goalId: string, managerId: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: { employee: true },
    });

    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.employee.managerId !== managerId) throw new ForbiddenException('Not your report');

    return this.prisma.goal.update({
      where: { id: goalId },
      data: { status: GoalStatus.APPROVED, locked: true },
    });
  }

  async returnForRework(goalId: string, managerId: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: { employee: true },
    });

    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.employee.managerId !== managerId) throw new ForbiddenException('Not your report');

    return this.prisma.goal.update({
      where: { id: goalId },
      data: { status: GoalStatus.RETURNED, locked: false },
    });
  }

  async unlock(goalId: string) {
    return this.prisma.goal.update({
      where: { id: goalId },
      data: { locked: false },
    });
  }
}
