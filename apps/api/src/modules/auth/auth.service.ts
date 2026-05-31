import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { LoginInput, RegisterInput } from '@banco-ricco/validators';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.usersService.findByIdentifier(input.email || input.phone || '');
    if (existing) {
      throw new ConflictException('User already exists with this email or phone');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.$transaction(async tx => {
      const createdUser = await tx.user.create({
        data: {
          email: input.email || null,
          phone: input.phone || null,
          passwordHash,
          fullName: input.fullName,
          role: 'customer',
        },
      });

      const customerProfile = await tx.customerProfile.create({
        data: { userId: createdUser.id },
      });

      await tx.loyaltyAccount.create({
        data: { customerId: customerProfile.id },
      });

      await tx.qRCard.create({
        data: {
          customerId: customerProfile.id,
          publicToken: this.generateQrPublicToken(),
        },
      });

      return createdUser;
    });

    const tokens = await this.generateTokens(user.id);
    return {
      user: { id: user.id, email: user.email, phone: user.phone, fullName: user.fullName, role: user.role },
      ...tokens,
    };
  }

  async login(input: LoginInput) {
    const user = await this.usersService.findByIdentifier(input.email || input.phone || '');
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id);
    return {
      user: { id: user.id, email: user.email, phone: user.phone, fullName: user.fullName, role: user.role },
      ...tokens,
    };
  }

  async adminLogin(input: LoginInput) {
    const result = await this.login(input);
    if (result.user.role === 'customer') {
      throw new ForbiddenException('هذا الحساب لا يملك صلاحية دخول لوحة التحكم');
    }
    return result;
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'banco-ricco-dev-secret',
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return this.generateTokens(user.id);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });
    return { accessToken, refreshToken };
  }

  private generateQrPublicToken() {
    return uuid().replace(/-/g, '').substring(0, 20);
  }
}
