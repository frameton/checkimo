import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /* ---------- helpers ---------- */

  private async signAccess(userId: string) {
    return this.jwt.signAsync({ sub: userId });
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
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await argon2.verify(user.password, password)))
      throw new UnauthorizedException();
    return user;
  }

  /** Login → renvoie access + refresh */
  async login(userId: string) {
    const access = await this.signAccess(userId);
    const refresh = randomBytes(64).toString('hex');
    await this.saveRefresh(userId, refresh);
    return { accessToken: access, refreshToken: refresh };
  }

  /** Rotation refresh */
  async refresh(userId: string, presented: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.hashedRefreshToken || !(await argon2.verify(user.hashedRefreshToken, presented)))
      throw new ForbiddenException();

    const access = await this.signAccess(userId);
    const newRefresh = randomBytes(64).toString('hex');
    await this.saveRefresh(userId, newRefresh);

    return { accessToken: access, refreshToken: newRefresh };
  }

  /** Logout → invalide le refresh */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
  }
}