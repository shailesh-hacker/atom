import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UomType } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class CheckinsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createUpdate(goalId: string, userId: string, achievement: number, quarter: string, statusUpdate: string, comment?: string) {
    const goal = await this.prisma.goal.findUnique({ 
      where: { id: goalId },
      include: { cycle: true }
    });
    if (!goal) throw new NotFoundException('Goal not found');

    if (achievement > goal.target) {
      throw new BadRequestException(`Achievement value (${achievement}) cannot exceed the assigned target value (${goal.target}).`);
    }

    // Enforce Cycle Phase
    if (goal.cycle && goal.cycle.isActive) {
      if (goal.cycle.phase === 'GOAL_SETTING') {
        throw new ForbiddenException('Check-ins are not allowed during Goal Setting phase');
      }
      const phaseToQuarter: Record<string, string> = {
        Q1_CHECKIN: 'Q1', Q2_CHECKIN: 'Q2', Q3_CHECKIN: 'Q3', Q4_CHECKIN: 'Q4',
      };
      const expectedQuarter = phaseToQuarter[goal.cycle.phase];
      if (expectedQuarter && expectedQuarter !== quarter) {
        throw new ForbiddenException(`You can only log ${expectedQuarter} updates currently`);
      }
    }

    const progressScore = this.computeScore(goal, achievement);

    const update = await this.prisma.goalUpdate.create({
      data: { goalId, achievement, quarter, statusUpdate, comment, progressScore },
    });

    // Notify Manager
    const employee = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { manager: true }
    });

    if (employee?.manager?.email) {
      await this.emailService.sendEmail(
        employee.manager.email,
        `New Goal Update Logged - ${employee.name}`,
        `
        <div style="font-family: sans-serif; max-width: 600px; line-height: 1.6;">
          <h2 style="color: #4f46e5;">New Goal Progress Logged</h2>
          <p>Hi ${employee.manager.name},</p>
          <p>Your direct report, <strong>${employee.name}</strong>, has logged a new progress check-in for their goal <strong>"${goal.title}"</strong> in GoalTrack.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Quarter:</strong> ${quarter}</li>
              <li><strong>Achievement:</strong> ${achievement} (Target: ${goal.target})</li>
              <li><strong>Status Update:</strong> ${statusUpdate}</li>
              <li><strong>Comment:</strong> ${comment || '—'}</li>
            </ul>
          </div>
          <p>Please log in to the portal to view their team check-in history.</p>
          <p style="margin-top: 24px;">
            <a href="http://localhost:3000/team-checkins" style="background-color: #4f46e5; color: white; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Team Check-ins</a>
          </p>
          <p style="margin-top: 32px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">This is an automated notification from GoalTrack. Please do not reply directly to this email.</p>
        </div>
        `
      ).catch(err => console.error('Failed to send check-in notification email', err));
    }

    // Update parent goal status to COMPLETED if marked as completed or reached 100%
    await this.prisma.goal.update({
      where: { id: goalId },
      data: { status: (statusUpdate === 'COMPLETED' || progressScore >= 1.0) ? 'COMPLETED' : 'APPROVED' }
    });

    // Sync ONLY if this user is the primary owner of a shared goal
    if (goal.isShared && goal.sharedGroupId && goal.primaryOwnerId === userId) {
      const linkedGoals = await this.prisma.goal.findMany({
        where: { sharedGroupId: goal.sharedGroupId, id: { not: goalId } }
      });
      if (linkedGoals.length > 0) {
        await Promise.all(linkedGoals.map(async lg => {
          const lgScore = this.computeScore(lg, achievement);
          await this.prisma.goalUpdate.create({
            data: {
              goalId: lg.id, achievement, quarter, statusUpdate,
              comment: `Synced from Primary Owner: ${comment || ''}`,
              progressScore: lgScore
            }
          });
          
          await this.prisma.goal.update({
            where: { id: lg.id },
            data: { status: (statusUpdate === 'COMPLETED' || lgScore >= 1.0) ? 'COMPLETED' : 'APPROVED' }
          });
        }));
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
