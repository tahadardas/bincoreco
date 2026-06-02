import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let usersService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      customerProfile: {
        create: jest.fn(),
      },
      loyaltyAccount: {
        create: jest.fn(),
      },
      qRCard: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };

    usersService = {
      findByIdentifier: jest.fn(),
      findById: jest.fn(),
    };

    const jwtService = new JwtService({ secret: 'test-secret' });
    service = new AuthService(prisma as unknown as PrismaService, jwtService, usersService as unknown as UsersService);
  });

  describe('login', () => {
    it('rejects invalid credentials', async () => {
      usersService.findByIdentifier.mockResolvedValue(null);

      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });

    it('rejects inactive account', async () => {
      usersService.findByIdentifier.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: '$2a$10$hashed',
        isActive: false,
      });

      await expect(service.login({ email: 'test@test.com', password: 'pass' })).rejects.toThrow(ForbiddenException);
    });

    it('rejects wrong password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('correct', 10);
      usersService.findByIdentifier.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hash,
        isActive: true,
      });

      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('rejects duplicate user', async () => {
      usersService.findByIdentifier.mockResolvedValue({ id: 'existing' });

      await expect(service.register({
        email: 'existing@test.com',
        password: 'pass123',
        fullName: 'Test',
      })).rejects.toThrow(ConflictException);
    });

    it('creates user and returns tokens', async () => {
      usersService.findByIdentifier.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user-1',
        email: 'new@test.com',
        phone: null,
        fullName: 'New User',
        role: 'customer',
        mustChangePassword: false,
      });
      prisma.customerProfile.create.mockResolvedValue({ id: 'profile-1' });
      prisma.loyaltyAccount.create.mockResolvedValue({});
      prisma.qRCard.create.mockResolvedValue({});

      const result = await service.register({
        email: 'new@test.com',
        password: 'pass123',
        fullName: 'New User',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('new@test.com');
    });
  });

  describe('refresh', () => {
    it('rejects invalid refresh token', async () => {
      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
