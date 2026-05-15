import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body } = request;

    return next.handle().pipe(
      tap(async (data) => {
        if (['POST', 'PATCH', 'DELETE'].includes(method) && user) {
          // Determine entity type and ID from URL or body
          let entityType = 'Unknown';
          let entityId = 'Unknown';

          if (url.includes('/goals')) {
            entityType = 'Goal';
            entityId = request.params.id || data?.id || 'Unknown';
          } else if (url.includes('/checkins')) {
            entityType = 'GoalUpdate';
            entityId = data?.id || 'Unknown';
          }

          const action = this.getActionLabel(method, url);

          await this.prisma.auditLog.create({
            data: {
              userId: user.id,
              entityType,
              entityId,
              action,
              newValue: body,
              // old value would require more complex logic fetching before the update
            },
          });
        }
      }),
    );
  }

  private getActionLabel(method: string, url: string): string {
    if (url.includes('/approve')) return 'APPROVE';
    if (url.includes('/return')) return 'RETURN';
    if (url.includes('/unlock')) return 'UNLOCK';
    if (method === 'POST') return 'CREATE';
    if (method === 'PATCH') return 'UPDATE';
    if (method === 'DELETE') return 'DELETE';
    return 'ACTION';
  }
}
