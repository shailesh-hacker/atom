import { Controller, Get, Res, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { stringify } from 'csv-stringify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Get('export')
  @Roles(Role.ADMIN, Role.MANAGER)
  async exportCsv(@Request() req, @Res() res: Response, @Query('managerId') managerId?: string) {
    const userRole = req.user.role;
    let targetManagerId = managerId;
    if (userRole === Role.MANAGER) targetManagerId = req.user.id;

    const whereClause: any = {};
    if (targetManagerId) whereClause.employee = { managerId: targetManagerId };

    const goals = await this.prisma.goal.findMany({
      where: whereClause,
      include: { employee: true, updates: { orderBy: { createdAt: 'asc' } } },
    });

    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

    const data = goals.map((g) => {
      // Index updates by quarter — take the latest entry per quarter
      const byQuarter: Record<string, { achievement: number; progressScore: number }> = {};
      for (const u of g.updates) {
        byQuarter[u.quarter] = { achievement: u.achievement, progressScore: u.progressScore ?? 0 };
      }

      const row: Record<string, any> = {
        Employee: g.employee.name,
        ThrustArea: g.thrustArea,
        Title: g.title,
        UOM: g.uom,
        PlannedTarget: g.target,
        Weightage: `${g.weightage}%`,
        Status: g.status,
      };

      for (const q of quarters) {
        row[`${q}_Achievement`] = byQuarter[q]?.achievement ?? '';
        row[`${q}_Score`] = byQuarter[q]?.progressScore !== undefined
          ? `${(byQuarter[q].progressScore * 100).toFixed(1)}%`
          : '';
      }

      return row;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=goals_report_${new Date().toISOString().split('T')[0]}.csv`);
    stringify(data, { header: true }).pipe(res);
  }

  @Get('completion')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getCompletionRates(@Request() req, @Query('managerId') managerId?: string) {
    const userRole = req.user.role;
    let targetManagerId = managerId;

    if (userRole === Role.MANAGER) {
      targetManagerId = req.user.id; // Managers can only see their own team
    }

    const activeCycle = await this.prisma.cycle.findFirst({ where: { isActive: true } });
    let activeQuarter = 'Goal Setting';
    if (activeCycle) {
      const phaseToQuarter: Record<string, string> = {
        GOAL_SETTING: 'Goal Setting',
        Q1_CHECKIN: 'Q1',
        Q2_CHECKIN: 'Q2',
        Q3_CHECKIN: 'Q3',
        Q4_CHECKIN: 'Q4',
        CLOSED: 'Closed',
      };
      activeQuarter = phaseToQuarter[activeCycle.phase] || 'Goal Setting';
    }

    const whereClause: any = { role: Role.EMPLOYEE };
    if (targetManagerId) {
      whereClause.managerId = targetManagerId;
    }

    const employees = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const employeeDetails: any[] = [];
    let totalGoalsSum = 0;
    let completedGoalsSum = 0;

    for (const emp of employees) {
      const goals = await this.prisma.goal.findMany({
        where: {
          employeeId: emp.id,
          cycleId: activeCycle?.id || undefined,
          status: { in: ['APPROVED', 'COMPLETED'] },
        },
        include: {
          updates: {
            where: { quarter: activeQuarter },
          },
        },
      });

      const totalGoals = goals.length;
      let totalProgressScore = 0;
      let completedGoalsCount = 0;

      for (const g of goals) {
        const sortedUpdates = [...g.updates].sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime());
        const latestUpdate = sortedUpdates[sortedUpdates.length - 1];
        const score = latestUpdate ? (latestUpdate.progressScore ?? 0) : 0;
        
        totalProgressScore += score;
        
        if (score >= 1.0) {
          completedGoalsCount++;
        }
      }

      const rate = totalGoals > 0 ? (totalProgressScore / totalGoals) * 100 : 0;

      totalGoalsSum += totalGoals;
      completedGoalsSum += completedGoalsCount;

      employeeDetails.push({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        totalGoals,
        completedGoals: completedGoalsCount,
        rate,
      });
    }

    const activeEmployeesCount = employeeDetails.filter(e => e.totalGoals > 0).length;
    const overallRate = activeEmployeesCount > 0 
      ? (employeeDetails.filter(e => e.totalGoals > 0).reduce((acc, e) => acc + e.rate, 0) / activeEmployeesCount)
      : 0;
    const completedEmployees = employeeDetails.filter(e => e.totalGoals > 0 && Math.round(e.rate) === 100).length;

    return {
      total: activeEmployeesCount || employees.length,
      submitted: completedEmployees,
      rate: overallRate,
      activeQuarter,
      employeeDetails,
    };
  }
}
