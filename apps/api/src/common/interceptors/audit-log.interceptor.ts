import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (method === 'GET') return next.handle();

    const userId = request.user?.id;
    const path = request.route?.path || request.url;
    const ip = request.ip || request.headers['x-forwarded-for'];

    return next.handle().pipe(
      tap(() => {
        this.prisma.auditLog.create({
          data: {
            userId,
            action: `${method} ${path}`,
            entity: path.split('/')[3] || 'unknown',
            entityId: request.params?.id,
            ipAddress: ip,
            metadata: { body: this.sanitize(request.body) },
          },
        }).catch(() => {});
      }),
    );
  }

  private sanitize(body: any): any {
    if (!body) return undefined;
    const sanitized = { ...body };
    const sensitiveKeys = ['password', 'token', 'secret', 'otp', 'code', 'refreshToken'];
    for (const key of sensitiveKeys) {
      if (sanitized[key]) sanitized[key] = '[REDACTED]';
    }
    return sanitized;
  }
}
