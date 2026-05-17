import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { GoalsModule } from './goals/goals.module';
import { CheckinsModule } from './checkins/checkins.module';
import { AuditModule } from './audit/audit.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { CyclesModule } from './cycles/cycles.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { AuditInterceptor } from './audit/audit.interceptor';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    AuthModule,
    UsersModule,
    GoalsModule,
    CheckinsModule,
    AuditModule,
    ReportsModule,
    CyclesModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
