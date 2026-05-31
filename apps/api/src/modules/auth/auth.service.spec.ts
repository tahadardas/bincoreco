import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  it('creates customer profile, loyalty account, and QR card when registering a customer', async () => {
    const tx = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'customer@example.com',
          phone: null,
          fullName: 'Test Customer',
          role: 'customer',
        }),
      },
      customerProfile: {
        create: jest.fn().mockResolvedValue({ id: 'profile-1', userId: 'user-1' }),
      },
      loyaltyAccount: {
        create: jest.fn().mockResolvedValue({ id: 'loyalty-1', customerId: 'profile-1' }),
      },
      qRCard: {
        create: jest.fn().mockResolvedValue({ id: 'qr-1', customerId: 'profile-1' }),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const jwtService = {
      sign: jest.fn().mockReturnValue('token'),
    } as unknown as JwtService;
    const usersService = {
      findByIdentifier: jest.fn().mockResolvedValue(null),
    } as unknown as UsersService;

    const service = new AuthService(prisma, jwtService, usersService);

    const result = await service.register({
      email: 'customer@example.com',
      password: 'secret123',
      fullName: 'Test Customer',
    });

    expect(tx.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ role: 'customer' }),
    }));
    expect(tx.customerProfile.create).toHaveBeenCalledWith({ data: { userId: 'user-1' } });
    expect(tx.loyaltyAccount.create).toHaveBeenCalledWith({ data: { customerId: 'profile-1' } });
    expect(tx.qRCard.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ customerId: 'profile-1' }),
    });
    expect(result.user.role).toBe('customer');
  });
});
