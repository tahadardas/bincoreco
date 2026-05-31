import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function createContext(role?: string): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: role ? { id: 'user-1', role } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows admin for admin routes', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['admin', 'maestro']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext('admin'))).toBe(true);
  });

  it('blocks customer tokens from admin routes', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['admin', 'maestro']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(createContext('customer'))).toThrow(ForbiddenException);
  });
});
