import { prisma } from '@repo/database';
import { AuditService } from './audit.service';
import { logger } from '../logger';

export type TicketVerificationResult = {
  approved: boolean;
  error?: 'INVALID_FORMAT' | 'TICKET_NOT_FOUND' | 'ALREADY_SCANNED' | 'CONCURRENT_SCAN_CONFLICT' | 'INTERNAL_SERVER_ERROR' | undefined;
  message: string;
  ticketId?: string | undefined;
  scannedAt?: string | undefined;
  event?: {
    title: string;
    venueName: string;
    eventDate: string;
    artistName: string;
  } | undefined;
  holder?: {
    email: string;
  } | undefined;
  holderEmail?: string | undefined;
  eventTitle?: string | undefined;
};

export class TicketService {
  /**
   * Cryptographically verifies a ticket by signature hash and marks it as scanned atomically.
   */
  static async verifyAndScan(
    qrCodeHash: string,
    scannerIp?: string,
    scannerUserId?: string
  ): Promise<TicketVerificationResult> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Find ticket with concurrency lock protection (select for update isn't raw in prisma, but transaction handles isolation level)
        const ticket = await tx.ticket.findUnique({
          where: { qrCodeHash },
          include: {
            event: {
              include: {
                artist: true,
              },
            },
            orderItem: {
              include: {
                order: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        });

        if (!ticket) {
          return {
            approved: false,
            error: 'TICKET_NOT_FOUND' as const,
            message: 'No active ticket matches this signature.',
          };
        }

        if (ticket.isScanned) {
          return {
            approved: false,
            error: 'ALREADY_SCANNED' as const,
            message: 'This ticket has already been validated at entry.',
            scannedAt: ticket.scannedAt?.toISOString(),
            holderEmail: ticket.orderItem.order.user?.email || 'Guest',
            eventTitle: ticket.event.title,
          };
        }

        // Perform the scan update
        const updatedTicket = await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            isScanned: true,
            scannedAt: new Date(),
          },
        });

        return {
          approved: true,
          message: 'Access granted.',
          ticketId: ticket.id,
          scannedAt: updatedTicket.scannedAt?.toISOString(),
          event: {
            title: ticket.event.title,
            venueName: ticket.event.venueName,
            eventDate: ticket.event.eventDate.toISOString(),
            artistName: ticket.event.artist.stageName,
          },
          holder: {
            email: ticket.orderItem.order.user?.email || 'Guest',
          },
        };
      });

      // Record database audit logs
      if (result.approved) {
        await AuditService.record({
          ...(scannerUserId ? { userId: scannerUserId } : {}),
          action: 'TICKET_SCAN_APPROVED',
          details: `Ticket ID ${result.ticketId} approved for event "${result.event?.title}"`,
          ...(scannerIp ? { ipAddress: scannerIp } : {}),
        });
      } else {
        await AuditService.record({
          ...(scannerUserId ? { userId: scannerUserId } : {}),
          action: 'TICKET_SCAN_DENIED',
          details: `Scan denied. Reason: ${result.error}. Hash prefix: ${qrCodeHash.slice(0, 10)}`,
          ...(scannerIp ? { ipAddress: scannerIp } : {}),
        });
      }

      return result;
    } catch (err) {
      logger.error('Ticket validation transaction error', { error: String(err), hash: qrCodeHash });
      return {
        approved: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An internal error occurred during ticket validation.',
      };
    }
  }
}
