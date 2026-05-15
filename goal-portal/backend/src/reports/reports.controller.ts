import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
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
  async exportCsv(@Res() res: Response) {
    const goals = await this.prisma.goal.findMany({
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
  @Roles(Role.ADMIN)
  async getCompletionRates() {
    const totalEmployees = await this.prisma.user.count({ where: { role: Role.EMPLOYEE } });
    const submittedEmployees = await this.prisma.goal.groupBy({
      by: ['employeeId'],
      where: { status: { in: ['SUBMITTED', 'APPROVED'] } },
    });

    return {
      total: totalEmployees,
      submitted: submittedEmployees.length,
      rate: (submittedEmployees.length / totalEmployees) * 100,
    };
  }
}
