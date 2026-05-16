import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto, ManagerEditGoalDto, SharedGoalDto } from './dto/goal.dto';
import { GoalStatus, Role } from '@prisma/client';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(creatorId: string, creatorRole: Role, dto: CreateGoalDto) {
    const targetEmployeeId = (creatorRole === Role.MANAGER || creatorRole === Role.ADMIN) 
      ? dto.employeeId || creatorId 
      : creatorId;

    // If manager is assigning, verify target is a direct report
    if (creatorRole === Role.MANAGER && targetEmployeeId !== creatorId) {
      const employee = await this.prisma.user.findUnique({ where: { id: targetEmployeeId } });
      if (!employee || employee.managerId !== creatorId) {
        throw new ForbiddenException('You can only assign goals to your direct reports');
      }
    }

    const goalCount = await this.prisma.goal.count({ where: { employeeId: targetEmployeeId } });
    if (goalCount >= 8) {
      throw new BadRequestException('Maximum 8 goals allowed per cycle');
    }

    return this.prisma.goal.create({
      data: {
        thrustArea: dto.thrustArea,
        title: dto.title,
        description: dto.description,
        uom: dto.uom,
        target: dto.target,
        weightage: dto.weightage,
        employeeId: targetEmployeeId,
        status: (creatorRole === Role.MANAGER || creatorRole === Role.ADMIN) ? GoalStatus.APPROVED : GoalStatus.DRAFT,
        locked: (creatorRole === Role.MANAGER || creatorRole === Role.ADMIN) ? true : false,
      },
    });
  }

  async findAll(userId: string, role: Role, managerId?: string) {
    if (role === Role.ADMIN) {
      if (managerId) {
        return this.prisma.goal.findMany({
          where: { employee: { managerId } },
          include: { employee: true, updates: true },
        });
      }
      return this.prisma.goal.findMany({ include: { employee: true, updates: true } });
    }
    
    if (role === Role.MANAGER) {
      // Manager fetching their team's goals
      return this.prisma.goal.findMany({
        where: { employee: { managerId: userId } },
        include: { employee: true, updates: true },
      });
    }

    // Default: fetch own goals
    return this.prisma.goal.findMany({
      where: { employeeId: userId },
      include: { updates: true },
    });
  }

  async findTeamGoals(managerId: string) {
    const users = await this.prisma.user.findMany({
      where: { managerId: managerId },
      include: { goals: true },
      orderBy: { name: 'asc' },
    });
    
    // Map it to a structure that's easy to digest on the frontend
    // Since the frontend previously grouped by employee, we can return the array of users
    // with their goals directly, OR we can map it to match the frontend's expected Goal format
    // Let's just return the users, but we should make sure the frontend understands it.
    // Wait, the frontend currently expects `Goal[]` and groups it. 
    // If I change it here, I MUST update the frontend.
    // Let's return the employees with their goals included.
    return users;
  }

  async update(goalId: string, userId: string, userRole: Role, dto: UpdateGoalDto) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: { employee: true },
    });
    if (!goal) throw new NotFoundException('Goal not found');

    if (userRole === Role.ADMIN) {
      // Admin can do anything
    } else if (userRole === Role.MANAGER) {
      if (goal.employee.managerId !== userId) {
        throw new ForbiddenException('You can only edit goals for your direct reports');
      }
    } else {
      throw new ForbiddenException('Employees cannot edit goal definitions');
    }

    if (goal.status === GoalStatus.COMPLETED) {
      throw new ForbiddenException('Cannot edit a completed goal');
    }

    if (goal.locked && userRole === Role.EMPLOYEE) {
      throw new ForbiddenException('Goal is locked and cannot be edited');
    }

    if (goal.isShared) {
      delete dto.title;
      delete dto.target;
    }

    return this.prisma.goal.update({
      where: { id: goalId },
      data: dto,
    });
  }

  async remove(goalId: string, userId: string, userRole: Role) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: { employee: true },
    });
    if (!goal) throw new NotFoundException('Goal not found');

    if (userRole === Role.ADMIN) {
      // OK
    } else if (userRole === Role.MANAGER) {
      if (goal.employee.managerId !== userId) {
        throw new ForbiddenException('You can only delete goals for your direct reports');
      }
    } else {
      throw new ForbiddenException('Employees cannot delete goals');
    }

    if (goal.status !== GoalStatus.DRAFT && goal.status !== GoalStatus.RETURNED && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only draft or returned goals can be deleted');
    }

    // Delete dependent check-in records first
    await this.prisma.goalUpdate.deleteMany({ where: { goalId } });
    return this.prisma.goal.delete({ where: { id: goalId } });
  }

  async submitAll(userId: string) {
    const goals = await this.prisma.goal.findMany({ where: { employeeId: userId } });
    const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);

    if (totalWeightage !== 100) {
      throw new BadRequestException(`Total weightage must be exactly 100%. Current total: ${totalWeightage}%`);
    }

    return this.prisma.goal.updateMany({
      where: { employeeId: userId, status: GoalStatus.DRAFT },
      data: { status: GoalStatus.PENDING },
    });
  }

  async submitWork(goalId: string, userId: string) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.employeeId !== userId) throw new ForbiddenException('Not your goal');
    if (goal.status !== GoalStatus.APPROVED && goal.status !== GoalStatus.RETURNED) {
      throw new BadRequestException('Only approved or returned goals can be submitted as completed work');
    }

    return this.prisma.goal.update({
      where: { id: goalId },
      data: { status: GoalStatus.PENDING },
    });
  }

  async approve(goalId: string, managerId: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: { employee: true },
    });

    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.employee.managerId !== managerId) throw new ForbiddenException('Not your report');

    // If goal is already locked (previously approved definition) and is PENDING,
    // this is a work completion approval.
    const nextStatus = (goal.status === GoalStatus.PENDING && goal.locked)
      ? GoalStatus.COMPLETED
      : GoalStatus.APPROVED;

    return this.prisma.goal.update({
      where: { id: goalId },
      data: { status: nextStatus, locked: true },
    });
  }

  // ── Return for Rework with reason ──
  async returnForRework(goalId: string, managerId: string, reason?: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: { employee: true },
    });

    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.employee.managerId !== managerId) throw new ForbiddenException('Not your report');

    return this.prisma.goal.update({
      where: { id: goalId },
      data: {
        status: GoalStatus.RETURNED,
        locked: true,
        returnReason: reason || null,
      },
    });
  }

  // ── Manager Inline-Edit (target + weightage before approval) ──
  async managerEdit(goalId: string, managerId: string, managerRole: Role, dto: ManagerEditGoalDto) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: { employee: true },
    });

    if (!goal) throw new NotFoundException('Goal not found');
    
    if (managerRole !== Role.ADMIN && goal.employee.managerId !== managerId) {
      throw new ForbiddenException('You can only edit goals for your direct reports');
    }

    if (goal.status === GoalStatus.COMPLETED) {
      throw new ForbiddenException('Cannot edit a completed goal');
    }

    const updateData: any = {};
    if (dto.target !== undefined) updateData.target = dto.target;
    if (dto.weightage !== undefined) updateData.weightage = dto.weightage;

    return this.prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    });
  }

  // ── Shared Goals Push ──
  async createShared(dto: SharedGoalDto, primaryOwnerId: string) {
    const { employeeIds, ...goalData } = dto;

    const creations = employeeIds.map((empId) =>
      this.prisma.goal.create({
        data: {
          ...goalData,
          employeeId: empId,
          isShared: true,
          primaryOwnerId,
          status: GoalStatus.APPROVED,
          locked: true,
        },
      }),
    );

    return Promise.all(creations);
  }

  async unlock(goalId: string) {
    return this.prisma.goal.update({
      where: { id: goalId },
      data: { locked: false },
    });
  }
}
