import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto, ManagerEditGoalDto, SharedGoalDto } from './dto/goal.dto';
import { GoalStatus, Role } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(creatorId: string, creatorRole: Role, dto: CreateGoalDto) {
    if (creatorRole === Role.MANAGER) {
      throw new ForbiddenException('Managers are only allowed to create shared goals');
    }

    const targetEmployeeId = creatorRole === Role.ADMIN
      ? dto.employeeId || creatorId 
      : creatorId;

    const status = creatorRole === Role.ADMIN
      ? GoalStatus.APPROVED
      : GoalStatus.PENDING;

    const activeCycle = await this.prisma.cycle.findFirst({ where: { isActive: true } });
    if (!activeCycle) throw new BadRequestException('No active cycle found');
    if (activeCycle.phase !== 'GOAL_SETTING') {
      throw new ForbiddenException('Goal creation is only allowed during the GOAL_SETTING phase');
    }

    const employeeGoals = await this.prisma.goal.findMany({
      where: { employeeId: targetEmployeeId, cycleId: activeCycle.id }
    });
    const currentTotalWeightage = employeeGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (currentTotalWeightage + dto.weightage > 100) {
      throw new BadRequestException(`Creating this goal would bring total weightage to ${currentTotalWeightage + dto.weightage}%, which exceeds the 100% maximum. You have ${100 - currentTotalWeightage}% remaining weightage.`);
    }

    const goalCount = employeeGoals.length;
    if (goalCount >= 8) {
      throw new BadRequestException('Maximum 8 goals allowed per employee');
    }

    if (dto.weightage < 10) {
      throw new BadRequestException('Minimum weightage per individual goal is 10%');
    }

    const newGoal = await this.prisma.goal.create({
      data: {
        thrustArea: dto.thrustArea,
        title: dto.title,
        description: dto.description,
        uom: dto.uom,
        target: dto.target,
        weightage: dto.weightage,
        isInverse: dto.isInverse ?? false,
        employeeId: targetEmployeeId,
        cycleId: activeCycle.id,
        status: status,
        locked: false,
      },
    });

    if (creatorRole === Role.EMPLOYEE) {
      const employee = await this.prisma.user.findUnique({
        where: { id: creatorId },
        include: { manager: true }
      });
      if (employee?.manager?.email) {
        await this.emailService.sendEmail(
          employee.manager.email,
          `New Goal Created - ${employee.name}`,
          `
          <div style="font-family: sans-serif; max-width: 600px; line-height: 1.6;">
            <h2 style="color: #4f46e5;">New Goal Set Up</h2>
            <p>Hi ${employee.manager.name},</p>
            <p>Your direct report, <strong>${employee.name}</strong>, has set up a new goal: <strong>"${newGoal.title}"</strong>.</p>
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Thrust Area:</strong> ${newGoal.thrustArea}</li>
                <li><strong>Weightage:</strong> ${newGoal.weightage}%</li>
                <li><strong>Target:</strong> ${newGoal.target} ${newGoal.uom}</li>
                <li><strong>Description:</strong> ${newGoal.description || '—'}</li>
              </ul>
            </div>
            <p>Please log in to the portal to review and manage their goals.</p>
            <p style="margin-top: 24px;">
              <a href="http://localhost:3000/goals" style="background-color: #4f46e5; color: white; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Goals</a>
            </p>
            <p style="margin-top: 32px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">This is an automated notification from GoalTrack. Please do not reply directly to this email.</p>
          </div>
          `
        ).catch(err => console.error('Failed to send goal setup email notification', err));
      }
    }

    return newGoal;
  }

  async findAll(userId: string, role: Role, managerId?: string) {
    if (role === Role.ADMIN) {
      if (managerId) {
        return this.prisma.goal.findMany({
          where: { employee: { managerId } },
          include: { employee: true, updates: true },
        });
      } else {
        // Global organization report for Admin: fetch ALL goals
        return this.prisma.goal.findMany({
          include: { employee: true, updates: true },
        });
      }
    }

    if (role === Role.MANAGER) {
      // Fetch goals of employees reporting to this manager, plus manager's own goals if any
      return this.prisma.goal.findMany({
        where: {
          OR: [
            { employee: { managerId: userId } },
            { employeeId: userId }
          ]
        },
        include: { employee: true, updates: true },
      });
    }

    // Employee: fetch own goals
    return this.prisma.goal.findMany({
      where: { employeeId: userId },
      include: { employee: true, updates: true },
    });
  }

  async findTeamGoals(managerId: string) {
    const users = await this.prisma.user.findMany({
      where: { managerId: managerId },
      include: { goals: { include: { updates: true } } },
      orderBy: { name: 'asc' },
    });
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
      if (goal.locked) {
        throw new ForbiddenException('Goals are locked on approval. No further edits without Admin intervention.');
      }
    } else {
      if (goal.employeeId !== userId) {
        throw new ForbiddenException('You can only edit your own goals');
      }
      if (goal.status === GoalStatus.APPROVED || goal.status === GoalStatus.COMPLETED) {
        throw new ForbiddenException('Employees cannot change approved goals');
      }
      if (goal.locked) {
        throw new ForbiddenException('Goals are locked on approval. No further edits without Admin intervention.');
      }
      // Employees are not allowed to edit goal definitions once created (only weightage can be updated)
      if (dto.thrustArea !== undefined || dto.title !== undefined || dto.description !== undefined || dto.uom !== undefined || dto.target !== undefined || dto.isInverse !== undefined) {
        throw new BadRequestException('Goal definition parameters (title, target, etc.) are read-only after creation. You can only adjust weightages.');
      }
    }

    if (goal.status === GoalStatus.COMPLETED) {
      throw new ForbiddenException('Cannot edit a completed goal');
    }

    if (dto.weightage !== undefined) {
      if (dto.weightage < 10) {
        throw new BadRequestException('Minimum weightage per individual goal is 10%');
      }

      const activeCycle = await this.prisma.cycle.findFirst({ where: { isActive: true } });
      const employeeGoals = await this.prisma.goal.findMany({
        where: { employeeId: goal.employeeId, cycleId: activeCycle?.id }
      });
      const otherGoalsWeightage = employeeGoals
        .filter(g => g.id !== goalId)
        .reduce((sum, g) => sum + g.weightage, 0);
      
      if (otherGoalsWeightage + dto.weightage > 100) {
        throw new BadRequestException(`Updating this goal's weightage to ${dto.weightage}% would bring total weightage to ${otherGoalsWeightage + dto.weightage}%, which exceeds the 100% maximum. You have ${100 - otherGoalsWeightage}% remaining weightage.`);
      }
    }

    const updatedGoal = await this.prisma.goal.update({
      where: { id: goalId },
      data: dto,
    });

    if (userRole === Role.EMPLOYEE) {
      const employee = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { manager: true }
      });
      if (employee?.manager?.email) {
        await this.emailService.sendEmail(
          employee.manager.email,
          `Goal Updated - ${employee.name}`,
          `
          <div style="font-family: sans-serif; max-width: 600px; line-height: 1.6;">
            <h2 style="color: #4f46e5;">Goal Updated By Employee</h2>
            <p>Hi ${employee.manager.name},</p>
            <p>Your direct report, <strong>${employee.name}</strong>, has updated their goal: <strong>"${updatedGoal.title}"</strong>.</p>
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Thrust Area:</strong> ${updatedGoal.thrustArea}</li>
                <li><strong>Weightage:</strong> ${updatedGoal.weightage}%</li>
                <li><strong>Target:</strong> ${updatedGoal.target} ${updatedGoal.uom}</li>
                <li><strong>Description:</strong> ${updatedGoal.description || '—'}</li>
              </ul>
            </div>
            <p>Please log in to the portal to review and manage their goals.</p>
            <p style="margin-top: 24px;">
              <a href="http://localhost:3000/goals" style="background-color: #4f46e5; color: white; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Goals</a>
            </p>
            <p style="margin-top: 32px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">This is an automated notification from GoalTrack. Please do not reply directly to this email.</p>
          </div>
          `
        ).catch(err => console.error('Failed to send goal update email notification', err));
      }
    }

    return updatedGoal;
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
      if (goal.employeeId !== userId) {
        throw new ForbiddenException('You can only delete your own goals');
      }
      if (goal.status === GoalStatus.APPROVED || goal.status === GoalStatus.COMPLETED) {
        throw new ForbiddenException('Employees cannot delete approved goals');
      }
      if (goal.status !== GoalStatus.DRAFT && goal.status !== GoalStatus.RETURNED && goal.status !== GoalStatus.PENDING) {
        throw new ForbiddenException('You can only delete goals in Draft, Returned, or Pending status');
      }
      if (goal.locked) {
        throw new ForbiddenException('Locked goals cannot be deleted');
      }
      if (goal.isShared) {
        throw new ForbiddenException('Recipients cannot delete shared goals');
      }
    }

    if (goal.status !== GoalStatus.DRAFT && goal.status !== GoalStatus.RETURNED && goal.status !== GoalStatus.PENDING && goal.status !== GoalStatus.APPROVED && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only draft, returned, pending, or approved goals can be deleted');
    }

    // Delete dependent check-in records first
    await this.prisma.goalUpdate.deleteMany({ where: { goalId } });
    return this.prisma.goal.delete({ where: { id: goalId } });
  }

  async submitAll(userId: string) {
    const activeCycle = await this.prisma.cycle.findFirst({ where: { isActive: true } });
    if (activeCycle && activeCycle.phase !== 'GOAL_SETTING') {
      throw new ForbiddenException('Goal submission is only allowed during the GOAL_SETTING phase');
    }

    const goals = await this.prisma.goal.findMany({ 
      where: { employeeId: userId, cycleId: activeCycle?.id } 
    });

    if (goals.length === 0) {
      throw new BadRequestException('Cannot submit an empty goal sheet');
    }

    if (goals.length > 8) {
      throw new BadRequestException('Maximum 8 goals allowed per employee');
    }

    const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
    if (totalWeightage !== 100) {
      throw new BadRequestException(`Total weightage must be exactly 100%. Current total: ${totalWeightage}%`);
    }

    const invalidGoal = goals.find((g) => g.weightage < 10);
    if (invalidGoal) {
      throw new BadRequestException(`Goal "${invalidGoal.title}" has weightage ${invalidGoal.weightage}%, which is below the minimum required 10%`);
    }

    const result = await this.prisma.goal.updateMany({
      where: { 
        employeeId: userId, 
        status: { in: [GoalStatus.DRAFT, GoalStatus.RETURNED] } 
      },
      data: { status: GoalStatus.PENDING },
    });

    // Notify Manager
    const employee = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { manager: true },
    });

    if (employee?.manager?.email) {
      await this.emailService.sendEmail(
        employee.manager.email,
        `[Action Required] Goal Sheet Submitted for Approval - ${employee.name}`,
        `
        <div style="font-family: sans-serif; max-width: 600px; line-height: 1.6;">
          <h2 style="color: #4f46e5;">Goal Sheet Submitted</h2>
          <p>Hi ${employee.manager.name},</p>
          <p>Your direct report, <strong>${employee.name}</strong>, has submitted their goal sheet for your review and approval in GoalTrack.</p>
          <p>Please log in to the portal to approve or return their goals.</p>
          <p style="margin-top: 24px;">
            <a href="http://localhost:3000/approvals" style="background-color: #4f46e5; color: white; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Pending Approvals</a>
          </p>
          <p style="margin-top: 32px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">This is an automated notification from GoalTrack. Please do not reply directly to this email.</p>
        </div>
        `
      ).catch(err => console.error('Failed to send goal submission notification email', err));
    }

    return result;
  }

  async submitWork(goalId: string, userId: string) {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.employeeId !== userId) throw new ForbiddenException('Not your goal');
    if (goal.status !== GoalStatus.APPROVED && goal.status !== GoalStatus.RETURNED) {
      throw new BadRequestException('Only approved or returned goals can be submitted as completed work');
    }

    const result = await this.prisma.goal.update({
      where: { id: goalId },
      data: { status: GoalStatus.PENDING },
    });

    // Notify Manager
    const employee = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { manager: true },
    });

    if (employee?.manager?.email) {
      await this.emailService.sendEmail(
        employee.manager.email,
        `[Action Required] Goal Completed Work Submitted - ${employee.name}`,
        `
        <div style="font-family: sans-serif; max-width: 600px; line-height: 1.6;">
          <h2 style="color: #4f46e5;">Completed Work Submitted</h2>
          <p>Hi ${employee.manager.name},</p>
          <p>Your direct report, <strong>${employee.name}</strong>, has submitted progress work for the goal <strong>"${goal.title}"</strong> for your approval in GoalTrack.</p>
          <p>Please log in to the portal to approve or return their progress check-in.</p>
          <p style="margin-top: 24px;">
            <a href="http://localhost:3000/approvals" style="background-color: #4f46e5; color: white; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Pending Approvals</a>
          </p>
          <p style="margin-top: 32px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">This is an automated notification from GoalTrack. Please do not reply directly to this email.</p>
        </div>
        `
      ).catch(err => console.error('Failed to send submit work notification email', err));
    }

    return result;
  }

  async approve(goalId: string, managerId: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: { employee: true },
    });

    if (!goal) throw new NotFoundException('Goal not found');
    if (goal.employee.managerId !== managerId) throw new ForbiddenException('Not your report');

    const nextStatus = (goal.status === GoalStatus.PENDING && goal.locked)
      ? GoalStatus.COMPLETED
      : GoalStatus.APPROVED;

    return this.prisma.goal.update({
      where: { id: goalId },
      data: { status: nextStatus, locked: true },
    });
  }

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
        locked: false, // Unlock for employee to edit again
        returnReason: reason || null,
      },
    });
  }

  async managerEdit(goalId: string, managerId: string, managerRole: Role, dto: ManagerEditGoalDto) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: { employee: true },
    });

    if (!goal) throw new NotFoundException('Goal not found');
    
    if (managerRole !== Role.ADMIN && goal.employee.managerId !== managerId) {
      throw new ForbiddenException('You can only edit goals for your direct reports');
    }

    if (goal.locked && managerRole !== Role.ADMIN) {
      throw new ForbiddenException('Goals are locked on approval. No further edits without Admin intervention.');
    }

    if (goal.status === GoalStatus.COMPLETED) {
      throw new ForbiddenException('Cannot edit a completed goal');
    }

    if (dto.weightage !== undefined && dto.weightage < 10) {
      throw new BadRequestException('Minimum weightage per individual goal is 10%');
    }

    const updateData: any = {};
    if (dto.target !== undefined) updateData.target = dto.target;
    if (dto.weightage !== undefined) updateData.weightage = dto.weightage;

    return this.prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    });
  }

  async createShared(dto: SharedGoalDto, creatorId: string) {
    const { employeeIds, primaryOwnerId: dtoPrimaryOwnerId, ...goalData } = dto;
    const activeCycle = await this.prisma.cycle.findFirst({ where: { isActive: true } });
    if (!activeCycle) throw new BadRequestException('No active cycle found');

    const sharedGroupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const primaryOwnerId = dtoPrimaryOwnerId || employeeIds[0];

    const creations = employeeIds.map((empId) =>
      this.prisma.goal.create({
        data: {
          ...goalData,
          isInverse: dto.isInverse ?? false,
          employeeId: empId,
          cycleId: activeCycle.id,
          isShared: true,
          sharedGroupId,
          primaryOwnerId,
          status: GoalStatus.APPROVED, // Direct APPROVED status so employee can instantly check-in and log progress
          locked: false,
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

  async findAutoApproved() {
    return this.prisma.goal.findMany({
      where: { returnReason: 'AUTO_APPROVED_Q1' },
      include: { employee: true },
    });
  }
}
