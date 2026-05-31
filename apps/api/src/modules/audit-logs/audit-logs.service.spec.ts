import { AuditLogsService } from './audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditLogsService', () => {
  it('records actor, action, entity, context, and snapshots', async () => {
    const prisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    } as unknown as PrismaService;
    const service = new AuditLogsService(prisma);

    await service.record({
      actorUserId: 'user-1',
      action: 'PRICE_CHANGED',
      entityType: 'Product',
      entityId: 'product-1',
      beforeSnapshot: { price: '1000.00' },
      afterSnapshot: { price: '1200.00' },
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: 'user-1',
        action: 'PRICE_CHANGED',
        entityType: 'Product',
        entityId: 'product-1',
        beforeSnapshot: { price: '1000.00' },
        afterSnapshot: { price: '1200.00' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
    });
  });
});
