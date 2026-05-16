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

    if (userRole === Role.MANAGER) {
      targetManagerId = req.user.id; // Managers can only export their own team
    }

    const whereClause: any = {};
    if (targetManagerId) {
      whereClause.employee = { managerId: targetManagerId };
    }

    const goals = await this.prisma.goal.findMany({
      where: whereClause,
      include: {
        employee: true,
        updates: true,
      },
    });

    const data = goals.map((g) => ({
      Employee: g.employee.name,
      ThrustArea: g.thrustArea,
      Title: g.title,
      UOM: g.uom,
      Target: g.target,
      Weightage: g.weightage,
      Status: g.status,
      Locked: g.locked,
      LatestAchievement: g.updates[0]?.achievement || 0,
      ProgressScore: g.updates[0]?.progressScore || 0,
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=goals_report.csv');

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
