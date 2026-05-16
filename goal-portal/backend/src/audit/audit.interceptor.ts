import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, params } = request;

    // Only audit mutating requests from authenticated users
    if (!['POST', 'PATCH', 'DELETE'].includes(method) || !user) {
      return next.handle();
    }

    // Fetch old value BEFORE the mutation executes
    return from(this.captureOldValue(url, params?.id)).pipe(
      switchMap((oldValue) =>
        next.handle().pipe(
          tap(async (responseData) => {
            try {
              const { entityType, entityId } = this.resolveEntity(url, params?.id, responseData);
              const action = this.getActionLabel(method, url);

              await this.prisma.auditLog.create({
                data: {
                  userId: user.id,
                  entityType,
                  entityId,
                  action,
                  oldValue: oldValue ?? undefined,
                  newValue: method === 'DELETE' ? null : (body ?? undefined),
                },
              });
            } catch {
              // Audit logging should never crash the request
            }
          }),
        ),
      ),
    );
  }

  /**
   * Fetches the current state of the entity from the DB before mutation.
   */
  private async captureOldValue(url: string, id?: string): Promise<Record<string, any> | null> {
    if (!id) return null;

    try {
      if (url.includes('/goals')) {
        return await this.prisma.goal.findUnique({ where: { id } });
      } else if (url.includes('/checkins')) {
        return await this.prisma.goalUpdate.findUnique({ where: { id } });
      }
    } catch {
      // Entity may not exist for POST requests — that's fine
    }

    return null;
  }

  private resolveEntity(url: string, paramId: string | undefined, responseData: any) {
    let entityType = 'Unknown';
    let entityId = paramId || responseData?.id || 'Unknown';

    if (url.includes('/goals')) entityType = 'Goal';
    else if (url.includes('/checkins')) entityType = 'GoalUpdate';
    else if (url.includes('/users')) entityType = 'User';

    return { entityType, entityId };
  }

  private getActionLabel(method: string, url: string): string {
    if (url.includes('/approve')) return 'APPROVE';
    if (url.includes('/return')) return 'RETURN';
    if (url.includes('/unlock')) return 'UNLOCK';
    if (url.includes('/manager-edit')) return 'MANAGER_EDIT';
    if (url.includes('/shared')) return 'SHARED_PUSH';
    if (method === 'POST') return 'CREATE';
    if (method === 'PATCH') return 'UPDATE';
    if (method === 'DELETE') return 'DELETE';
    return 'ACTION';
  }
}
