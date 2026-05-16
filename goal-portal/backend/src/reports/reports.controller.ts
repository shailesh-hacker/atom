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

    const whereClause: any = { role: Role.EMPLOYEE };
    if (targetManagerId) {
      whereClause.managerId = targetManagerId;
    }

    const totalEmployees = await this.prisma.user.count({ where: whereClause });

    // Build where clause for goals
    const goalWhereClause: any = { status: { in: ['PENDING', 'APPROVED', 'COMPLETED'] } };
    if (targetManagerId) {
      goalWhereClause.employee = { managerId: targetManagerId };
    }

    const submittedEmployees = await this.prisma.goal.groupBy({
      by: ['employeeId'],
      where: goalWhereClause,
    });

    return {
      total: totalEmployees,
      submitted: submittedEmployees.length,
      rate: totalEmployees > 0 ? (submittedEmployees.length / totalEmployees) * 100 : 0,
    };
  }
}
