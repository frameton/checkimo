import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from 'prisma/prisma.service';
import { Role, User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly UsersService: UsersService, // Assurez-vous que ce service est importé et injecté correctement
  ) {}

  /* ---------- helpers ---------- */

   private async signAccess(user: Pick<User, 'id' | 'role'>) {
    return this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { secret: process.env.JWT_ACCESS_SECRET },
    );
  }

 private async saveRefresh(userId: string, token: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: await argon2.hash(token) },
    });
  }

  /* ---------- public API ---------- */

  /** Validation lors du login */
 async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, role: true, isEmailConfirmed: true },
    });
    if (!user || !(await argon2.verify(user.password, password))) {
      throw new UnauthorizedException();
    }

    if (!user.isEmailConfirmed) {
      throw new UnauthorizedException("Veuillez confirmer votre email avant de vous connecter.");
    }

    return user;
  }

  /** Login → renvoie access + refresh */
  async login(user: Pick<User, 'id' | 'role'>) {
    const accessToken = await this.signAccess(user);
    const refreshToken = randomBytes(64).toString('hex');
    await this.saveRefresh(user.id, refreshToken);
    return { accessToken, refreshToken };
  }

  /** Rotation refresh */
  async refresh(userId: string, presented: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, hashedRefreshToken: true },
    });
    if (
      !user?.hashedRefreshToken ||
      !(await argon2.verify(user.hashedRefreshToken, presented))
    ) {
      throw new ForbiddenException();
    }

    const accessToken = await this.signAccess(user);
    const newRefreshToken = randomBytes(64).toString('hex');
    await this.saveRefresh(user.id, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  /** Logout → invalide le refresh */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
  }
}