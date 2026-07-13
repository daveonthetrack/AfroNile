import { prisma } from '@repo/database';
import { logger } from '../logger';

export class AuditService {
  /**
   * Logs a security or user action and records it inside the audit database.
   */
  static async record({
    userId,
    action,
    details,
    ipAddress,
  }: {
    userId?: string;
    action: string;
    details: string;
    ipAddress?: string;
  }) {
    try {
      // Structured logging output
      logger.info(`Audit Log [${action}]`, { userId, details, ipAddress });

      // Insert record to database
      await prisma.auditLog.create({
        data: {
          action,
          details,
          userId: userId || null,
          ipAddress: ipAddress || null,
        },
      });
    } catch (err) {
      logger.error('Failed to write audit database log', { error: String(err), action, details });
    }
  }

  /**
   * Fetch audit logs (supporting offset-based pagination for admin panels)
   */
  static async getLogs(limit: number = 20, offset: number = 0) {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count(),
    ]);

    return { logs, total };
  }
}
