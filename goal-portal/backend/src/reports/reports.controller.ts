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
    let activeQuarter = 'Q1';
    if (activeCycle) {
      const phaseToQuarter: Record<string, string> = {
        Q1_CHECKIN: 'Q1',
        Q2_CHECKIN: 'Q2',
        Q3_CHECKIN: 'Q3',
        Q4_CHECKIN: 'Q4',
      };
      activeQuarter = phaseToQuarter[activeCycle.phase] || 'Q1';
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
      const completedGoals = goals.filter(g => g.updates.length > 0).length;
      const rate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

      totalGoalsSum += totalGoals;
      completedGoalsSum += completedGoals;

      employeeDetails.push({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        totalGoals,
        completedGoals,
        rate,
      });
    }

    const overallRate = totalGoalsSum > 0 ? (completedGoalsSum / totalGoalsSum) * 100 : 0;
    const completedEmployees = employeeDetails.filter(e => e.totalGoals > 0 && e.rate === 100).length;
    const activeEmployeesCount = employeeDetails.filter(e => e.totalGoals > 0).length;

    return {
      total: activeEmployeesCount || employees.length,
      submitted: completedEmployees,
      rate: overallRate,
      activeQuarter,
      employeeDetails,
    };
  }
}
